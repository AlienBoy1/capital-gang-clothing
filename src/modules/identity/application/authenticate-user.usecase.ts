import bcrypt from "bcryptjs";
import type { UserRepository } from "../infrastructure/user.repository";
import { requiresAccessCodeValidation } from "../domain/entities";

export class InvalidCredentialsError extends Error {}
export class AccessCodeRequiredError extends Error {}
export class InvalidAccessCodeError extends Error {}
export class InactiveAccountError extends Error {}

interface AuthenticateInput {
  email: string;
  /** Optional on first login (access-code flow). Required afterwards. */
  password?: string;
  /** Only required (and only checked) on the user's very first login. */
  accessCode?: string;
}

/**
 * Login flow:
 *  1. First-time users: email + access code (password ignored).
 *  2. Returning users: email + password.
 * After access-code validation, mustSetPassword stays true until they set one.
 */
export class AuthenticateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: AuthenticateInput) {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new InvalidCredentialsError();

    if (!user.isActive) throw new InactiveAccountError();

    if (requiresAccessCodeValidation(user)) {
      if (!input.accessCode) {
        throw new AccessCodeRequiredError();
      }

      const codeMatches = user.accessCode
        ? await bcrypt.compare(input.accessCode, user.accessCode)
        : false;

      if (!codeMatches) throw new InvalidAccessCodeError();

      await this.userRepository.markValidatedAndClearAccessCode(user.id);
      return this.userRepository.toPublicProfile({
        ...user,
        isValidated: true,
        accessCode: null,
      });
    }

    if (!input.password) throw new InvalidCredentialsError();

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw new InvalidCredentialsError();

    return this.userRepository.toPublicProfile(user);
  }
}
