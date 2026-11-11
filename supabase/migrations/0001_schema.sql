-- 0001: tables, constraints, indexes, updated_at trigger, RLS and the photo bucket.
-- Spec: docs/superpowers/specs/2026-11-09-data-model-design.md (§4, §5, §9, §10).
-- Run once in the Supabase SQL Editor, before 0002 and 0003.

-- Keeps updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- One phone number is one customer.
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique, -- E.164, e.g. +905321234567
  preference_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number integer generated always as identity (start with 1001) unique,
  tracking_token text not null unique,
  customer_id uuid not null references public.customers (id) on delete restrict,
  express_percent integer check (express_percent > 0), -- null = normal order
  estimated_ready_date date,
  public_description text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.price_list_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_kurus integer not null check (price_kurus >= 0),
  is_active boolean not null default true, -- used items are deactivated, never deleted
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One physical garment. Tag label = order_number || '-' || item_no (not stored).
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  item_no integer not null check (item_no > 0),
  price_list_item_id uuid references public.price_list_items (id) on delete restrict,
  garment_name text not null,
  unit_price_kurus integer check (unit_price_kurus >= 0),
  rack_location text,
  note text,
  status text not null default 'RECEIVED'
    check (status in ('RECEIVED', 'CLEANING', 'IRONING', 'READY', 'DELIVERED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, item_no)
);

-- Append-only status history (protected by 0002).
create table public.item_status_events (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.order_items (id) on delete restrict,
  from_status text
    check (from_status in ('RECEIVED', 'CLEANING', 'IRONING', 'READY', 'DELIVERED', 'CANCELLED')),
  to_status text not null
    check (to_status in ('RECEIVED', 'CLEANING', 'IRONING', 'READY', 'DELIVERED', 'CANCELLED')),
  kind text not null check (kind in ('normal', 'undo', 'step_back')),
  changed_at timestamptz not null default now()
);

-- Stain/damage photos. The file lives in the private "item-photos" bucket.
create table public.item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.order_items (id) on delete restrict,
  storage_path text not null unique, -- <order_id>/<item_id>/<uuid>.jpg
  note text,
  created_at timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders (customer_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index item_status_events_item_id_idx on public.item_status_events (item_id);
create index item_photos_item_id_idx on public.item_photos (item_id);

create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger price_list_items_set_updated_at before update on public.price_list_items
  for each row execute function public.set_updated_at();
create trigger order_items_set_updated_at before update on public.order_items
  for each row execute function public.set_updated_at();

-- RLS on, no policies: only the server's service_role key can read or write.
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.price_list_items enable row level security;
alter table public.order_items enable row level security;
alter table public.item_status_events enable row level security;
alter table public.item_photos enable row level security;

-- Table privileges: only the server role. The project is created with
-- "Automatically expose new tables" off, so nothing is granted unless listed here.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Private bucket: photos are only shown through short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', false)
on conflict (id) do nothing;
