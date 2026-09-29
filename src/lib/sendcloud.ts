import "server-only";
import crypto from "node:crypto";
import type { Order, OrderItem } from "./types";
import { orderNo } from "./format";

const API = "https://panel.sendcloud.sc/api/v2";

export const hasSendcloud = () =>
  Boolean(process.env.SENDCLOUD_PUBLIC_KEY && process.env.SENDCLOUD_SECRET_KEY);

function auth() {
  const token = Buffer.from(
    `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`,
  ).toString("base64");
  return `Basic ${token}`;
}

/** "Stavangerweg 21-9" → { street: "Stavangerweg", number: "21-9" } */
export function splitAddress(line1: string) {
  const m = line1.trim().match(/^(.*?)[\s,]+(\d+\s*[\w\-\/ ]{0,10})$/);
  if (m && m[1]) return { street: m[1].trim(), number: m[2].trim() };
  return { street: line1.trim(), number: "" };
}

export type SendcloudParcel = {
  id: number;
  tracking_number?: string;
  tracking_url?: string;
  status?: { id: number; message: string };
  carrier?: { code: string };
  order_number?: string;
};

/**
 * Maakt een zending aan in Sendcloud (zonder label). Het label maak je daarna in het
 * Sendcloud-panel (of via de Sendcloud-app); de tracking komt via de webhook terug.
 */
export async function createSendcloudParcel(order: Order, items: OrderItem[]) {
  if (!hasSendcloud()) throw new Error("Sendcloud keys ontbreken");
  const a = order.shipping_address ?? {};
  const { street, number } = splitAddress(a.line1 ?? "");
  const perItem = Number(process.env.SENDCLOUD_WEIGHT_PER_ITEM_KG ?? 0.25);
  const qty = items.reduce((s, i) => s + i.quantity, 0);
  const weight = Math.max(0.1, qty * perItem).toFixed(3);

  const body = {
    parcel: {
      name: order.name ?? "",
      address: street,
      house_number: number,
      address_2: a.line2 ?? "",
      city: a.city ?? "",
      postal_code: a.postal_code ?? "",
      country: a.country ?? "NL",
      telephone: order.phone ?? "",
      email: order.email ?? "",
      order_number: orderNo(order.order_number),
      external_reference: order.id,
      weight,
      request_label: false,
      total_order_value: (order.total_cents / 100).toFixed(2),
      total_order_value_currency: "EUR",
      parcel_items: items.map((i) => ({
        description: `${i.product_name} (${i.size})`.slice(0, 50),
        quantity: i.quantity,
        weight: perItem.toFixed(3),
        value: (i.unit_price_cents / 100).toFixed(2),
        hs_code: "610910", // T-shirts, katoen
        origin_country: "NL",
        sku: i.variant_id ?? undefined,
      })),
    },
  };

  const res = await fetch(`${API}/parcels`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(6000), // Netlify functions: 10s limiet
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Sendcloud ${res.status}: ${JSON.stringify(json?.error ?? json).slice(0, 300)}`);
  }
  return json.parcel as SendcloudParcel;
}

/** Sendcloud ondertekent webhooks met HMAC-SHA256(body, secret key). */
export function verifySendcloudSignature(rawBody: string, signature: string | null) {
  const secret = process.env.SENDCLOUD_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Sendcloud status-id's die we gebruiken
export const SC_DELIVERED = 11;
export const SC_CANCELLED = [2000, 1999];
