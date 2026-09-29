import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;
export function stripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY ontbreekt");
    _stripe = new Stripe(key, { appInfo: { name: "5321938-shop" } });
  }
  return _stripe;
}
export type { Stripe };
