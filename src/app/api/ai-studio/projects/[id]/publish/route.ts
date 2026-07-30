import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAIStudio } from "@/modules/ai-studio/application/require-ai-studio";
import { ProductBridgeService } from "@/modules/ai-studio/application/product-bridge.service";
import { aiStudioRepository } from "@/modules/ai-studio/infrastructure/ai-studio.repository";

const publishSchema = z.object({
  assetVersionIds: z.array(z.string().min(1)).min(1),
  storeType: z.enum(["CLOTHING", "TATTOO_SHOP"]).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.publish");
  if (auth.error) return auth.error;

  const { id } = await params;
  const project = await aiStudioRepository.getProject(id);
  if (!project) return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });

  const parsed = publishSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const session = await ProductBridgeService.createPublicationSession({
      projectId: id,
      assetVersionIds: parsed.data.assetVersionIds,
      createdById: auth.session.userId,
      storeType: parsed.data.storeType,
    });

    const redirectTo = ProductBridgeService.openProductFormPath(
      session.id,
      parsed.data.storeType ?? "CLOTHING"
    );

    return NextResponse.json({
      sessionId: session.id,
      redirectTo,
      assetCount: session.items.length,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo crear la sesión" },
      { status: 400 }
    );
  }
}
