-- Dual: initial schema
-- Run this once in the Supabase SQL editor (or `supabase db push`).
-- Every table has row-level security on. The browser only ever uses the
-- public anon key; anything privileged goes through the security-definer
-- functions below or through server routes that use the service-role key.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default 'Swimmer' check (char_length(name) between 1 and 60),
  country     text not null default 'USA'     check (char_length(country) between 2 and 3),
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are public"
  on public.profiles for select using (true);

-- Users may change their own name and country, nothing else.
create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.profiles from anon, authenticated;
grant update (name, country) on public.profiles to authenticated;

-- Create the profile row automatically when someone signs up.
-- Name and country come from the sign-up form (auth metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, country)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'country', ''), 'USA')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Subscriptions (written only by the Stripe webhook with the service role)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  user_id                 uuid primary key references public.profiles (id) on delete cascade,
  plan                    text not null check (plan in ('monthly', 'annual', 'lifetime')),
  status                  text not null,  -- Stripe status, or 'lifetime'
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  current_period_end      timestamptz,
  updated_at              timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users read own subscription"
  on public.subscriptions for select to authenticated
  using (user_id = auth.uid());
-- No insert/update/delete policies: only the service role can write.

create or replace function public.is_premium(uid uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.is_admin
  ) or exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and (
        s.status = 'lifetime'
        or (s.status in ('active', 'trialing', 'past_due')
            and (s.current_period_end is null or s.current_period_end > now()))
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Race results
-- ---------------------------------------------------------------------------
create table public.race_results (
  id             uuid primary key default gen_random_uuid(),
  swimmer_id     uuid not null references public.profiles (id) on delete cascade,
  event          text not null check (char_length(event) <= 120),
  total_time_ms  integer not null check (total_time_ms > 0 and total_time_ms < 86400000),
  unit           text not null default 'meters' check (unit in ('meters', 'yards')),
  laps           integer[] not null default '{}',
  country        text,
  meet_id        text,
  round          text,
  party_id       uuid,
  created_at     timestamptz not null default now()
);

create index race_results_swimmer_idx on public.race_results (swimmer_id, created_at desc);
create index race_results_event_idx   on public.race_results (event, total_time_ms);
create index race_results_meet_idx    on public.race_results (meet_id, event, round, total_time_ms);
create unique index race_results_one_per_party on public.race_results (party_id, swimmer_id) where party_id is not null;

alter table public.race_results enable row level security;

create policy "Race results are public"
  on public.race_results for select using (true);

-- Free-standing results (time trials, PB entries). Meet and party results
-- must go through submit_party_result() so they can't be faked.
create policy "Users add own results"
  on public.race_results for insert to authenticated
  with check (swimmer_id = auth.uid() and party_id is null and meet_id is null and round is null);

create policy "Users delete own free results"
  on public.race_results for delete to authenticated
  using (swimmer_id = auth.uid() and party_id is null);

-- Snapshot the swimmer's country onto each result.
create or replace function public.set_result_country()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.country is null then
    select country into new.country from public.profiles where id = new.swimmer_id;
  end if;
  return new;
end;
$$;

create trigger race_results_country
  before insert on public.race_results
  for each row execute function public.set_result_country();

-- ---------------------------------------------------------------------------
-- Personal bests
-- ---------------------------------------------------------------------------
create table public.personal_bests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  stroke      text not null,
  distance    integer not null check (distance > 0),
  unit        text not null default 'meters' check (unit in ('meters', 'yards')),
  time        text not null,
  time_ms     integer not null check (time_ms > 0),
  created_at  timestamptz not null default now(),
  unique (user_id, stroke, distance, unit)
);

alter table public.personal_bests enable row level security;
create policy "PBs are public" on public.personal_bests for select using (true);
create policy "Users insert own PBs" on public.personal_bests for insert to authenticated with check (user_id = auth.uid());
create policy "Users update own PBs" on public.personal_bests for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users delete own PBs" on public.personal_bests for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Goals
-- ---------------------------------------------------------------------------
create table public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  description  text not null default '',
  target_date  date,
  completed    boolean not null default false,
  type         text not null default 'custom'
               check (type in ('custom', 'personal_best', 'leaderboard_rank', 'meet_qualification', 'goal_time_standard')),
  event        text,
  target_time  text,
  league       text,
  target_rank  integer,
  meet_id      text,
  created_at   timestamptz not null default now()
);

