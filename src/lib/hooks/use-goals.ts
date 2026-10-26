
'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Goal } from '@/lib/types';
import { getUserId as getCurrentUserId } from '@/lib/hooks/use-user-profile';


const STORAGE_KEY = 'aquaSpeed-goals';

const initialData: Goal[] = [];

export function useGoals(userId?: string) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const targetUserId = userId || getCurrentUserId();

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allGoals: Goal[] = storedData ? JSON.parse(storedData) : initialData;
      if (targetUserId) {
        setGoals(allGoals.filter(g => g.userId === targetUserId));
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Failed to load goals from localStorage', error);
      setGoals([]);
    }
    setIsInitialized(true);
  }, [targetUserId]);

   const updateAllGoals = (allGoals: Goal[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allGoals));
        if (targetUserId) {
            setGoals(allGoals.filter(g => g.userId === targetUserId));
        }
    } catch (error) {
        console.error('Failed to save goals to localStorage', error);
    }
  }


  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'completed' | 'userId'>) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      completed: false,
      userId: currentUserId,
    };
    
    const storedData = localStorage.getItem(STORAGE_KEY);
    const allGoals: Goal[] = storedData ? JSON.parse(storedData) : initialData;
    updateAllGoals([newGoal, ...allGoals]);
  }, [targetUserId]);

  const removeGoal = useCallback((id: string) => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const allGoals: Goal[] = storedData ? JSON.parse(storedData) : initialData;
    const updatedGoals = allGoals.filter((goal) => goal.id !== id);
    updateAllGoals(updatedGoals);
  }, [targetUserId]);

  const toggleGoal = useCallback((id: string) => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const allGoals: Goal[] = storedData ? JSON.parse(storedData) : initialData;
    const updatedGoals = allGoals.map((goal) =>
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      );
    updateAllGoals(updatedGoals);
  }, [targetUserId]);

  return { goals, addGoal, removeGoal, toggleGoal, isInitialized };
}

    