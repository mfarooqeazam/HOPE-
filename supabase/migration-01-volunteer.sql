-- ---------------------------------------------------------------------------
-- Migration 01 — allow volunteer registrations
--
-- WHY THIS IS NEEDED
-- The tables in the live project were created from an earlier version of
-- schema.sql. Two things were added afterwards, and the live database does
-- not have them:
--
--   1. `kind` only permits 'family' and 'training'. The volunteer form sends
--      'volunteer', so the check constraint rejects it.
--   2. `volunteer_as` does not exist at all. PostgREST replies
--      PGRST204 "Could not find the 'volunteer_as' column".
--
-- Verified against the live project on 2026-09-01: a volunteer insert fails.
-- Until this runs, every submission from volunteer.html is rejected and the
-- visitor sees the fallback message with the phone number.
--
-- Safe to run more than once.
--
-- Run it in: Supabase dashboard → SQL Editor → New query → Run.
-- ---------------------------------------------------------------------------

-- 1. Let `kind` accept volunteers.
alter table public.registrations
  drop constraint if exists registrations_kind_check;

alter table public.registrations
  add constraint registrations_kind_check
  check (kind in ('family', 'training', 'volunteer'));

-- 2. Add the volunteer track's own column.
alter table public.registrations
  add column if not exists volunteer_as text;

alter table public.registrations
  drop constraint if exists registrations_volunteer_as_check;

alter table public.registrations
  add constraint registrations_volunteer_as_check
  check (volunteer_as is null or volunteer_as in
         ('individual', 'student_professional', 'company', 'remote'));

comment on column public.registrations.volunteer_as is
  'Volunteer track only: whether they are offering time as an individual, a student or professional, a company, or remotely.';

-- 3. Confirm the insert-only grants are still in place. These are stated in
--    schema.sql too; repeating them here makes the migration self-contained.
grant insert on public.enquiries     to anon;
grant insert on public.registrations to anon;

-- ---------------------------------------------------------------------------
-- VERIFY
-- After running, this should return one row with volunteer_as listed:
--
--   select column_name, data_type
--   from information_schema.columns
--   where table_name = 'registrations' and column_name = 'volunteer_as';
--
-- Then submit the form on volunteer.html and check Table Editor →
-- registrations for a row with kind = 'volunteer'.
-- ---------------------------------------------------------------------------
