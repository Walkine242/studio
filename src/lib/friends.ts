import { getCountryByCode, type Country } from './countries';

export interface Friend {
  id: string;
  name: string;
  country: Country;
  avatar: string;
}

export const getFriends = (): Friend[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('dual_followed_friends');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addFriend = (friend: Friend) => {
  if (typeof window === 'undefined') return;
  const current = getFriends();
  if (!current.some(f => f.id === friend.id)) {
    const updated = [...current, friend];
    localStorage.setItem('dual_followed_friends', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  }
};

export const removeFriend = (friendId: string) => {
  if (typeof window === 'undefined') return;
  const current = getFriends();
  const updated = current.filter(f => f.id !== friendId);
  localStorage.setItem('dual_followed_friends', JSON.stringify(updated));
  window.dispatchEvent(new Event('storage'));
};
