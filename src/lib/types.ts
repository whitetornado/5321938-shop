export type SizeChart = { columns: string[]; rows: string[][]; note?: string };

export type Variant = {
  id: string;
  product_id: string;
  size: string;
  sort_order: number;
  stock: number | null;
  is_active: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  image_front: string | null;
  image_back: string | null;
  extra_images: string[];
  material: string | null;
  fit: string | null;
  care: string | null;
  size_chart: SizeChart | null;
  delivery_note: string | null;
  available_until: string | null;
  is_active: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_variants: Variant[];
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "expired"
  | "failed";

export type Address = {
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  size: string;
  quantity: number;
  unit_price_cents: number;
  image: string | null;
};

export type Order = {
  id: string;
  order_number: number;
  status: OrderStatus;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  shipping_address: Address | null;
  shipping_method: string | null;
  shipping_label: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  sendcloud_parcel_id: number | null;
  sendcloud_status: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  admin_note: string | null;
  confirmation_sent_at: string | null;
  admin_notified_at: string | null;
  shipped_email_sent_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type Settings = {
  id: number;
  shop_open: boolean;
  closed_message: string | null;
  announcement: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Wacht op betaling",
  paid: "Betaald",
  processing: "In productie",
  shipped: "Verzonden",
  delivered: "Bezorgd",
  cancelled: "Geannuleerd",
  refunded: "Terugbetaald",
  expired: "Verlopen",
  failed: "Mislukt",
};
