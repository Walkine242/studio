'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AllTimeBest } from '@/lib/types';
import { getSupabase } from '@/lib/supabase/client';

/** Top 8 swimmers per event by best time, computed in the database. */
export function useAllTimeBestByEvent() {
  const [bestTimes, setBestTimes] = useState<AllTimeBest[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchBestTimes = useCallback(async () => {
    setIsInitialized(false);
    const { data, error } = await getSupabase().rpc('all_time_best_by_event');
    if (error) console.error('Failed to load all-time best times:', error);
    setBestTimes(
      ((data as any[]) ?? []).map((r) => ({
        event: r.event,
        totalTime: r.total_time_ms,
        date: r.date,
        swimmerId: r.swimmer_id,
        swimmerName: r.swimmer_name,
      }))
    );
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    fetchBestTimes();
  }, [fetchBestTimes]);

  return { bestTimes, isInitialized, refetch: fetchBestTimes };
}