alter table public.goals enable row level security;
create policy "Goals are public" on public.goals for select using (true);
create policy "Users manage own goals" on public.goals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Workout logs (completed sessions) and saved AI workouts
-- ---------------------------------------------------------------------------
create table public.workout_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  date        date not null default current_date,
  title       text not null,
  source      text not null default 'manual',
  duration    text,
  distance    text,
  avg_pace    text,
  location    text,
  created_at  timestamptz not null default now()
);

alter table public.workout_logs enable row level security;
create policy "Workout logs are public" on public.workout_logs for select using (true);
create policy "Users manage own logs" on public.workout_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.saved_workouts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  workout           text not null,
  experience        text,
  typical_distance  text,
  target_stroke     text,
  duration          text,
  intensity         text,
  created_at        timestamptz not null default now()
);

alter table public.saved_workouts enable row level security;
create policy "Users manage own saved workouts" on public.saved_workouts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Follows
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id   uuid not null references public.profiles (id) on delete cascade,
  following_id  uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;
create policy "Follows are public" on public.follows for select using (true);
create policy "Users follow" on public.follows for insert to authenticated with check (follower_id = auth.uid());
-- You can unfollow someone, or remove someone who follows you.
create policy "Users unfollow or remove follower" on public.follows for delete to authenticated
  using (follower_id = auth.uid() or following_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Meets created by admins (the built-in season meets live in src/config/meets.ts)
-- ---------------------------------------------------------------------------
create table public.meets (
  id               text primary key default ('meet_' || substr(md5(random()::text), 1, 8)),
  name             text not null,
  date             timestamptz not null,
  is_championship  boolean not null default false,
  events           jsonb not null default '[]',
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);

alter table public.meets enable row level security;
create policy "Meets are public" on public.meets for select using (true);
create policy "Admins create meets" on public.meets for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- ---------------------------------------------------------------------------
-- Awards (created only by finish logic)
-- ---------------------------------------------------------------------------
create table public.awards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  meet        text not null,
  rank        integer not null,
  party_id    uuid,
  created_at  timestamptz not null default now(),
  unique (party_id, user_id)
);

alter table public.awards enable row level security;
create policy "Awards are public" on public.awards for select using (true);

-- ---------------------------------------------------------------------------
-- Parties (race lobbies) and their members
-- ---------------------------------------------------------------------------
create table public.parties (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique default upper(substr(md5(random()::text), 1, 6)),
  event               text not null,
  is_public           boolean not null default false,
  status              text not null default 'waiting' check (status in ('waiting', 'in-progress', 'finished')),
  host_id             uuid not null references public.profiles (id) on delete cascade,
  meet_id             text,
  round               text check (round is null or round in ('Prelims', 'Quarterfinals', 'Semifinals', 'Finals')),
  qualified_swimmers  uuid[] not null default '{}',
  created_at          timestamptz not null default now(),
  started_at          timestamptz,
  finished_at         timestamptz
);

create index parties_public_waiting_idx on public.parties (is_public, status);
create index parties_meet_idx on public.parties (meet_id, event, round, status);

