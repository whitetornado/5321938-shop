"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { cartCount, cartSubtotal, MAX_PER_LINE, useCart } from "@/lib/cart";
import { startCheckout } from "@/lib/checkout-client";
import { useHydrated } from "@/lib/use-hydrated";
import { money } from "@/lib/format";
import type { PublicShipping } from "@/lib/config";
import { QtyStepper } from "./QtyStepper";

export function CartDrawer({ shipping, shopOpen }: { shipping: PublicShipping; shopOpen: boolean }) {
  const { lines, open, setOpen, setQty, remove, restore } = useCart();
  const hydrated = useHydrated();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!hydrated || !open) return null;

  const subtotal = cartSubtotal(lines);
  const count = cartCount(lines);
  const free = shipping.freeFromCents;
  const remaining = free != null ? Math.max(0, free - subtotal) : null;
  const shippingCents = remaining === 0 ? 0 : shipping.costCents;

  const onRemove = (variantId: string) => {
    const line = remove(variantId);
    if (line)
      toast(`${line.name} (${line.size}) verwijderd`, {
        action: { label: "Ongedaan maken", onClick: () => restore(line) },
      });
  };

  const onCheckout = async () => {
    setLoading(true);
    const ok = await startCheckout(lines);
    if (!ok) setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Winkelwagen">
      <button
        className="animate-fade-in absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
        aria-label="Sluiten"
      />
      <aside className="animate-slide-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-bold">
            Winkelwagen {count > 0 && <span className="text-zinc-400">({count})</span>}
          </h2>
          <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-zinc-100" aria-label="Sluiten">
            <X className="size-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-full bg-zinc-100 p-5">
              <ShoppingBag className="size-8 text-zinc-400" />
            </div>
            <p className="font-semibold">Je winkelwagen is nog leeg</p>
            <Link href="/#shirts" onClick={() => setOpen(false)} className="btn-dark">
              Bekijk de shirts
            </Link>
          </div>
        ) : (
          <>
            {free != null && (
              <div className="border-b border-zinc-100 px-5 py-3">
                <p className="flex items-center gap-2 text-sm">
                  <Truck className="size-4 text-brand" />
                  {remaining! > 0 ? (
                    <span>
                      Nog <strong>{money(remaining!)}</strong> tot gratis verzending
                    </span>
                  ) : (
                    <strong>Je bestelling wordt gratis verzonden 🎉</strong>
                  )}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${Math.min(100, (subtotal / free) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <ul className="flex-1 divide-y divide-zinc-100 overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-4 py-4">
                  <Link
                    href={`/shirt/${l.slug}`}
                    onClick={() => setOpen(false)}
                    className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100"
                  >
                    {l.image && <Image src={l.image} alt={l.name} fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{l.name}</p>
                        <p className="text-sm text-zinc-500">Maat {l.size}</p>
                      </div>
                      <p className="font-semibold tabular-nums">{money(l.priceCents * l.quantity)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QtyStepper
                        size="sm"
                        value={l.quantity}
                        min={1}
                        max={Math.min(MAX_PER_LINE, l.maxQty ?? MAX_PER_LINE)}
                        onChange={(v) => setQty(l.variantId, v)}
                        label={`Aantal ${l.name} maat ${l.size}`}
                      />
                      <button
                        onClick={() => onRemove(l.variantId)}
                        className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                        aria-label={`Verwijder ${l.name} maat ${l.size}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-zinc-200 bg-zinc-50 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-600">Subtotaal</dt>
                  <dd className="tabular-nums">{money(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">Verzending</dt>
                  <dd className="tabular-nums">{shippingCents === 0 ? "Gratis" : money(shippingCents)}</dd>
                </div>
                <div className="flex justify-between pt-1.5 text-base font-bold">
                  <dt>Totaal</dt>
                  <dd className="tabular-nums">{money(subtotal + shippingCents)}</dd>
                </div>
                <p className="text-xs text-zinc-500">
                  Incl. btw. {shipping.pickupEnabled && `${shipping.pickupLabel} kan bij het afrekenen.`} Kortingscode? Vul
                  die in bij het afrekenen.
                </p>
              </dl>
              <button onClick={onCheckout} disabled={loading || !shopOpen} className="btn-primary mt-4 w-full">
                <Lock className="size-4" />
                {!shopOpen ? "Verkoop gesloten" : loading ? "Even geduld…" : "Veilig afrekenen"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="mt-2 w-full py-2 text-center text-sm font-medium text-zinc-600 hover:text-ink"
              >
                Verder winkelen
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
