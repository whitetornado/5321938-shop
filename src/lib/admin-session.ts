// Edge-safe (gebruikt in proxy.ts én server code)
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dagen

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET ontbreekt of is te kort (min. 32 tekens)");
  return new TextEncoder().encode(s);
}

export async function createAdminToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifyAdminToken(token: string | undefined) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};
