'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AllTimeBest } from '@/lib/types';
import { getAllRaceResults } from '@/lib/services/race-results-service';
import { useUserProfile } from './use-user-profile';

const MOCK_USER_NAMES: Record<string, string> = {
    "user_zivts43": "Swimmer Zivts",
    "user_2": "Alex Johnson",
    "user_3": "Yuki Tanaka",
    "user_4": "Fatima Al-Fahim",
    "user_5": "Sven Eriksson",
    "user_6": "Chloe Dubois",
};
const getSwimmerName = (id: string) => MOCK_USER_NAMES[id] || id.replace('_', ' ');


export function useAllTimeBestByEvent() {
  const [bestTimes, setBestTimes] = useState<AllTimeBest[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchBestTimes = useCallback(async () => {
    setIsInitialized(false);
    try {
      const results = await getAllRaceResults();
      const bestByEvent: { [key: string]: AllTimeBest[] } = {};

      for (const result of results) {
        if (!result.swimmerId) continue;

        if (!bestByEvent[result.event]) {
          bestByEvent[result.event] = [];
        }

        // Add result if not already present for that swimmer
        if (!bestByEvent[result.event].some(r => r.swimmerId === result.swimmerId)) {
             bestByEvent[result.event].push({
                event: result.event,
                totalTime: result.totalTime,
                date: result.date,
                swimmerId: result.swimmerId,
                swimmerName: getSwimmerName(result.swimmerId),
            });
        }
      }
      
      // Sort and limit to top 8 for each event
      const top8ByEvent: AllTimeBest[] = [];
      for (const event in bestByEvent) {
          const sorted = bestByEvent[event]
            .sort((a,b) => a.totalTime - b.totalTime)
            .slice(0, 8);
          top8ByEvent.push(...sorted);
      }

      const sortedBestTimes = top8ByEvent.sort((a, b) => {
          if (a.event < b.event) return -1;
          if (a.event > b.event) return 1;
          return a.totalTime - b.totalTime;
      });

      setBestTimes(sortedBestTimes);
    } catch (error) {
      console.error('Failed to load all-time best times:', error);
      setBestTimes([]);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    fetchBestTimes();
  }, [fetchBestTimes]);

  return { bestTimes, isInitialized, refetch: fetchBestTimes };
}
