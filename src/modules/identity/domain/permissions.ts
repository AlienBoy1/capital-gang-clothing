import type { Role } from "./entities";

/**
 * Every permission-gated action in the platform lives in this union.
 * Adding a new admin capability means adding one literal here + one
 * entry in ROLE_PERMISSIONS — nothing else in the app should hardcode
 * role checks like `role === "ADMIN"`.
 */
export type Permission =
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "products.toggleActive"
  | "tattooShop.manage"
  | "gallery.manage"
  | "orders.view"
  | "orders.updateStatus"
  | "aiStudio.view"
  | "aiStudio.create"
  | "aiStudio.edit"
  | "aiStudio.process"
  | "aiStudio.publish"
  | "users.create"
  | "users.editAny"
  | "users.editSelf"
  | "users.delete"
  | "admins.create"
  | "admins.delete"
  | "settings.critical.edit"
  | "permissions.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "products.create",
    "products.edit",
    "products.delete",
    "products.toggleActive",
    "tattooShop.manage",
    "gallery.manage",
    "orders.view",
    "orders.updateStatus",
    "aiStudio.view",
    "aiStudio.create",
    "aiStudio.edit",
    "aiStudio.process",
    "aiStudio.publish",
    "users.create",
    "users.editAny",
    "users.editSelf",
    "users.delete",
    "admins.create",
    "admins.delete",
    "settings.critical.edit",
    "permissions.manage",
  ],
  USER: [
    "products.create",
    "products.edit",
    "tattooShop.manage",
    "gallery.manage",
    "orders.view",
    "aiStudio.view",
    "aiStudio.create",
    "aiStudio.edit",
    "aiStudio.process",
    "aiStudio.publish",
    "users.editSelf",
    // Explicitly NOT granted to USER, per spec:
    // products.delete, users.create, users.editAny, users.delete,
    // admins.create, admins.delete, settings.critical.edit, permissions.manage
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(`Role "${role}" lacks permission "${permission}"`);
  }
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN" as const;
}
