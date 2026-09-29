import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { stripe, type Stripe } from "@/lib/stripe";
import { finalizeOrder } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("Stripe webhook signature invalid", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.payment_status === "paid") {
          await finalizeOrder(s.id, { ensure: true }); // re-fetch met expand
          revalidatePath("/", "layout"); // voorraad kan veranderd zijn
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const s = event.data.object as Stripe.Checkout.Session;
        await setStatus(s, "failed");
        break;
      }
      case "checkout.session.expired": {
        const s = event.data.object as Stripe.Checkout.Session;
        await setStatus(s, "expired");
        break;
      }
      case "charge.refunded": {
        const c = event.data.object as Stripe.Charge;
        if (c.refunded && typeof c.payment_intent === "string") {
          await supabaseAdmin().from("orders").update({ status: "refunded" }).eq("stripe_payment_intent", c.payment_intent);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 }); // Stripe probeert opnieuw
  }
  return NextResponse.json({ received: true });
}

async function setStatus(s: Stripe.Checkout.Session, status: "failed" | "expired") {
  const id = s.metadata?.order_id || s.client_reference_id;
  if (!id) return;
  await supabaseAdmin().from("orders").update({ status }).eq("id", id).eq("status", "pending");
}
