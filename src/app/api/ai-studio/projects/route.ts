import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAIStudio } from "@/modules/ai-studio/application/require-ai-studio";
import { aiStudioRepository } from "@/modules/ai-studio/infrastructure/ai-studio.repository";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  const auth = await requireAIStudio("aiStudio.view");
  if (auth.error) return auth.error;

  const projects = await aiStudioRepository.listProjects();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const auth = await requireAIStudio("aiStudio.create");
  if (auth.error) return auth.error;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const project = await aiStudioRepository.createProject({
    name: parsed.data.name,
    description: parsed.data.description,
    createdById: auth.session.userId,
  });

  return NextResponse.json(project, { status: 201 });
}
