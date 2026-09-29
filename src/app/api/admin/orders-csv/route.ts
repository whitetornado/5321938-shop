import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { orderNo } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { data } = await supabaseAdmin()
    .from("orders")
    .select("*, order_items(*)")
    .in("status", ["paid", "processing", "shipped", "delivered"])
    .order("order_number");
  const header = ["Order", "Datum", "Status", "Naam", "E-mail", "Telefoon", "Adres", "Postcode", "Plaats", "Land", "Verzendwijze", "Shirt", "Maat", "Aantal", "Stukprijs", "Ordertotaal", "Track&Trace"];
  const lines = [header.join(";")];
  for (const o of (data ?? []) as (Order & { order_items: OrderItem[] })[]) {
    const a = o.shipping_address ?? {};
    for (const i of o.order_items) {
      lines.push(
        [
          orderNo(o.order_number), o.paid_at ?? o.created_at, o.status, o.name, o.email, o.phone,
          [a.line1, a.line2].filter(Boolean).join(" "), a.postal_code, a.city, a.country, o.shipping_label,
          i.product_name, i.size, i.quantity, (i.unit_price_cents / 100).toFixed(2).replace(".", ","),
          (o.total_cents / 100).toFixed(2).replace(".", ","), o.tracking_number,
        ].map(esc).join(";"),
      );
    }
  }
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bestellingen-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
