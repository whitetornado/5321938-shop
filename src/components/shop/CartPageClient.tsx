"use client";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";

export function CartPageClient() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("geannuleerd")) {
      toast.info("Betaling geannuleerd", { description: "Geen zorgen — je winkelwagen is bewaard." });
      window.history.replaceState(null, "", "/winkelwagen");
    }
    useCart.getState().setOpen(true);
  }, []);
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-extrabold uppercase">Winkelwagen</h1>
      <p className="mt-3 text-zinc-600">Je winkelwagen staat rechts open.</p>
      <div className="mt-8 flex justify-center gap-3">
        <button onClick={() => useCart.getState().setOpen(true)} className="btn-dark">Open winkelwagen</button>
        <Link href="/" className="btn-ghost">Verder winkelen</Link>
      </div>
    </div>
  );
}
