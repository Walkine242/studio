'use client';

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

const WORKOUTS_KEY = 'aquaSpeed-saved-workouts';

function getLocalWorkouts(): SavedWorkout[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(WORKOUTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalWorkouts(workouts: SavedWorkout[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  }
}

export async function saveWorkout(workout: Omit<SavedWorkout, 'id' | 'date'>): Promise<SavedWorkout> {
  const workouts = getLocalWorkouts();
  const newWorkout: SavedWorkout = {
    ...workout,
    id: 'workout_' + Math.random().toString(36).substring(2, 9),
    date: new Date().toISOString(),
  };
  workouts.push(newWorkout);
  saveLocalWorkouts(workouts);
  return newWorkout;
}

export async function getSavedWorkouts(): Promise<SavedWorkout[]> {
  const workouts = getLocalWorkouts();
  return workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function deleteSavedWorkout(id: string): Promise<void> {
  let workouts = getLocalWorkouts();
  workouts = workouts.filter((w) => w.id !== id);
  saveLocalWorkouts(workouts);
}
