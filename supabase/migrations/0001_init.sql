-- =====================================================================
-- 5321938.nl — supporters shirt shop
-- Draai dit volledige bestand 1x in Supabase → SQL Editor.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Producten
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  subtitle         text,
  description      text,
  price_cents      integer not null check (price_cents >= 0),
  compare_at_cents integer check (compare_at_cents is null or compare_at_cents >= 0),
  image_front      text,
  image_back       text,
  extra_images     text[] not null default '{}',
  material         text,           -- bv. "100% biologisch katoen, 180 g/m²"
  fit              text,           -- bv. "Regular fit, valt normaal"
  care             text,           -- wasvoorschrift
  size_chart       jsonb,          -- { "columns": [...], "rows": [[...], ...], "note": "..." }
  delivery_note    text,           -- bv. "Geleverd vóór 12 oktober"
  available_until  timestamptz,    -- na dit moment niet meer te bestellen (optioneel)
  is_active        boolean not null default false,
  featured         boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  size        text not null,
  sort_order  integer not null default 0,
  stock       integer check (stock is null or stock >= 0), -- null = onbeperkt (print on demand)
  is_active   boolean not null default true,
  unique (product_id, size)
);
create index if not exists product_variants_product_idx on public.product_variants(product_id);

-- ---------------------------------------------------------------------
-- Bestellingen
-- ---------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id                     uuid primary key default gen_random_uuid(),
  order_number           bigint not null unique default nextval('public.order_number_seq'),
  status                 text not null default 'pending'
                         check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded','expired','failed')),
  stripe_session_id      text unique,
  stripe_payment_intent  text,
  email                  text,
  name                   text,
  phone                  text,
  shipping_address       jsonb,     -- {line1,line2,postal_code,city,country}
  shipping_method        text,      -- 'shipping' | 'pickup'
  shipping_label         text,
  subtotal_cents         integer not null default 0,
  shipping_cents         integer not null default 0,
  discount_cents         integer not null default 0,
  total_cents            integer not null default 0,
  currency               text not null default 'eur',
  sendcloud_parcel_id    bigint,
  sendcloud_status       text,
  carrier                text,
  tracking_number        text,
  tracking_url           text,
  admin_note             text,
  confirmation_sent_at   timestamptz,
  admin_notified_at      timestamptz,
  shipped_email_sent_at  timestamptz,
  paid_at                timestamptz,
  shipped_at             timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_sendcloud_idx on public.orders(sendcloud_parcel_id);

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       uuid references public.products(id) on delete set null,
  variant_id       uuid references public.product_variants(id) on delete set null,
  product_name     text not null,
  size             text not null,
  quantity         integer not null check (quantity > 0),
  unit_price_cents integer not null,
  image            text
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------------------------------------------------------------------
-- Winkelinstellingen (1 rij)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id             integer primary key default 1 check (id = 1),
  shop_open      boolean not null default true,
  closed_message text default 'De verkoop is gesloten. Bedankt voor je steun!',
  announcement   text,
  hero_title     text default 'Het officiële supportersshirt',
  hero_subtitle  text default 'Laat zien bij wie je hoort. Beperkte oplage — op = op.',
  updated_at     timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Voorraad atomair verlagen (alleen als voorraad wordt bijgehouden)
-- ---------------------------------------------------------------------
create or replace function public.decrement_stock(p_variant uuid, p_qty integer)
returns void language sql security definer set search_path = public as $$
  update public.product_variants
     set stock = greatest(stock - p_qty, 0)
   where id = p_variant and stock is not null;
$$;
revoke all on function public.decrement_stock(uuid, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- RLS: publiek mag alleen actieve producten lezen. Alles anders via service role.
-- ---------------------------------------------------------------------
alter table public.products          enable row level security;
alter table public.product_variants  enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.settings          enable row level security;

drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products
  for select to anon, authenticated using (is_active = true);

drop policy if exists "public read variants of active products" on public.product_variants;
create policy "public read variants of active products" on public.product_variants
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_active = true));

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select to anon, authenticated using (true);
-- orders / order_items: GEEN policies → alleen service role.

-- ---------------------------------------------------------------------
-- Storage bucket voor productfoto's (publiek leesbaar, schrijven via signed upload URL)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760,
        array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true;
-- Geen insert/update/delete policies voor anon: uploads lopen via een
-- server-side aangemaakte signed upload URL (service role).
