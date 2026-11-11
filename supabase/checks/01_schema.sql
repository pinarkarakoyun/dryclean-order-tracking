-- Schema checks (run after 0001 and 0002). Expected result: 8 rows starting with "OK:".
-- Any failure stops with an error that starts with "FAIL:".
-- All test data is rolled back inside the function: nothing stays in the database.

create or replace function pg_temp.run_schema_checks()
returns setof text
language plpgsql
as $$
declare
  results text[] := '{}';
  v_count integer;
  v_customer uuid;
  v_order uuid;
  v_number integer;
  v_item uuid;
  v_event bigint;
begin
  select count(*) into v_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('customers', 'orders', 'price_list_items', 'order_items',
                      'item_status_events', 'item_photos')
    and c.relrowsecurity;
  if v_count <> 6 then
    raise exception 'FAIL: rls is on for % of 6 tables', v_count;
  end if;
  results := results || 'OK: rls'::text;

  if has_table_privilege('anon', 'public.customers', 'select')
     or has_table_privilege('authenticated', 'public.order_items', 'update')
     or not has_table_privilege('service_role', 'public.item_status_events', 'insert') then
    raise exception 'FAIL: table grants';
  end if;
  results := results || 'OK: table grants'::text;

  -- Everything below writes test data, then rolls it back by raising 'rollback_checks'.
  begin
    insert into public.customers (name, phone)
    values ('Check Customer', '+900000000001')
    returning id into v_customer;

    begin
      insert into public.customers (name, phone) values ('Other', '+900000000001');
      raise exception 'FAIL: phone unique';
    exception when unique_violation then
      results := results || 'OK: phone unique'::text;
    end;

    insert into public.orders (tracking_token, customer_id)
    values ('check-token-0000000000001', v_customer)
    returning id, order_number into v_order, v_number;
    if v_number < 1001 then
      raise exception 'FAIL: order number % is below 1001', v_number;
    end if;
    results := results || 'OK: order number'::text;

    insert into public.order_items (order_id, item_no, garment_name)
    values (v_order, 1, 'Check shirt')
    returning id into v_item;

    begin
      update public.order_items set status = 'WASHING' where id = v_item;
      raise exception 'FAIL: status check';
    exception when check_violation then
      results := results || 'OK: status check'::text;
    end;

    insert into public.item_status_events (item_id, from_status, to_status, kind)
    values (v_item, null, 'RECEIVED', 'normal')
    returning id into v_event;

    begin
      update public.item_status_events set kind = 'undo' where id = v_event;
      raise exception 'FAIL: append-only update';
    exception when raise_exception then
      if sqlerrm <> 'item_status_events is append-only' then raise; end if;
      results := results || 'OK: append-only update'::text;
    end;

    begin
      delete from public.item_status_events where id = v_event;
      raise exception 'FAIL: append-only delete';
    exception when raise_exception then
      if sqlerrm <> 'item_status_events is append-only' then raise; end if;
      results := results || 'OK: append-only delete'::text;
    end;

    begin
      delete from public.customers where id = v_customer;
      raise exception 'FAIL: restrict';
    exception when foreign_key_violation then
      results := results || 'OK: restrict'::text;
    end;

    raise exception 'rollback_checks';
  exception when raise_exception then
    if sqlerrm <> 'rollback_checks' then raise; end if;
  end;

  return query select unnest(results);
end;
$$;

select * from pg_temp.run_schema_checks();
