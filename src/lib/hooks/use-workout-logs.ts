
'use client';
import { useState, useEffect, useCallback } from 'react';
import type { WorkoutLog } from '@/lib/types';
import { getUserId as getCurrentUserId } from '@/lib/hooks/use-user-profile';

const STORAGE_KEY = 'aquaSpeed-workoutLogs';

export function useWorkoutLogs({ userId }: { userId?: string } = {}) {
    const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const targetUserId = userId || getCurrentUserId();

    const loadLogs = useCallback(() => {
        try {
            const storedData = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
            const allLogs: WorkoutLog[] = storedData ? JSON.parse(storedData) : [];
            if (targetUserId) {
                setWorkoutLogs(allLogs.filter(log => log.userId === targetUserId));
            } else {
                setWorkoutLogs([]);
            }
        } catch (error) {
            console.error('Failed to load workout logs', error);
            setWorkoutLogs([]);
        }
        setIsInitialized(true);
    }, [targetUserId]);

    useEffect(() => {
        loadLogs();
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', loadLogs);
            return () => window.removeEventListener('storage', loadLogs);
        }
    }, [loadLogs]);

    const addWorkoutLog = useCallback((log: Omit<WorkoutLog, 'id' | 'userId'>) => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId || typeof window === 'undefined') return;

        const storedData = localStorage.getItem(STORAGE_KEY);
        const allLogs: WorkoutLog[] = storedData ? JSON.parse(storedData) : [];

        const newLog: WorkoutLog = {
            ...log,
            id: Date.now(),
            userId: currentUserId,
        };

        const updated = [newLog, ...allLogs];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        loadLogs();
    }, [loadLogs]);

    return { workoutLogs, isInitialized, addWorkoutLog, refetch: loadLogs };
}
