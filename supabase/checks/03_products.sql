-- Products and quick prices checks (run after 0005). Expected result: 4 rows starting with "OK:".
-- Any failure stops with an error that starts with "FAIL:".
-- All test data is rolled back inside the function: nothing stays in the database.

create or replace function pg_temp.run_product_checks()
returns setof text
language plpgsql
as $$
declare
  results text[] := '{}';
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'price_list_items' and column_name = 'price_kurus'
  ) then
    raise exception 'FAIL: price_list_items.price_kurus still exists';
  end if;
  results := results || 'OK: price column removed'::text;

  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'quick_prices' and c.relrowsecurity
  ) then
    raise exception 'FAIL: rls is off for quick_prices';
  end if;
  results := results || 'OK: quick prices rls'::text;

  if has_table_privilege('anon', 'public.quick_prices', 'select')
     or has_table_privilege('authenticated', 'public.quick_prices', 'insert')
     or not has_table_privilege('service_role', 'public.quick_prices', 'insert') then
    raise exception 'FAIL: quick prices grants';
  end if;
  results := results || 'OK: quick prices grants'::text;

  -- Everything below writes test data, then rolls it back by raising 'rollback_checks'.
  begin
    insert into public.quick_prices (amount_kurus) values (987654);
    begin
      insert into public.quick_prices (amount_kurus) values (987654);
      raise exception 'FAIL: quick price unique';
    exception when unique_violation then
      null;
    end;
    begin
      insert into public.quick_prices (amount_kurus) values (0);
      raise exception 'FAIL: quick price above zero';
    exception when check_violation then
      null;
    end;
    results := results || 'OK: quick prices rules'::text;

    raise exception 'rollback_checks';
  exception when raise_exception then
    if sqlerrm <> 'rollback_checks' then raise; end if;
  end;

  return query select unnest(results);
end;
$$;

select * from pg_temp.run_product_checks();
