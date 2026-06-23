'use client';
import type { RaceResult } from '@/lib/types';

const RACE_RESULTS_KEY = 'aquaSpeed-race-results';

function getLocalRaceResults(): RaceResult[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(RACE_RESULTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalRaceResults(results: RaceResult[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(RACE_RESULTS_KEY, JSON.stringify(results));
  }
}

const listeners: Set<(results: RaceResult[]) => void> = new Set();

export function subscribeToRaceResults(onUpdate: (results: RaceResult[]) => void) {
  listeners.add(onUpdate);
  onUpdate(getLocalRaceResults());
  return () => {
    listeners.delete(onUpdate);
  };
}

function notifyListeners() {
  const results = getLocalRaceResults();
  listeners.forEach((listener) => listener(results));
}

export async function addRaceResult(result: Omit<RaceResult, 'id' | 'date'>): Promise<RaceResult> {
  const results = getLocalRaceResults();
  const newResult: RaceResult = {
    ...result,
    id: 'race_' + Math.random().toString(36).substring(2, 9),
    date: new Date().toISOString(),
  };
  results.push(newResult);
  saveLocalRaceResults(results);
  notifyListeners();
  return newResult;
}

export async function getRaceResults(country?: string): Promise<RaceResult[]> {
  const results = getLocalRaceResults();
  const filtered = country ? results.filter((r) => r.country === country) : results;
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAllRaceResults(): Promise<RaceResult[]> {
  const results = getLocalRaceResults();
  return results.sort((a, b) => a.totalTime - b.totalTime);
}

export async function removeRaceResult(id: string): Promise<void> {
  let results = getLocalRaceResults();
  results = results.filter((r) => r.id !== id);
  saveLocalRaceResults(results);
  notifyListeners();
}
