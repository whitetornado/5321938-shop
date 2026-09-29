"use client";
import { ShoppingBag } from "lucide-react";
import { useHydrated } from "@/lib/use-hydrated";
import { cartCount, useCart } from "@/lib/cart";

export function CartButton() {
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const mounted = useHydrated();
  const count = mounted ? cartCount(lines) : 0;
  return (
    <button
      onClick={() => setOpen(true)}
      className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-zinc-100"
      aria-label={`Winkelwagen${count ? `, ${count} artikelen` : ""}`}
    >
      <ShoppingBag className="size-[22px]" strokeWidth={1.8} />
      {count > 0 && (
        <span
          key={count}
          className="animate-fade-in absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold leading-5 text-white"
        >
          {count}
        </span>
      )}
    </button>
  );
}
