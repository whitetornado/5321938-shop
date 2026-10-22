-- =====================================================================
-- Toegangscodes: shop alleen toegankelijk met een persoonlijke code.
-- Draai dit 1x in Supabase → SQL Editor. Veilig om opnieuw te draaien.
-- Aanzetten met env ACCESS_CODE_REQUIRED=true (Netlify).
-- =====================================================================

create table if not exists public.access_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,          -- altijd HOOFDLETTERS
  label         text,                          -- bv. naam van de jongen
  is_active     boolean not null default true,
  max_uses      integer check (max_uses is null or max_uses > 0), -- max. aantal betaalde bestellingen (null = onbeperkt)
  uses          integer not null default 0,    -- aantal betaalde bestellingen met deze code
  last_used_at  timestamptz,                   -- laatste keer ingelogd
  created_at    timestamptz not null default now()
);

alter table public.access_codes enable row level security;
-- Geen policies: alleen de server (service role) mag erbij.

alter table public.orders add column if not exists access_code_id uuid references public.access_codes(id) on delete set null;
alter table public.orders add column if not exists access_label text;
create index if not exists orders_access_code_idx on public.orders(access_code_id);

create or replace function public.increment_access_code_use(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.access_codes set uses = uses + 1 where id = p_id;
$$;
revoke all on function public.increment_access_code_use(uuid) from public, anon, authenticated;
