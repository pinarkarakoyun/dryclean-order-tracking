-- RPC checks (run after 0003). Expected result: 8 rows starting with "OK:".
-- Any failure stops with an error that starts with "FAIL:".
-- All test data is rolled back inside the function: nothing stays in the database.

create or replace function pg_temp.run_rpc_checks()
returns setof text
language plpgsql
as $$
declare
  results text[] := '{}';
  v_first public.orders;
  v_second public.orders;
  v_item1 public.order_items;
  v_item2 public.order_items;
  v_changed public.order_items;
  v_count integer;
  v_name text;
  v_from text;
  v_fn text;
begin
  begin
    v_first := public.create_order('Check Person', '+900000000002', 'check-token-0000000000002');
    v_second := public.create_order('Different Name', '+900000000002', 'check-token-0000000000003');

    select count(*) into v_count from public.customers where phone = '+900000000002';
    if v_count <> 1 or v_first.customer_id <> v_second.customer_id or v_first.id = v_second.id then
      raise exception 'FAIL: customer reused';
    end if;
    results := results || 'OK: customer reused'::text;

    select name into v_name from public.customers where id = v_first.customer_id;
    if v_name <> 'Check Person' then
      raise exception 'FAIL: name kept (got %)', v_name;
    end if;
    results := results || 'OK: name kept'::text;

    v_item1 := public.add_order_item(v_first.id, 'Check shirt', null, 1500, null, null);
    v_item2 := public.add_order_item(v_first.id, 'Check coat', null, null, 'A3', 'Stain on sleeve');
    select count(*) into v_count
    from public.item_status_events
    where item_id in (v_item1.id, v_item2.id)
      and from_status is null and to_status = 'RECEIVED' and kind = 'normal';
    if v_item1.item_no <> 1 or v_item2.item_no <> 2 or v_count <> 2
       or v_item1.status <> 'RECEIVED' then
      raise exception 'FAIL: item numbers';
    end if;
    results := results || 'OK: item numbers'::text;

    v_changed := public.change_item_status(v_item1.id, 'RECEIVED', 'CLEANING', 'normal');
    select from_status into v_from
    from public.item_status_events
    where item_id = v_item1.id
    order by id desc
    limit 1;
    if v_changed.status <> 'CLEANING' or v_from <> 'RECEIVED' then
      raise exception 'FAIL: status change';
    end if;
    results := results || 'OK: status change'::text;

    select count(*) into v_count from public.item_status_events where item_id = v_item1.id;
    v_changed := public.change_item_status(v_item1.id, 'RECEIVED', 'CLEANING', 'normal');
    if v_changed.status <> 'CLEANING'
       or (select count(*) from public.item_status_events where item_id = v_item1.id) <> v_count then
      raise exception 'FAIL: double click';
    end if;
    results := results || 'OK: double click'::text;

    begin
      perform public.change_item_status(v_item1.id, 'RECEIVED', 'IRONING', 'normal');
      raise exception 'FAIL: conflict';
    exception when raise_exception then
      if sqlerrm <> 'status_conflict' then raise; end if;
      results := results || 'OK: conflict'::text;
    end;

    begin
      perform public.change_item_status(gen_random_uuid(), 'RECEIVED', 'CLEANING', 'normal');
      raise exception 'FAIL: item not found';
    exception when raise_exception then
      if sqlerrm <> 'item_not_found' then raise; end if;
    end;
    begin
      perform public.add_order_item(gen_random_uuid(), 'Nothing', null, null, null, null);
      raise exception 'FAIL: order not found';
    exception when raise_exception then
      if sqlerrm <> 'order_not_found' then raise; end if;
    end;
    results := results || 'OK: not found'::text;

    raise exception 'rollback_checks';
  exception when raise_exception then
    if sqlerrm <> 'rollback_checks' then raise; end if;
  end;

  foreach v_fn in array array[
    'public.create_order(text,text,text)',
    'public.add_order_item(uuid,text,uuid,integer,text,text)',
    'public.change_item_status(uuid,text,text,text)'
  ] loop
    if has_function_privilege('anon', v_fn, 'execute')
       or has_function_privilege('authenticated', v_fn, 'execute')
       or not has_function_privilege('service_role', v_fn, 'execute') then
      raise exception 'FAIL: grants on %', v_fn;
    end if;
  end loop;
  results := results || 'OK: grants'::text;

  return query select unnest(results);
end;
$$;

select * from pg_temp.run_rpc_checks();
