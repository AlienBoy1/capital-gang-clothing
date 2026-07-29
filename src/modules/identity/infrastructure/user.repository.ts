import { prisma } from "@/shared/lib/prisma";
import type { UserEntity } from "../domain/entities";
import type { Prisma } from "@prisma/client";

type PrismaUser = Prisma.UserGetPayload<{}>;

/**
 * Repository interface lives with the implementation in this small project,
 * but is imported by the application layer as a type-only contract —
 * the use-case never imports Prisma directly, keeping it swappable/testable.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<PrismaUser | null>;
  markValidatedAndClearAccessCode(userId: string): Promise<void>;
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

  toPublicProfile(user: PrismaUser): UserEntity {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isValidated: user.isValidated,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      theme: user.theme as "light" | "dark",
    };
  }
}
