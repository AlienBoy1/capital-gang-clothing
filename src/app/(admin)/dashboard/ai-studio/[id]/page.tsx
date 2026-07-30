import { ProjectWorkspace } from "@/modules/ai-studio/presentation/ProjectWorkspace";

export default async function AIStudioProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectWorkspace projectId={id} />;
}
