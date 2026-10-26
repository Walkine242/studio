export interface RegisteredUser {
  id: string;
  name: string;
  country: string;
  email?: string;
  avatar?: string;
}

const REGISTERED_USERS_KEY = 'dual_registered_users';

export function getRegisteredUsers(): RegisteredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerUser(user: RegisteredUser): void {
  if (typeof window === 'undefined') return;
  const current = getRegisteredUsers();
  const existingIdx = current.findIndex(
    (u) => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
  );

  if (existingIdx >= 0) {
    current[existingIdx] = { ...current[existingIdx], ...user };
  } else {
    current.push(user);
  }

  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event('storage'));
}
