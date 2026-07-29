import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { CreateUserUseCase } from "@/modules/identity/application/create-user.usecase";
import { ForbiddenError } from "@/modules/identity/domain/permissions";
import { prisma } from "@/shared/lib/prisma";

const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email(),
  role: z.enum(["ADMIN", "USER"]),
});

const useCase = new CreateUserUseCase();

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      phone: true,
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await useCase.execute({
      actorRole: session.role,
      actorId: session.userId,
      ...parsed.data,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: "No tienes permiso para esta acción" }, { status: 403 });
    }
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
