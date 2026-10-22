import "server-only";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";
import { ACCESS_COOKIE, accessRequired, verifyAccessToken } from "./access-session";

export type AccessCode = {
  id: string;
  code: string;
  label: string | null;
  is_active: boolean;
  max_uses: number | null;
  uses: number;
  last_used_at: string | null;
  created_at: string;
};

/**
 * Controleert de toegangscookie tegen de database (code nog actief en niet op).
 * Geeft null als toegang niet verplicht is, anders de code of een foutmelding.
 */
export async function checkAccess(): Promise<
  { required: false } | { required: true; ok: true; code: AccessCode } | { required: true; ok: false; error: string }
> {
  if (!accessRequired()) return { required: false };
  const claims = await verifyAccessToken((await cookies()).get(ACCESS_COOKIE)?.value);
  if (!claims) return { required: true, ok: false, error: "Je hebt een geldige toegangscode nodig." };
  const { data } = await supabaseAdmin().from("access_codes").select("*").eq("id", claims.cid).maybeSingle();
  const code = data as AccessCode | null;
  if (!code || !code.is_active) return { required: true, ok: false, error: "Je toegangscode is niet meer geldig." };
  if (code.max_uses !== null && code.uses >= code.max_uses)
    return { required: true, ok: false, error: "Met deze toegangscode is het maximale aantal bestellingen al gedaan." };
  return { required: true, ok: true, code };
}

export function generateCode(prefix = "GHC") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // zonder 0/O/1/I
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const part = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${prefix ? prefix + "-" : ""}${part}`;
}
