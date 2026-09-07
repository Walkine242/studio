'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AllTimePoints, RaceResult, Party } from '@/lib/types';
import { getAllRaceResults } from '../services/race-results-service';

const FINALS_POINTS = [9, 7, 6, 5, 4, 3, 2, 1];
const PARTIES_KEY = 'aquaSpeed-parties';

const calculatePoints = (parties: Party[], raceResultsBySwimmer: Record<string, RaceResult[]>): AllTimePoints[] => {
    const pointsMap: { [swimmer: string]: { points: number; races: number } } = {};

    parties.forEach((party) => {
        const sortedMembers = [...party.members].sort((a, b) => {
            const timeA = raceResultsBySwimmer[a]?.find((r) => r.meetId === party.meetId && r.event === party.event && r.round === party.round)?.totalTime ?? Infinity;
            const timeB = raceResultsBySwimmer[b]?.find((r) => r.meetId === party.meetId && r.event === party.event && r.round === party.round)?.totalTime ?? Infinity;
            return timeA - timeB;
        });

        sortedMembers.forEach((member, index) => {
            if (!pointsMap[member]) {
                pointsMap[member] = { points: 0, races: 0 };
            }

            let pointsGained = 0;
            if (index < FINALS_POINTS.length) {
                pointsGained = FINALS_POINTS[index];
            }
            
            pointsMap[member].points += pointsGained;
            pointsMap[member].races += 1;
        });
    });

    return Object.entries(pointsMap).map(([swimmer, data]) => ({
        swimmer,
        ...data,
    })).sort((a, b) => b.points - a.points);
};

export function useAllTimePoints(country?: string) {
  const [allTimePoints, setAllTimePoints] = useState<AllTimePoints[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchAllTimePoints = useCallback(async () => {
    setIsInitialized(false);
     
    const storedParties = typeof window !== 'undefined' ? localStorage.getItem(PARTIES_KEY) : null;
    const allParties: Party[] = storedParties ? JSON.parse(storedParties) : [];
    const parties = allParties.filter((p) => p.isPublic && p.status === 'finished' && p.round === 'Finals');

    let allRaceResults = await getAllRaceResults();

    if (country) {
        const countrySwimmerIds = new Set(
          allRaceResults
            .filter((r) => r.country === country)
            .map((r) => r.swimmerId)
            .filter(Boolean) as string[]
        );
        parties.forEach((party) => {
            party.members = party.members.filter((memberId: string) => countrySwimmerIds.has(memberId));
        });
        allRaceResults = allRaceResults.filter((r) => r.country === country);
    }
     
    const raceResultsBySwimmer: Record<string, RaceResult[]> = {};
    allRaceResults.forEach((r) => {
        if (r.swimmerId) {
            if (!raceResultsBySwimmer[r.swimmerId]) {
                raceResultsBySwimmer[r.swimmerId] = [];
            }
            raceResultsBySwimmer[r.swimmerId].push(r);
        }
    });

    const points = calculatePoints(parties, raceResultsBySwimmer);
    setAllTimePoints(points);
    setIsInitialized(true);
  }, [country]);

  useEffect(() => {
    fetchAllTimePoints();
  }, [fetchAllTimePoints]);

  return { allTimePoints, isInitialized };
}
