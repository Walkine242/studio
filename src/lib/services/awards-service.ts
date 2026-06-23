'use client';
import type { Award } from '@/lib/types';

const AWARDS_KEY = 'aquaSpeed-awards';

function getLocalAwards(): Award[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(AWARDS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalAwards(awards: Award[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AWARDS_KEY, JSON.stringify(awards));
  }
}

export async function createAward(userId: string, title: string, meet: string, rank: number) {
  const awards = getLocalAwards();
  const newAward: Award = {
    id: 'award_' + Math.random().toString(36).substring(2, 9),
    userId,
    title,
    meet,
    rank,
    date: new Date().toISOString(),
  };
  awards.push(newAward);
  saveLocalAwards(awards);
}

export async function getAwardsForUser(userId: string): Promise<Award[]> {
  const awards = getLocalAwards();
  const userAwards = awards.filter((a) => a.userId === userId);
  return userAwards.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
