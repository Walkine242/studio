'use client';
import { useState, useEffect, useCallback } from 'react';
import type { PersonalBest } from '@/lib/types';
import { getUserId } from '@/lib/hooks/use-user-profile';
import { useAuth } from '@/lib/auth/auth-provider';
import { swimTimeToMs } from '@/lib/utils';
import { getSupabase } from '@/lib/supabase/client';

function mapPB(row: any): PersonalBest {
  return {
    id: row.id,
    stroke: row.stroke,
    distance: row.distance,
    unit: row.unit,
    time: row.time,
    date: row.created_at,
    userId: row.user_id,
  };
}

export function usePersonalBests(userId?: string) {
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  const targetUserId = userId || user?.id || null;

  const load = useCallback(async () => {
    if (!targetUserId) {
      setPersonalBests([]);
      setIsInitialized(true);
      return;
    }
    const { data, error } = await getSupabase()
      .from('personal_bests')
      .select('*')
      .eq('user_id', targetUserId)
      .order('stroke')
      .order('distance');
    if (error) console.error('Failed to load personal bests:', error);
    setPersonalBests((data ?? []).map(mapPB));
    setIsInitialized(true);
  }, [targetUserId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Saves the time only if it beats the existing PB for that stroke/distance/unit. */
  const addPersonalBest = useCallback(async (pb: Omit<PersonalBest, 'id' | 'date' | 'userId'>) => {
    const me = getUserId();
    if (!me) return;
    const supabase = getSupabase();
    const newMs = swimTimeToMs(pb.time);

    const { data: existing } = await supabase
      .from('personal_bests')
      .select('id, time_ms')
      .eq('user_id', me)
      .eq('stroke', pb.stroke)
      .eq('distance', pb.distance)
      .eq('unit', pb.unit)
      .maybeSingle();

    if (existing && existing.time_ms <= newMs) return;

    const row = {
      user_id: me,
      stroke: pb.stroke,
      distance: pb.distance,
      unit: pb.unit,
      time: pb.time,
      time_ms: Math.round(newMs),
      created_at: new Date().toISOString(),
    };
    const { error } = existing
      ? await supabase.from('personal_bests').update(row).eq('id', existing.id)
      : await supabase.from('personal_bests').insert(row);
    if (error) {
      console.error('Failed to save personal best:', error);
      return;
    }
    await load();
  }, [load]);

  const removePersonalBest = useCallback(async (id: string) => {
    const { error } = await getSupabase().from('personal_bests').delete().eq('id', id);
    if (error) console.error('Failed to remove personal best:', error);
    setPersonalBests((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { personalBests, addPersonalBest, removePersonalBest, isInitialized };
}
