import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { customAlphabet } from "nanoid";
import { prisma } from "@/shared/lib/prisma";
import { assertCan } from "../domain/permissions";
import type { Role } from "../domain/entities";

const generateNumericCode = customAlphabet("0123456789", 6);

interface CreateUserInput {
  actorRole: Role;
  actorId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: Role;
}

interface CreateUserResult {
  userId: string;
  /** Plaintext, shown ONCE to the creator so they can hand it to the new user. */
  accessCode: string;
}

/**
 * Creates a user without a usable password. The access code is the first-login
 * key; afterwards the user must set their own password on the dashboard.
 */
export class CreateUserUseCase {
  async execute(input: CreateUserInput): Promise<CreateUserResult> {
    assertCan(input.actorRole, input.role === "ADMIN" ? "admins.create" : "users.create");

    const accessCode = generateNumericCode();
    const placeholderPassword = `pending-${randomUUID()}-${Date.now()}`;

    const [accessCodeHash, passwordHash] = await Promise.all([
      bcrypt.hash(accessCode, 10),
      bcrypt.hash(placeholderPassword, 10),
    ]);

    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        role: input.role,
        accessCode: accessCodeHash,
        accessCodePlain: accessCode,
        passwordHash,
        isValidated: false,
        mustSetPassword: true,
        createdById: input.actorId,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: input.actorId,
        action: "user.created",
        entityType: "User",
        entityId: user.id,
        metadata: { role: input.role },
      },
    });

    return { userId: user.id, accessCode };
  }
}
