export const site = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  name: process.env.NEXT_PUBLIC_SITE_NAME || "5321938",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || "Het officiële supportersshirt",
  brandColor: process.env.NEXT_PUBLIC_BRAND_COLOR || "#e30613",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@5321938.nl",
  orderPrefix: process.env.NEXT_PUBLIC_ORDER_PREFIX ?? "5321-",
  deliveryTime: process.env.NEXT_PUBLIC_DELIVERY_TIME || "2–4 werkdagen",
  company: {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || "",
    address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "",
    kvk: process.env.NEXT_PUBLIC_COMPANY_KVK || "",
    btw: process.env.NEXT_PUBLIC_COMPANY_BTW || "",
  },
};

export const shipping = {
  countries: (process.env.SHIPPING_COUNTRIES || "NL,BE")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean),
  costCents: Number(process.env.SHIPPING_COST_CENTS ?? 495),
  label: process.env.SHIPPING_LABEL || "Verzenden met track & trace",
  freeFromCents: process.env.FREE_SHIPPING_FROM_CENTS
    ? Number(process.env.FREE_SHIPPING_FROM_CENTS)
    : null,
  pickupEnabled: process.env.PICKUP_ENABLED === "true",
  pickupLabel: process.env.PICKUP_LABEL || "Gratis afhalen",
};

/** Publieke subset voor client components (wordt via props doorgegeven). */
export type PublicShipping = {
  costCents: number;
  freeFromCents: number | null;
  pickupEnabled: boolean;
  pickupLabel: string;
};
export const publicShipping = (): PublicShipping => ({
  costCents: shipping.costCents,
  freeFromCents: shipping.freeFromCents,
  pickupEnabled: shipping.pickupEnabled,
  pickupLabel: shipping.pickupLabel,
});

export const VAT_RATE = 0.21;

export const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
export const KIDS_SIZES = ["98/104", "110/116", "122/128", "134/146", "152/164"];

export const DEFAULT_SIZE_CHART = {
  columns: ["Maat", "Borstbreedte (cm)", "Lengte (cm)"],
  rows: [
    ["S", "49", "71"],
    ["M", "52", "73"],
    ["L", "55", "75"],
    ["XL", "58", "77"],
    ["XXL", "61", "79"],
    ["3XL", "64", "81"],
  ],
  note: "Gemeten plat liggend, van oksel tot oksel. Afwijking ±2 cm mogelijk.",
};
