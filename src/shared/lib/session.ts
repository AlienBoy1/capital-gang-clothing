import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/modules/identity/domain/entities";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret-change-me");

export interface SessionPayload {
  userId: string;
  role: Role;
  isValidated: boolean;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
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

export const SESSION_COOKIE_NAME = "cgc_session";
