// Team logos. Every swimmer designs a team (name, short tag and a logo made of
// a crest shape, an emblem and three colours). Saved in the `teams` table; a
// swimmer who hasn't designed one yet gets a consistent default from their id.

export const LOGO_SHAPES = ['shield', 'crest', 'circle', 'hexagon', 'badge', 'diamond'] as const;
export const LOGO_EMBLEMS = ['fin', 'wave', 'bolt', 'flame', 'trident', 'anchor', 'star', 'crown', 'drop', 'letters'] as const;

export type LogoShape = (typeof LOGO_SHAPES)[number];
export type LogoEmblem = (typeof LOGO_EMBLEMS)[number];

export interface TeamLogo {
  shape: LogoShape;
  emblem: LogoEmblem;
  /** Main fill of the crest. */
  primary: string;
  /** Rim and lettering. */
  secondary: string;
  /** Emblem colour. */
  accent: string;
}

export interface Team {
  id?: string;
  name: string;
  abbr: string;
  logo: TeamLogo;
  /** False when this is a generated default rather than a saved team. */
  saved: boolean;
}

export const EMBLEM_LABELS: Record<LogoEmblem, string> = {
  fin: 'Shark', wave: 'Wave', bolt: 'Bolt', flame: 'Flame', trident: 'Trident',
  anchor: 'Anchor', star: 'Star', crown: 'Crown', drop: 'Drop', letters: 'Letters Only',
};

export const SHAPE_LABELS: Record<LogoShape, string> = {
  shield: 'Shield', crest: 'Crest', circle: 'Circle', hexagon: 'Hexagon', badge: 'Badge', diamond: 'Diamond',
};

export const PRIMARY_COLORS = ['#0b1f4d', '#1d4ed8', '#0e7490', '#047857', '#7f1d1d', '#b91c1c', '#6d28d9', '#c2410c', '#111827', '#334155'];
export const SECONDARY_COLORS = ['#f8fafc', '#facc15', '#e5e7eb', '#0f172a', '#fb923c', '#67e8f9', '#fda4af', '#a3e635'];
export const ACCENT_COLORS = ['#f8fafc', '#facc15', '#f97316', '#ef4444', '#22d3ee', '#3b82f6', '#a855f7', '#22c55e', '#0f172a'];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Up to 3 letters from a name: "Jordan Smith" -> "JS", "Dolphins" -> "DOL". */
export function makeAbbr(name: string): string {
  const words = (name || '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'SWM';
  if (words.length === 1) return words[0].slice(0, 3);
  return words.slice(0, 3).map((w) => w[0]).join('');
}

export function defaultLogo(seed: string): TeamLogo {
  const h = hash(seed || 'swimmer');
  const emblems = LOGO_EMBLEMS.filter((e) => e !== 'letters');
  return {
    shape: LOGO_SHAPES[h % LOGO_SHAPES.length],
    emblem: emblems[(h >> 3) % emblems.length],
    primary: PRIMARY_COLORS[(h >> 7) % PRIMARY_COLORS.length],
    secondary: SECONDARY_COLORS[(h >> 11) % 3], // white, gold or silver rims read best
    accent: ACCENT_COLORS[(h >> 14) % 8],
  };
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Merges a saved (possibly partial or invalid) logo over the default for this seed. */
export function resolveLogo(saved: unknown, seed: string): TeamLogo {
  const base = defaultLogo(seed);
  if (!saved || typeof saved !== 'object') return base;
  const s = saved as Record<string, unknown>;
  const color = (k: 'primary' | 'secondary' | 'accent') =>
    typeof s[k] === 'string' && HEX.test(s[k] as string) ? (s[k] as string) : base[k];
  return {
    shape: LOGO_SHAPES.includes(s.shape as LogoShape) ? (s.shape as LogoShape) : base.shape,
    emblem: LOGO_EMBLEMS.includes(s.emblem as LogoEmblem) ? (s.emblem as LogoEmblem) : base.emblem,
    primary: color('primary'),
    secondary: color('secondary'),
    accent: color('accent'),
  };
}

/**
 * The team a swimmer is shown with. `raw` is the row from the `teams` table
 * (or null); swimmers without one get "<Name> Swim" with a default logo.
 */
export function resolveTeam(raw: unknown, swimmerId: string, swimmerName: string): Team {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  if (r && typeof r.name === 'string' && typeof r.abbr === 'string') {
    return {
      id: typeof r.id === 'string' ? r.id : undefined,
      name: r.name,
      abbr: r.abbr.toUpperCase().slice(0, 4),
      logo: resolveLogo(r.logo, typeof r.id === 'string' ? r.id : swimmerId),
      saved: true,
    };
  }
  const first = (swimmerName || 'Swimmer').trim().split(/\s+/)[0];
  return { name: `${first} Swim`, abbr: makeAbbr(swimmerName), logo: defaultLogo(swimmerId), saved: false };
}
