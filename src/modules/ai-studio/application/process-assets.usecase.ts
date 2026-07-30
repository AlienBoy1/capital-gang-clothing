import type { AIAssetType } from "@/modules/ai-studio/domain/entities";
import { DEFAULT_PROCESS_PIPELINE, AI_ASSET_TYPE_LABELS } from "@/modules/ai-studio/domain/entities";
import {
  createCatalogMaster,
  GenerativeStudioError,
  processVariantFromMaster,
} from "@/modules/ai-studio/infrastructure/processing.service";
import { aiStudioRepository } from "@/modules/ai-studio/infrastructure/ai-studio.repository";
import { prisma } from "@/shared/lib/prisma";

export type ProcessProgressEvent =
  | {
      type: "history_reset";
      assetId: string;
      originalVersionId: string;
    }
  | {
      type: "job_start";
      assetId: string;
      assetIndex: number;
      assetCount: number;
      stepCount: number;
      pipeline: AIAssetType[];
    }
  | {
      type: "step";
      assetId: string;
      step: number;
      stepCount: number;
      label: string;
      progress: number;
      processingType?: AIAssetType | "CUTOUT" | "PREPARE";
      stepStatus: "pending" | "active" | "done" | "error";
    }
  | {
      type: "version_ready";
      assetId: string;
      processingType: AIAssetType;
      version: {
        id: string;
        assetId: string;
        versionNumber: number;
        parentVersionId: string | null;
        processingType: AIAssetType;
        storagePath: string;
        mime: string;
        width: number | null;
        height: number | null;
        size: number | null;
        checksum: string | null;
        createdById: string | null;
        createdAt: string;
        isCurrent: boolean;
        isOriginal: boolean;
        jobStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
        notes: string | null;
      };
      progress: number;
    }
  | {
      type: "job_done";
      assetId: string;
      ok: boolean;
      errorMessage?: string;
      progress: number;
    }
  | {
      type: "done";
      ok: boolean;
      failedCount: number;
      message?: string | null;
    };

function serializeVersion(version: {
  id: string;
  assetId: string;
  versionNumber: number;
  parentVersionId: string | null;
  processingType: AIAssetType;
  storagePath: string;
  mime: string;
  width: number | null;
  height: number | null;
  size: number | null;
  checksum: string | null;
  createdById: string | null;
  createdAt: Date;
  isCurrent: boolean;
  isOriginal: boolean;
  jobStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
  notes: string | null;
}) {
  return {
    ...version,
    createdAt: version.createdAt.toISOString(),
  };
}

