'use client';
import { createAward } from './awards-service';
import { MEETS } from '@/config/meets';
import { getDynamicMeets } from './meet-service';
import type { Party, RaceResult } from '@/lib/types';

const PARTIES_KEY = 'aquaSpeed-parties';
const RACE_RESULTS_KEY = 'aquaSpeed-race-results';

function getLocalParties(): Party[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(PARTIES_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveLocalParties(parties: Party[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PARTIES_KEY, JSON.stringify(parties));
  }
}

function getLocalRaceResults(): RaceResult[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(RACE_RESULTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

const generatePartyCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const getUserId = () => {
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }
  return 'default-user';
};

// Subscriptions
const partyListeners: Set<{ partyId: string; callback: (party: Party | null) => void }> = new Set();
const publicPartiesListeners: Set<(parties: Party[]) => void> = new Set();

function notifyPartyListeners(partyId: string) {
  const parties = getLocalParties();
  const party = parties.find((p) => p.id === partyId) || null;
  
  if (party && party.status === 'finished' && party.round === 'Finals' && party.members.length > 0) {
    const topFinishers = party.members.slice(0, 3);
    topFinishers.forEach((swimmerId, index) => {
      const rank = index + 1;
      const place = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';
      const title = `${place} Place - ${party.event}`;
      createAward(swimmerId, title, party.meetId || 'Unknown Meet', rank);
    });
  }

  partyListeners.forEach((listener) => {
    if (listener.partyId === partyId) {
      listener.callback(party);
    }
  });
}

function notifyPublicPartiesListeners() {
  const parties = getLocalParties().filter((p) => p.isPublic && p.status === 'waiting');
  publicPartiesListeners.forEach((listener) => listener(parties));
}

export async function createParty(data: Partial<Party>): Promise<Party> {
  const hostId = getUserId();
  const partyCode = generatePartyCode();
  
  const parties = getLocalParties();
  const newParty: Party = {
    id: 'party_' + Math.random().toString(36).substring(2, 9),
    code: partyCode,
    event: data.event || 'Custom Event',
    isPublic: data.isPublic !== undefined ? data.isPublic : false,
    status: 'waiting',
    hostId: hostId,
    members: [hostId],
    memberCount: 1,
    createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
    meetId: data.meetId,
    round: data.round,
    qualifiedSwimmers: data.qualifiedSwimmers || [],
  };

  parties.push(newParty);
  saveLocalParties(parties);
  notifyPublicPartiesListeners();
  return newParty;
}

export function getParty(partyId: string, onUpdate: (party: Party | null) => void) {
  const listener = { partyId, callback: onUpdate };
  partyListeners.add(listener);
  
  // Initial callback
  const parties = getLocalParties();
  const party = parties.find((p) => p.id === partyId) || null;
  onUpdate(party);

  return () => {
    partyListeners.delete(listener);
  };
}

export async function joinParty(partyId: string) {
  const parties = getLocalParties();
  const partyIndex = parties.findIndex((p) => p.id === partyId);

  if (partyIndex === -1) {
    throw new Error('Party not found');
  }

  const partyData = parties[partyIndex];
  const currentUserId = getUserId();

  if (partyData.round && ['Quarterfinals', 'Semifinals', 'Finals'].includes(partyData.round)) {
    const qualified = partyData.qualifiedSwimmers || [];
    if (!qualified.includes(currentUserId)) {
      throw new Error(`You have not qualified for the ${partyData.round}.`);
    }
  }
  
  if (partyData.members.includes(currentUserId)) {
    return;
  }

  partyData.members.push(currentUserId);
  partyData.memberCount += 1;
  
  parties[partyIndex] = partyData;
  saveLocalParties(parties);
  
  notifyPartyListeners(partyId);
  notifyPublicPartiesListeners();
}

export function getPublicParties(onUpdate: (parties: Party[]) => void) {
  publicPartiesListeners.add(onUpdate);
  
  const parties = getLocalParties().filter((p) => p.isPublic && p.status === 'waiting');
  onUpdate(parties);

  return () => {
    publicPartiesListeners.delete(onUpdate);
  };
}

export async function getQualifiedSwimmersForNextRound(
  meetId: string, 
  eventName: string, 
  previousRound: 'Prelims' | 'Quarterfinals' | 'Semifinals'
): Promise<string[]> {
  const parties = getLocalParties();
  const party = parties.find(
    (p) => p.meetId === meetId && p.event === eventName && p.round === previousRound && p.status === 'finished'
  );
  if (!party) return [];

  let limitCount = 8;
  if (previousRound === 'Prelims') limitCount = 32;
  if (previousRound === 'Quarterfinals') limitCount = 16;

  const results = getLocalRaceResults();
  const filteredResults = results.filter(
    (r) => r.meetId === meetId && r.event === eventName && r.round === previousRound
  );
  
  const qualifiedIds = filteredResults
    .sort((a, b) => a.totalTime - b.totalTime)
    .slice(0, limitCount)
    .map((d) => d.swimmerId);
  
  return qualifiedIds;
}

export async function findOrCreatePartyForEvent(
  meetId: string, 
  eventName: string, 
  roundName: string
): Promise<Party> {
  const dynamicMeets = await getDynamicMeets();
  const allMeets = [...MEETS, ...dynamicMeets];
  const meet = allMeets.find((m) => m.id === meetId);
  const event = meet?.events.find((e) => e.name === eventName);
  const round = event?.rounds.find((r) => r.name === roundName);

  if (!meet || !event || !round) {
    throw new Error('Meet, event, or round not found.');
  }

  if (roundName === 'Prelims') {
    const [hours, minutes] = round.startTime.split(':').map(Number);
    const eventStartDateTime = new Date(meet.date);
    eventStartDateTime.setUTCHours(hours, minutes, 0, 0);
    const now = new Date();
    if (now.getTime() - eventStartDateTime.getTime() > 24 * 60 * 60 * 1000) {
      throw new Error(`The preliminary round for ${eventName} is now closed.`);
    }
  }

  const parties = getLocalParties();
  let party = parties.find(
    (p) => p.meetId === meetId && p.event === eventName && p.round === roundName && p.status === 'waiting'
  );

  if (!party) {
    let qualifiedSwimmers: string[] | undefined = undefined;
    if (roundName === 'Quarterfinals') {
      qualifiedSwimmers = await getQualifiedSwimmersForNextRound(meetId, eventName, 'Prelims');
    } else if (roundName === 'Semifinals') {
      qualifiedSwimmers = await getQualifiedSwimmersForNextRound(meetId, eventName, 'Quarterfinals');
    } else if (roundName === 'Finals') {
      qualifiedSwimmers = await getQualifiedSwimmersForNextRound(meetId, eventName, 'Semifinals');
    }
    
    party = await createParty({
      meetId,
      event: eventName,
      round: roundName,
      isPublic: true,
      qualifiedSwimmers,
    });
  }
  
  await joinParty(party.id);
  return party;
}
