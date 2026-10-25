'use client';
import { useState, useEffect, useCallback } from 'react';
import type { WorkoutLog } from '@/lib/types';
import { getUserId } from '@/lib/hooks/use-user-profile';
import { useAuth } from '@/lib/auth/auth-provider';
import { getSupabase } from '@/lib/supabase/client';

function mapLog(row: any): WorkoutLog {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    source: row.source,
    duration: row.duration ?? '',
    distance: row.distance ?? '',
    avgPace: row.avg_pace ?? '',
    userId: row.user_id,
    location: row.location ?? undefined,
  };
}

export function useWorkoutLogs({ userId }: { userId?: string }) {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  const targetUserId = userId || user?.id || null;

  const load = useCallback(async () => {
    if (!targetUserId) {
      setWorkoutLogs([]);
      setIsInitialized(true);
      return;
    }
    const { data, error } = await getSupabase()
      .from('workout_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) console.error('Failed to load workout logs:', error);
    setWorkoutLogs((data ?? []).map(mapLog));
    setIsInitialized(true);
  }, [targetUserId]);

  useEffect(() => {
    load();
  }, [load]);

  return { workoutLogs, isInitialized, refetch: load };
}

/** Records a completed session for the signed-in swimmer. */
export async function addWorkoutLog(log: Omit<WorkoutLog, 'id' | 'userId'>) {
  const me = getUserId();
  if (!me) throw new Error('You must be logged in.');
  const { error } = await getSupabase().from('workout_logs').insert({
    user_id: me,
    date: log.date,
    title: log.title,
    source: log.source,
    duration: log.duration,
    distance: log.distance,
    avg_pace: log.avgPace,
    location: log.location ?? null,
  });
  if (error) throw error;
}
