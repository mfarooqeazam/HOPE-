-- ---------------------------------------------------------------------------
-- Migration 02 — the portal
--
-- READ THIS BEFORE RUNNING IT
--
-- This reverses a decision recorded in CLAUDE.md ("Forms only. No accounts,
-- no dashboards. Children's clinical data: not collected."). That decision
-- existed for a reason, and reversing it is legitimate — but it changes what
-- this project is responsible for.
--
-- The moment a behaviour intervention plan, an IEP or a session note is
-- stored here, this stops being a marketing site and becomes a system holding
-- identifiable health data about children. Under Pakistan's draft Personal
-- Data Protection Bill, health and psychological data is sensitive personal
-- data, and processing a child's requires verified parental consent.
--
-- Four things must exist before real client data goes in. They are not
-- optional and they are not this file's job:
--
--   1. A written privacy policy naming what is held, why, and for how long.
--   2. A retention period, and a routine that actually deletes past it.
--   3. A deletion route a parent can use, and someone who answers it.
--   4. A breach procedure: who is told, how fast, by whom.
--
-- Two technical prerequisites:
--
--   A. Enable Auth → Email in the Supabase dashboard. The portal signs in by
--      magic link; there are no passwords to leak.
--   B. Create a private Storage bucket named `documents`. Do NOT make it
--      public. Files are served through signed URLs that expire.
--
-- Until then this schema is safe to run: it creates the structure and the
-- policies, and holds nothing.
--
-- Run in: Supabase dashboard → SQL Editor → New query → Run.
-- Safe to run more than once.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. WHO IS SIGNED IN
--    One row per account, created on first sign-in. `role` decides which
--    portal a person sees; `staff` sees everything.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  full_name   text,
  phone       text,
  role        text not null default 'family'
              check (role in ('family', 'trainee', 'volunteer', 'staff')),
  -- Display name for the person this account is about, where that is not the
  -- account holder. First name only — there is no reason to hold more here.
  child_first_name text
);

comment on column public.profiles.child_first_name is
  'First name only, parent-supplied. Deliberately not a full name, date of birth, or any identifier.';

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Staff read everything. One helper, used by every policy below, so the rule
-- lives in exactly one place.
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff'
  );
$$;

drop policy if exists "staff read all profiles" on public.profiles;
create policy "staff read all profiles" on public.profiles
  for select to authenticated using (public.is_staff());

-- A profile row appears automatically the first time someone signs in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. DOCUMENTS — BMPs, IEPs, reports, invoices
--    The file itself lives in the private `documents` Storage bucket. This
--    table holds only the pointer and the metadata.
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('bmp', 'iep', 'report', 'invoice', 'consent', 'other')),
  title       text not null,
  summary     text,
  storage_path text,                     -- path inside the private bucket
  issued_on   date,
  review_due  date
);

alter table public.documents enable row level security;

drop policy if exists "read own documents" on public.documents;
create policy "read own documents" on public.documents
  for select to authenticated using (owner = auth.uid() or public.is_staff());

-- Clients never write here. Documents are produced by the centre.
drop policy if exists "staff write documents" on public.documents;
create policy "staff write documents" on public.documents
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- 3. SESSIONS — when, who with, and a note the family can read
--
--    `note` is written FOR the family, not the clinical record. Full clinical
--    notes stay out of this system: if they are ever added, a retention
--    period and a deletion route must exist first.
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  starts_at   timestamptz not null,
  minutes     integer check (minutes is null or (minutes > 0 and minutes <= 480)),
  discipline  text check (discipline is null or discipline in
              ('aba', 'speech', 'ot', 'physio', 'education', 'review')),
  clinician   text,
  status      text not null default 'scheduled'
              check (status in ('scheduled', 'attended', 'cancelled', 'missed')),
  note        text,
  home_task   text
);

comment on column public.sessions.note is
  'Written for the family to read. Not the clinical record.';

alter table public.sessions enable row level security;

drop policy if exists "read own sessions" on public.sessions;
create policy "read own sessions" on public.sessions
  for select to authenticated using (owner = auth.uid() or public.is_staff());

drop policy if exists "staff write sessions" on public.sessions;
create policy "staff write sessions" on public.sessions
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- 4. FEES — what is owed, what is funded, what has been paid
-- ---------------------------------------------------------------------------
create table if not exists public.fees (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  description text not null,
  amount_pkr  integer,                   -- null where the place is funded
  funded      boolean not null default false,
  period      text,                      -- e.g. 'September 2026'
  due_on      date,
  paid_on     date
);

comment on column public.fees.funded is
  'True where the place is funded rather than charged for. amount_pkr is then null, not zero — the cost exists, it is simply carried by the centre.';

alter table public.fees enable row level security;

