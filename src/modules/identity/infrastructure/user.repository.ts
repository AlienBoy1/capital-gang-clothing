import { prisma } from "@/shared/lib/prisma";
import type { UserEntity } from "../domain/entities";
import type { Prisma } from "@prisma/client";

type PrismaUser = Prisma.UserGetPayload<{}>;

export interface UserRepository {
  findByEmail(email: string): Promise<PrismaUser | null>;
  markValidatedAndClearAccessCode(userId: string): Promise<void>;
  setPassword(userId: string, passwordHash: string): Promise<void>;
  toPublicProfile(user: PrismaUser): UserEntity;
}

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async markValidatedAndClearAccessCode(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isValidated: true, accessCode: null },
    });
  }

  async setPassword(userId: string, passwordHash: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustSetPassword: false },
    });
  }

  toPublicProfile(user: PrismaUser): UserEntity {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isValidated: user.isValidated,
      mustSetPassword: user.mustSetPassword,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      theme: user.theme as "light" | "dark",
    };
  }
}
