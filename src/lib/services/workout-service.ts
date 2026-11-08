'use client';
import { getSupabase } from '@/lib/supabase/client';

export interface SavedWorkout {
  id: string;
  date: string;
  workout: string;
  experience: string;
  typicalDistance: string;
  targetStroke?: string;
  duration?: string;
  intensity?: string;
}

function mapWorkout(r: any): SavedWorkout {
  return {
    id: r.id,
    date: r.created_at,
    workout: r.workout,
    experience: r.experience ?? '',
    typicalDistance: r.typical_distance ?? '',
    targetStroke: r.target_stroke ?? undefined,
    duration: r.duration ?? undefined,
    intensity: r.intensity ?? undefined,
  };
}

export async function saveWorkout(workout: Omit<SavedWorkout, 'id' | 'date'>): Promise<SavedWorkout> {
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('You must be logged in.');
  const { data, error } = await supabase
    .from('saved_workouts')
    .insert({
      user_id: auth.user.id,
      workout: workout.workout,
      experience: workout.experience,
      typical_distance: workout.typicalDistance,
      target_stroke: workout.targetStroke ?? null,
      duration: workout.duration ?? null,
      intensity: workout.intensity ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapWorkout(data);
}

export async function getSavedWorkouts(): Promise<SavedWorkout[]> {
  // Row-level security returns only the signed-in user's workouts.
  const { data, error } = await getSupabase()
    .from('saved_workouts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapWorkout);
}

export async function deleteSavedWorkout(id: string): Promise<void> {
  const { error } = await getSupabase().from('saved_workouts').delete().eq('id', id);
  if (error) throw error;
}
