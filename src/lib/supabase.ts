import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;
let _public: SupabaseClient | null = null;

export const hasSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Service-role client — ALLEEN server-side (webhooks, admin). Omzeilt RLS. */
export function supabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase service role env ontbreekt");
    _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return _admin;
}

/** Anon client voor publieke reads (RLS actief). */
export function supabasePublic(): SupabaseClient {
  if (!_public) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase env ontbreekt");
    _public = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Storefront-data 60s cachen (ISR); admin-acties/orders doen revalidatePath voor directe updates.
      global: {
        fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60, tags: ["shop"] } }),
      },
    });
  }
  return _public;
}

export const PRODUCT_BUCKET = "product-images";
