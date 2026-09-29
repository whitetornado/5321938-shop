import "server-only";
import { supabaseAdmin } from "./supabase";
import { stripe, type Stripe } from "./stripe";
import { adminEmail, adminRecipients, confirmationEmail, sendMail, shippedEmail } from "./email";
import { createSendcloudParcel, hasSendcloud } from "./sendcloud";
import type { Order, OrderItem } from "./types";

export async function getOrderWithItems(id: string) {
  const { data } = await supabaseAdmin()
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();
  return data as (Order & { order_items: OrderItem[] }) | null;
}

/**
 * Idempotent: markeert een pending order als betaald, verlaagt voorraad en
 * verstuurt mails + Sendcloud. Wordt aangeroepen vanuit de Stripe webhook én
 * (als vangnet) vanaf de bedankpagina — wie als eerste komt, doet het werk.
 */
export async function finalizeOrder(
  sessionOrId: string | Stripe.Checkout.Session,
  opts: { ensure?: boolean } = {},
) {
  const session =
    typeof sessionOrId === "string"
      ? await stripe().checkout.sessions.retrieve(sessionOrId, {
          expand: ["shipping_cost.shipping_rate"],
        })
      : sessionOrId;

  if (session.payment_status !== "paid") return null;
  const orderId = session.metadata?.order_id || session.client_reference_id;
  if (!orderId) throw new Error(`Geen order_id in session ${session.id}`);

  // Shipping rate metadata ophalen (type: shipping | pickup)
  let rate: Stripe.ShippingRate | null = null;
  const sr = session.shipping_cost?.shipping_rate;
  if (sr) rate = typeof sr === "string" ? await stripe().shippingRates.retrieve(sr) : sr;

  const ship = session.collected_information?.shipping_details;
  const cust = session.customer_details;
  const addr = ship?.address ?? cust?.address ?? null;

  const db = supabaseAdmin();
  const { data: claimed, error } = await db
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_session_id: session.id,
      stripe_payment_intent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      email: cust?.email ?? null,
      name: ship?.name ?? cust?.name ?? null,
      phone: cust?.phone ?? null,
      shipping_address: addr
        ? {
            line1: addr.line1,
            line2: addr.line2,
            postal_code: addr.postal_code,
            city: addr.city,
            country: addr.country,
          }
        : null,
      shipping_method: rate?.metadata?.type ?? "shipping",
      shipping_label: rate?.display_name ?? null,
      shipping_cents: session.shipping_cost?.amount_total ?? 0,
      discount_cents: session.total_details?.amount_discount ?? 0,
      total_cents: session.amount_total ?? 0,
      subtotal_cents: session.amount_subtotal ?? 0,
    })
    .eq("id", orderId)
    .eq("status", "pending") // ← claim: slechts één proces wint
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!claimed) {
    // Al geclaimd. Bij een webhook-retry (bv. na een function-timeout) de
    // ontbrekende stappen alsnog afmaken — mails/Sendcloud zijn idempotent.
    if (opts.ensure) await completeOrder(orderId);
    return null;
  }

  const order = claimed as Order;
  const { data: itemsData } = await db.from("order_items").select("*").eq("order_id", order.id);
  const items = (itemsData ?? []) as OrderItem[];

  // Voorraad verlagen
  for (const i of items) {
    if (i.variant_id) await db.rpc("decrement_stock", { p_variant: i.variant_id, p_qty: i.quantity });
  }

  await sendOrderEmails(order, items);

  if (order.shipping_method !== "pickup" && process.env.SENDCLOUD_AUTO_CREATE !== "false") {
    await pushToSendcloud(order, items).catch((err) =>
      console.error("Sendcloud aanmaken mislukt", order.id, err),
    );
  }

  return order; // let op: revalidatePath gebeurt in de webhook-route (mag niet tijdens render)
}

/** Maakt mails + Sendcloud af voor een betaalde order als die stappen nog ontbreken. */
async function completeOrder(orderId: string) {
  const order = await getOrderWithItems(orderId);
  if (!order || !["paid", "processing"].includes(order.status)) return;
  await sendOrderEmails(order, order.order_items);
  if (
    order.shipping_method !== "pickup" &&
    !order.sendcloud_parcel_id &&
    process.env.SENDCLOUD_AUTO_CREATE !== "false"
  ) {
    await pushToSendcloud(order, order.order_items).catch((err) =>
      console.error("Sendcloud aanmaken mislukt", order.id, err),
    );
  }
}

export async function sendOrderEmails(order: Order, items: OrderItem[], force = false) {
  const db = supabaseAdmin();
  // Klant
  if (order.email && (force || !order.confirmation_sent_at)) {
    try {
      const m = confirmationEmail(order, items);
      await sendMail({
        to: order.email,
        ...m,
        idempotencyKey: force ? undefined : `confirm-${order.id}`,
      });
      await db.from("orders").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", order.id);
    } catch (err) {
      console.error("Bevestigingsmail mislukt", order.id, err);
    }
  }
  // Admin
  const admins = adminRecipients();
  if (admins.length && !order.admin_notified_at && !force) {
    try {
      const m = adminEmail(order, items);
      await sendMail({ to: admins, ...m, replyTo: order.email ?? undefined, idempotencyKey: `admin-${order.id}` });
      await db.from("orders").update({ admin_notified_at: new Date().toISOString() }).eq("id", order.id);
    } catch (err) {
      console.error("Admin-mail mislukt", order.id, err);
    }
  }
}

export async function pushToSendcloud(order: Order, items: OrderItem[]) {
  if (!hasSendcloud()) return null;
  if (order.sendcloud_parcel_id) return order.sendcloud_parcel_id;
  const parcel = await createSendcloudParcel(order, items);
  await supabaseAdmin()
    .from("orders")
    .update({
      sendcloud_parcel_id: parcel.id,
      sendcloud_status: parcel.status?.message ?? null,
      status: order.status === "paid" ? "processing" : order.status,
    })
    .eq("id", order.id);
  return parcel.id;
}

/** Verstuurt (1x) de verzendmail als er tracking is. */
export async function sendShippedEmailOnce(orderId: string, force = false) {
  const db = supabaseAdmin();
  const q = db
    .from("orders")
    .update({ shipped_email_sent_at: new Date().toISOString() })
    .eq("id", orderId);
  const { data } = await (force ? q : q.is("shipped_email_sent_at", null)).select("*").maybeSingle();
  if (!data) return false;
  const order = data as Order;
  if (!order.email) return false;
  try {
    const m = shippedEmail(order);
    await sendMail({ to: order.email, ...m });
    return true;
  } catch (err) {
    console.error("Verzendmail mislukt", orderId, err);
    await db.from("orders").update({ shipped_email_sent_at: null }).eq("id", orderId);
    return false;
  }
}
