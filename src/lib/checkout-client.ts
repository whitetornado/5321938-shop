"use client";
import { toast } from "sonner";
import { useCart, type CartLine } from "./cart";

type Issue = { variantId: string; available: number; reason: string };

/** Start Stripe Checkout. Corrigeert de winkelwagen als voorraad/prijs gewijzigd is. */
export async function startCheckout(lines: CartLine[]) {
  if (!lines.length) return false;
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })) }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; issues?: Issue[] };
    if (res.ok && data.url) {
      window.location.href = data.url;
      return true;
    }
    if (data.issues?.length) {
      const { setQty } = useCart.getState();
      for (const i of data.issues) setQty(i.variantId, i.available);
      toast.warning("Je winkelwagen is bijgewerkt", {
        description: data.issues.map((i) => i.reason).join(" · "),
      });
      return false;
    }
    toast.error("Afrekenen lukt nu niet", { description: data.error ?? "Probeer het zo nog eens." });
  } catch {
    toast.error("Geen verbinding", { description: "Controleer je internet en probeer opnieuw." });
  }
  return false;
}
