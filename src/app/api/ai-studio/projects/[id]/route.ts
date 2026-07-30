import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAIStudio } from "@/modules/ai-studio/application/require-ai-studio";
import { aiStudioRepository } from "@/modules/ai-studio/infrastructure/ai-studio.repository";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["DRAFT", "PROCESSING", "READY", "PUBLISHED", "ARCHIVED"]).optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.view");
  if (auth.error) return auth.error;

  const { id } = await params;
  const project = await aiStudioRepository.getProject(id);
  if (!project) return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.edit");
  if (auth.error) return auth.error;

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const project = await aiStudioRepository.updateProject(id, parsed.data);
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.edit");
  if (auth.error) return auth.error;

  const { id } = await params;
  try {
    await aiStudioRepository.deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
  }
}
