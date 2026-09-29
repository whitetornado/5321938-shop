import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderWithItems } from "@/lib/orders";
import { dateTimeNL, money, orderNo, vatOf } from "@/lib/format";
import { hasSendcloud } from "@/lib/sendcloud";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OrderActions } from "@/components/admin/OrderActions";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderWithItems(id);
  if (!order) notFound();
  const a = order.shipping_address ?? {};
  const qty = order.order_items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div>
      <Link href="/admin/bestellingen" className="text-sm text-zinc-500 hover:text-ink">← Bestellingen</Link>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{orderNo(order.order_number)}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-zinc-500">{dateTimeNL(order.paid_at ?? order.created_at)}</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold">{qty} shirt{qty !== 1 && "s"}</h2>
            <ul className="mt-3 divide-y divide-zinc-100">
              {order.order_items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-contain" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{i.product_name}</p>
                    <p className="text-sm text-zinc-500">Maat <strong className="text-ink">{i.size}</strong> · {i.quantity}× {money(i.unit_price_cents)}</p>
                  </div>
                  <p className="font-medium tabular-nums">{money(i.quantity * i.unit_price_cents)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-sm">
              <Row k="Subtotaal" v={money(order.subtotal_cents)} />
              {order.discount_cents > 0 && <Row k="Korting" v={`− ${money(order.discount_cents)}`} />}
              <Row k={order.shipping_label ?? "Verzending"} v={money(order.shipping_cents)} />
              <Row k="Totaal" v={money(order.total_cents)} bold />
              <Row k="waarvan btw 21%" v={money(vatOf(order.total_cents))} />
            </dl>
          </section>

          <section className="card grid gap-5 p-5 sm:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Klant</h2>
              <p className="mt-2">{order.name}</p>
              <p><a className="underline" href={`mailto:${order.email}`}>{order.email}</a></p>
              {order.phone && <p><a className="underline" href={`tel:${order.phone}`}>{order.phone}</a></p>}
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{order.shipping_method === "pickup" ? "Afhalen" : "Bezorgadres"}</h2>
              <p className="mt-2 whitespace-pre-line">{[a.line1, a.line2, `${a.postal_code ?? ""} ${a.city ?? ""}`, a.country].filter(Boolean).join("\n")}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <OrderActions order={order} sendcloudEnabled={hasSendcloud()} />
          <section className="card space-y-1 p-5 text-xs text-zinc-500">
            <p>Bevestiging klant: {dateTimeNL(order.confirmation_sent_at)}</p>
            <p>Admin-melding: {dateTimeNL(order.admin_notified_at)}</p>
            <p>Verzendmail: {dateTimeNL(order.shipped_email_sent_at)}</p>
            {order.stripe_payment_intent && (
              <p><a className="underline" target="_blank" href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent}`}>Bekijk betaling in Stripe ↗</a></p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : "text-zinc-600"}`}>
      <dt>{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
