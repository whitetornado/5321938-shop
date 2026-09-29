"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _c: SupabaseClient | null = null;
export function supabaseBrowser() {
  if (!_c)
    _c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
  return _c;
}
