import "server-only";
import { hasSupabase, supabasePublic, supabaseAdmin } from "./supabase";
import type { Product, Settings } from "./types";

const SELECT = "*, product_variants(*)";

function normalize(p: Product): Product {
  return {
    ...p,
    extra_images: p.extra_images ?? [],
    product_variants: [...(p.product_variants ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export function isAvailable(p: Pick<Product, "is_active" | "available_until">) {
  if (!p.is_active) return false;
  if (p.available_until && new Date(p.available_until).getTime() < Date.now()) return false;
  return true;
}

export function isSoldOut(p: Product) {
  const active = p.product_variants.filter((v) => v.is_active);
  if (active.length === 0) return true;
  return active.every((v) => v.stock !== null && v.stock <= 0);
}

export async function getActiveProducts(): Promise<Product[]> {
  if (!hasSupabase()) return [];
  const { data, error } = await supabasePublic()
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getActiveProducts", error.message);
    return [];
  }
  return (data as Product[]).map(normalize);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!hasSupabase()) return null;
  const { data, error } = await supabasePublic()
    .from("products")
    .select(SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) console.error("getProductBySlug", error.message);
  return data ? normalize(data as Product) : null;
}

export async function getSettings(): Promise<Settings> {
  const fallback: Settings = {
    id: 1,
    shop_open: true,
    closed_message: null,
    announcement: null,
    hero_title: null,
    hero_subtitle: null,
  };
  if (!hasSupabase()) return fallback;
  const { data } = await supabasePublic().from("settings").select("*").eq("id", 1).maybeSingle();
  return (data as Settings) ?? fallback;
}

/* ---------- admin ---------- */
export async function adminGetProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select(SELECT)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Product[]).map(normalize);
}

export async function adminGetProduct(id: string): Promise<Product | null> {
  const { data } = await supabaseAdmin().from("products").select(SELECT).eq("id", id).maybeSingle();
  return data ? normalize(data as Product) : null;
}
