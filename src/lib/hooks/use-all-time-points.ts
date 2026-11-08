'use client';
import { useState, useEffect } from 'react';
import type { AllTimePoints } from '@/lib/types';
import { getSupabase } from '@/lib/supabase/client';

/** All-time points from finished public Finals (9-7-6-5-4-3-2-1), computed in the database. */
export function useAllTimePoints(country?: string) {
  const [allTimePoints, setAllTimePoints] = useState<AllTimePoints[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsInitialized(false);
    getSupabase()
      .rpc('all_time_points', { p_country: country ?? null })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('Failed to load all-time points:', error);
        setAllTimePoints(
          ((data as any[]) ?? []).map((r) => ({
            swimmer: r.swimmer_id,
            name: r.name,
            country: r.country,
            points: r.points,
            races: r.races,
          }))
        );
        setIsInitialized(true);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  return { allTimePoints, isInitialized };
}