drop policy if exists "read own fees" on public.fees;
create policy "read own fees" on public.fees
  for select to authenticated using (owner = auth.uid() or public.is_staff());

drop policy if exists "staff write fees" on public.fees;
create policy "staff write fees" on public.fees
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- 5. TRAINING — cohorts, materials, enrolment
-- ---------------------------------------------------------------------------
create table if not exists public.cohorts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  pathway     text not null check (pathway in ('iba', 'ibt', 'ceu', 'supervision')),
  starts_on   date,
  ends_on     date
);

create table if not exists public.enrolments (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references public.profiles (id) on delete cascade,
  cohort      uuid not null references public.cohorts (id) on delete cascade,
  created_at  timestamptz not null default now(),
  hours_done  numeric(6,1) not null default 0,
  hours_required numeric(6,1),
  status      text not null default 'active'
              check (status in ('active', 'complete', 'withdrawn')),
  unique (owner, cohort)
);

create table if not exists public.materials (
  id          uuid primary key default gen_random_uuid(),
  cohort      uuid not null references public.cohorts (id) on delete cascade,
  created_at  timestamptz not null default now(),
  title       text not null,
  kind        text not null check (kind in ('slides', 'video', 'quiz', 'reading', 'live')),
  url         text,
  storage_path text,
  available_from timestamptz,
  sort_order  integer not null default 0
);

alter table public.cohorts    enable row level security;
alter table public.enrolments enable row level security;
alter table public.materials  enable row level security;

drop policy if exists "read own enrolments" on public.enrolments;
create policy "read own enrolments" on public.enrolments
  for select to authenticated using (owner = auth.uid() or public.is_staff());

-- A cohort is readable if you are on it.
drop policy if exists "read enrolled cohorts" on public.cohorts;
create policy "read enrolled cohorts" on public.cohorts
  for select to authenticated using (
    public.is_staff() or exists (
      select 1 from public.enrolments e
      where e.cohort = cohorts.id and e.owner = auth.uid()
    )
  );

-- Materials follow the cohort, and only once they are released.
drop policy if exists "read enrolled materials" on public.materials;
create policy "read enrolled materials" on public.materials
  for select to authenticated using (
    public.is_staff() or (
      (available_from is null or available_from <= now())
      and exists (
        select 1 from public.enrolments e
        where e.cohort = materials.cohort and e.owner = auth.uid()
      )
    )
  );

drop policy if exists "staff write cohorts" on public.cohorts;
create policy "staff write cohorts" on public.cohorts
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write enrolments" on public.enrolments;
create policy "staff write enrolments" on public.enrolments
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff write materials" on public.materials;
create policy "staff write materials" on public.materials
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- 6. VOLUNTEERS — hours given, and what is coming up
-- ---------------------------------------------------------------------------
create table if not exists public.volunteer_hours (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  happened_on date not null,
  hours       numeric(5,1) not null check (hours > 0 and hours <= 24),
  activity    text not null,
  setting     text,
  confirmed   boolean not null default false
);

alter table public.volunteer_hours enable row level security;

drop policy if exists "read own hours" on public.volunteer_hours;
create policy "read own hours" on public.volunteer_hours
  for select to authenticated using (owner = auth.uid() or public.is_staff());

drop policy if exists "staff write hours" on public.volunteer_hours;
create policy "staff write hours" on public.volunteer_hours
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Events are visible to everyone signed in; `for_role` narrows the audience.
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  location    text,
  detail      text,
  for_role    text not null default 'all'
              check (for_role in ('all', 'family', 'trainee', 'volunteer')),
  signup_url  text
);

alter table public.events enable row level security;

drop policy if exists "read events" on public.events;
create policy "read events" on public.events
  for select to authenticated using (
    public.is_staff()
    or for_role = 'all'
    or exists (select 1 from public.profiles p
               where p.id = auth.uid() and p.role = events.for_role)
  );

drop policy if exists "staff write events" on public.events;
create policy "staff write events" on public.events
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- 7. GRANTS
--    Nothing here is readable by `anon`. Every policy above is scoped to
--    `authenticated`, and every one of them checks auth.uid().
-- ---------------------------------------------------------------------------
grant select on public.profiles, public.documents, public.sessions,
                public.fees, public.cohorts, public.enrolments,
                public.materials, public.volunteer_hours, public.events
  to authenticated;
grant update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 8. MAKE YOURSELF STAFF
--    Sign in once through the portal so the account exists, then run:
--
--      update public.profiles set role = 'staff'
--      where id = (select id from auth.users where email = 'you@example.com');
--
-- VERIFY
--    Table Editor should list nine new tables, each showing "RLS enabled".
--    Signed out, every one of them must return zero rows.
-- ---------------------------------------------------------------------------
