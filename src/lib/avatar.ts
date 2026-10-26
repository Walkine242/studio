// Swimmer avatar appearance. Saved per profile (profiles.avatar); anyone
// without a saved look gets a consistent default picked from their user id.

export interface AvatarLook {
  skin: string;
  cap: string;
  suit: string;
  stripe: string;
  lens: string;
}

export const SKIN_TONES = ['#f6d7c3', '#eac09f', '#d39b72', '#b47a52', '#8d5a3b', '#5e3a24'];
export const CAP_COLORS = ['#e11d48', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#2563eb', '#7c3aed', '#111827', '#f8fafc'];
export const SUIT_COLORS = ['#0f172a', '#1e3a8a', '#0e7490', '#166534', '#7f1d1d', '#6b21a8', '#ea580c', '#334155'];
export const STRIPE_COLORS = ['#f97316', '#facc15', '#22d3ee', '#f8fafc', '#e11d48', '#a3e635'];
export const LENS_COLORS = ['#38bdf8', '#a855f7', '#f59e0b', '#10b981', '#111827', '#ec4899'];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function defaultLook(seed: string): AvatarLook {
  const h = hash(seed || 'swimmer');
  return {
    skin: SKIN_TONES[h % SKIN_TONES.length],
    cap: CAP_COLORS[(h >> 3) % CAP_COLORS.length],
    suit: SUIT_COLORS[(h >> 6) % SUIT_COLORS.length],
    stripe: STRIPE_COLORS[(h >> 9) % STRIPE_COLORS.length],
    lens: LENS_COLORS[(h >> 12) % LENS_COLORS.length],
  };
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Merges a saved (possibly partial or invalid) look over the default for this swimmer. */
export function resolveLook(saved: unknown, seed: string): AvatarLook {
  const base = defaultLook(seed);
  if (!saved || typeof saved !== 'object') return base;
  const s = saved as Record<string, unknown>;
  const pick = (k: keyof AvatarLook) => (typeof s[k] === 'string' && HEX.test(s[k] as string) ? (s[k] as string) : base[k]);
  return { skin: pick('skin'), cap: pick('cap'), suit: pick('suit'), stripe: pick('stripe'), lens: pick('lens') };
}

export function initials(name: string): string {
  const parts = (name || 'S').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'S') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
