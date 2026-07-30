import { NextResponse } from "next/server";
import { can, type Permission } from "@/modules/identity/domain/permissions";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import type { SessionPayload } from "@/shared/lib/session";

type AuthOk = { session: SessionPayload; error?: undefined };
type AuthFail = { session?: undefined; error: NextResponse };

export async function requireAIStudio(
  permission: Permission = "aiStudio.view"
): Promise<AuthOk | AuthFail> {
  const session = await getCurrentSession();
  if (!session) {
    return { error: NextResponse.json({ message: "No autenticado" }, { status: 401 }) };
  }
  if (!can(session.role, permission)) {
    return { error: NextResponse.json({ message: "No autorizado" }, { status: 403 }) };
  }
  return { session };
}
