-- Products have no price any more, and the quick price buttons move from the code to the database.
-- Run AFTER the app code that no longer reads price_list_items.price_kurus is in place.
-- Safe to run again: every statement checks first.

-- 1. The same garment type is not always the same price: the price is typed per order item.
--    Order items keep their own copied price (order_items.unit_price_kurus), so nothing is lost.
--    The table keeps its name: renaming it would also change order_items.price_list_item_id
--    and the add_order_item function, for no gain.
alter table public.price_list_items drop column if exists price_kurus;

-- 2. Quick price buttons of the item form, edited in the panel. Not linked to any order.
create table if not exists public.quick_prices (
  id uuid primary key default gen_random_uuid(),
  amount_kurus integer not null unique check (amount_kurus > 0),
  created_at timestamptz not null default now()
);

alter table public.quick_prices enable row level security;

-- Same rule as every other table (0001): only the server (service_role) may read or write.
revoke all on public.quick_prices from anon, authenticated;
grant select, insert, update, delete on public.quick_prices to service_role;

-- 3. Starting buttons: the values that were in the code (EXAMPLE VALUES, the shop edits them).
insert into public.quick_prices (amount_kurus)
values (10000), (15000), (20000), (25000), (30000), (40000)
on conflict (amount_kurus) do nothing;
