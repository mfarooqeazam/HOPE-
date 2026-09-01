-- ---------------------------------------------------------------------------
-- Migration 03 — therapists, and access limited to their own clients
--
-- WHAT CHANGES
-- Migration 02 had two levels: you see your own row, or you are staff and see
-- everything. That is too blunt for a centre with therapists in it. A
-- therapist working with six children has no business reading the seventh
-- family's session notes.
--
-- This adds a third level between them:
--
--   family / trainee   sees only their own records
--   therapist          sees only the clients assigned to them, and can write
--                      session notes and upload documents for those clients
--   admin              sees everything, because someone has to schedule and
--                      invoice
--
-- The assignment is an explicit row in `care_team`. There is no implicit
-- access: a therapist who is not assigned sees nothing, and adding a
-- therapist to a family is a deliberate act that leaves a record of who did
-- it and when.
--
-- Run AFTER migration-02-portal.sql. Safe to run more than once.
-- ---------------------------------------------------------------------------

-- 1. `staff` was the only privileged role. Split it.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('family', 'trainee', 'volunteer', 'therapist', 'admin', 'staff'));

comment on column public.profiles.role is
  'family and trainee see their own records. therapist sees assigned clients only. admin sees everything. staff is the pre-migration-03 value and behaves as admin.';

-- 2. Who works with whom.
create table if not exists public.care_team (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  client      uuid not null references public.profiles (id) on delete cascade,
  therapist   uuid not null references public.profiles (id) on delete cascade,
  role_label  text,                       -- e.g. 'Lead ABA therapist'
  assigned_by uuid references public.profiles (id),
  ended_on    date,                       -- set instead of deleting; keeps history
  unique (client, therapist)
);

comment on table public.care_team is
  'Explicit assignment. A therapist with no row here sees nothing. Ending an assignment sets ended_on rather than deleting the row, so it is possible to answer "who had access, and when".';

alter table public.care_team enable row level security;

-- 3. Helpers. One place each, so a policy change cannot drift.
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.role in ('admin', 'staff'));
$$;

create or replace function public.is_therapist()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.role = 'therapist');
$$;

-- Currently assigned, and the assignment has not ended.
create or replace function public.treats(target uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.care_team c
    where c.client = target
      and c.therapist = auth.uid()
      and (c.ended_on is null or c.ended_on > current_date)
  );
$$;

-- is_staff() is kept so migration 02's policies keep working, but it now
-- means "admin" rather than "anyone with a staff-ish role".
create or replace function public.is_staff()
returns boolean language sql security definer set search_path = public as $$
  select public.is_admin();
$$;

drop policy if exists "read own care team" on public.care_team;
create policy "read own care team" on public.care_team
  for select to authenticated
  using (client = auth.uid() or therapist = auth.uid() or public.is_admin());

drop policy if exists "admin writes care team" on public.care_team;
create policy "admin writes care team" on public.care_team
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4. Widen the read policies to assigned therapists, and let them write.
drop policy if exists "read own documents" on public.documents;
create policy "read own documents" on public.documents
  for select to authenticated
  using (owner = auth.uid() or public.is_admin() or public.treats(owner));

drop policy if exists "staff write documents" on public.documents;
drop policy if exists "team writes documents" on public.documents;
create policy "team writes documents" on public.documents
  for all to authenticated
  using (public.is_admin() or public.treats(owner))
  with check (public.is_admin() or public.treats(owner));

drop policy if exists "read own sessions" on public.sessions;
create policy "read own sessions" on public.sessions
  for select to authenticated
  using (owner = auth.uid() or public.is_admin() or public.treats(owner));

drop policy if exists "staff write sessions" on public.sessions;
drop policy if exists "team writes sessions" on public.sessions;
create policy "team writes sessions" on public.sessions
  for all to authenticated
  using (public.is_admin() or public.treats(owner))
  with check (public.is_admin() or public.treats(owner));

-- A therapist can see the profile of a client they treat, and nobody else's.
drop policy if exists "therapist reads assigned profiles" on public.profiles;
create policy "therapist reads assigned profiles" on public.profiles
  for select to authenticated using (public.treats(id));

-- 5. Fees stay with administrators. A therapist has no reason to see what a
--    family is paying, and knowing tends to change how people are treated.
drop policy if exists "read own fees" on public.fees;
create policy "read own fees" on public.fees
  for select to authenticated using (owner = auth.uid() or public.is_admin());

-- 6. Every session note carries its author, so a family can be told who wrote
--    what about their child.
alter table public.sessions
  add column if not exists written_by uuid references public.profiles (id);

comment on column public.sessions.written_by is
  'The clinician who wrote the note. A family is entitled to know who wrote what about their child.';

grant select on public.care_team to authenticated;
grant insert, update on public.documents, public.sessions to authenticated;

-- ---------------------------------------------------------------------------
-- ASSIGNING A THERAPIST
--
--   insert into public.care_team (client, therapist, role_label, assigned_by)
--   values (
--     (select id from auth.users where email = 'parent@example.com'),
--     (select id from auth.users where email = 'therapist@example.com'),
--     'Lead ABA therapist',
--     auth.uid()
--   );
--
-- ENDING ONE — do not delete the row:
--
--   update public.care_team set ended_on = current_date
--   where client = '…' and therapist = '…';
--
-- VERIFY
--   Signed in as a therapist with no care_team row, documents and sessions
--   must both return zero rows.
-- ---------------------------------------------------------------------------
