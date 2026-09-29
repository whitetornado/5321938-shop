import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SC_CANCELLED, SC_DELIVERED, verifySendcloudSignature, type SendcloudParcel } from "@/lib/sendcloud";
import { sendShippedEmailOnce } from "@/lib/orders";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Sendcloud → Instellingen → Integraties → (jouw API-integratie) → Webhook URL:
 *   https://5321938.nl/api/sendcloud/webhook   (feedback aan)
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySendcloudSignature(raw, req.headers.get("sendcloud-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const body = JSON.parse(raw) as { action?: string; parcel?: SendcloudParcel };
  if (body.action !== "parcel_status_changed" || !body.parcel) return NextResponse.json({ ok: true });

  const p = body.parcel;
  const db = supabaseAdmin();
  const { data } = await db.from("orders").select("*").eq("sendcloud_parcel_id", p.id).maybeSingle();
  const order = data as Order | null;
  if (!order) return NextResponse.json({ ok: true, note: "unknown parcel" });

  const statusId = p.status?.id ?? 0;
  const patch: Partial<Order> = {
    sendcloud_status: p.status?.message ?? null,
    tracking_number: p.tracking_number || order.tracking_number,
    tracking_url: p.tracking_url || order.tracking_url,
    carrier: p.carrier?.code ?? order.carrier,
  };

  // Label aangemaakt / onderweg: er is een trackingnummer en het is geen annulering
  const hasTracking = Boolean(patch.tracking_number) && !SC_CANCELLED.includes(statusId) && statusId !== 1000 && statusId !== 999;
  if (statusId === SC_DELIVERED) patch.status = "delivered";
  else if (hasTracking && ["paid", "processing"].includes(order.status)) {
    patch.status = "shipped";
    patch.shipped_at = new Date().toISOString();
  }

  await db.from("orders").update(patch).eq("id", order.id);
  if (hasTracking && patch.tracking_url) await sendShippedEmailOnce(order.id);

  return NextResponse.json({ ok: true });
}
