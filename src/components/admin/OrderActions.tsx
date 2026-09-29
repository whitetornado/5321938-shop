"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { orderToSendcloud, resendConfirmation, sendShippedMail, updateOrder } from "@/app/admin/actions";
import { STATUS_LABEL, type Order, type OrderStatus } from "@/lib/types";

const EDITABLE: OrderStatus[] = ["paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export function OrderActions({ order, sendcloudEnabled }: { order: Order; sendcloudEnabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? "");
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [note, setNote] = useState(order.admin_note ?? "");

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message ?? "Gelukt");
      else toast.error(r.error ?? "Mislukt");
      router.refresh();
    });

  const paid = !["pending", "expired", "failed"].includes(order.status);

  return (
    <>
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Status</h2>
        <select className="input" value={status} disabled={!paid} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
          {(paid ? EDITABLE : [order.status]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <textarea className="input min-h-20 text-sm" placeholder="Interne notitie" value={note} onChange={(e) => setNote(e.target.value)} />
        <button disabled={pending || !paid} className="btn-dark w-full py-2.5 text-sm" onClick={() => run(() => updateOrder(order.id, { status, admin_note: note || null }))}>
          Opslaan
        </button>
      </section>

      {paid && order.shipping_method !== "pickup" && (
        <section className="card space-y-3 p-5">
          <h2 className="font-semibold">Verzending</h2>
          {sendcloudEnabled && (
            order.sendcloud_parcel_id ? (
              <p className="rounded-xl bg-zinc-50 p-3 text-sm">
                Sendcloud zending <strong>#{order.sendcloud_parcel_id}</strong>
                {order.sendcloud_status && <> — {order.sendcloud_status}</>}
                <br />
                <a href="https://app.sendcloud.com/v2/shipping/list/orders" target="_blank" className="underline">Label maken in Sendcloud ↗</a>
              </p>
            ) : (
              <button disabled={pending} onClick={() => run(() => orderToSendcloud(order.id))} className="btn-primary w-full py-2.5 text-sm">
                Zending aanmaken in Sendcloud
              </button>
            )
          )}
          <p className="text-xs text-zinc-500">Track &amp; trace komt automatisch binnen via de Sendcloud-webhook. Handmatig invullen kan ook:</p>
          <input className="input text-sm" placeholder="Trackingnummer" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          <input className="input text-sm" placeholder="Tracking-URL" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
          <input className="input text-sm" placeholder="Vervoerder (postnl, dhl…)" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <button disabled={pending} className="btn-ghost py-2.5 text-sm" onClick={() => run(() => updateOrder(order.id, { tracking_number: tracking || null, tracking_url: trackingUrl || null, carrier: carrier || null, status: "shipped" }))}>
              Markeer verzonden
            </button>
            <button disabled={pending || !order.tracking_url} className="btn-ghost py-2.5 text-sm" onClick={() => run(() => sendShippedMail(order.id))} title={!order.tracking_url ? "Sla eerst een tracking-URL op" : ""}>
              {order.shipped_email_sent_at ? "Verzendmail opnieuw" : "Stuur verzendmail"}
            </button>
          </div>
        </section>
      )}

      {paid && (
        <section className="card p-5">
          <button disabled={pending} className="w-full text-sm font-medium underline" onClick={() => run(() => resendConfirmation(order.id))}>
            Orderbevestiging opnieuw sturen naar klant
          </button>
        </section>
      )}
    </>
  );
}
