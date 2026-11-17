'use client';
import { useState, useEffect, useCallback } from 'react';
import type { RaceResult } from '@/lib/types';
import {
  addRaceResult as addRaceResultService,
  removeRaceResult as removeRaceResultService,
  queryRaceResults,
} from '@/lib/services/race-results-service';
import { useAuth } from '@/lib/auth/auth-provider';

interface Options {
  userId?: string;
  dateRange?: { startDate: Date; endDate: Date };
  country?: string;
  global?: boolean;
  /** Only the signed-in swimmer's own results. */
  mine?: boolean;
}

export function useRaceResults({ userId, dateRange, country, global, mine }: Options = {}) {
  const [raceResults, setRaceResults] = useState<RaceResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const startTs = dateRange?.startDate.getTime();
  const endTs = dateRange?.endDate.getTime();

  const { user } = useAuth();
  const swimmerId = mine ? user?.id : country || global ? undefined : userId;
  const blocked = mine && !swimmerId;

  const load = useCallback(async () => {
    if (blocked) {
      setRaceResults([]);
      setIsInitialized(true);
      return;
    }
    try {
      const results = await queryRaceResults({
        swimmerId,
        country,
        startDate: startTs !== undefined ? new Date(startTs) : undefined,
        endDate: endTs !== undefined ? new Date(endTs) : undefined,
      });
      setRaceResults(results);
    } catch (error) {
      console.error('Failed to load race results:', error);
      setRaceResults([]);
    } finally {
      setIsInitialized(true);
    }
  }, [swimmerId, country, startTs, endTs, blocked]);

  useEffect(() => {
    setIsInitialized(false);
    load();
  }, [load]);

  const addRaceResult = useCallback(async (result: Omit<RaceResult, 'id' | 'date'>) => {
    try {
      await addRaceResultService({
        event: result.event,
        totalTime: result.totalTime,
        laps: result.laps,
        unit: result.unit || 'meters',
      });
      await load();
    } catch (error) {
      console.error('Failed to save race result:', error);
      throw error;
    }
  }, [load]);

  const removeRaceResult = useCallback(async (id: string) => {
    try {
      await removeRaceResultService(id);
      setRaceResults((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Failed to remove race result:', error);
    }
  }, []);

  return { raceResults, addRaceResult, removeRaceResult, isInitialized, refetch: load };
}

/** The signed-in swimmer's own results (used for "Your League Standings"). */
export function useMyRaceResults(options: { dateRange?: { startDate: Date; endDate: Date } } = {}) {
  return useRaceResults({ ...options, mine: true });
}
