import bcrypt from "bcryptjs";
import type { UserRepository } from "../infrastructure/user.repository";
import { requiresAccessCodeValidation } from "../domain/entities";

export class InvalidCredentialsError extends Error {}
export class AccessCodeRequiredError extends Error {}
export class InvalidAccessCodeError extends Error {}
export class InactiveAccountError extends Error {}

interface AuthenticateInput {
  email: string;
  password: string;
  /** Only required (and only checked) on the user's very first login. */
  accessCode?: string;
}

/**
 * Encapsulates the full login flow, including the one-time access-code
 * gate described in the product spec:
 *
 *  1. Verify email + password.
 *  2. If the account has never been validated, an accessCode is
 *     mandatory and must match the one assigned at creation time.
 *  3. On a successful match, the account is permanently marked as
 *     validated and the access code is cleared — it can never be used
 *     again and will never be asked for again.
 */
export class AuthenticateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: AuthenticateInput) {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new InvalidCredentialsError();

    if (!user.isActive) throw new InactiveAccountError();

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw new InvalidCredentialsError();

    if (requiresAccessCodeValidation(user)) {
      if (!input.accessCode) {
        // Signal the UI to render the access-code step before granting a session.
        throw new AccessCodeRequiredError();
      }

      const codeMatches = user.accessCode
        ? await bcrypt.compare(input.accessCode, user.accessCode)
        : false;

      if (!codeMatches) throw new InvalidAccessCodeError();

      await this.userRepository.markValidatedAndClearAccessCode(user.id);
    }

    return this.userRepository.toPublicProfile(user);
  }
}
