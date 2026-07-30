import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/modules/identity/domain/entities";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret-change-me");

export interface SessionPayload {
  userId: string;
  role: Role;
  isValidated: boolean;
  mustSetPassword: boolean;
  rememberMe?: boolean;
}

/** ~400 days — Chromium persistent cookie ceiling; for PWA "remember me". */
export const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

export async function createSessionToken(
  payload: SessionPayload,
  options?: { rememberMe?: boolean }
): Promise<string> {
  const rememberMe = Boolean(options?.rememberMe ?? payload.rememberMe);
  return new SignJWT({ ...payload, rememberMe })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? "400d" : "12h")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function buildSessionCookieOptions(rememberMe: boolean) {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  if (rememberMe) {
    return { ...base, maxAge: REMEMBER_MAX_AGE_SECONDS };
  }

  // Session cookie: no maxAge → expires when the browser/PWA session ends
  return base;
}

export const SESSION_COOKIE_NAME = "cgc_session";
