import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Mail, Package, Truck, XCircle } from "lucide-react";
import { stripe, type Stripe } from "@/lib/stripe";
import { finalizeOrder } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase";
import { money, orderNo, vatOf } from "@/lib/format";
import { site } from "@/lib/config";
import type { Order, OrderItem } from "@/lib/types";
import { ClearCart } from "@/components/shop/ClearCart";
import { ShareButtons } from "@/components/shop/ShareButtons";
import { StatusRefresher } from "@/components/shop/StatusRefresher";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Status van je bestelling", robots: { index: false } };

type State = "paid" | "processing" | "open" | "failed" | "expired";

function stateOf(s: Stripe.Checkout.Session, order: Order | null): State {
  if (s.payment_status === "paid" || (order && !["pending", "expired", "failed"].includes(order.status))) return "paid";
  if (order?.status === "failed") return "failed";
  if (s.status === "expired" || order?.status === "expired") return "expired";
  if (s.status === "complete") return "processing"; // bv. bankoverschrijving/SEPA nog onderweg
  return "open"; // betaalpagina verlaten zonder te betalen
}

export default async function PaymentStatus({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  if (!session_id?.startsWith("cs_")) return <NotFound />;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe().checkout.sessions.retrieve(session_id);
  } catch {
    return <NotFound />;
  }

  if (session.payment_status === "paid") {
    // Vangnet als de webhook (nog) niet binnen is — idempotent.
    await finalizeOrder(session_id).catch((e) => console.error("finalize on status page", e));
  }

  const orderId = session.metadata?.order_id || session.client_reference_id;
  const { data } = orderId
    ? await supabaseAdmin().from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle()
    : { data: null };
  const order = data as (Order & { order_items: OrderItem[] }) | null;
  const state = stateOf(session, order);

  const email = session.customer_details?.email ?? order?.email ?? null;
  const items = order?.order_items ?? [];
  const total = order?.total_cents || session.amount_total || 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      {state === "paid" && <ClearCart />}
      {state === "processing" && <StatusRefresher />}

      <StatusHeader state={state} orderNumber={order?.order_number} />

      {state === "open" && session.url && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={session.url} className="btn-primary">Verder met betalen</a>
          <Link href="/winkelwagen" className="btn-ghost">Terug naar winkelwagen</Link>
        </div>
      )}
      {(state === "failed" || state === "expired" || (state === "open" && !session.url)) && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/winkelwagen" className="btn-primary">Opnieuw afrekenen</Link>
          <a href={`mailto:${site.contactEmail}`} className="btn-ghost">Hulp nodig?</a>
        </div>
      )}

      {(state === "paid" || state === "processing") && (
        <ol className="mt-10 grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { label: "Betaald", done: state === "paid" },
            { label: "In productie", done: !!order && ["processing", "shipped", "delivered"].includes(order.status) },
            { label: "Verzonden", done: !!order && ["shipped", "delivered"].includes(order.status) },
            { label: "Bezorgd", done: order?.status === "delivered" },
          ].map((s, i) => (
            <li key={s.label} className="flex flex-col items-center gap-2">
              <span
                className={`flex size-9 items-center justify-center rounded-full text-sm font-bold ${
                  s.done ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {s.done ? "✓" : i + 1}
              </span>
              <span className={s.done ? "font-semibold text-ink" : "text-zinc-500"}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      {items.length > 0 && (
        <section className="card mt-10 overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h2 className="font-semibold">Je bestelling</h2>
            {order && <span className="text-sm text-zinc-500">{orderNo(order.order_number)}</span>}
          </div>
          <ul className="divide-y divide-zinc-100 px-5">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                  {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-contain" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.product_name}</p>
                  <p className="text-sm text-zinc-500">Maat {i.size} · {i.quantity}×</p>
                </div>
                <p className="font-medium tabular-nums">{money(i.unit_price_cents * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-zinc-100 bg-zinc-50 px-5 py-4 text-sm">
            {order && order.subtotal_cents > 0 && <Row k="Subtotaal" v={money(order.subtotal_cents)} />}
            {order && order.discount_cents > 0 && <Row k="Korting" v={`− ${money(order.discount_cents)}`} />}
            {state === "paid" && order && (
              <Row k={order.shipping_label || "Verzending"} v={order.shipping_cents ? money(order.shipping_cents) : "Gratis"} />
            )}
            <Row k="Totaal" v={money(total)} bold />
            {state === "paid" && <p className="text-right text-xs text-zinc-500">waarvan {money(vatOf(total))} btw</p>}
          </dl>
        </section>
      )}

      {state === "paid" && (
        <>
          <ul className="mt-8 space-y-3 text-sm text-zinc-600">
            <li className="flex gap-3">
              <Mail className="size-5 shrink-0 text-ink" />
              <span>
                Bevestiging gestuurd naar <strong className="text-ink">{email ?? "je e-mailadres"}</strong>. Niets ontvangen? Check je
                spam.
              </span>
            </li>
            <li className="flex gap-3">
              <Package className="size-5 shrink-0 text-ink" />
              <span>We gaan aan de slag met je bestelling. Verwachte levertijd: {site.deliveryTime}.</span>
            </li>
            <li className="flex gap-3">
              <Truck className="size-5 shrink-0 text-ink" />
              <span>Zodra je pakket onderweg is, ontvang je de track &amp; trace-code per e-mail.</span>
            </li>
          </ul>
          <div className="mt-10 rounded-2xl bg-zinc-50 p-5 text-center">
            <p className="mb-3 font-semibold">Maak je clubgenoten jaloers 😉</p>
            <div className="flex justify-center">
              <ShareButtons url={site.url} title={site.tagline} />
            </div>
          </div>
        </>
      )}

      <div className="mt-10 text-center">
        <Link href="/" className="text-sm font-medium text-zinc-600 underline underline-offset-2 hover:text-ink">
          Terug naar de shop
        </Link>
      </div>
    </div>
  );
}

function StatusHeader({ state, orderNumber }: { state: State; orderNumber?: number }) {
  const cfg = {
    paid: {
      icon: <CheckCircle2 className="size-9 text-emerald-600" />,
      bg: "bg-emerald-50",
      title: "Betaling geslaagd",
      text: `Bedankt! Je bestelling${orderNumber ? ` ${orderNo(orderNumber)}` : ""} is bevestigd.`,
    },
    processing: {
      icon: <Loader2 className="size-9 animate-spin text-amber-600" />,
      bg: "bg-amber-50",
      title: "Betaling wordt verwerkt",
      text: "Je bank bevestigt de betaling. Dit kan even duren — deze pagina ververst vanzelf. Je krijgt ook een e-mail zodra het rond is.",
    },
    open: {
      icon: <Clock className="size-9 text-zinc-500" />,
      bg: "bg-zinc-100",
      title: "Betaling niet afgerond",
      text: "Je hebt nog niet betaald. Je winkelwagen is bewaard — rond je betaling af of probeer het opnieuw.",
    },
    failed: {
      icon: <XCircle className="size-9 text-red-600" />,
      bg: "bg-red-50",
      title: "Betaling mislukt",
      text: "De betaling is niet gelukt en er is niets afgeschreven. Je winkelwagen is bewaard, probeer het gerust opnieuw.",
    },
    expired: {
      icon: <AlertTriangle className="size-9 text-amber-600" />,
      bg: "bg-amber-50",
      title: "Betaalsessie verlopen",
      text: "Je betaalsessie is verlopen en er is niets afgeschreven. Je winkelwagen is bewaard, reken opnieuw af.",
    },
  }[state];

  return (
    <div className="text-center">
      <div className={`mx-auto flex size-16 items-center justify-center rounded-full ${cfg.bg}`}>{cfg.icon}</div>
      <h1 className="font-display mt-5 text-4xl font-extrabold uppercase sm:text-5xl">{cfg.title}</h1>
      <p className="mx-auto mt-3 max-w-md text-zinc-600">{cfg.text}</p>
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

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-extrabold uppercase">Bestelling niet gevonden</h1>
      <p className="mt-3 text-zinc-600">
        Heb je betaald maar geen bevestiging gekregen? Mail ons via {site.contactEmail}.
      </p>
      <Link href="/" className="btn-dark mt-8">Naar de shop</Link>
    </div>
  );
}
