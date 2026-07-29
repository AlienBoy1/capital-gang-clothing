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
  isActive: boolean;
  avatarUrl: string | null;
  locale: string;
  theme: "light" | "dark";
}

/**
 * A user must complete the one-time access-code validation before they
 * can authenticate normally. This models that invariant explicitly instead
 * of leaving it as a boolean scattered across the codebase.
 */
export function requiresAccessCodeValidation(user: Pick<UserEntity, "isValidated">): boolean {
  return !user.isValidated;
}
