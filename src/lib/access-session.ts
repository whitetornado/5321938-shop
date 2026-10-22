// Edge/Node-safe: gebruikt in proxy.ts én server code.
import { SignJWT, jwtVerify } from "jose";

export const ACCESS_COOKIE = "shop_access";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dagen

export const accessRequired = () => process.env.ACCESS_CODE_REQUIRED === "true";

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET ontbreekt of is te kort");
  // Eigen sleutel afleiden, zodat een toegangscookie nooit als admin-cookie geldt
  return new TextEncoder().encode(`${s}:shop-access`);
}

export type AccessClaims = { cid: string; label: string | null };

export async function createAccessToken(c: AccessClaims) {
  return new SignJWT({ cid: c.cid, label: c.label ?? "" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifyAccessToken(token: string | undefined): Promise<AccessClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.cid !== "string") return null;
    return { cid: payload.cid, label: (payload.label as string) || null };
  } catch {
    return null;
  }
}

export const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

/** Pagina's die zonder code bereikbaar blijven (wettelijk verplicht / nodig voor de flow). */
export const PUBLIC_PATHS = ["/toegang", "/voorwaarden", "/privacy", "/retourneren", "/contact", "/verzending", "/robots.txt"];

export const normalizeCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, "");
