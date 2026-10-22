"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { ACCESS_COOKIE, accessCookieOptions, createAccessToken, normalizeCode } from "@/lib/access-session";
import type { AccessCode } from "@/lib/access";

export async function enterCode(_: unknown, form: FormData): Promise<{ error?: string }> {
  const code = normalizeCode(String(form.get("code") ?? ""));
  const next = String(form.get("next") ?? "/");
  const fail = async (error: string) => {
    await new Promise((r) => setTimeout(r, 700)); // raden afremmen
    return { error };
  };
  if (code.length < 4 || code.length > 40) return fail("Vul je toegangscode in.");

  const { data } = await supabaseAdmin().from("access_codes").select("*").eq("code", code).maybeSingle();
  const c = data as AccessCode | null;
  if (!c || !c.is_active) return fail("Deze code is onbekend of niet meer geldig.");
  if (c.max_uses !== null && c.uses >= c.max_uses) return fail("Met deze code is al besteld.");

  await supabaseAdmin().from("access_codes").update({ last_used_at: new Date().toISOString() }).eq("id", c.id);
  (await cookies()).set(ACCESS_COOKIE, await createAccessToken({ cid: c.id, label: c.label }), accessCookieOptions);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}
