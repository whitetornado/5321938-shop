import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifySendcloudSignature, type SendcloudParcel } from "@/lib/sendcloud";
import { sendShippedEmailOnce } from "@/lib/orders";
import { orderNo } from "@/lib/format";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Sendcloud → Instellingen → Integraties → (API-integratie 5321938.nl) → Webhook feedback aan:
 *   https://5321938.nl/api/sendcloud/webhook
 *
 * Verzendmail:
 *  - SENDCLOUD_MAIL_ON=label (standaard): zodra het label is aangemaakt (er is een trackingnummer)
 *  - SENDCLOUD_MAIL_ON=scan: pas als de vervoerder het pakket heeft gescand
 */
const NO_LABEL = [999, 1002]; // geen label / aanmelding mislukt
const CANCELLED = [1999, 2000];
const BEFORE_SCAN = [1000, 1001, 1, 13]; // klaar om te verzenden / aangemeld / nog niet opgehaald
const DELIVERED = 11;

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySendcloudSignature(raw, req.headers.get("sendcloud-signature"))) {
    console.warn("[sendcloud] ongeldige signature — klopt SENDCLOUD_SECRET_KEY met deze integratie?");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(raw) as { action?: string; parcel?: SendcloudParcel };
  if (body.action !== "parcel_status_changed" || !body.parcel) {
    return NextResponse.json({ ok: true, ignored: body.action ?? "no action" });
  }

  const p = body.parcel;
  const statusId = p.status?.id ?? 0;
  console.log("[sendcloud]", p.id, p.order_number, statusId, p.status?.message, p.tracking_number ?? "-");

  // Order zoeken: eerst op parcel-id, anders op ordernummer (bv. "5321-1004")
  const db = supabaseAdmin();
  let { data } = await db.from("orders").select("*").eq("sendcloud_parcel_id", p.id).maybeSingle();
  if (!data && p.order_number) {
    const num = Number(String(p.order_number).replace(/\D/g, "").slice(-9));
    if (num) {
      const r = await db.from("orders").select("*").eq("order_number", num).maybeSingle();
      if (r.data && orderNo((r.data as Order).order_number) === p.order_number) data = r.data;
    }
  }
  const order = data as Order | null;
  if (!order) {
    console.warn("[sendcloud] geen order gevonden voor parcel", p.id, p.order_number);
    return NextResponse.json({ ok: true, note: "unknown parcel" });
  }

  const tracking = p.tracking_number || order.tracking_number;
  const hasLabel = Boolean(tracking) && !NO_LABEL.includes(statusId) && !CANCELLED.includes(statusId);
  const mailOnScan = process.env.SENDCLOUD_MAIL_ON === "scan";
  const shouldMail = hasLabel && (!mailOnScan || !BEFORE_SCAN.includes(statusId));

  const patch: Partial<Order> = {
    sendcloud_parcel_id: order.sendcloud_parcel_id ?? p.id,
    sendcloud_status: p.status?.message ?? null,
    tracking_number: tracking,
    tracking_url: p.tracking_url || order.tracking_url,
    carrier: p.carrier?.code ?? order.carrier,
  };
  if (statusId === DELIVERED) patch.status = "delivered";
  else if (shouldMail && ["paid", "processing"].includes(order.status)) {
    patch.status = "shipped";
    patch.shipped_at = new Date().toISOString();
  }

  await db.from("orders").update(patch).eq("id", order.id);

  if (shouldMail) {
    const sent = await sendShippedEmailOnce(order.id);
    console.log("[sendcloud] verzendmail", order.id, sent ? "verstuurd" : "al eerder verstuurd / mislukt");
  }

  return NextResponse.json({ ok: true });
}
