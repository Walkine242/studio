'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';

interface StreakData {
  currentStreak: number;
  lastLogin: string; // ISO date string (YYYY-MM-DD)
}

const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const isYesterday = (date1: Date, date2: Date) => {
    const yesterday = new Date(date1);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(yesterday, date2);
};


export function useLoginStreak(): { streak: number, isNewStreak: boolean } {
    const [streak, setStreak] = useState(0);
    const [isNewStreak, setIsNewStreak] = useState(false);
    const { user } = useAuth();
    const userId = user?.id ?? null;

    useEffect(() => {
        const checkStreak = () => {
            try {
                // Clear any legacy global streak key for non-logged-in visitors
                if (!userId) {
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('aquaSpeed-loginStreak');
                    }
                    setStreak(0);
                    setIsNewStreak(false);
                    return;
                }

                const streakKey = `aquaSpeed-loginStreak_${userId}`;
                const storedData = localStorage.getItem(streakKey);
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];

                let streakData: StreakData;

                if (storedData) {
                    streakData = JSON.parse(storedData);
                    const lastLoginDate = new Date(streakData.lastLogin);
                    
                    if (!isSameDay(today, lastLoginDate)) {
                        if (isYesterday(today, lastLoginDate)) {
                            // Streak continues
                            streakData.currentStreak += 1;
                        } else {
                            // Streak broken
                            streakData.currentStreak = 1;
                        }
                        streakData.lastLogin = todayStr;
                        localStorage.setItem(streakKey, JSON.stringify(streakData));
                        setIsNewStreak(true);
                    }
                } else {
                    // First login for authenticated user
                    streakData = { currentStreak: 1, lastLogin: todayStr };
                    localStorage.setItem(streakKey, JSON.stringify(streakData));
                    setIsNewStreak(true);
                }
                setStreak(streakData.currentStreak);

            } catch (error) {
                console.error('Failed to process login streak:', error);
            }
        };

        checkStreak();
    }, [userId]);

    // Only report a new streak once
    useEffect(() => {
        if (isNewStreak) {
            const timer = setTimeout(() => setIsNewStreak(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isNewStreak]);

    return { streak, isNewStreak };
}

