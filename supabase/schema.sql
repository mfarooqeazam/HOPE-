-- ============================================================================
-- The Project Hope — database schema
--
-- HOW TO USE
--   1. Create a free project at https://supabase.com
--   2. Open the project → SQL Editor → New query
--   3. Paste this entire file and press Run
--   4. Copy Project URL + anon key (Settings → API) into
--      site/assets/js/config.js
--
-- DESIGN NOTE — WHY THERE IS NO `diagnosis` OR `medical_history` COLUMN
--   The original technical spec proposed storing children's diagnoses and
--   medical history in this database. That is special-category health data
--   about minors. Pakistan's draft Personal Data Protection Bill classes
--   physical, behavioural, psychological and mental-health data as sensitive,
--   requires explicit consent, and requires verified parental consent for
--   children's data.
--
--   A web form does not need a diagnosis in order to book an assessment.
--   Clinical detail belongs in clinical records, held offline under your
--   existing professional obligations — not in a database reachable from a
--   public website.
--
--   What remains is an optional free-text `needs` field, where a parent
--   describes in their own words what support they are looking for. That is
--   enough to route the enquiry, and it is volunteered rather than demanded.
--
--   Do not add clinical columns here without first putting a retention
--   period, a deletion route, and a breach procedure in writing.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. ENQUIRIES — the general contact form
-- ---------------------------------------------------------------------------
create table if not exists public.enquiries (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),

  name         text not null,
  phone        text not null,
  email        text,
  topic        text,
  message      text,

  source_page  text,                    -- which page the form was sent from
  handled      boolean not null default false,
  handled_note text                     -- for your own follow-up notes
);

comment on table public.enquiries is
  'General contact form submissions. Insert-only from the website.';


-- ---------------------------------------------------------------------------
-- 2. REGISTRATIONS — families and trainees, one table, distinguished by `kind`
-- ---------------------------------------------------------------------------
create table if not exists public.registrations (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  kind              text not null check (kind in ('family', 'training')),

  -- Contact (both kinds)
  full_name         text not null,
  phone             text not null,
  email             text,
  city              text,
  preferred_contact text check (preferred_contact in ('whatsapp','phone','email')),

  -- Family track only
  child_first_name  text,
  child_age         integer check (child_age is null or (child_age >= 0 and child_age <= 25)),
  services          text[],             -- e.g. {'ABA','Speech','OT','Physio','School'}
  needs             text,               -- OPTIONAL free text. No diagnosis requested.

  -- Training track only
  programme         text check (programme is null or programme in ('IBA','IBT','supervision','ceu')),
  current_role      text,
  prior_experience  text,

  -- Shared
  notes             text,
  consent           boolean not null default false,

  handled           boolean not null default false,
  handled_note      text
);

comment on column public.registrations.needs is
  'Optional, parent-authored description of the support sought. Deliberately not a diagnosis field.';


-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
--
--    The website uses the public anon key, which ships in the browser and must
--    be treated as public. These policies let it INSERT and nothing else — no
--    SELECT, UPDATE or DELETE. Nobody can read submissions with the anon key,
--    only add to them.
--
--    You read submissions in the Supabase dashboard (Table Editor), which
--    authenticates as you, not as anon.
-- ---------------------------------------------------------------------------
alter table public.enquiries     enable row level security;
alter table public.registrations enable row level security;

drop policy if exists "anon can submit enquiries" on public.enquiries;
create policy "anon can submit enquiries"
  on public.enquiries for insert
  to anon
  with check (true);

drop policy if exists "anon can submit registrations" on public.registrations;
create policy "anon can submit registrations"
  on public.registrations for insert
  to anon
  with check (true);

-- No SELECT policy is defined for anon, so reads are denied by default.
-- This is deliberate. Do not add one.


-- ---------------------------------------------------------------------------
-- 4. INDEXES — for sorting the dashboard by newest first
-- ---------------------------------------------------------------------------
create index if not exists enquiries_created_at_idx
  on public.enquiries (created_at desc);

create index if not exists registrations_created_at_idx
  on public.registrations (created_at desc);

create index if not exists registrations_kind_idx
  on public.registrations (kind, created_at desc);


-- ---------------------------------------------------------------------------
-- 5. VERIFY
--    After running, check: Table Editor should list both tables, and each
--    should show "RLS enabled" with exactly one INSERT policy.
-- ---------------------------------------------------------------------------
