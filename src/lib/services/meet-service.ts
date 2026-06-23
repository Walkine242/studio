'use client';
import type { Meet } from '@/lib/types';

const MEETS_KEY = 'aquaSpeed-meets';

function getLocalMeets(): Meet[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(MEETS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalMeets(meets: Meet[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MEETS_KEY, JSON.stringify(meets));
  }
}

// In-memory subscription list for reactive UI updates
const listeners: Set<(meets: Meet[]) => void> = new Set();

function notifyListeners() {
  const meets = getLocalMeets();
  const sortedMeets = meets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  listeners.forEach((listener) => listener(sortedMeets));
}

export async function createMeet(meet: Omit<Meet, 'id'>) {
  const meets = getLocalMeets();
  const newMeet: Meet = {
    ...meet,
    id: 'meet_' + Math.random().toString(36).substring(2, 9),
  };
  meets.push(newMeet);
  saveLocalMeets(meets);
  notifyListeners();
}

export function subscribeToMeets(onUpdate: (meets: Meet[]) => void) {
  listeners.add(onUpdate);
  
  // Initial invoke
  const meets = getLocalMeets();
  const sortedMeets = meets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  onUpdate(sortedMeets);

  return () => {
    listeners.delete(onUpdate);
  };
}

export async function getDynamicMeets(): Promise<Meet[]> {
  const meets = getLocalMeets();
  return meets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
