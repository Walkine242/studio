'use client';
import { useState, useEffect, useCallback } from 'react';
import type { RaceResult } from '@/lib/types';
import { 
  addRaceResult as addRaceResultService, 
  removeRaceResult as removeRaceResultService,
  subscribeToRaceResults
} from '@/lib/services/race-results-service';
import { useLocalRaceResults } from './use-local-race-results';
import { getUserId as getCurrentUserId, useUserProfile } from '@/lib/hooks/use-user-profile';

export function useRaceResults({ userId, dateRange, country, global }: { userId?: string, dateRange?: { startDate: Date, endDate: Date }, country?: string, global?: boolean }) {
  const [raceResults, setRaceResults] = useState<RaceResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { addRaceResult: addLocalRaceResult } = useLocalRaceResults();
  const { profile } = useUserProfile();

  useEffect(() => {
    setIsInitialized(false);
    
    const unsubscribe = subscribeToRaceResults((allResults) => {
      let results = [...allResults];

      if (country) {
        results = results.filter((r) => r.country === country);
      } else if (userId) {
        results = results.filter((r) => r.swimmerId === userId);
      }

      // Filter by date range if provided
      if (dateRange) {
        results = results.filter((r) => {
          const raceDate = new Date(r.date);
          return raceDate >= dateRange.startDate && raceDate <= dateRange.endDate;
        });
      }
      
      // Sort by date descending in memory
      results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setRaceResults(results);
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [userId, dateRange, country, global]);

  const addRaceResult = useCallback(async (result: Omit<RaceResult, 'id' | 'date'>) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId || !profile) return;
    try {
      const newRace = { 
        ...result, 
        swimmerId: currentUserId, 
        country: profile.country, 
        date: new Date().toISOString(),
        unit: result.unit || 'meters'
      };
      await addRaceResultService(newRace);
      addLocalRaceResult({ ...newRace, id: 'temp-' + Date.now() });
    } catch (error) {
      console.error('Failed to initiate race result save:', error);
    }
  }, [profile, addLocalRaceResult]);

  const removeRaceResult = useCallback(async (id: string) => {
    try {
      await removeRaceResultService(id);
    } catch (error) {
      console.error('Failed to initiate race result removal:', error);
    }
  }, []);

  return { raceResults, addRaceResult, removeRaceResult, isInitialized };
}
