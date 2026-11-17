-- Dual: team logos (replaces the 3D avatar).
-- Every swimmer can design one team: a name, a short tag (e.g. "SHK") and a
-- logo (crest shape, emblem and colours). Profiles point at the team they swim
-- for. For now each swimmer swims for their own team; joining another
-- swimmer's team will be added later on top of this same table.
-- Run this in the Supabase SQL editor after the earlier migrations.

create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null unique references public.profiles (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 2 and 30),
  abbr        text not null check (abbr ~ '^[A-Z0-9]{1,4}$'),
  logo        jsonb not null default '{}'::jsonb
              check (jsonb_typeof(logo) = 'object' and pg_column_size(logo) < 1024),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.teams enable row level security;

drop policy if exists "Teams are public" on public.teams;
create policy "Teams are public" on public.teams for select using (true);

-- No direct writes: teams change only through save_my_team() below.
revoke insert, update, delete on public.teams from anon, authenticated;

alter table public.profiles add column if not exists team_id uuid;
alter table public.profiles drop constraint if exists profiles_team_id_fkey;
alter table public.profiles
  add constraint profiles_team_id_fkey foreign key (team_id) references public.teams (id) on delete set null;

-- Swimmers edit their name and country only; team_id is set by the functions.
revoke update on public.profiles from anon, authenticated;
grant update (name, country) on public.profiles to authenticated;

-- Create or update the caller's own team and make it their team.
create or replace function public.save_my_team(p_name text, p_abbr text, p_logo jsonb)
returns public.teams
language plpgsql
security definer set search_path = public
as $$
declare
  v_team public.teams;
  v_key  text;
  v_val  jsonb;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;

  p_name := btrim(coalesce(p_name, ''));
  p_abbr := upper(btrim(coalesce(p_abbr, '')));
  if char_length(p_name) not between 2 and 30 then
    raise exception 'Team name must be 2 to 30 characters.';
  end if;
  if p_abbr !~ '^[A-Z0-9]{1,4}$' then
    raise exception 'Team tag must be 1 to 4 letters or numbers.';
  end if;

  -- Logo: only known keys; colours are #rrggbb, the rest are short words.
  if p_logo is null or jsonb_typeof(p_logo) <> 'object' then
    raise exception 'Invalid logo.';
  end if;
  for v_key, v_val in select * from jsonb_each(p_logo) loop
    if v_key not in ('shape', 'emblem', 'primary', 'secondary', 'accent') then
      raise exception 'Invalid logo.';
    end if;
    if jsonb_typeof(v_val) <> 'string' then raise exception 'Invalid logo.'; end if;
    if v_key in ('primary', 'secondary', 'accent') then
      if (v_val #>> '{}') !~ '^#[0-9a-fA-F]{6}$' then raise exception 'Invalid logo colour.'; end if;
    elsif (v_val #>> '{}') !~ '^[a-z]{1,16}$' then
      raise exception 'Invalid logo.';
    end if;
  end loop;

  insert into public.teams (owner_id, name, abbr, logo)
  values (auth.uid(), p_name, p_abbr, p_logo)
  on conflict (owner_id) do update
    set name = excluded.name, abbr = excluded.abbr, logo = excluded.logo, updated_at = now()
  returning * into v_team;

  update public.profiles set team_id = v_team.id where id = auth.uid();
  return v_team;
end;
$$;

revoke all on function public.save_my_team(text, text, jsonb) from public, anon;
grant execute on function public.save_my_team(text, text, jsonb) to authenticated;
