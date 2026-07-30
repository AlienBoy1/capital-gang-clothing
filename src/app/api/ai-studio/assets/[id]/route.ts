import { NextResponse } from "next/server";
import { requireAIStudio } from "@/modules/ai-studio/application/require-ai-studio";
import { aiStudioRepository } from "@/modules/ai-studio/infrastructure/ai-studio.repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.view");
  if (auth.error) return auth.error;

  const { id } = await params;
  const asset = await aiStudioRepository.getAsset(id);
  if (!asset) return NextResponse.json({ message: "Asset no encontrado" }, { status: 404 });
  return NextResponse.json(asset);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.edit");
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body?.action === "favorite") {
    const asset = await aiStudioRepository.toggleFavorite(id);
    if (!asset) return NextResponse.json({ message: "Asset no encontrado" }, { status: 404 });
    return NextResponse.json(asset);
  }

  return NextResponse.json({ message: "Acción no soportada" }, { status: 400 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.edit");
  if (auth.error) return auth.error;

  const { id } = await params;
  const ok = await aiStudioRepository.deleteAsset(id);
  if (!ok) return NextResponse.json({ message: "Asset no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
