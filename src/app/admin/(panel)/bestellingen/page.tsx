import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { dateTimeNL, money, orderNo } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";
import { StatusBadge } from "@/components/admin/StatusBadge";

const FILTERS = [
  { key: "open", label: "Te verzenden", statuses: ["paid", "processing"] },
  { key: "shipped", label: "Verzonden", statuses: ["shipped", "delivered"] },
  { key: "all", label: "Alle betaalde", statuses: ["paid", "processing", "shipped", "delivered", "cancelled", "refunded"] },
  { key: "pending", label: "Onbetaald/verlopen", statuses: ["pending", "expired", "failed"] },
];

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "open", q } = await searchParams;
  const f = FILTERS.find((x) => x.key === status) ?? FILTERS[0];
  let query = supabaseAdmin().from("orders").select("*, order_items(quantity,size,product_name)").in("status", f.statuses).order("created_at", { ascending: false }).limit(500);
  if (q) {
    const term = q.replace(/[%,()]/g, "").trim();
    const num = Number(term.replace(/\D/g, ""));
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%${num ? `,order_number.eq.${num}` : ""}`);
  }
  const { data } = await query;
  const orders = (data ?? []) as (Order & { order_items: Pick<OrderItem, "quantity" | "size" | "product_name">[] })[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Bestellingen</h1>
        <a href="/api/admin/orders-csv" className="btn-ghost px-4 py-2 text-sm">Export CSV</a>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((x) => (
          <Link key={x.key} href={`/admin/bestellingen?status=${x.key}`} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${x.key === f.key ? "bg-ink text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:ring-ink"}`}>
            {x.label}
          </Link>
        ))}
        <form className="ml-auto">
          <input type="hidden" name="status" value={f.key} />
          <input name="q" defaultValue={q} placeholder="Zoek naam, e-mail, ordernr" className="input w-64 py-2 text-sm" />
        </form>
      </div>

      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Klant</th>
              <th className="px-4 py-3 font-medium">Shirts</th>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Totaal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3"><Link href={`/admin/bestellingen/${o.id}`} className="font-semibold hover:underline">{orderNo(o.order_number)}</Link></td>
                <td className="px-4 py-3"><div>{o.name ?? "—"}</div><div className="text-xs text-zinc-500">{o.email}</div></td>
                <td className="px-4 py-3 text-zinc-600">{o.order_items.map((i) => `${i.quantity}× ${i.size}`).join(", ")}</td>
                <td className="px-4 py-3 text-zinc-500">{dateTimeNL(o.paid_at ?? o.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} />{o.shipping_method === "pickup" && <span className="ml-1 text-xs text-zinc-500">afhalen</span>}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{money(o.total_cents)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">Geen bestellingen in deze lijst.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
