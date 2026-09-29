import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { money, orderNo, dateTimeNL } from "@/lib/format";
import { STATUS_LABEL, type Order } from "@/lib/types";
import { StatusBadge } from "@/components/admin/StatusBadge";

const PAID = ["paid", "processing", "shipped", "delivered"];
const OPEN = ["paid", "processing"];

export default async function Dashboard() {
  const db = supabaseAdmin();
  const [{ data: orders }, { data: items }] = await Promise.all([
    db.from("orders").select("*").in("status", PAID).order("created_at", { ascending: false }),
    db.from("order_items").select("product_name,size,quantity,orders!inner(status)").in("orders.status", PAID),
  ]);
  const list = (orders ?? []) as Order[];
  const revenue = list.reduce((s, o) => s + o.total_cents, 0);
  const openOrders = list.filter((o) => OPEN.includes(o.status));
  const shirts = (items ?? []).reduce((s, i) => s + (i.quantity as number), 0);

  // Productie-overzicht: per shirt per maat (alle betaalde orders) + nog te verzenden
  type Row = { total: number; open: number };
  const matrix = new Map<string, Map<string, Row>>();
  for (const i of (items ?? []) as unknown as { product_name: string; size: string; quantity: number; orders: { status: string } }[]) {
    const m = matrix.get(i.product_name) ?? new Map<string, Row>();
    const r = m.get(i.size) ?? { total: 0, open: 0 };
    r.total += i.quantity;
    if (OPEN.includes(i.orders.status)) r.open += i.quantity;
    m.set(i.size, r);
    matrix.set(i.product_name, m);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = list.filter((o) => (o.paid_at ?? o.created_at).slice(0, 10) === today).length;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Overzicht</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Omzet (incl. btw)" value={money(revenue)} />
        <Stat label="Bestellingen" value={String(list.length)} sub={`${todayCount} vandaag`} />
        <Stat label="Shirts verkocht" value={String(shirts)} />
        <Stat label="Te verzenden" value={String(openOrders.length)} href="/admin/bestellingen?status=open" highlight={openOrders.length > 0} />
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Productie-overzicht per maat</h2>
          <a href="/api/admin/orders-csv" className="text-sm font-medium underline">Export CSV</a>
        </div>
        {matrix.size === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Nog geen verkopen.</p>
        ) : (
          [...matrix].map(([name, sizes]) => (
            <div key={name} className="mt-4">
              <p className="text-sm font-semibold">{name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[...sizes].map(([size, r]) => (
                  <div key={size} className="min-w-20 rounded-xl border border-zinc-200 px-3 py-2 text-center">
                    <p className="text-xs text-zinc-500">{size}</p>
                    <p className="text-lg font-bold tabular-nums">{r.total}</p>
                    {r.open > 0 && <p className="text-[11px] font-medium text-amber-600">{r.open} open</p>}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="font-semibold">Laatste bestellingen</h2>
          <Link href="/admin/bestellingen" className="text-sm font-medium underline">Alles</Link>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-100">
            {list.slice(0, 8).map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50">
                <td className="px-5 py-3"><Link href={`/admin/bestellingen/${o.id}`} className="font-semibold hover:underline">{orderNo(o.order_number)}</Link></td>
                <td className="px-2 py-3">{o.name}</td>
                <td className="hidden px-2 py-3 text-zinc-500 sm:table-cell">{dateTimeNL(o.paid_at ?? o.created_at)}</td>
                <td className="px-2 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3 text-right tabular-nums">{money(o.total_cents)}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td className="px-5 py-6 text-zinc-500">Nog geen bestellingen. {STATUS_LABEL.paid} bestellingen verschijnen hier.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value, sub, href, highlight }: { label: string; value: string; sub?: string; href?: string; highlight?: boolean }) {
  const inner = (
    <div className={`card h-full p-5 ${highlight ? "border-amber-300 bg-amber-50" : ""}`}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
