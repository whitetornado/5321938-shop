"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Lock, ShoppingBag, Users } from "lucide-react";
import { toast } from "sonner";
import { MAX_PER_LINE, useCart } from "@/lib/cart";
import { money } from "@/lib/format";
import type { Variant } from "@/lib/types";
import { QtyStepper } from "./QtyStepper";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price_cents: number;
    image: string | null;
  };
  variants: Variant[];
  disabledReason: string | null; // bv. "Uitverkocht" / "Verkoop gesloten"
};

const LOW = 5;

export function BuyBox({ product, variants, disabledReason }: Props) {
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [multi, setMulti] = useState<Record<string, number>>({});
  const [shake, setShake] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);

  const active = variants.filter((v) => v.is_active);
  const maxFor = (v: Variant) => Math.min(MAX_PER_LINE, v.stock ?? MAX_PER_LINE);
  const out = (v: Variant) => v.stock !== null && v.stock <= 0;
  const selected = active.find((v) => v.size === size) ?? null;

  const multiTotal = useMemo(() => Object.values(multi).reduce((a, b) => a + b, 0), [multi]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [mode, disabledReason]);

  const lineBase = (v: Variant) => ({
    variantId: v.id,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    size: v.size,
    priceCents: product.price_cents,
    image: product.image,
    maxQty: v.stock,
  });

  const addSingle = () => {
    if (!selected) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.info("Kies eerst je maat", { description: "Twijfel je? Bekijk de maattabel hieronder." });
      document.getElementById("buybox")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const added = add(lineBase(selected), qty);
    if (added === 0) {
      toast.warning(`Maximum bereikt voor maat ${selected.size}`);
      return;
    }
    if (added < qty) toast.warning(`Er zijn er nog maar ${added} extra beschikbaar in maat ${selected.size}`);
    toast.success(`${added}× ${product.name} (${selected.size}) toegevoegd`);
    setQty(1);
    setOpen(true);
  };

  const addMulti = () => {
    if (multiTotal === 0) {
      toast.info("Vul bij minstens één maat een aantal in");
      return;
    }
    let total = 0;
    for (const v of active) {
      const q = multi[v.id] ?? 0;
      if (q > 0) total += add(lineBase(v), q);
    }
    if (total === 0) {
      toast.warning("Niets toegevoegd — maximum per maat bereikt");
      return;
    }
    toast.success(`${total} shirt${total > 1 ? "s" : ""} toegevoegd aan je winkelwagen`);
    setMulti({});
    setOpen(true);
  };

  if (disabledReason) {
    return (
      <div id="buybox" className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="font-semibold">{disabledReason}</p>
        <p className="mt-1 text-sm text-zinc-600">Volg ons of houd deze pagina in de gaten voor een eventuele nieuwe ronde.</p>
      </div>
    );
  }

  return (
    <div id="buybox" className="scroll-mt-24">
      {/* mode toggle */}
      <div className="mb-5 grid grid-cols-2 rounded-full bg-zinc-100 p-1 text-sm font-semibold" role="tablist">
        {(
          [
            ["single", "Eén maat"],
            ["multi", "Meerdere maten"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`flex items-center justify-center gap-1.5 rounded-full py-2.5 transition ${mode === m ? "bg-white shadow-sm" : "text-zinc-500 hover:text-ink"}`}
          >
            {m === "multi" && <Users className="size-4" />} {label}
          </button>
        ))}
      </div>

      {mode === "single" ? (
        <>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold">
              Maat{selected && <span className="font-normal text-zinc-500">: {selected.size}</span>}
            </span>
            <a href="#maattabel" className="text-sm font-medium text-zinc-600 underline underline-offset-2 hover:text-ink">
              Maattabel
            </a>
          </div>
          <div className={`grid grid-cols-4 gap-2 sm:grid-cols-5 ${shake ? "animate-[shake_.4s]" : ""}`} role="radiogroup" aria-label="Kies je maat">
            {active.map((v) => {
              const disabled = out(v);
              const isSel = size === v.size;
              return (
                <button
                  key={v.id}
                  role="radio"
                  aria-checked={isSel}
                  disabled={disabled}
                  onClick={() => {
                    setSize(v.size);
                    setQty((q) => Math.min(q, maxFor(v)));
                  }}
                  className={`relative h-12 rounded-xl border text-sm font-semibold transition ${
                    isSel
                      ? "border-ink bg-ink text-white"
                      : disabled
                        ? "cursor-not-allowed border-zinc-200 text-zinc-300 line-through"
                        : "border-zinc-300 hover:border-ink"
                  }`}
                >
                  {v.size}
                  {!disabled && v.stock !== null && v.stock <= LOW && (
                    <span className="absolute -right-1 -top-1.5 rounded-full bg-brand px-1.5 text-[10px] leading-4 text-white">
                      {v.stock}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {selected?.stock !== null && selected && selected.stock <= LOW && (
            <p className="mt-2 text-sm font-medium text-brand">Nog maar {selected.stock} op voorraad in {selected.size}</p>
          )}

          <div ref={ctaRef} className="mt-5 flex items-center gap-3">
            <QtyStepper value={qty} onChange={setQty} min={1} max={selected ? maxFor(selected) : MAX_PER_LINE} />
            <button onClick={addSingle} className="btn-primary flex-1">
              <ShoppingBag className="size-4" /> In winkelwagen · {money(product.price_cents * qty)}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-zinc-600">Bestel je voor het hele gezin of team? Vul per maat het aantal in.</p>
          <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
            {active.map((v) => {
              const disabled = out(v);
              return (
                <div key={v.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <span className={`font-semibold ${disabled ? "text-zinc-300 line-through" : ""}`}>{v.size}</span>
                    {disabled ? (
                      <span className="ml-2 text-xs text-zinc-400">uitverkocht</span>
                    ) : (
                      v.stock !== null &&
                      v.stock <= LOW && <span className="ml-2 text-xs font-medium text-brand">nog {v.stock}</span>
                    )}
                  </div>
                  {!disabled && (
                    <QtyStepper
                      size="sm"
                      value={multi[v.id] ?? 0}
                      max={maxFor(v)}
                      onChange={(q) => setMulti((m) => ({ ...m, [v.id]: q }))}
                      label={`Aantal maat ${v.size}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div ref={ctaRef} className="mt-4">
            <button onClick={addMulti} disabled={multiTotal === 0} className="btn-primary w-full">
              <ShoppingBag className="size-4" />
              {multiTotal === 0
                ? "Kies aantallen"
                : `${multiTotal} shirt${multiTotal > 1 ? "s" : ""} toevoegen · ${money(multiTotal * product.price_cents)}`}
            </button>
          </div>
        </>
      )}

      <ul className="mt-5 space-y-1.5 text-sm text-zinc-600">
        <li className="flex items-center gap-2"><Lock className="size-4 text-zinc-400" /> Veilig betalen met iDEAL, Bancontact of creditcard</li>
        <li className="flex items-center gap-2"><Check className="size-4 text-zinc-400" /> 14 dagen bedenktijd · ruilen mogelijk</li>
      </ul>

      {/* sticky mobile CTA */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform md:hidden ${
          ctaVisible ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="text-sm text-zinc-500">{money(product.price_cents)}{selected && ` · maat ${selected.size}`}</p>
          </div>
          <button
            onClick={() =>
              mode === "single" && selected ? addSingle() : document.getElementById("buybox")?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
            className="btn-primary px-5 py-3"
          >
            {mode === "single" && selected ? "Toevoegen" : "Kies maat"}
          </button>
        </div>
      </div>
    </div>
  );
}
