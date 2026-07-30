import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAIStudio } from "@/modules/ai-studio/application/require-ai-studio";
import { enqueueAndProcessAssets } from "@/modules/ai-studio/application/process-assets.usecase";
import { aiStudioRepository } from "@/modules/ai-studio/infrastructure/ai-studio.repository";
import { DEFAULT_PROCESS_PIPELINE } from "@/modules/ai-studio/domain/entities";

export const runtime = "nodejs";
export const maxDuration = 300;

const processSchema = z.object({
  assetIds: z.array(z.string().min(1)).min(1),
  targetTypes: z
    .array(
      z.enum([
        "BACKGROUND_REMOVED",
        "WHITE_BACKGROUND",
        "BLACK_BACKGROUND",
        "PNG",
        "WEBP",
        "JPG",
        "MOCKUP",
        "STREET",
        "FLATLAY",
        "TRYON_MAN",
        "TRYON_WOMAN",
        "DETAIL",
        "THUMBNAIL",
        "PREVIEW_3D",
        "GLB",
      ])
    )
    .optional(),
  stream: z.boolean().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.process");
  if (auth.error) return auth.error;

  const { id } = await params;
  const project = await aiStudioRepository.getProject(id);
  if (!project) return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });

  const parsed = processSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const belonging = parsed.data.assetIds.every((assetId) =>
    project.assets.some((asset) => asset.id === assetId)
  );
  if (!belonging) {
    return NextResponse.json({ message: "Los assets deben pertenecer al proyecto" }, { status: 400 });
  }

  const wantsStream =
    parsed.data.stream !== false &&
    (request.headers.get("accept")?.includes("text/event-stream") || parsed.data.stream === true);

  if (!wantsStream) {
    const jobs = await enqueueAndProcessAssets({
      assetIds: parsed.data.assetIds,
      targetTypes: parsed.data.targetTypes ?? DEFAULT_PROCESS_PIPELINE,
      createdById: auth.session.userId,
    });
    const refreshed = await aiStudioRepository.getProject(id);
    const failed = (jobs ?? []).filter((job) => job?.status === "ERROR");
    return NextResponse.json({
      jobs,
      project: refreshed,
      message: failed[0]?.errorMessage ?? null,
      ok: failed.length === 0,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        send({ type: "started", projectId: id, assetCount: parsed.data.assetIds.length });

        const jobs = await enqueueAndProcessAssets({
          assetIds: parsed.data.assetIds,
          targetTypes: parsed.data.targetTypes ?? DEFAULT_PROCESS_PIPELINE,
          createdById: auth.session.userId,
          onProgress: async (event) => {
            send(event);
          },
        });

        const refreshed = await aiStudioRepository.getProject(id);
        const failed = (jobs ?? []).filter((job) => job?.status === "ERROR");
        send({
          type: "complete",
          ok: failed.length === 0,
          jobs,
          project: refreshed,
          message: failed[0]?.errorMessage ?? null,
        });
      } catch (error) {
        send({
          type: "done",
          ok: false,
          failedCount: 1,
          message: error instanceof Error ? error.message : "Error de procesamiento",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
