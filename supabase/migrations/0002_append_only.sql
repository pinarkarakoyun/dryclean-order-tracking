-- 0002: the status history can only grow. Undo adds a new event; nothing is ever changed or removed.
-- Enforced in the database, so it holds whatever code (or person) runs the query.

create or replace function public.prevent_event_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'item_status_events is append-only';
end;
$$;

create trigger item_status_events_no_update_delete
  before update or delete on public.item_status_events
  for each row execute function public.prevent_event_changes();

create trigger item_status_events_no_truncate
  before truncate on public.item_status_events
  for each statement execute function public.prevent_event_changes();
