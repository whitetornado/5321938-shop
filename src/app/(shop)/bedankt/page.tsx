import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, Package } from "lucide-react";
import { stripe } from "@/lib/stripe";
import { finalizeOrder } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase";
import { money, orderNo } from "@/lib/format";
import { site } from "@/lib/config";
import { ClearCart } from "@/components/shop/ClearCart";
import { ShareButtons } from "@/components/shop/ShareButtons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bedankt voor je bestelling", robots: { index: false } };

export default async function ThankYou({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  if (!session_id?.startsWith("cs_")) return <Invalid />;

  let session;
  try {
    session = await stripe().checkout.sessions.retrieve(session_id);
  } catch {
    return <Invalid />;
  }

  const paid = session.payment_status === "paid";
  if (paid) {
    // Vangnet als de webhook (nog) niet binnen is — idempotent.
    await finalizeOrder(session_id).catch((e) => console.error("finalize on thank-you", e));
  }
  const orderId = session.metadata?.order_id;
  const { data: order } = orderId
    ? await supabaseAdmin().from("orders").select("order_number,total_cents,email").eq("id", orderId).maybeSingle()
    : { data: null };

  const email = session.customer_details?.email ?? order?.email;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
      {paid && <ClearCart />}
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 className="size-9 text-emerald-600" />
      </div>
      <h1 className="font-display mt-6 text-5xl font-extrabold uppercase">
        {paid ? "Bedankt!" : "Bijna klaar…"}
      </h1>
      <p className="mt-3 text-lg text-zinc-600">
        {paid
          ? "Je bestelling is geplaatst en betaald."
          : "We wachten nog op de bevestiging van je betaling. Je ontvangt een e-mail zodra deze binnen is."}
      </p>

      {order && (
        <div className="card mx-auto mt-8 max-w-sm p-5 text-left">
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Bestelnummer</span><strong>{orderNo(order.order_number)}</strong></div>
          <div className="mt-2 flex justify-between text-sm"><span className="text-zinc-500">Totaal</span><strong>{money(order.total_cents)}</strong></div>
        </div>
      )}

      <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left text-sm text-zinc-600">
        <li className="flex gap-3"><Mail className="size-5 shrink-0 text-ink" /> Bevestiging gestuurd naar <strong className="text-ink">{email ?? "je e-mailadres"}</strong>. Niets ontvangen? Check je spam.</li>
        <li className="flex gap-3"><Package className="size-5 shrink-0 text-ink" /> Zodra je pakket onderweg is, krijg je de track &amp; trace-code per e-mail.</li>
      </ul>

      <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-zinc-50 p-5">
        <p className="mb-3 font-semibold">Maak je clubgenoten jaloers 😉</p>
        <div className="flex justify-center"><ShareButtons url={site.url} title={site.tagline} /></div>
      </div>

      <Link href="/" className="btn-dark mt-10">Terug naar de shop</Link>
    </div>
  );
}

function Invalid() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-extrabold uppercase">Bestelling niet gevonden</h1>
      <p className="mt-3 text-zinc-600">Heb je betaald maar geen bevestiging gekregen? Mail ons via {site.contactEmail}.</p>
      <Link href="/" className="btn-dark mt-8">Naar de shop</Link>
    </div>
  );
}
