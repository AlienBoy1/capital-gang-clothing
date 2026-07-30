/**
 * Identity domain — pure types & entities, no framework/DB dependencies.
 */

export type Role = "ADMIN" | "USER";

export interface UserEntity {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  role: Role;
  isValidated: boolean;
  mustSetPassword: boolean;
  isActive: boolean;
  avatarUrl: string | null;
  locale: string;
  theme: "light" | "dark";
}

/**
 * A user must complete the one-time access-code validation before they
 * can authenticate normally.
 */
export function requiresAccessCodeValidation(user: Pick<UserEntity, "isValidated">): boolean {
  return !user.isValidated;
}

/** Password policy for first-time setup / changes. */
export const PASSWORD_SPECIAL_CHARS = ["#", "!", "@", "'", "?"] as const;

export function isValidPasswordPolicy(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[#!@'?]/.test(password)) return false;
  return true;
}

export const PASSWORD_POLICY_MESSAGE =
  "Mínimo 8 caracteres, una mayúscula, un número y un carácter especial (#, !, @, ', ?).";
