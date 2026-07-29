import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123456!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@capitalgangclothing.com" },
    update: {
      firstName: "Admin",
      lastName: "Principal",
      phone: "0000000000",
      role: "ADMIN",
      passwordHash,
      isValidated: true,
      accessCode: null,
      isActive: true,
    },
    create: {
      firstName: "Admin",
      lastName: "Principal",
      phone: "0000000000",
      email: "admin@capitalgangclothing.com",
      role: "ADMIN",
      passwordHash,
      isValidated: true,
      accessCode: null,
      isActive: true,
    },
  });

  console.log("Administrador inicial creado:");
  console.log("  email:        admin@capitalgangclothing.com");
  console.log("  password:     Admin123456!");
  console.log("  acceso:       no requiere código porque la cuenta ya está validada");
  console.log("  id:", admin.id);

  await prisma.category.createMany({
    data: [
      { storeType: "CLOTHING", name: "Playeras", slug: "playeras" },
      { storeType: "CLOTHING", name: "Hoodies", slug: "hoodies" },
      { storeType: "CLOTHING", name: "Accesorios", slug: "accesorios" },
      { storeType: "TATTOO_SHOP", name: "Tintas", slug: "tintas" },
      { storeType: "TATTOO_SHOP", name: "Agujas", slug: "agujas" },
      { storeType: "TATTOO_SHOP", name: "Cuidado Post-Tatuaje", slug: "cuidado-post-tatuaje" },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
