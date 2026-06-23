
'use client';
import { useState, useEffect, useCallback } from 'react';
import type { PersonalBest } from '@/lib/types';
import { getUserId as getCurrentUserId } from '@/lib/hooks/use-user-profile';
import { swimTimeToMs } from '@/lib/utils';

const STORAGE_KEY = 'aquaSpeed-personalBests';

const initialData: PersonalBest[] = [
  { id: '1', stroke: 'Freestyle', distance: 50, unit: 'meters', time: '00:23.50', date: new Date('2023-08-15').toISOString(), userId: 'user_zivts43' },
  { id: '2', stroke: 'Freestyle', distance: 100, unit: 'meters', time: '00:52.10', date: new Date('2023-09-01').toISOString(), userId: 'user_zivts43' },
  { id: '3', stroke: 'Butterfly', distance: 50, unit: 'meters', time: '00:25.80', date: new Date('2023-07-20').toISOString(), userId: 'user_zivts43' },
];


export function usePersonalBests(userId?: string) {
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const targetUserId = userId || getCurrentUserId();

  const getDeduplicatedPBs = (allPBs: PersonalBest[], uid: string) => {
    const userPBs = allPBs.filter(pb => pb.userId === uid);
    const uniquePBs: Record<string, PersonalBest> = {};
    
    userPBs.forEach(pb => {
        const key = `${pb.stroke}-${pb.distance}-${pb.unit || 'meters'}`;
        if (!uniquePBs[key] || swimTimeToMs(pb.time) < swimTimeToMs(uniquePBs[key].time)) {
            uniquePBs[key] = pb;
        }
    });
    
    return Object.values(uniquePBs);
  };

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allPBs: PersonalBest[] = storedData ? JSON.parse(storedData) : initialData;
      if (targetUserId) {
        setPersonalBests(getDeduplicatedPBs(allPBs, targetUserId));
      } else {
        setPersonalBests(getDeduplicatedPBs(initialData, 'user_zivts43'))
      }
    } catch (error) {
      console.error('Failed to load personal bests from localStorage', error);
      setPersonalBests([]);
    }
    setIsInitialized(true);
  }, [targetUserId]);

  const updateAllPBs = (allPBs: PersonalBest[]) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allPBs));
        if (targetUserId) {
            setPersonalBests(getDeduplicatedPBs(allPBs, targetUserId));
        }
      } catch (error) {
        console.error('Failed to save personal bests to localStorage', error);
      }
  }

  const addPersonalBest = useCallback((pb: Omit<PersonalBest, 'id' | 'date' | 'userId'>) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    const storedData = localStorage.getItem(STORAGE_KEY);
    let allPBs: PersonalBest[] = storedData ? JSON.parse(storedData) : initialData;
    
    const newTimeMs = swimTimeToMs(pb.time);
    
    // Find index of existing PB for same stroke, distance and unit
    const existingIndex = allPBs.findIndex(p => p.userId === currentUserId && p.stroke === pb.stroke && p.distance === pb.distance && (p.unit === pb.unit || (!p.unit && pb.unit === 'meters')));
    
    if (existingIndex !== -1) {
        const existingTimeMs = swimTimeToMs(allPBs[existingIndex].time);
        if (newTimeMs < existingTimeMs) {
            // Found a faster time, replace existing
            allPBs[existingIndex] = {
                ...pb,
                id: Date.now().toString(),
                date: new Date().toISOString(),
                userId: currentUserId,
            };
        } else {
            // New time is not faster, do not add/update PBs
            return; 
        }
    } else {
        // No existing record, add it
        allPBs.push({
            ...pb,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            userId: currentUserId,
        });
    }

    updateAllPBs(allPBs);

  }, [targetUserId]);

  const removePersonalBest = useCallback((id: string) => {
     const storedData = localStorage.getItem(STORAGE_KEY);
    const allPBs: PersonalBest[] = storedData ? JSON.parse(storedData) : initialData;
    const updatedPBs = allPBs.filter((pb) => pb.id !== id);
    updateAllPBs(updatedPBs);
  }, [targetUserId]);

  return { personalBests, addPersonalBest, removePersonalBest, isInitialized };
}
