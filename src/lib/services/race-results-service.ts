'use client';
import type { RaceResult } from '@/lib/types';
import { getSupabase } from '@/lib/supabase/client';

const COLUMNS = 'id, swimmer_id, event, total_time_ms, unit, laps, country, meet_id, round, created_at, profiles(name)';

export function mapRaceResult(row: any): RaceResult {
  return {
    id: row.id,
    date: row.created_at,
    totalTime: row.total_time_ms,
    unit: row.unit,
    laps: row.laps ?? [],
    event: row.event,
    swimmerId: row.swimmer_id,
    country: row.country ?? undefined,
    meetId: row.meet_id ?? undefined,
    round: row.round ?? undefined,
    swimmerName: row.profiles?.name ?? undefined,
  };
}

export interface RaceResultQuery {
  swimmerId?: string;
  country?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export async function queryRaceResults(q: RaceResultQuery = {}): Promise<RaceResult[]> {
  let query = getSupabase().from('race_results').select(COLUMNS);
  if (q.swimmerId) query = query.eq('swimmer_id', q.swimmerId);
  if (q.country) query = query.eq('country', q.country);
  if (q.startDate) query = query.gte('created_at', q.startDate.toISOString());
  if (q.endDate) query = query.lte('created_at', q.endDate.toISOString());
  const { data, error } = await query.order('created_at', { ascending: false }).limit(q.limit ?? 1000);
  if (error) throw error;
  return (data ?? []).map(mapRaceResult);
}

/** Adds a time-trial / PB result for the signed-in swimmer. */
export async function addRaceResult(
  result: Pick<RaceResult, 'event' | 'totalTime' | 'laps'> & { unit?: RaceResult['unit'] }
): Promise<RaceResult> {
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('You must be logged in.');

  const { data, error } = await supabase
    .from('race_results')
    .insert({
      swimmer_id: auth.user.id,
      event: result.event,
      total_time_ms: Math.round(result.totalTime),
      unit: result.unit ?? 'meters',
      laps: (result.laps ?? []).map((l) => Math.round(l)),
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return mapRaceResult(data);
}

export async function getRaceResults(country?: string): Promise<RaceResult[]> {
  return queryRaceResults({ country });
}

/** All results, fastest first (used for event rankings). */
export async function getAllRaceResults(): Promise<RaceResult[]> {
  const { data, error } = await getSupabase()
    .from('race_results')
    .select(COLUMNS)
    .order('total_time_ms', { ascending: true })
    .limit(5000);
  if (error) throw error;
  return (data ?? []).map(mapRaceResult);
}

export async function removeRaceResult(id: string): Promise<void> {
  const { error } = await getSupabase().from('race_results').delete().eq('id', id);
  if (error) throw error;
}
