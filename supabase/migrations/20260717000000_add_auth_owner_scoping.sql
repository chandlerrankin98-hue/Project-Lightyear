-- Step 8: close the open RLS gap with real Supabase Auth (single account, email+password).
-- All three tables are currently empty, so these are plain not-null adds with no backfill.

alter table public.setups add column user_id uuid not null references auth.users(id) on delete cascade;
alter table public.setup_history add column user_id uuid not null references auth.users(id) on delete cascade;
alter table public.session_notes add column user_id uuid not null references auth.users(id) on delete cascade;

create index setups_user_id_idx on public.setups (user_id);
create index setup_history_user_id_idx on public.setup_history (user_id);
create index session_notes_user_id_idx on public.session_notes (user_id);

create or replace function public.log_setup_history() returns trigger as $$
begin
  insert into public.setup_history (setup_id, setup_values, change_note, user_id)
  values (old.id, old.setup_values, 'auto-saved on update', old.user_id);
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = public;

drop policy "anon full access (interim, no auth yet)" on public.setups;
drop policy "anon full access (interim, no auth yet)" on public.setup_history;
drop policy "anon full access (interim, no auth yet)" on public.session_notes;

create policy "owner full access" on public.setups
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner full access" on public.setup_history
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owner full access" on public.session_notes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
