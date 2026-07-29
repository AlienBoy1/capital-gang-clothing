import { NextResponse } from "next/server";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { prisma } from "@/shared/lib/prisma";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const settings = await prisma.appSetting.findMany();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const body = await request.json();
  const settings = Array.isArray(body) ? body : [body];
  const created = [] as Array<{ id: string; key: string; value: string }>;

  for (const item of settings) {
    const existing = await prisma.appSetting.findUnique({ where: { key: item.key } });
    if (existing) {
      const updated = await prisma.appSetting.update({ where: { id: existing.id }, data: { value: item.value } });
      created.push(updated);
    } else {
      const createdItem = await prisma.appSetting.create({ data: { key: item.key, value: item.value } });
      created.push(createdItem);
    }
  }

  return NextResponse.json(created, { status: 201 });
}
