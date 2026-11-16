-- Zuper Roofing Academy — database schema
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- Before running: check the email domain in allowed_email() and the owner email at the bottom.

-- 1. Staff list: leads, HR and leadership who can see the team dashboard.
create table if not exists public.staff (
  email     text primary key,
  role      text not null check (role in ('admin', 'owner')),  -- owner can also delete learner records
  added_at  timestamptz not null default now()
);

-- 2. One progress row per learner. The app stores its progress document in `data`.
create table if not exists public.progress (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint progress_data_size check (octet_length(data::text) < 262144)
);

alter table public.staff    enable row level security;
alter table public.progress enable row level security;

-- 3. Helper functions (security definer so policies can read the staff list).
create or replace function public.staff_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.staff where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.staff_role() in ('admin', 'owner'), false)
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.staff_role() = 'owner', false)
$$;

-- Only accounts on your company domain may save progress. Keep in step with config.js.
create or replace function public.allowed_email()
returns boolean language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) like '%@zuper.co'
$$;

revoke all on function public.staff_role(), public.is_admin(), public.is_owner(), public.allowed_email() from public, anon;
grant execute on function public.staff_role(), public.is_admin(), public.is_owner(), public.allowed_email() to authenticated;

-- 4. Stamp each write with the signed-in email and time, so rows can't be mislabelled.
create or replace function public.progress_stamp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.email := lower(coalesce(auth.jwt() ->> 'email', new.email));
  new.updated_at := now();
  if tg_op = 'UPDATE' then new.user_id := old.user_id; end if;
  return new;
end $$;

drop trigger if exists progress_stamp on public.progress;
create trigger progress_stamp before insert or update on public.progress
  for each row execute function public.progress_stamp();

-- 5. Access rules.
drop policy if exists "learners read own progress"   on public.progress;
drop policy if exists "staff read all progress"      on public.progress;
drop policy if exists "learners create own progress" on public.progress;
drop policy if exists "learners update own progress" on public.progress;
drop policy if exists "owner deletes progress"       on public.progress;
drop policy if exists "staff read staff list"        on public.staff;

create policy "learners read own progress" on public.progress
  for select to authenticated using (user_id = auth.uid());
create policy "staff read all progress" on public.progress
  for select to authenticated using (public.is_admin());
create policy "learners create own progress" on public.progress
  for insert to authenticated with check (user_id = auth.uid() and public.allowed_email());
create policy "learners update own progress" on public.progress
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.allowed_email());
create policy "owner deletes progress" on public.progress
  for delete to authenticated using (public.is_owner());
create policy "staff read staff list" on public.staff
  for select to authenticated using (public.is_admin());
-- The staff list has no insert/update policies: manage it here in the SQL Editor or the Table Editor.

grant select, insert, update, delete on public.progress to authenticated;
grant select on public.staff to authenticated;

-- 6. Live dashboard updates.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'progress') then
    alter publication supabase_realtime add table public.progress;
  end if;
end $$;

-- 7. Add yourself as owner, and your leads / HR as admins. Edit these emails.
insert into public.staff (email, role) values
  ('suraj.p@zuper.co', 'owner')
  -- , ('lead.name@zuper.co', 'admin')
  -- , ('hr.name@zuper.co', 'admin')
on conflict (email) do update set role = excluded.role;
