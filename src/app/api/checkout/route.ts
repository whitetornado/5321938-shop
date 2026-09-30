import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe, type Stripe } from "@/lib/stripe";
import { shipping, site } from "@/lib/config";
import { isAvailable } from "@/lib/products";
import { orderNo } from "@/lib/format";
import type { Product, Variant } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  lines: z
    .array(z.object({ variantId: z.uuid(), quantity: z.number().int().min(1).max(25) }))
    .min(1)
    .max(40),
});

type VariantRow = Variant & { products: Product };

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige winkelwagen" }, { status: 400 });

  // Dubbele varianten samenvoegen
  const wanted = new Map<string, number>();
  for (const l of parsed.data.lines) wanted.set(l.variantId, (wanted.get(l.variantId) ?? 0) + l.quantity);

  const db = supabaseAdmin();

  const { data: settings } = await db.from("settings").select("shop_open, closed_message").eq("id", 1).maybeSingle();
  if (settings && !settings.shop_open)
    return NextResponse.json({ error: settings.closed_message || "De verkoop is gesloten" }, { status: 409 });

  const { data, error } = await db
    .from("product_variants")
    .select("*, products(*)")
    .in("id", [...wanted.keys()]);
  if (error) return NextResponse.json({ error: "Er ging iets mis, probeer opnieuw" }, { status: 500 });

  const rows = (data ?? []) as VariantRow[];
  const issues: { variantId: string; available: number; reason: string }[] = [];

  for (const [id, qty] of wanted) {
    const v = rows.find((r) => r.id === id);
    if (!v || !v.is_active || !v.products || !isAvailable(v.products)) {
      issues.push({ variantId: id, available: 0, reason: `${v?.products?.name ?? "Een artikel"} is niet meer beschikbaar` });
      continue;
    }
    if (v.stock !== null && v.stock < qty) {
      issues.push({
        variantId: id,
        available: v.stock,
        reason: v.stock === 0 ? `${v.products.name} maat ${v.size} is uitverkocht` : `Nog maar ${v.stock}× ${v.products.name} maat ${v.size}`,
      });
    }
  }
  if (issues.length) return NextResponse.json({ error: "Winkelwagen gewijzigd", issues }, { status: 409 });

  // Order (pending) vastleggen vóór betaling — prijzen komen ALTIJD uit de database
  const items = [...wanted].map(([id, qty]) => {
    const v = rows.find((r) => r.id === id)!;
    return {
      product_id: v.products.id,
      variant_id: v.id,
      product_name: v.products.name,
      size: v.size,
      quantity: qty,
      unit_price_cents: v.products.price_cents,
      image: v.products.image_front,
    };
  });
  const subtotal = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);

  const { data: order, error: oErr } = await db
    .from("orders")
    .insert({ status: "pending", subtotal_cents: subtotal, total_cents: subtotal })
    .select("id, order_number")
    .single();
  if (oErr || !order) return NextResponse.json({ error: "Bestelling aanmaken mislukt" }, { status: 500 });

  const { error: iErr } = await db.from("order_items").insert(items.map((i) => ({ ...i, order_id: order.id })));
  if (iErr) {
    await db.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: "Bestelling aanmaken mislukt" }, { status: 500 });
  }

  // Verzendopties
  const free = shipping.freeFromCents != null && subtotal >= shipping.freeFromCents;
  const shipping_options: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [
    {
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: free ? `${shipping.label} (gratis)` : shipping.label,
        fixed_amount: { amount: free ? 0 : shipping.costCents, currency: "eur" },
        tax_behavior: "inclusive",
        metadata: { type: "shipping" },
      },
    },
  ];
  if (shipping.pickupEnabled) {
    shipping_options.push({
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: shipping.pickupLabel,
        fixed_amount: { amount: 0, currency: "eur" },
        tax_behavior: "inclusive",
        metadata: { type: "pickup" },
      },
    });
  }

  // Lokaal (npm run dev op poort 3000/3003/…) terugsturen naar de poort waar je nu zit;
  // in productie altijd naar NEXT_PUBLIC_SITE_URL.
  const reqOrigin = new URL(req.url).origin;
  const base =
    process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(reqOrigin)
      ? reqOrigin
      : site.url;

  const toAbs = (u: string | null) => (u && /^https:\/\//.test(u) ? [u] : undefined);

  try {
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        locale: "nl",
        client_reference_id: order.id,
        metadata: { order_id: order.id, order_number: String(order.order_number) },
        payment_intent_data: {
          description: `Bestelling ${orderNo(order.order_number)}`,
          metadata: { order_id: order.id, order_number: String(order.order_number) },
        },
        line_items: items.map((i) => ({
          quantity: i.quantity,
          price_data: {
            currency: "eur",
            unit_amount: i.unit_price_cents,
            tax_behavior: "inclusive",
            product_data: {
              name: i.product_name,
              description: `Maat ${i.size}`,
              images: toAbs(i.image),
              metadata: { variant_id: i.variant_id },
            },
          },
        })),
        shipping_address_collection: {
          allowed_countries: shipping.countries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
        },
        shipping_options,
        phone_number_collection: { enabled: true },
        billing_address_collection: "auto",
        allow_promotion_codes: process.env.STRIPE_ALLOW_PROMO_CODES !== "false",
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 uur
        custom_text: {
          submit: {
            message: `Door te betalen ga je akkoord met onze algemene voorwaarden (${site.url}/voorwaarden).`,
          },
        },
        success_url: `${base}/bedankt?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/winkelwagen?geannuleerd=1`,
      },
      { idempotencyKey: `checkout-${order.id}` },
    );

    await db.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error", err);
    await db.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: "Betaalomgeving niet bereikbaar, probeer het zo opnieuw" }, { status: 502 });
  }
}
