import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { PrismaUserRepository } from "@/modules/identity/infrastructure/user.repository";
import { setPasswordSchema } from "@/modules/identity/presentation/login.schema";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/shared/lib/session";
import { prisma } from "@/shared/lib/prisma";

const repo = new PrismaUserRepository();

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });

  const parsed = setPasswordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await repo.setPassword(session.userId, passwordHash);

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

  const profile = repo.toPublicProfile(user);
  const token = await createSessionToken({
    userId: profile.id,
    role: profile.role,
    isValidated: profile.isValidated,
    mustSetPassword: false,
  });

  const response = NextResponse.json({ user: profile });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
