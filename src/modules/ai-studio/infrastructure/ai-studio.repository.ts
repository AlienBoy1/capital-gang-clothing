import type { AIAssetType, AIProjectStatus } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

const versionSelect = {
  id: true,
  assetId: true,
  versionNumber: true,
  parentVersionId: true,
  processingType: true,
  storagePath: true,
  mime: true,
  width: true,
  height: true,
  size: true,
  checksum: true,
  createdById: true,
  createdAt: true,
  isCurrent: true,
  isOriginal: true,
  jobStatus: true,
  notes: true,
} as const;

const assetInclude = {
  currentVersion: { select: versionSelect },
  versions: { select: versionSelect, orderBy: { versionNumber: "asc" as const } },
  jobs: { orderBy: { createdAt: "desc" as const }, take: 5 },
};

export const aiStudioRepository = {
  listProjects() {
    return prisma.aIProject.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { assets: true, publications: true } },
        assets: {
          take: 4,
          orderBy: { createdAt: "desc" },
          include: { currentVersion: { select: { storagePath: true, processingType: true } } },
        },
      },
    });
  },

  getProject(id: string) {
    return prisma.aIProject.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assets: {
          orderBy: { createdAt: "desc" },
          include: assetInclude,
        },
        publications: {
          orderBy: { publishedAt: "desc" },
          include: {
            product: { select: { id: true, name: true, slug: true } },
            publishedBy: { select: { firstName: true, lastName: true } },
            assets: {
              orderBy: { order: "asc" },
              include: { assetVersion: { select: versionSelect } },
            },
          },
        },
      },
    });
  },

  createProject(data: { name: string; description?: string | null; createdById: string }) {
    return prisma.aIProject.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        createdById: data.createdById,
        status: "DRAFT",
      },
    });
  },

  updateProject(id: string, data: { name?: string; description?: string | null; status?: AIProjectStatus }) {
    return prisma.aIProject.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
      },
    });
  },

  deleteProject(id: string) {
    return prisma.aIProject.delete({ where: { id } });
  },

  async createOriginalAssets(input: {
    projectId: string;
    urls: string[];
    createdById: string;
  }) {
    const created = [];

    for (const url of input.urls) {
      const asset = await prisma.aIAsset.create({
        data: {
          projectId: input.projectId,
          assetType: "ORIGINAL",
          status: "READY",
        },
      });

      const version = await prisma.aIAssetVersion.create({
        data: {
          assetId: asset.id,
          versionNumber: 1,
          processingType: "ORIGINAL",
          storagePath: url,
          mime: "image/webp",
          createdById: input.createdById,
          isCurrent: true,
          isOriginal: true,
          jobStatus: "COMPLETED",
          notes: "Fotografía original",
        },
      });

      const updated = await prisma.aIAsset.update({
        where: { id: asset.id },
        data: { currentVersionId: version.id },
        include: assetInclude,
      });

      created.push(updated);
    }

    await prisma.aIProject.update({
      where: { id: input.projectId },
      data: { status: "READY" },
    });

    return created;
  },

  getAsset(id: string) {
    return prisma.aIAsset.findUnique({
      where: { id },
      include: {
        ...assetInclude,
        project: { select: { id: true, name: true, status: true } },
      },
    });
  },

  async toggleFavorite(id: string) {
    const asset = await prisma.aIAsset.findUnique({ where: { id } });
    if (!asset) return null;
    return prisma.aIAsset.update({
      where: { id },
      data: { favorite: !asset.favorite },
      include: assetInclude,
    });
  },

  async setCurrentVersion(assetId: string, versionId: string) {
    const version = await prisma.aIAssetVersion.findFirst({
      where: { id: versionId, assetId },
    });
    if (!version) return null;

    await prisma.$transaction([
      prisma.aIAssetVersion.updateMany({
        where: { assetId },
        data: { isCurrent: false },
      }),
      prisma.aIAssetVersion.update({
        where: { id: versionId },
        data: { isCurrent: true },
      }),
      prisma.aIAsset.update({
        where: { id: assetId },
        data: {
          currentVersionId: versionId,
          assetType: version.processingType,
          status: "READY",
        },
      }),
    ]);

    return this.getAsset(assetId);
  },

  async duplicateVersion(versionId: string, createdById: string) {
    const source = await prisma.aIAssetVersion.findUnique({ where: { id: versionId } });
    if (!source) return null;

    const last = await prisma.aIAssetVersion.findFirst({
      where: { assetId: source.assetId },
      orderBy: { versionNumber: "desc" },
    });

    const nextNumber = (last?.versionNumber ?? 0) + 1;

    await prisma.aIAssetVersion.updateMany({
      where: { assetId: source.assetId },
      data: { isCurrent: false },
    });

    const version = await prisma.aIAssetVersion.create({
      data: {
        assetId: source.assetId,
        versionNumber: nextNumber,
        parentVersionId: source.id,
        processingType: source.processingType,
        storagePath: source.storagePath,
        mime: source.mime,
        width: source.width,
        height: source.height,
        size: source.size,
        checksum: source.checksum,
        createdById,
        isCurrent: true,
        isOriginal: false,
        jobStatus: "COMPLETED",
        notes: `Duplicado de v${source.versionNumber}`,
      },
    });

    await prisma.aIAsset.update({
      where: { id: source.assetId },
      data: { currentVersionId: version.id, status: "READY" },
    });

    return this.getAsset(source.assetId);
  },

  async deleteVersion(versionId: string) {
    const version = await prisma.aIAssetVersion.findUnique({ where: { id: versionId } });
    if (!version) return { ok: false as const, message: "Versión no encontrada" };
    if (version.isOriginal) {
      return { ok: false as const, message: "La versión original no se puede eliminar" };
    }

    const assetId = version.assetId;
    const wasCurrent = version.isCurrent;

    await prisma.aIAssetVersion.delete({ where: { id: versionId } });

    if (wasCurrent) {
      const fallback = await prisma.aIAssetVersion.findFirst({
        where: { assetId },
        orderBy: { versionNumber: "desc" },
      });
      if (fallback) {
        await prisma.aIAssetVersion.update({
          where: { id: fallback.id },
          data: { isCurrent: true },
        });
        await prisma.aIAsset.update({
          where: { id: assetId },
          data: {
            currentVersionId: fallback.id,
            assetType: fallback.processingType,
          },
        });
      }
    }

    return { ok: true as const, asset: await this.getAsset(assetId) };
  },

  async deleteAsset(assetId: string) {
    const asset = await prisma.aIAsset.findUnique({
      where: { id: assetId },
      include: { versions: true },
    });
    if (!asset) return false;

    // Clear circular currentVersion FK before delete
    await prisma.aIAsset.update({
      where: { id: assetId },
      data: { currentVersionId: null },
    });
    await prisma.aIAsset.delete({ where: { id: assetId } });
    return true;
  },

  /**
   * On regenerate: wipe all derived versions, keep only the original.
   * Clears publication/session links that would block deletes.
   */
  async resetDerivedVersions(assetId: string) {
    const original = await prisma.aIAssetVersion.findFirst({
      where: { assetId, isOriginal: true },
    });
    if (!original) {
      throw new Error("No hay versión original para regenerar");
    }

    const derived = await prisma.aIAssetVersion.findMany({
      where: { assetId, isOriginal: false },
      select: { id: true },
    });
    const ids = derived.map((d) => d.id);

    if (ids.length) {
      await prisma.catalogPublicationAsset.deleteMany({
        where: { assetVersionId: { in: ids } },
      });
      await prisma.catalogPublishSessionItem.deleteMany({
        where: { assetVersionId: { in: ids } },
      });
      await prisma.productImage.updateMany({
        where: { assetVersionId: { in: ids } },
        data: { assetVersionId: null },
      });

      await prisma.aIAsset.update({
        where: { id: assetId },
        data: {
          currentVersionId: original.id,
          assetType: "ORIGINAL",
          status: "PROCESSING",
        },
      });

      await prisma.aIAssetVersion.update({
        where: { id: original.id },
        data: { isCurrent: true },
      });

      await prisma.aIAssetVersion.updateMany({
        where: { assetId, isOriginal: false },
        data: { parentVersionId: null, isCurrent: false },
      });

      await prisma.aIAssetVersion.deleteMany({
        where: { assetId, isOriginal: false },
      });
    } else {
      await prisma.aIAsset.update({
        where: { id: assetId },
        data: {
          currentVersionId: original.id,
          assetType: "ORIGINAL",
          status: "PROCESSING",
        },
      });
      await prisma.aIAssetVersion.update({
        where: { id: original.id },
        data: { isCurrent: true },
      });
    }

    return original;
  },

  async appendVersion(input: {
    assetId: string;
    parentVersionId: string;
    processingType: AIAssetType;
    storagePath: string;
    mime: string;
    width?: number | null;
    height?: number | null;
    size?: number | null;
    checksum?: string | null;
    createdById?: string | null;
    notes?: string | null;
    jobStatus?: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
    makeCurrent?: boolean;
  }) {
    const last = await prisma.aIAssetVersion.findFirst({
      where: { assetId: input.assetId },
      orderBy: { versionNumber: "desc" },
    });
    const nextNumber = (last?.versionNumber ?? 0) + 1;
    const makeCurrent = input.makeCurrent ?? true;

    if (makeCurrent) {
      await prisma.aIAssetVersion.updateMany({
        where: { assetId: input.assetId },
        data: { isCurrent: false },
      });
    }

    const version = await prisma.aIAssetVersion.create({
      data: {
        assetId: input.assetId,
        versionNumber: nextNumber,
        parentVersionId: input.parentVersionId,
        processingType: input.processingType,
        storagePath: input.storagePath,
        mime: input.mime,
        width: input.width ?? null,
        height: input.height ?? null,
        size: input.size ?? null,
        checksum: input.checksum ?? null,
        createdById: input.createdById ?? null,
        isCurrent: makeCurrent,
        isOriginal: false,
        jobStatus: input.jobStatus ?? "COMPLETED",
        notes: input.notes ?? null,
      },
    });

    if (makeCurrent) {
      await prisma.aIAsset.update({
        where: { id: input.assetId },
        data: {
          currentVersionId: version.id,
          assetType: input.processingType,
          status: input.jobStatus === "ERROR" ? "ERROR" : "READY",
        },
      });
    }

    return version;
  },
};