export async function enqueueAndProcessAssets(input: {
  assetIds: string[];
  targetTypes?: AIAssetType[];
  createdById: string;
  onProgress?: (event: ProcessProgressEvent) => void | Promise<void>;
}) {
  const targetTypes = input.targetTypes?.length ? input.targetTypes : DEFAULT_PROCESS_PIPELINE;
  const pipeline = targetTypes.filter((t) => t !== "ORIGINAL");
  const jobs = [];
  const assetCount = input.assetIds.length;
  let failedCount = 0;
  let lastError: string | null = null;

  const emit = async (event: ProcessProgressEvent) => {
    await input.onProgress?.(event);
  };

  for (let assetIndex = 0; assetIndex < input.assetIds.length; assetIndex++) {
    const assetId = input.assetIds[assetIndex]!;
    const asset = await aiStudioRepository.getAsset(assetId);
    if (!asset?.currentVersion) continue;

    const stepCount = pipeline.length + 2;

    await prisma.aIProject.update({
      where: { id: asset.projectId },
      data: { status: "PROCESSING" },
    });

    // Wipe previous derived history — regenerate from original only
    const original = await aiStudioRepository.resetDerivedVersions(assetId);
    await emit({
      type: "history_reset",
      assetId,
      originalVersionId: original.id,
    });

    const job = await prisma.aIProcessingJob.create({
      data: {
        assetId,
        sourceVersionId: original.id,
        targetTypes,
        status: "PROCESSING",
      },
    });

    await emit({
      type: "job_start",
      assetId,
      assetIndex,
      assetCount,
      stepCount,
      pipeline,
    });

    const baseProgress = assetIndex / assetCount;

    try {
      await emit({
        type: "step",
        assetId,
        step: 1,
        stepCount,
        label: "Preparando foto original…",
        progress: baseProgress + 0.02 / assetCount,
        processingType: "PREPARE",
        stepStatus: "active",
      });

      await emit({
        type: "step",
        assetId,
        step: 2,
        stepCount,
        label: "Recorte ONNX (prendas oscuras + doble pasada)…",
        progress: baseProgress + 0.08 / assetCount,
        processingType: "CUTOUT",
        stepStatus: "active",
      });

      const master = await createCatalogMaster(original.storagePath);

      await emit({
        type: "step",
        assetId,
        step: 2,
        stepCount,
        label: "Recorte listo",
        progress: baseProgress + 0.2 / assetCount,
        processingType: "CUTOUT",
        stepStatus: "done",
      });

      let flatlayVersionId: string | null = null;
      let whiteVersionId: string | null = null;
      let lastVersionId: string | null = null;

      for (let i = 0; i < pipeline.length; i++) {
        const type = pipeline[i]!;
        const step = i + 3;
        const within = (step / stepCount) / assetCount;
        await emit({
          type: "step",
          assetId,
          step,
          stepCount,
          label: `Generando ${AI_ASSET_TYPE_LABELS[type]}…`,
          progress: Math.min(0.99, baseProgress + within),
          processingType: type,
          stepStatus: "active",
        });

        const result = await processVariantFromMaster(master, type);
        const version = await aiStudioRepository.appendVersion({
          assetId,
          parentVersionId: original.id,
          processingType: result.processingType,
          storagePath: result.storagePath,
          mime: result.mime,
          width: result.width,
          height: result.height,
          size: result.size,
          checksum: result.checksum,
          createdById: input.createdById,
          notes: result.notes,
          jobStatus: "COMPLETED",
          makeCurrent: false,
        });
        lastVersionId = version.id;
        if (type === "FLATLAY") flatlayVersionId = version.id;
        if (type === "WHITE_BACKGROUND") whiteVersionId = version.id;

        await emit({
          type: "version_ready",
          assetId,
          processingType: type,
          version: serializeVersion(version),
          progress: Math.min(0.99, baseProgress + within),
        });

        await emit({
          type: "step",
          assetId,
          step,
          stepCount,
          label: `${AI_ASSET_TYPE_LABELS[type]} listo`,
          progress: Math.min(0.99, baseProgress + within),
          processingType: type,
          stepStatus: "done",
        });
      }

      const nextCurrentId = flatlayVersionId ?? whiteVersionId ?? lastVersionId;
      if (nextCurrentId) {
        await aiStudioRepository.setCurrentVersion(assetId, nextCurrentId);
      }

      await prisma.aIProcessingJob.update({
        where: { id: job.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      await prisma.aIAsset.update({
        where: { id: assetId },
        data: { status: "READY" },
      });

      await emit({
        type: "job_done",
        assetId,
        ok: true,
        progress: (assetIndex + 1) / assetCount,
      });
    } catch (error) {
      const message =
        error instanceof GenerativeStudioError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Error de procesamiento";

      failedCount += 1;
      lastError = message;

      await prisma.aIProcessingJob.update({
        where: { id: job.id },
        data: {
          status: "ERROR",
          errorMessage: message,
          completedAt: new Date(),
        },
      });
      await prisma.aIAsset.update({
        where: { id: assetId },
        data: { status: "ERROR" },
      });

      await emit({
        type: "job_done",
        assetId,
        ok: false,
        errorMessage: message,
        progress: (assetIndex + 1) / assetCount,
      });
    }

    jobs.push(await prisma.aIProcessingJob.findUnique({ where: { id: job.id } }));
  }

  const projectIds = new Set<string>();
  for (const assetId of input.assetIds) {
    const asset = await prisma.aIAsset.findUnique({ where: { id: assetId } });
    if (asset) projectIds.add(asset.projectId);
  }
  for (const projectId of projectIds) {
    const remaining = await prisma.aIAsset.count({
      where: { projectId, status: "PROCESSING" },
    });
    if (remaining === 0) {
      await prisma.aIProject.update({
        where: { id: projectId },
        data: { status: "READY" },
      });
    }
  }

  await emit({
    type: "done",
    ok: failedCount === 0,
    failedCount,
    message: lastError,
  });

  return jobs;
}
