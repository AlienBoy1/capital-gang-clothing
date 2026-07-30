import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAIStudio } from "@/modules/ai-studio/application/require-ai-studio";
import { aiStudioRepository } from "@/modules/ai-studio/infrastructure/ai-studio.repository";

const uploadSchema = z.object({
  urls: z.array(z.string().min(1)).min(1).max(24),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.create");
  if (auth.error) return auth.error;

  const { id } = await params;
  const project = await aiStudioRepository.getProject(id);
  if (!project) return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });

  const parsed = uploadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const assets = await aiStudioRepository.createOriginalAssets({
    projectId: id,
    urls: parsed.data.urls,
    createdById: auth.session.userId,
  });

  return NextResponse.json(assets, { status: 201 });
}
