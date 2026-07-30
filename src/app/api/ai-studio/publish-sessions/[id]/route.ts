import { NextResponse } from "next/server";
import { requireAIStudio } from "@/modules/ai-studio/application/require-ai-studio";
import { ProductBridgeService } from "@/modules/ai-studio/application/product-bridge.service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAIStudio("aiStudio.publish");
  if (auth.error) return auth.error;

  const { id } = await params;
  const session = await ProductBridgeService.getSession(id, auth.session.userId);
  if (!session) {
    return NextResponse.json({ message: "Sesión no encontrada o expirada" }, { status: 404 });
  }

  return NextResponse.json({
    session,
    assets: ProductBridgeService.injectAssets(session),
  });
}
