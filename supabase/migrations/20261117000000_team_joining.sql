-- Dual: joining teams + team leaderboard.
-- Run this in the Supabase SQL editor after the earlier migrations.
--
-- Rules
--  * A swimmer swims for at most one team (profiles.team_id).
--  * The team's captain is its owner (teams.owner_id).
--  * Swimmers ask to join; the captain approves or declines.
--  * Members can leave; captains can remove members. A swimmer who leaves goes
--    back to their own team if they designed one, otherwise to no team.
--  * A captain whose team has other members can't join another team.

create or replace function public.team_max_members() returns integer
language sql immutable as $$ select 30 $$;

create table if not exists public.team_join_requests (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (team_id, user_id)
);
create index if not exists team_join_requests_user_idx on public.team_join_requests (user_id);

alter table public.team_join_requests enable row level security;

-- Requesters see their own requests; captains see requests to their team.
drop policy if exists "See own or own-team join requests" on public.team_join_requests;
create policy "See own or own-team join requests" on public.team_join_requests for select using (
  user_id = auth.uid()
  or exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid())
);
revoke insert, update, delete on public.team_join_requests from anon, authenticated;

create index if not exists profiles_team_idx on public.profiles (team_id);

-- Number of swimmers on a team.
create or replace function public.team_member_count(p_team_id uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.profiles where team_id = p_team_id;
$$;

-- True when the swimmer captains a team that has other members on it.
create or replace function public.captains_team_with_members(p_user_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teams t
    join public.profiles m on m.team_id = t.id and m.id <> p_user_id
    where t.owner_id = p_user_id
  );
$$;

-- Saving your team design no longer pulls you off a team you've joined.
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

  -- Only make it your team if you aren't swimming for someone else's.
  update public.profiles set team_id = v_team.id
  where id = auth.uid() and (team_id is null or team_id = v_team.id);
  return v_team;
end;
$$;

-- Ask to join a team.
create or replace function public.request_join_team(p_team_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_current uuid;
begin
  if v_uid is null then raise exception 'You must be logged in.'; end if;
  if not exists (select 1 from public.teams where id = p_team_id) then
    raise exception 'That team doesn''t exist.';
  end if;
  select team_id into v_current from public.profiles where id = v_uid;
  if v_current = p_team_id then raise exception 'You''re already on this team.'; end if;
  if public.captains_team_with_members(v_uid) then
    raise exception 'You captain a team with members. Remove them before joining another team.';
  end if;
  if public.team_member_count(p_team_id) >= public.team_max_members() then
    raise exception 'This team is full.';
  end if;
  if (select count(*) from public.team_join_requests where user_id = v_uid) >= 5 then
    raise exception 'You already have 5 pending requests. Cancel one first.';
  end if;
  insert into public.team_join_requests (team_id, user_id) values (p_team_id, v_uid)
  on conflict (team_id, user_id) do nothing;
end;
$$;

-- Withdraw your request to join a team.
create or replace function public.cancel_join_request(p_team_id uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.team_join_requests where team_id = p_team_id and user_id = auth.uid();
$$;

-- Captain approves (p_accept = true) or declines a request.
create or replace function public.respond_join_request(p_request_id uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_req public.team_join_requests;
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;
  select r.* into v_req from public.team_join_requests r
  join public.teams t on t.id = r.team_id
  where r.id = p_request_id and t.owner_id = auth.uid();
  if v_req.id is null then raise exception 'Request not found.'; end if;

  if p_accept then
    if public.captains_team_with_members(v_req.user_id) then
      delete from public.team_join_requests where id = v_req.id;
      raise exception 'That swimmer now captains a team with members, so they can''t join.';
    end if;
    if public.team_member_count(v_req.team_id) >= public.team_max_members() then
      raise exception 'Your team is full.';
    end if;
    update public.profiles set team_id = v_req.team_id where id = v_req.user_id;
    -- Joined: clear all of this swimmer's other pending requests.
    delete from public.team_join_requests where user_id = v_req.user_id;
  else
    delete from public.team_join_requests where id = v_req.id;
  end if;
end;
$$;

-- Leave the team you've joined (captains can't leave their own team).
create or replace function public.leave_team() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_current uuid;
begin
  if v_uid is null then raise exception 'You must be logged in.'; end if;
  select team_id into v_current from public.profiles where id = v_uid;
  if v_current is null then return; end if;
  if exists (select 1 from public.teams where id = v_current and owner_id = v_uid) then
    raise exception 'Captains can''t leave their own team.';
  end if;
  update public.profiles
  set team_id = (select id from public.teams where owner_id = v_uid)
  where id = v_uid;
end;
$$;

-- Captain removes a member from their team.
create or replace function public.remove_team_member(p_user_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'You must be logged in.'; end if;
  if p_user_id = auth.uid() then raise exception 'You can''t remove yourself.'; end if;
  if not exists (
    select 1 from public.profiles p join public.teams t on t.id = p.team_id
    where p.id = p_user_id and t.owner_id = auth.uid()
  ) then
    raise exception 'That swimmer isn''t on your team.';
  end if;
  update public.profiles
  set team_id = (select id from public.teams where owner_id = p_user_id)
  where id = p_user_id;
end;
$$;

-- Find teams by name or tag (most members first).
create or replace function public.search_teams(p_query text default '', p_limit integer default 20)
returns table (id uuid, name text, abbr text, logo jsonb, members integer, captain_id uuid, captain_name text, captain_country text)
language sql stable security definer set search_path = public as $$
  select t.id, t.name, t.abbr, t.logo,
         (select count(*)::integer from public.profiles m where m.team_id = t.id) as members,
         t.owner_id, c.name, c.country
  from public.teams t
  join public.profiles c on c.id = t.owner_id
  where coalesce(btrim(p_query), '') = ''
     or strpos(lower(t.name), lower(btrim(p_query))) > 0
     or strpos(lower(t.abbr), lower(btrim(p_query))) > 0
  order by members desc, t.created_at
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

-- Team standings: meet points and dual wins of each team's current members.
create or replace function public.team_leaderboard()
returns table (id uuid, name text, abbr text, logo jsonb, members integer, points integer, dual_wins integer, races integer)
language sql stable security definer set search_path = public as $$
  with pts as (
    select swimmer_id, points, races from public.all_time_points(null)
  ), placed as (
    select r.swimmer_id,
           row_number() over (partition by r.party_id order by r.total_time_ms) as place,
           count(*) over (partition by r.party_id) as swimmers
    from public.race_results r
    join public.parties p on p.id = r.party_id
    where p.status = 'finished'
  ), wins as (
    select swimmer_id, count(*)::integer as wins
    from placed where place = 1 and swimmers >= 2
    group by swimmer_id
  )
  select t.id, t.name, t.abbr, t.logo,
         count(pr.id)::integer as members,
         coalesce(sum(pts.points), 0)::integer as points,
         coalesce(sum(w.wins), 0)::integer as dual_wins,
         coalesce(sum(pts.races), 0)::integer as races
  from public.teams t
  join public.profiles pr on pr.team_id = t.id
  left join pts on pts.swimmer_id = pr.id
  left join wins w on w.swimmer_id = pr.id
  group by t.id, t.name, t.abbr, t.logo
  order by points desc, dual_wins desc, members desc, t.name
  limit 100;
$$;

revoke all on function public.request_join_team(uuid) from public, anon;
revoke all on function public.cancel_join_request(uuid) from public, anon;
revoke all on function public.respond_join_request(uuid, boolean) from public, anon;
revoke all on function public.leave_team() from public, anon;
revoke all on function public.remove_team_member(uuid) from public, anon;
grant execute on function public.request_join_team(uuid) to authenticated;
grant execute on function public.cancel_join_request(uuid) to authenticated;
grant execute on function public.respond_join_request(uuid, boolean) to authenticated;
grant execute on function public.leave_team() to authenticated;
grant execute on function public.remove_team_member(uuid) to authenticated;
grant execute on function public.search_teams(text, integer) to anon, authenticated;
grant execute on function public.team_leaderboard() to anon, authenticated;
