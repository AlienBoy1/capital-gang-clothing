import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { assertCan, ForbiddenError } from "@/modules/identity/domain/permissions";
import { prisma } from "@/shared/lib/prisma";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  isValidated: true,
  mustSetPassword: true,
  accessCodePlain: true,
  locale: true,
  theme: true,
  createdAt: true,
  updatedAt: true,
} as const;

const userSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  isActive: z.boolean().optional(),
  theme: z.enum(["light", "dark"]).optional(),
});

async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session) return { error: NextResponse.json({ message: "No autenticado" }, { status: 401 }) };
  if (session.role !== "ADMIN") {
    return { error: NextResponse.json({ message: "No autorizado" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) return NextResponse.json({ message: "No encontrado" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const { id } = await params;
  const parsed = userSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "No encontrado" }, { status: 404 });

  try {
    assertCan(session.role, "users.editAny");

    const nextRole = parsed.data.role ?? existing.role;
    if (nextRole === "ADMIN" || existing.role === "ADMIN") {
      // Creating/promoting admins or editing admins requires admin privileges
      if (parsed.data.role === "ADMIN" && existing.role !== "ADMIN") {
        assertCan(session.role, "admins.create");
      }
    }

    if (parsed.data.email && parsed.data.email !== existing.email) {
      const clash = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (clash && clash.id !== id) {
        return NextResponse.json({ message: "Ese correo ya está en uso" }, { status: 409 });
      }
    }

    // Prevent locking yourself out by deactivating own account
    if (id === session.userId && parsed.data.isActive === false) {
      return NextResponse.json(
        { message: "No puedes desactivar tu propia cuenta" },
        { status: 400 }
      );
    }
    if (id === session.userId && parsed.data.role === "USER" && existing.role === "ADMIN") {
      return NextResponse.json(
        { message: "No puedes quitarte el rol de administrador" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: userSelect,
    });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "user.updated",
        entityType: "User",
        entityId: id,
        metadata: parsed.data,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: "No tienes permiso para esta acción" }, { status: 403 });
    }
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const session = auth.session!;

  const { id } = await params;
  if (id === session.userId) {
    return NextResponse.json({ message: "No puedes eliminar tu propia cuenta" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ message: "No encontrado" }, { status: 404 });

  try {
    assertCan(session.role, existing.role === "ADMIN" ? "admins.delete" : "users.delete");

    await prisma.user.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "user.deleted",
        entityType: "User",
        entityId: id,
        metadata: { email: existing.email, role: existing.role },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: "No tienes permiso para esta acción" }, { status: 403 });
    }
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