create table public.party_members (
  party_id   uuid not null references public.parties (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (party_id, user_id)
);

alter table public.parties enable row level security;
alter table public.party_members enable row level security;

create policy "Parties are readable" on public.parties for select using (true);
create policy "Party members are readable" on public.party_members for select using (true);
-- All writes go through the functions below.

alter table public.race_results
  add constraint race_results_party_fk foreign key (party_id) references public.parties (id) on delete set null;

-- Let the browser subscribe to live lobby changes.
alter publication supabase_realtime add table public.parties, public.party_members, public.race_results;

-- ---------------------------------------------------------------------------
-- Race logic (security definer = runs with table-owner rights, checks auth itself)
-- ---------------------------------------------------------------------------

-- Who qualified for the next round: fastest N distinct swimmers in the previous round.
create or replace function public.qualified_swimmers(p_meet_id text, p_event text, p_previous_round text)
returns uuid[]
language sql stable
security definer set search_path = public
as $$
  select coalesce(array_agg(swimmer_id order by best), '{}')
  from (
    select swimmer_id, min(total_time_ms) as best
    from public.race_results
    where meet_id = p_meet_id and event = p_event and round = p_previous_round
    group by swimmer_id
    order by best
    limit case p_previous_round when 'Prelims' then 32 when 'Quarterfinals' then 16 else 8 end
  ) q;
$$;

create or replace function public.previous_round(p_round text)
returns text language sql immutable as $$
  select case p_round
    when 'Quarterfinals' then 'Prelims'
    when 'Semifinals' then 'Quarterfinals'
    when 'Finals' then 'Semifinals'
    else null end;
$$;

create or replace function public.create_party(p_event text, p_is_public boolean default false)
returns public.parties
language plpgsql
security definer set search_path = public
as $$
declare
  v_party public.parties;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;
  if p_event is null or char_length(trim(p_event)) = 0 or char_length(p_event) > 120 then
    raise exception 'Invalid event.';
  end if;

  insert into public.parties (event, is_public, host_id)
  values (trim(p_event), coalesce(p_is_public, false), auth.uid())
  returning * into v_party;

  insert into public.party_members (party_id, user_id) values (v_party.id, auth.uid());
  return v_party;
end;
$$;

create or replace function public.join_party(p_party_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_party public.parties;
  v_prev text;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;

  select * into v_party from public.parties where id = p_party_id;
  if not found then raise exception 'Party not found.'; end if;

  if exists (select 1 from public.party_members where party_id = p_party_id and user_id = auth.uid()) then
    return;
  end if;

  if v_party.status <> 'waiting' then raise exception 'This race has already started.'; end if;

  if v_party.meet_id is not null then
    if not public.is_premium(auth.uid()) then
      raise exception 'Public swim meets require a Dual membership.';
    end if;
    v_prev := public.previous_round(v_party.round);
    if v_prev is not null
       and not (auth.uid() = any (public.qualified_swimmers(v_party.meet_id, v_party.event, v_prev))) then
      raise exception 'You have not qualified for the %.', v_party.round;
    end if;
  end if;

  insert into public.party_members (party_id, user_id) values (p_party_id, auth.uid())
  on conflict do nothing;
end;
$$;

-- Find the open lobby for a meet round, or open a new one, then join it.
create or replace function public.find_or_create_meet_party(p_meet_id text, p_event text, p_round text)
returns public.parties
language plpgsql
security definer set search_path = public
as $$
declare
  v_party public.parties;
  v_prev text;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;
  if not public.is_premium(auth.uid()) then
    raise exception 'Public swim meets require a Dual membership.';
  end if;
  if p_round not in ('Prelims', 'Quarterfinals', 'Semifinals', 'Finals') then
    raise exception 'Invalid round.';
  end if;

  -- Serialize lobby creation for this meet/event/round so two swimmers
  -- arriving together end up in the same lobby.
  perform pg_advisory_xact_lock(hashtext(p_meet_id || '|' || p_event || '|' || p_round));

  select * into v_party from public.parties
  where meet_id = p_meet_id and event = p_event and round = p_round and status = 'waiting'
  order by created_at
  limit 1;

  if not found then
    v_prev := public.previous_round(p_round);
    insert into public.parties (event, is_public, host_id, meet_id, round, qualified_swimmers)
    values (
      p_event, true, auth.uid(), p_meet_id, p_round,
      case when v_prev is null then '{}' else public.qualified_swimmers(p_meet_id, p_event, v_prev) end
    )
    returning * into v_party;
  end if;

  perform public.join_party(v_party.id);
  return v_party;
end;
$$;

create or replace function public.start_party(p_party_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.parties
  set status = 'in-progress', started_at = now()
  where id = p_party_id and host_id = auth.uid() and status = 'waiting';
  if not found then raise exception 'Only the host can start a waiting race.'; end if;
end;
$$;

-- Close a race and hand out podium awards for Finals.
create or replace function public.finish_party_internal(p_party_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_party public.parties;
  r record;
begin
  update public.parties set status = 'finished', finished_at = now()
  where id = p_party_id and status <> 'finished'
  returning * into v_party;
  if not found then return; end if;

  if v_party.round = 'Finals' then
    for r in
      select swimmer_id, row_number() over (order by total_time_ms) as place
      from public.race_results
      where party_id = p_party_id
      order by total_time_ms
      limit 3
    loop
      insert into public.awards (user_id, title, meet, rank, party_id)
      values (
        r.swimmer_id,
        (case r.place when 1 then '1st' when 2 then '2nd' else '3rd' end) || ' Place - ' || v_party.event,
        coalesce(v_party.meet_id, 'Dual'),
        r.place,
        p_party_id
      )
      on conflict do nothing;
    end loop;
  end if;
end;
$$;

revoke execute on function public.finish_party_internal(uuid) from public, anon, authenticated;

create or replace function public.finish_party(p_party_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.parties where id = p_party_id and host_id = auth.uid()) then
    raise exception 'Only the host can end the race.';
  end if;
  perform public.finish_party_internal(p_party_id);
end;
$$;

-- A swimmer submits their own time for a live race. When every member has a
-- time, the race closes automatically.
create or replace function public.submit_party_result(
  p_party_id uuid,
  p_total_time_ms integer,
  p_laps integer[] default '{}',
  p_unit text default 'meters'
)
returns public.race_results
language plpgsql
security definer set search_path = public
as $$
declare
  v_party public.parties;
  v_result public.race_results;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;

  select * into v_party from public.parties where id = p_party_id;
  if not found then raise exception 'Party not found.'; end if;
  if v_party.status <> 'in-progress' then raise exception 'This race is not running.'; end if;
  if not exists (select 1 from public.party_members where party_id = p_party_id and user_id = auth.uid()) then
    raise exception 'You are not in this race.';
  end if;

  insert into public.race_results (swimmer_id, event, total_time_ms, unit, laps, meet_id, round, party_id)
  values (auth.uid(), v_party.event, p_total_time_ms, coalesce(p_unit, 'meters'), coalesce(p_laps, '{}'),
          v_party.meet_id, v_party.round, p_party_id)
  returning * into v_result;

  if (select count(*) from public.race_results where party_id = p_party_id)
     >= (select count(*) from public.party_members where party_id = p_party_id) then
    perform public.finish_party_internal(p_party_id);
  end if;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Leaderboards
-- ---------------------------------------------------------------------------

-- All-time points: finished public Finals, 9-7-6-5-4-3-2-1 by finishing time.
create or replace function public.all_time_points(p_country text default null)
returns table (swimmer_id uuid, name text, country text, points integer, races integer)
language sql stable
security definer set search_path = public
as $$
  with placings as (
    select r.swimmer_id,
           row_number() over (partition by r.party_id order by r.total_time_ms) as place
    from public.race_results r
    join public.parties p on p.id = r.party_id
    join public.profiles pr on pr.id = r.swimmer_id
    where p.is_public and p.status = 'finished' and p.round = 'Finals'
      and (p_country is null or pr.country = p_country)
  )
  select pl.swimmer_id, pr.name, pr.country,
         sum(case when place <= 8 then (array[9,7,6,5,4,3,2,1])[place] else 0 end)::integer as points,
         count(*)::integer as races
  from placings pl
  join public.profiles pr on pr.id = pl.swimmer_id
  group by pl.swimmer_id, pr.name, pr.country
  order by points desc, races desc;
$$;

-- Fastest 8 swimmers per event (each swimmer's best time only).
create or replace function public.all_time_best_by_event()
returns table (event text, total_time_ms integer, date timestamptz, swimmer_id uuid, swimmer_name text)
language sql stable
security definer set search_path = public
as $$
  with best as (
    select distinct on (r.event, r.swimmer_id)
           r.event, r.total_time_ms, r.created_at, r.swimmer_id
    from public.race_results r
    order by r.event, r.swimmer_id, r.total_time_ms
  ), ranked as (
    select b.*, row_number() over (partition by b.event order by b.total_time_ms) as rn
    from best b
  )
  select ranked.event, ranked.total_time_ms, ranked.created_at, ranked.swimmer_id, p.name
  from ranked join public.profiles p on p.id = ranked.swimmer_id
  where rn <= 8
  order by ranked.event, ranked.total_time_ms;
$$;
