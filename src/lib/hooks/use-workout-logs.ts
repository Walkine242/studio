
'use client';
import { useState, useEffect } from 'react';
import type { WorkoutLog } from '@/lib/types';
import { getUserId as getCurrentUserId } from '@/lib/hooks/use-user-profile';

const mockWorkoutLogs: WorkoutLog[] = [
  { id: 1, date: '2024-07-28', title: 'Morning Endurance', source: 'apple-watch', duration: '1h 15m', distance: '3,200m', avgPace: "1:58/100m", userId: 'user_zivts43', location: 'City Aquatic Center' },
  { id: 2, date: '2024-07-26', title: 'Sprint Intervals', source: 'form-goggles', duration: '45m', distance: '1,800m', avgPace: "1:45/100m", userId: 'user_zivts43', location: 'Community Pool' },
  { id: 3, date: '2024-07-25', title: 'Technique Focus', source: 'manual', duration: '1h 0m', distance: '2,500m', avgPace: "2:10/100m", userId: 'user_zivts43', location: 'University Natatorium' },
  { id: 4, date: '2024-07-23', title: 'Recovery Swim', source: 'garmin', duration: '30m', distance: '1,200m', avgPace: "2:25/100m", userId: 'user_2', location: 'LA Fitness' },
  { id: 5, date: '2024-07-22', title: 'Long Distance', source: 'fitbit', duration: '2h 0m', distance: '5,000m', avgPace: "2:05/100m", userId: 'user_2', location: 'YMCA Main Branch' },
  { id: 6, date: '2024-07-21', title: 'Threshold Set', source: 'suunto', duration: '55m', distance: '2,800m', avgPace: "1:55/100m", userId: 'user_3', location: 'Tokyo Tatsumi International Swimming Center' },
  { id: 7, date: '2024-07-20', title: 'Pace Work', source: 'polar', duration: '1h 5m', distance: '3,000m', avgPace: "2:00/100m", userId: 'user_4', location: 'Montreal Olympic Pool' }
];

const STORAGE_KEY = 'aquaSpeed-workoutLogs';

export function useWorkoutLogs({ userId }: { userId?: string }) {
    const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const targetUserId = userId || getCurrentUserId();

    useEffect(() => {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            const allLogs: WorkoutLog[] = storedData ? JSON.parse(storedData) : mockWorkoutLogs;
            if (targetUserId) {
                setWorkoutLogs(allLogs.filter(log => log.userId === targetUserId));
            }
        } catch (error) {
            console.error('Failed to load workout logs', error);
             if (targetUserId) {
                setWorkoutLogs(mockWorkoutLogs.filter(log => log.userId === targetUserId));
            }
        }
        setIsInitialized(true);
    }, [targetUserId]);

    return { workoutLogs, isInitialized };
}
