-- Phase 1 Step 4: saved setups, session notes, setup history.
-- Auth is deferred to Phase 4 (see STATUS.md); RLS policies below intentionally allow open
-- anon access for this single-user personal tool. Tighten to per-user policies once auth ships.

create extension if not exists pgcrypto;

create table public.setups (
  id uuid primary key default gen_random_uuid(),
  car_id text not null,
  track text not null,
  name text not null,
  raw_setup jsonb not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index setups_car_track_idx on public.setups (car_id, track);

create table public.setup_history (
  id uuid primary key default gen_random_uuid(),
  setup_id uuid not null references public.setups(id) on delete cascade,
  raw_setup jsonb not null,
  change_note text,
  created_at timestamptz not null default now()
);

create index setup_history_setup_id_idx on public.setup_history (setup_id);

-- Auto-snapshot the previous raw_setup into setup_history whenever a setup's raw_setup
-- actually changes, so setup_history requires no app-level bookkeeping.
create function public.log_setup_history() returns trigger as $$
begin
  insert into public.setup_history (setup_id, raw_setup, change_note)
  values (old.id, old.raw_setup, 'auto-saved on update');
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger setups_before_update
before update on public.setups
for each row
when (old.raw_setup is distinct from new.raw_setup)
execute function public.log_setup_history();

create table public.session_notes (
  id uuid primary key default gen_random_uuid(),
  car_id text not null,
  track text not null,
  setup_id uuid references public.setups(id) on delete set null,
  session_type text check (session_type in ('practice', 'qualifying', 'race')),
  conditions jsonb,
  notes text not null,
  created_at timestamptz not null default now()
);

create index session_notes_car_track_idx on public.session_notes (car_id, track);
create index session_notes_setup_id_idx on public.session_notes (setup_id);

alter table public.setups enable row level security;
alter table public.setup_history enable row level security;
alter table public.session_notes enable row level security;

create policy "anon full access (interim, no auth yet)" on public.setups
  for all to anon using (true) with check (true);

create policy "anon full access (interim, no auth yet)" on public.setup_history
  for all to anon using (true) with check (true);

create policy "anon full access (interim, no auth yet)" on public.session_notes
  for all to anon using (true) with check (true);
