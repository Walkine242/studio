'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Goal } from '@/lib/types';
import { getUserId } from '@/lib/hooks/use-user-profile';
import { useAuth } from '@/lib/auth/auth-provider';
import { getSupabase } from '@/lib/supabase/client';

function mapGoal(row: any): Goal {
  return {
    id: row.id,
    description: row.description,
    targetDate: row.target_date ? new Date(row.target_date).toISOString() : '',
    completed: row.completed,
    type: row.type,
    event: row.event ?? undefined,
    targetTime: row.target_time ?? undefined,
    league: row.league ?? undefined,
    targetRank: row.target_rank ?? undefined,
    meetId: row.meet_id ?? undefined,
    userId: row.user_id,
  };
}

export function useGoals(userId?: string) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  const targetUserId = userId || user?.id || null;

  const load = useCallback(async () => {
    if (!targetUserId) {
      setGoals([]);
      setIsInitialized(true);
      return;
    }
    const { data, error } = await getSupabase()
      .from('goals')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });
    if (error) console.error('Failed to load goals:', error);
    setGoals((data ?? []).map(mapGoal));
    setIsInitialized(true);
  }, [targetUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'completed' | 'userId'>) => {
    const me = getUserId();
    if (!me) return;
    const { error } = await getSupabase().from('goals').insert({
      user_id: me,
      description: goal.description,
      target_date: goal.targetDate ? goal.targetDate.slice(0, 10) : null,
      type: goal.type,
      event: goal.event || null,
      target_time: goal.targetTime || null,
      league: goal.league || null,
      target_rank: goal.targetRank || null,
      meet_id: goal.meetId || null,
    });
    if (error) console.error('Failed to add goal:', error);
    await load();
  }, [load]);

  const removeGoal = useCallback(async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    const { error } = await getSupabase().from('goals').delete().eq('id', id);
    if (error) console.error('Failed to remove goal:', error);
  }, []);

  const toggleGoal = useCallback(async (id: string) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    const nextValue = !goal.completed;
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, completed: nextValue } : g)));
    const { error } = await getSupabase().from('goals').update({ completed: nextValue }).eq('id', id);
    if (error) console.error('Failed to update goal:', error);
  }, [goals]);

  return { goals, addGoal, removeGoal, toggleGoal, isInitialized };
}
