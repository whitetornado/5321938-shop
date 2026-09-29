"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { z } from "zod";
import { ADMIN_COOKIE, adminCookieOptions, createAdminToken } from "@/lib/admin-session";
import { requireAdmin } from "@/lib/admin-auth";
import { PRODUCT_BUCKET, supabaseAdmin } from "@/lib/supabase";
import { slugify } from "@/lib/format";
import { getOrderWithItems, pushToSendcloud, sendOrderEmails, sendShippedEmailOnce } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

type Result = { ok: true; id?: string; message?: string } | { ok: false; error: string };

const revalidateShop = () => revalidatePath("/", "layout");

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */
export async function login(_: unknown, form: FormData): Promise<{ error?: string }> {
  const pw = String(form.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const a = crypto.createHash("sha256").update(pw).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  if (!expected || !crypto.timingSafeEqual(a, b)) {
    await new Promise((r) => setTimeout(r, 800)); // brute-force afremmen
    return { error: "Onjuist wachtwoord" };
  }
  (await cookies()).set(ADMIN_COOKIE, await createAdminToken(), adminCookieOptions);
  const next = String(form.get("next") ?? "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* Uploads (signed upload URL → browser uploadt direct naar Supabase)  */
/* ------------------------------------------------------------------ */
export async function createUploadUrl(filename: string, contentType: string) {
  await requireAdmin();
  if (!/^image\/(png|jpeg|webp)$/.test(contentType)) return { ok: false as const, error: "Alleen PNG/JPG/WebP" };
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const base = slugify(filename.replace(/\.[^.]+$/, "")) || "shirt";
  const path = `products/${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${base}.${ext}`;
  const { data, error } = await supabaseAdmin().storage.from(PRODUCT_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false as const, error: error?.message ?? "Upload-URL mislukt" };
  const { data: pub } = supabaseAdmin().storage.from(PRODUCT_BUCKET).getPublicUrl(path);
  return { ok: true as const, path, token: data.token, publicUrl: pub.publicUrl };
}

/* ------------------------------------------------------------------ */
/* Producten                                                           */
/* ------------------------------------------------------------------ */
const VariantIn = z.object({
  id: z.string().optional(),
  size: z.string().trim().min(1).max(20),
  stock: z.number().int().min(0).nullable(),
  is_active: z.boolean(),
});
const ProductIn = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Naam is te kort").max(120),
  slug: z.string().trim().max(80).optional(),
  subtitle: z.string().trim().max(160).nullable(),
  description: z.string().trim().max(5000).nullable(),
  price_cents: z.number().int().min(0).max(100000),
  compare_at_cents: z.number().int().min(0).nullable(),
  image_front: z.string().url("Voorkant-afbeelding is verplicht"),
  image_back: z.string().url().nullable(),
  extra_images: z.array(z.string().url()).max(8),
  material: z.string().trim().max(2000).nullable(),
  fit: z.string().trim().max(2000).nullable(),
  care: z.string().trim().max(2000).nullable(),
  size_chart: z
    .object({ columns: z.array(z.string()), rows: z.array(z.array(z.string())), note: z.string().optional() })
    .nullable(),
  delivery_note: z.string().trim().max(200).nullable(),
  available_until: z.string().nullable(),
  is_active: z.boolean(),
  featured: z.boolean(),
  sort_order: z.number().int(),
  variants: z.array(VariantIn).min(1, "Kies minstens één maat"),
});
export type ProductInput = z.infer<typeof ProductIn>;

export async function saveProduct(input: ProductInput): Promise<Result> {
  await requireAdmin();
  const parsed = ProductIn.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" };
  const { variants, id, ...p } = parsed.data;
  const db = supabaseAdmin();

  let slug = slugify(p.slug || p.name);
  // unieke slug
  const { data: clash } = await db.from("products").select("id").eq("slug", slug).maybeSingle();
  if (clash && clash.id !== id) slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;

  const row = {
    ...p,
    slug,
    available_until: p.available_until ? new Date(p.available_until).toISOString() : null,
  };

  let productId = id;
  if (productId) {
    const { error } = await db.from("products").update(row).eq("id", productId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await db.from("products").insert(row).select("id").single();
    if (error || !data) return { ok: false, error: error?.message ?? "Opslaan mislukt" };
    productId = data.id as string;
  }

  // Varianten synchroniseren (bestaande blijven behouden i.v.m. orderhistorie)
  const { data: existing } = await db.from("product_variants").select("id,size").eq("product_id", productId);
  const keep = new Set<string>();
  for (const [i, v] of variants.entries()) {
    const match = existing?.find((e) => e.id === v.id || e.size === v.size);
    const vrow = { product_id: productId, size: v.size, stock: v.stock, is_active: v.is_active, sort_order: i };
    if (match) {
      keep.add(match.id);
      await db.from("product_variants").update(vrow).eq("id", match.id);
    } else {
      const { data } = await db.from("product_variants").insert(vrow).select("id").single();
      if (data) keep.add(data.id);
    }
  }
  const remove = (existing ?? []).filter((e) => !keep.has(e.id)).map((e) => e.id);
  if (remove.length) await db.from("product_variants").update({ is_active: false }).in("id", remove);

  revalidateShop();
  return { ok: true, id: productId, message: "Opgeslagen" };
}

export async function toggleProduct(id: string, isActive: boolean): Promise<Result> {
  await requireAdmin();
  const { error } = await supabaseAdmin().from("products").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateShop();
  return { ok: true, message: isActive ? "Shirt staat online" : "Shirt is offline gezet" };
}

export async function duplicateProduct(id: string): Promise<Result> {
  await requireAdmin();
  const db = supabaseAdmin();
  const { data: src } = await db.from("products").select("*, product_variants(*)").eq("id", id).single();
  if (!src) return { ok: false, error: "Niet gevonden" };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at, updated_at, product_variants, ...rest } = src;
  const { data: copy, error } = await db
    .from("products")
    .insert({ ...rest, name: `${rest.name} (kopie)`, slug: `${rest.slug}-kopie-${crypto.randomBytes(2).toString("hex")}`, is_active: false })
    .select("id")
    .single();
  if (error || !copy) return { ok: false, error: error?.message ?? "Kopiëren mislukt" };
  await db.from("product_variants").insert(
    (product_variants as { size: string; stock: number | null; is_active: boolean; sort_order: number }[]).map((v) => ({
      product_id: copy.id,
      size: v.size,
      stock: v.stock,
      is_active: v.is_active,
      sort_order: v.sort_order,
    })),
  );
  revalidatePath("/admin/producten");
  return { ok: true, id: copy.id, message: "Kopie gemaakt (offline)" };
}

export async function deleteProduct(id: string): Promise<Result> {
  await requireAdmin();
  const { error } = await supabaseAdmin().from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateShop();
  return { ok: true, message: "Verwijderd" };
}

/* ------------------------------------------------------------------ */
/* Bestellingen                                                        */
/* ------------------------------------------------------------------ */
const STATUSES: OrderStatus[] = ["paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export async function updateOrder(
  id: string,
  patch: { status?: OrderStatus; tracking_number?: string | null; tracking_url?: string | null; carrier?: string | null; admin_note?: string | null },
): Promise<Result> {
  await requireAdmin();
  if (patch.status && !STATUSES.includes(patch.status)) return { ok: false, error: "Ongeldige status" };
  const extra = patch.status === "shipped" ? { shipped_at: new Date().toISOString() } : {};
  const { error } = await supabaseAdmin().from("orders").update({ ...patch, ...extra }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/bestellingen/${id}`);
  revalidatePath("/admin/bestellingen");
  return { ok: true, message: "Bijgewerkt" };
}

export async function orderToSendcloud(id: string): Promise<Result> {
  await requireAdmin();
  const order = await getOrderWithItems(id);
  if (!order) return { ok: false, error: "Order niet gevonden" };
  try {
    const parcelId = await pushToSendcloud(order, order.order_items);
    if (!parcelId) return { ok: false, error: "Sendcloud-keys ontbreken" };
    revalidatePath(`/admin/bestellingen/${id}`);
    return { ok: true, message: `Zending ${parcelId} staat klaar in Sendcloud` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function resendConfirmation(id: string): Promise<Result> {
  await requireAdmin();
  const order = await getOrderWithItems(id);
  if (!order) return { ok: false, error: "Order niet gevonden" };
  await sendOrderEmails(order, order.order_items, true);
  return { ok: true, message: `Bevestiging opnieuw verstuurd naar ${order.email}` };
}

export async function sendShippedMail(id: string): Promise<Result> {
  await requireAdmin();
  const sent = await sendShippedEmailOnce(id, true);
  revalidatePath(`/admin/bestellingen/${id}`);
  return sent ? { ok: true, message: "Verzendmail verstuurd" } : { ok: false, error: "Versturen mislukt" };
}

/* ------------------------------------------------------------------ */
/* Instellingen                                                        */
/* ------------------------------------------------------------------ */
export async function saveSettings(input: {
  shop_open: boolean;
  closed_message: string | null;
  announcement: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
}): Promise<Result> {
  await requireAdmin();
  const clean = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]),
  );
  const { error } = await supabaseAdmin().from("settings").update(clean).eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidateShop();
  return { ok: true, message: "Instellingen opgeslagen" };
}
