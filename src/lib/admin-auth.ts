import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminToken } from "./admin-session";

export async function isAdmin() {
  const jar = await cookies();
  return verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
}

/** Gebruik in iedere admin server action / route. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
