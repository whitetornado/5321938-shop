import type { Metadata } from "next";
import { CartPageClient } from "@/components/shop/CartPageClient";

export const metadata: Metadata = { title: "Winkelwagen", robots: { index: false } };

export default function CartPage() {
  return <CartPageClient />;
}
