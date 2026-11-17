import { getSupabase } from '@/lib/supabase/client';

// Team joining: search, requests, approvals, leaving and the team leaderboard.
// All writes go through security-definer functions (see the team_joining SQL).

export interface TeamSummary {
  id: string;
  name: string;
  abbr: string;
  logo: unknown;
  members: number;
  captainId: string;
  captainName: string;
  captainCountry: string;
}

export interface TeamMember {
  id: string;
  name: string;
  country: string;
}

export interface JoinRequest {
  id: string;
  teamId: string;
  userId: string;
  createdAt: string;
  swimmerName?: string;
  swimmerCountry?: string;
  team?: { id: string; name: string; abbr: string; logo: unknown };
}

export interface TeamStanding {
  id: string;
  name: string;
  abbr: string;
  logo: unknown;
  members: number;
  points: number;
  dualWins: number;
  races: number;
}

function fail(error: { message: string } | null): void {
  if (!error) return;
  // Explain the most likely cause when the SQL hasn't been run yet.
  if (/function .* does not exist|schema cache|team_join_requests/i.test(error.message)) {
    throw new Error('Team joining isn\'t installed in the database yet (run the team joining SQL file in Supabase).');
  }
  throw new Error(error.message);
}

export async function searchTeams(query: string): Promise<TeamSummary[]> {
  const { data, error } = await getSupabase().rpc('search_teams', { p_query: query, p_limit: 20 });
  fail(error);
  return (data ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    abbr: t.abbr,
    logo: t.logo,
    members: t.members,
    captainId: t.captain_id,
    captainName: t.captain_name,
    captainCountry: t.captain_country,
  }));
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, name, country')
    .eq('team_id', teamId)
    .order('name');
  fail(error);
  return (data ?? []) as TeamMember[];
}

/** Requests to join the captain's team (RLS only returns them to the captain). */
export async function getIncomingRequests(teamId: string): Promise<JoinRequest[]> {
  const { data, error } = await getSupabase()
    .from('team_join_requests')
    .select('id, team_id, user_id, created_at, swimmer:profiles!team_join_requests_user_id_fkey(name, country)')
    .eq('team_id', teamId)
    .order('created_at');
  fail(error);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    teamId: r.team_id,
    userId: r.user_id,
    createdAt: r.created_at,
    swimmerName: r.swimmer?.name,
    swimmerCountry: r.swimmer?.country,
  }));
}

/** The signed-in swimmer's own pending requests. */
export async function getMyRequests(userId: string): Promise<JoinRequest[]> {
  const { data, error } = await getSupabase()
    .from('team_join_requests')
    .select('id, team_id, user_id, created_at, team:teams(id, name, abbr, logo)')
    .eq('user_id', userId)
    .order('created_at');
  fail(error);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    teamId: r.team_id,
    userId: r.user_id,
    createdAt: r.created_at,
    team: r.team ?? undefined,
  }));
}

export async function requestToJoin(teamId: string): Promise<void> {
  const { error } = await getSupabase().rpc('request_join_team', { p_team_id: teamId });
  fail(error);
}

export async function cancelRequest(teamId: string): Promise<void> {
  const { error } = await getSupabase().rpc('cancel_join_request', { p_team_id: teamId });
  fail(error);
}

export async function respondToRequest(requestId: string, accept: boolean): Promise<void> {
  const { error } = await getSupabase().rpc('respond_join_request', { p_request_id: requestId, p_accept: accept });
  fail(error);
}

export async function leaveTeam(): Promise<void> {
  const { error } = await getSupabase().rpc('leave_team');
  fail(error);
}

export async function removeMember(userId: string): Promise<void> {
  const { error } = await getSupabase().rpc('remove_team_member', { p_user_id: userId });
  fail(error);
}

export async function getTeamLeaderboard(): Promise<TeamStanding[]> {
  const { data, error } = await getSupabase().rpc('team_leaderboard');
  fail(error);
  return (data ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    abbr: t.abbr,
    logo: t.logo,
    members: t.members,
    points: t.points,
    dualWins: t.dual_wins,
    races: t.races,
  }));
}
