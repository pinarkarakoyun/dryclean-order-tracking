-- 0003: writes that touch more than one table run as one function = one transaction (spec §7).
-- Business rules (which status may follow which) live in the app, not here.

-- Finds the customer by phone or creates it, then opens the order.
-- An existing customer's name is never changed here: the form asks first.
create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_tracking_token text
)
returns public.orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order public.orders;
begin
  insert into customers (name, phone)
  values (p_customer_name, p_customer_phone)
  on conflict (phone) do nothing;

  select id into v_customer_id from customers where phone = p_customer_phone;

  insert into orders (tracking_token, customer_id)
  values (p_tracking_token, v_customer_id)
  returning * into v_order;

  return v_order;
end;
$$;

-- Adds a garment with the next item number, starting as RECEIVED, with its first history event.
-- Locking the order row makes two simultaneous adds wait for each other instead of taking the same number.
create or replace function public.add_order_item(
  p_order_id uuid,
  p_garment_name text,
  p_price_list_item_id uuid,
  p_unit_price_kurus integer,
  p_rack_location text,
  p_note text
)
returns public.order_items
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_next integer;
  v_item public.order_items;
begin
  perform 1 from orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found' using errcode = 'P0001';
  end if;

  select coalesce(max(item_no), 0) + 1 into v_next
  from order_items
  where order_id = p_order_id;

  insert into order_items (
    order_id, item_no, price_list_item_id, garment_name,
    unit_price_kurus, rack_location, note, status
  )
  values (
    p_order_id, v_next, p_price_list_item_id, p_garment_name,
    p_unit_price_kurus, p_rack_location, p_note, 'RECEIVED'
  )
  returning * into v_item;

  insert into item_status_events (item_id, from_status, to_status, kind)
  values (v_item.id, null, 'RECEIVED', 'normal');

  return v_item;
end;
$$;

-- Changes one garment's status and records it, in one transaction.
-- 1. Already at the target status: nothing is written (a double click is harmless).
-- 2. Status differs from what the screen showed (p_expected_status): status_conflict.
create or replace function public.change_item_status(
  p_item_id uuid,
  p_expected_status text,
  p_to_status text,
  p_kind text
)
returns public.order_items
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item public.order_items;
begin
  select * into v_item from order_items where id = p_item_id for update;
  if not found then
    raise exception 'item_not_found' using errcode = 'P0001';
  end if;

  if v_item.status = p_to_status then
    return v_item;
  end if;

  if v_item.status <> p_expected_status then
    raise exception 'status_conflict' using errcode = 'P0001';
  end if;

  insert into item_status_events (item_id, from_status, to_status, kind)
  values (p_item_id, v_item.status, p_to_status, p_kind);

  update order_items set status = p_to_status
  where id = p_item_id
  returning * into v_item;

  return v_item;
end;
$$;

-- Only the server (service_role) may call these.
revoke execute on function public.create_order(text, text, text) from public, anon, authenticated;
revoke execute on function public.add_order_item(uuid, text, uuid, integer, text, text) from public, anon, authenticated;
revoke execute on function public.change_item_status(uuid, text, text, text) from public, anon, authenticated;

grant execute on function public.create_order(text, text, text) to service_role;
grant execute on function public.add_order_item(uuid, text, uuid, integer, text, text) to service_role;
grant execute on function public.change_item_status(uuid, text, text, text) to service_role;
