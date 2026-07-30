import { NextResponse } from "next/server";
import { requireAIStudio } from "@/modules/ai-studio/application/require-ai-studio";
import { aiStudioRepository } from "@/modules/ai-studio/infrastructure/ai-studio.repository";
import { prisma } from "@/shared/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.edit");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body?.action as string | undefined;

  const version = await prisma.aIAssetVersion.findUnique({ where: { id } });
  if (!version) return NextResponse.json({ message: "Versión no encontrada" }, { status: 404 });

  if (action === "restore" || action === "setCurrent") {
    const asset = await aiStudioRepository.setCurrentVersion(version.assetId, id);
    return NextResponse.json(asset);
  }

  if (action === "duplicate") {
    const asset = await aiStudioRepository.duplicateVersion(id, auth.session.userId);
    return NextResponse.json(asset);
  }

  return NextResponse.json({ message: "Acción no soportada" }, { status: 400 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.edit");
  if (auth.error) return auth.error;

  const { id } = await params;
  const result = await aiStudioRepository.deleteVersion(id);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }
  return NextResponse.json(result.asset);
}
