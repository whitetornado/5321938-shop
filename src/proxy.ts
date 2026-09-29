import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const ok = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value).catch(() => false);
  if (ok) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
