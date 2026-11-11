-- 0004: change_item_status must report a conflict when p_expected_status is NULL.
-- In 0003, "status <> NULL" is NULL (not true), so a caller passing NULL skipped the conflict check.
-- "is distinct from" treats NULL as a real value. The app always sends a status; this closes the gap
-- for any future caller. Run once in the SQL Editor, after 0003. Re-running is harmless.

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

  if v_item.status is distinct from p_expected_status then
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

-- "create or replace" keeps the privileges, but state them again so this file stands on its own.
revoke execute on function public.change_item_status(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.change_item_status(uuid, text, text, text) to service_role;
