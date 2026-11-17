-- Dual: swims imported from watches (Garmin, COROS, Suunto, Polar, Apple Watch...).
-- Adds per-swim details (laps, strokes, heart rate) to training logs, and an id
-- per device activity so the same swim can't be imported twice.
-- Run this in the Supabase SQL editor after the earlier migrations.

alter table public.workout_logs add column if not exists details jsonb;
alter table public.workout_logs add column if not exists external_id text;

alter table public.workout_logs drop constraint if exists workout_logs_details_shape;
alter table public.workout_logs add constraint workout_logs_details_shape check (
  details is null or (jsonb_typeof(details) = 'object' and pg_column_size(details) < 65536)
);
alter table public.workout_logs drop constraint if exists workout_logs_external_id_len;
alter table public.workout_logs add constraint workout_logs_external_id_len check (
  external_id is null or char_length(external_id) <= 100
);

create unique index if not exists workout_logs_user_external_idx
  on public.workout_logs (user_id, external_id) where external_id is not null;
