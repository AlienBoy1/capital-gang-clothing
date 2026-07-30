import { NextResponse } from "next/server";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { PrismaUserRepository } from "@/modules/identity/infrastructure/user.repository";
import { prisma } from "@/shared/lib/prisma";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ message: "No encontrado" }, { status: 404 });

  return NextResponse.json(new PrismaUserRepository().toPublicProfile(user));
}
