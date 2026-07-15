-- Step 7: manual entry form replaces the JSON read/write engine (no PC file access on PS5).
-- Column no longer holds a raw ACC on-disk setup — rename to reflect real-unit setup values.

alter table public.setups rename column raw_setup to setup_values;
alter table public.setup_history rename column raw_setup to setup_values;

create or replace function public.log_setup_history() returns trigger as $$
begin
  insert into public.setup_history (setup_id, setup_values, change_note)
  values (old.id, old.setup_values, 'auto-saved on update');
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = public;

drop trigger setups_before_update on public.setups;
create trigger setups_before_update
before update on public.setups
for each row
when (old.setup_values is distinct from new.setup_values)
execute function public.log_setup_history();
