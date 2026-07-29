import bcrypt from "bcryptjs";
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
  /** Plaintext, shown ONCE to the creator so they can hand it to the new
   *  user out-of-band (WhatsApp/in person). Never stored in plaintext,
   *  never retrievable again after this call returns. */
  accessCode: string;
  /** Plaintext temporary password, same one-time-visibility rule applies. */
  temporaryPassword: string;
}

/**
 * Only ADMIN can create USER or ADMIN accounts (users.create / admins.create
 * per the permissions matrix). USER role has no path to this use-case at all
 * in the UI, and this server-side check is what actually enforces it —
 * the UI hiding the button is just a courtesy, not the security boundary.
 */
export class CreateUserUseCase {
  async execute(input: CreateUserInput): Promise<CreateUserResult> {
    assertCan(input.actorRole, input.role === "ADMIN" ? "admins.create" : "users.create");

    const accessCode = generateNumericCode();
    const temporaryPassword = generateNumericCode() + generateNumericCode();

    const [accessCodeHash, passwordHash] = await Promise.all([
      bcrypt.hash(accessCode, 10),
      bcrypt.hash(temporaryPassword, 10),
    ]);

    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        role: input.role,
        accessCode: accessCodeHash,
        passwordHash,
        isValidated: false,
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

    return { userId: user.id, accessCode, temporaryPassword };
  }
}
