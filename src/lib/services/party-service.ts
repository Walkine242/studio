'use client';
import { MEETS } from '@/config/meets';
import { getDynamicMeets } from './meet-service';
import { mapRaceResult } from './race-results-service';
import { getSupabase } from '@/lib/supabase/client';
import type { Party, RaceResult, SwimmerSummary } from '@/lib/types';

// All party writes go through database functions (create_party, join_party,
// start_party, submit_party_result, finish_party), which check who is calling.

function mapParty(row: any, members: SwimmerSummary[]): Party {
  return {
    id: row.id,
    code: row.code,
    event: row.event,
    isPublic: row.is_public,
    status: row.status,
    hostId: row.host_id,
    members: members.map((m) => m.id),
    memberCount: members.length,
    memberProfiles: members,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    meetId: row.meet_id ?? undefined,
    round: row.round ?? undefined,
    qualifiedSwimmers: row.qualified_swimmers ?? [],
  };
}

function rpcError(error: { message: string } | null): never | void {
  if (error) throw new Error(error.message);
}

async function fetchParty(partyId: string): Promise<Party | null> {
  const supabase = getSupabase();
  const [{ data: party }, { data: members }] = await Promise.all([
    supabase.from('parties').select('*').eq('id', partyId).maybeSingle(),
    supabase
      .from('party_members')
      .select('user_id, joined_at, profiles(name, country)')
      .eq('party_id', partyId)
      .order('joined_at'),
  ]);
  if (!party) return null;
  const summaries: SwimmerSummary[] = (members ?? []).map((m: any) => ({
    id: m.user_id,
    name: m.profiles?.name ?? 'Swimmer',
    country: m.profiles?.country ?? '',
  }));
  return mapParty(party, summaries);
}

export async function createParty(data: Partial<Party>): Promise<Party> {
  const { data: row, error } = await getSupabase().rpc('create_party', {
    p_event: data.event || 'Custom Event',
    p_is_public: data.isPublic ?? false,
  });
  rpcError(error);
  const party = await fetchParty((row as any).id);
  if (!party) throw new Error('Could not create a party.');
  return party;
}

/** Live view of one party: calls onUpdate now and whenever it or its members change. */
export function getParty(partyId: string, onUpdate: (party: Party | null) => void) {
  const supabase = getSupabase();
  let active = true;
  const refresh = () => fetchParty(partyId).then((p) => active && onUpdate(p));
  refresh();

  const channel = supabase
    .channel(`party-${partyId}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'parties', filter: `id=eq.${partyId}` }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'party_members', filter: `party_id=eq.${partyId}` }, refresh)
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function joinParty(partyId: string) {
  const { error } = await getSupabase().rpc('join_party', { p_party_id: partyId });
  rpcError(error);
}

export async function startParty(partyId: string) {
  const { error } = await getSupabase().rpc('start_party', { p_party_id: partyId });
  rpcError(error);
}

export async function finishParty(partyId: string) {
  const { error } = await getSupabase().rpc('finish_party', { p_party_id: partyId });
  rpcError(error);
}

/** Submit the signed-in swimmer's time for a running race. */
export async function submitPartyResult(partyId: string, totalTimeMs: number, laps: number[] = [], unit: 'meters' | 'yards' = 'meters') {
  const { error } = await getSupabase().rpc('submit_party_result', {
    p_party_id: partyId,
    p_total_time_ms: Math.round(totalTimeMs),
    p_laps: laps.map((l) => Math.round(l)),
    p_unit: unit,
  });
  rpcError(error);
}

/** Results for one party, fastest first, with swimmer names. */
export async function getPartyResults(partyId: string): Promise<(RaceResult & { swimmerName: string })[]> {
  const { data, error } = await getSupabase()
    .from('race_results')
    .select('id, swimmer_id, event, total_time_ms, unit, laps, country, meet_id, round, created_at, profiles(name)')
    .eq('party_id', partyId)
    .order('total_time_ms');
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...mapRaceResult(r), swimmerName: r.profiles?.name ?? 'Swimmer' }));
}

/** Live list of public lobbies waiting for swimmers. */
export function getPublicParties(onUpdate: (parties: Party[]) => void) {
  const supabase = getSupabase();
  let active = true;
  const refresh = async () => {
    const { data } = await supabase
      .from('parties')
      .select('*, party_members(user_id)')
      .eq('is_public', true)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!active) return;
    onUpdate(
      (data ?? []).map((row: any) =>
        mapParty(row, (row.party_members ?? []).map((m: any) => ({ id: m.user_id, name: '', country: '' })))
      )
    );
  };
  refresh();

  const channel = supabase
    .channel(`public-parties-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'parties' }, refresh)
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export async function getQualifiedSwimmersForNextRound(
  meetId: string,
  eventName: string,
  previousRound: 'Prelims' | 'Quarterfinals' | 'Semifinals'
): Promise<string[]> {
  const { data, error } = await getSupabase().rpc('qualified_swimmers', {
    p_meet_id: meetId,
    p_event: eventName,
    p_previous_round: previousRound,
  });
  if (error) {
    console.error('Failed to check qualification:', error);
    return [];
  }
  return (data as string[]) ?? [];
}

export async function findOrCreatePartyForEvent(meetId: string, eventName: string, roundName: string): Promise<Party> {
  const dynamicMeets = await getDynamicMeets();
  const meet = [...MEETS, ...dynamicMeets].find((m) => m.id === meetId);
  const event = meet?.events.find((e) => e.name === eventName);
  const round = event?.rounds.find((r) => r.name === roundName);

  if (!meet || !event || !round) {
    throw new Error('Meet, event, or round not found.');
  }

  if (roundName === 'Prelims') {
    const [hours, minutes] = round.startTime.split(':').map(Number);
    const eventStart = new Date(meet.date);
    eventStart.setUTCHours(hours, minutes, 0, 0);
    if (Date.now() - eventStart.getTime() > 24 * 60 * 60 * 1000) {
      throw new Error(`The preliminary round for ${eventName} is now closed.`);
    }
  }

  const { data, error } = await getSupabase().rpc('find_or_create_meet_party', {
    p_meet_id: meetId,
    p_event: eventName,
    p_round: roundName,
  });
  rpcError(error);
  const party = await fetchParty((data as any).id);
  if (!party) throw new Error('Could not join the lobby.');
  return party;
}
