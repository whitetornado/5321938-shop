import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-session";
import { ACCESS_COOKIE, PUBLIC_PATHS, accessRequired, verifyAccessToken } from "@/lib/access-session";

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ── Admin ────────────────────────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const ok = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value).catch(() => false);
    if (ok) return NextResponse.next();
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // ── Shop achter toegangscode (alleen als ACCESS_CODE_REQUIRED=true) ──
  if (!accessRequired()) return NextResponse.next();
  if (PUBLIC_PATHS.includes(pathname)) return withNoIndex(NextResponse.next());

  const access = await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value).catch(() => null);
  if (access) return withNoIndex(NextResponse.next());

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Je hebt een geldige toegangscode nodig." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/toegang";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return withNoIndex(NextResponse.redirect(url));
}

function withNoIndex(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: [
    // Alles behalve statische bestanden, fonts, iconen en de webhooks van Stripe/Sendcloud
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|api/stripe/webhook|api/sendcloud/webhook).*)",
  ],
};
