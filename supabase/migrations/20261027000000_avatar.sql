-- Dual: swimmer avatar look (cap, suit, goggles, skin colours) for the 3D lobby.
-- Run this in the Supabase SQL editor after the earlier migrations.

alter table public.profiles add column if not exists avatar jsonb;

-- Only small objects of colour codes are accepted.
alter table public.profiles drop constraint if exists profiles_avatar_shape;
alter table public.profiles add constraint profiles_avatar_shape check (
  avatar is null or (jsonb_typeof(avatar) = 'object' and pg_column_size(avatar) < 1024)
);

-- Swimmers may edit their name, country and avatar (nothing else).
revoke update on public.profiles from anon, authenticated;
grant update (name, country, avatar) on public.profiles to authenticated;
