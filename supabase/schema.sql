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

-- 8. Sign-in log: one row each time someone completes a sign-in (a new session is
--    created). Written by the database itself, so it can't be skipped or edited from
--    the browser. Leads, HR and the owner can read it on the team dashboard.
--    Sign-ins from other domains are logged too, even though the site signs them out.
--    Records: email, time, browser/device (user agent) and IP address.
create table if not exists public.sign_ins (
  id            bigint generated always as identity primary key,
  user_id       uuid references auth.users (id) on delete set null,
  email         text not null,
  signed_in_at  timestamptz not null default now(),
  user_agent    text,
  ip            inet,
  session_id    uuid
);
alter table public.sign_ins add column if not exists ip inet;
create index if not exists sign_ins_signed_in_at on public.sign_ins (signed_in_at desc);
create index if not exists sign_ins_user_id on public.sign_ins (user_id);

alter table public.sign_ins enable row level security;
drop policy if exists "staff read sign-ins" on public.sign_ins;
create policy "staff read sign-ins" on public.sign_ins
  for select to authenticated using (public.is_admin());
revoke all on public.sign_ins from anon, authenticated;
grant select on public.sign_ins to authenticated;

create or replace function public.log_sign_in()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public.sign_ins (user_id, email, signed_in_at, user_agent, ip, session_id)
    select new.user_id, lower(u.email), coalesce(new.created_at, now()), left(new.user_agent, 400), new.ip, new.id
    from auth.users u where u.id = new.user_id and u.email is not null;
  exception when others then
    null;  -- never block a sign-in because the log couldn't be written
  end;
  return new;
end $$;
revoke all on function public.log_sign_in() from public, anon, authenticated;

drop trigger if exists log_sign_in on auth.sessions;
create trigger log_sign_in after insert on auth.sessions
  for each row execute function public.log_sign_in();
