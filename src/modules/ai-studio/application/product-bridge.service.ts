import { prisma } from "@/shared/lib/prisma";
import { canPublishAssetStatus } from "@/modules/ai-studio/domain/entities";

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

const publishSessionInclude = {
  items: {
    orderBy: { order: "asc" as const },
    include: {
      assetVersion: {
        select: {
          id: true,
          storagePath: true,
          processingType: true,
          versionNumber: true,
          mime: true,
          width: true,
          height: true,
          assetId: true,
        },
      },
    },
  },
  project: { select: { id: true, name: true } },
};

export type PublishSessionDTO = NonNullable<
  Awaited<ReturnType<typeof prisma.catalogPublishSession.findUnique<{
    where: { id: string };
    include: typeof publishSessionInclude;
  }>>>
>;

/**
 * ProductBridgeService — connects AI Product Studio with the Products module.
 * Never duplicates files; only passes asset version IDs / URLs by reference.
 */
export const ProductBridgeService = {
  async createPublicationSession(input: {
    projectId: string;
    assetVersionIds: string[];
    createdById: string;
    storeType?: "CLOTHING" | "TATTOO_SHOP";
  }) {
    if (!input.assetVersionIds.length) {
      throw new Error("Selecciona al menos una versión de asset");
    }

    const versions = await prisma.aIAssetVersion.findMany({
      where: { id: { in: input.assetVersionIds } },
      include: { asset: true },
    });

    if (versions.length !== input.assetVersionIds.length) {
      throw new Error("Algunas versiones no existen");
    }

    for (const version of versions) {
      if (version.asset.projectId !== input.projectId) {
        throw new Error("Las versiones deben pertenecer al mismo proyecto");
      }
      if (
        !canPublishAssetStatus(version.asset.status) ||
        version.jobStatus === "PENDING" ||
        version.jobStatus === "PROCESSING" ||
        version.jobStatus === "ERROR"
      ) {
        throw new Error("Solo se pueden publicar versiones de assets listos");
      }
    }

    const session = await prisma.catalogPublishSession.create({
      data: {
        projectId: input.projectId,
        createdById: input.createdById,
        storeType: input.storeType ?? "CLOTHING",
        status: "PENDING",
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        items: {
          create: input.assetVersionIds.map((assetVersionId, order) => ({
            assetVersionId,
            order,
          })),
        },
      },
      include: publishSessionInclude,
    });

    return session;
  },

  openProductFormPath(sessionId: string, storeType: "CLOTHING" | "TATTOO_SHOP" = "CLOTHING") {
    const base = storeType === "TATTOO_SHOP" ? "/dashboard/tattoo-shop" : "/dashboard/productos";
    return `${base}?publishSession=${sessionId}`;
  },

  async getSession(sessionId: string, userId: string): Promise<PublishSessionDTO | null> {
    const session = await prisma.catalogPublishSession.findUnique({
      where: { id: sessionId },
      include: publishSessionInclude,
    });

    if (!session) return null;
    if (session.createdById !== userId) return null;
    if (session.status !== "PENDING") return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.catalogPublishSession.update({
        where: { id: sessionId },
        data: { status: "EXPIRED" },
      });
      return null;
    }

    return session;
  },

  injectAssets(session: PublishSessionDTO) {
    return session.items.map((item) => ({
      url: item.assetVersion.storagePath,
      assetVersionId: item.assetVersion.id,
      alt: `${session.project.name} · v${item.assetVersion.versionNumber}`,
      processingType: item.assetVersion.processingType,
    }));
  },

  async linkAssetsToProduct(input: {
    sessionId: string;
    productId: string;
    userId: string;
  }) {
    const session = await this.getSession(input.sessionId, input.userId);
    if (!session) throw new Error("Sesión de publicación inválida o expirada");

    const publication = await prisma.catalogPublication.create({
      data: {
        projectId: session.projectId,
        productId: input.productId,
        publishedById: input.userId,
        status: "ACTIVE",
        assets: {
          create: session.items.map((item) => ({
            assetVersionId: item.assetVersionId,
            order: item.order,
          })),
        },
      },
      include: {
        assets: true,
      },
    });

    // Mark assets as published + project published
    const assetIds = [...new Set(session.items.map((i) => i.assetVersion.assetId))];
    await prisma.aIAsset.updateMany({
      where: { id: { in: assetIds } },
      data: { status: "PUBLISHED" },
    });
    await prisma.aIProject.update({
      where: { id: session.projectId },
      data: { status: "PUBLISHED" },
    });

    await prisma.catalogPublishSession.update({
      where: { id: input.sessionId },
      data: { status: "CONSUMED" },
    });

    return publication;
  },
};
