'use client';
import { useId } from 'react';
import type { LogoEmblem, LogoShape, TeamLogo } from '@/lib/team-logo';
import { cn } from '@/lib/utils';

// Original crest artwork in an esports / team-badge style, drawn on a 200×200
// canvas. Every shape is centred on (100,100), so the layered rims and the
// inner panel are the same path scaled about the centre.
const SHAPES: Record<LogoShape, (props: React.SVGProps<SVGElement>) => JSX.Element> = {
  shield: (p) => <path {...(p as any)} d="M100 6 L184 34 V92 C184 148 148 180 100 196 C52 180 16 148 16 92 V34 Z" />,
  crest: (p) => <path {...(p as any)} d="M32 10 H168 L190 36 V108 C190 158 142 186 100 196 C58 186 10 158 10 108 V36 Z" />,
  circle: (p) => <circle {...(p as any)} cx="100" cy="100" r="94" />,
  hexagon: (p) => <polygon {...(p as any)} points="100,4 186,52 186,148 100,196 14,148 14,52" />,
  badge: (p) => <rect {...(p as any)} x="8" y="8" width="184" height="184" rx="40" />,
  diamond: (p) => <polygon {...(p as any)} points="100,2 198,100 100,198 2,100" />,
};

const INK = '#070b14';

/** Mixes a #rrggbb colour towards white (amount > 0) or black (amount < 0). */
function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const a = Math.min(1, Math.abs(amount));
  const ch = (v: number) => Math.round(v + (target - v) * a).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

/** Scales about the centre of the 200×200 canvas. */
const scaleAt = (k: number) => `translate(${100 * (1 - k)} ${100 * (1 - k)}) scale(${k})`;

// Emblem outlines on a 100×100 canvas. `detail` paints inner shading lines.
function EmblemShape({ emblem, detail }: { emblem: LogoEmblem; detail?: string }) {
  switch (emblem) {
    case 'fin':
      // Attacking shark: tilted up, open jaw, angry brow.
      return (
        <g transform="rotate(-18 50 50)">
          <path d="M0 28 L19 51 C31 43 43 40 53 39 L57 10 L70 38 C82 39 93 45 102 54 L84 60 L99 67 C88 70 78 70 66 69 L58 86 L52 69 C40 69 28 67 18 62 L1 84 L10 56 Z" />
          {detail && (
            <>
              <path d="M102 54 L84 60 L99 67 Z" fill={detail} stroke="none" />
              <path d="M86 59.5 L88.5 63 L91 60.6 L93.5 64.2 L96 62" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round" />
              <circle cx="85" cy="50" r="3" fill={detail} stroke="none" />
              <circle cx="85.8" cy="49.2" r="0.9" fill="#fff" stroke="none" />
              <path d="M79 44.5 L91 49" fill="none" stroke={detail} strokeWidth={3.2} strokeLinecap="round" />
              <path d="M71 47 V61 M65 47 V62 M59 47 V62" fill="none" stroke={detail} strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />
            </>
          )}
        </g>
      );
    case 'wave':
      return (
        <>
          <path d="M4 60 C12 26 44 6 72 14 C88 19 98 33 98 48 C90 38 77 33 66 38 C54 43 52 58 62 65 C45 72 28 61 33 46 C22 50 12 55 4 60 Z" />
          <path d="M2 78 C17 67 32 67 46 77 C60 87 75 87 98 72 V89 C75 101 60 101 46 91 C32 81 17 83 2 94 Z" />
        </>
      );
    case 'bolt':
      return (
        <>
          <path d="M62 0 L14 60 H44 L30 100 L88 34 H56 L72 0 Z" />
          {detail && <path d="M62 6 L24 54 H40" fill="none" stroke={detail} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />}
        </>
      );
    case 'flame':
      return (
        <>
          <path d="M50 0 C58 26 86 38 86 67 C86 87 70 100 50 100 C30 100 14 87 14 67 C14 50 25 39 32 27 C35 42 42 50 48 52 C42 35 41 17 50 0 Z" />
          {detail && <path d="M50 46 C56 60 69 66 69 79 C69 91 61 97 50 97 C39 97 31 91 31 80 C31 70 37 64 42 58 C44 66 47 70 50 71 C47 62 46 54 50 46 Z" fill={detail} stroke="none" opacity={0.85} />}
        </>
      );
    case 'trident':
      return (
        <path d="M50 0 L61 18 H55 V54 H64 C72 54 78 49 78 40 V22 H73 L83 3 L93 22 H88 V42 C88 57 77 65 64 65 H55 V100 H45 V65 H36 C23 65 12 57 12 42 V22 H7 L17 3 L27 22 H22 V40 C22 49 28 54 36 54 H45 V18 H39 Z" />
      );
    case 'anchor':
      return (
        <>
          <path d="M50 1 A12 12 0 1 1 49.9 1 Z M50 9 A4 4 0 1 0 50.1 9 Z" fillRule="evenodd" />
          <path d="M44 24 H56 V34 H71 V44 H56 V86 C69 84 79 76 83 64 L75 60 L96 49 L98 74 L90 69 C83 87 68 98 50 98 C32 98 17 87 10 69 L2 74 L4 49 L25 60 L17 64 C21 76 31 84 44 86 V44 H29 V34 H44 Z" />
        </>
      );
    case 'star':
      return (
        <>
          <polygon points="50,0 63,36 100,36 70,58 81,96 50,73 19,96 30,58 0,36 37,36" />
          {detail && <polygon points="50,14 59,40 50,62 41,40" fill={detail} stroke="none" opacity={0.6} />}
        </>
      );
    case 'crown':
      return (
        <>
          <path d="M6 78 L0 20 L29 45 L50 4 L71 45 L100 20 L94 78 Z" />
          <rect x="6" y="84" width="88" height="14" rx="3" />
          {detail && <circle cx="50" cy="56" r="7" fill={detail} stroke="none" opacity={0.8} />}
        </>
      );
    case 'drop':
      return (
        <>
          <path d="M50 0 C65 27 88 48 88 70 C88 89 71 100 50 100 C29 100 12 89 12 70 C12 48 35 27 50 0 Z" />
          {detail && <path d="M32 66 C32 77 39 86 50 88" fill="none" stroke={detail} strokeWidth={6} strokeLinecap="round" opacity={0.55} />}
        </>
      );
    default:
      return null;
  }
}

interface TeamLogoBadgeProps {
  logo: TeamLogo;
  abbr: string;
  className?: string;
  /** Pixel size (square). Defaults to 96. */
  size?: number;
  /** Grey, faded silhouette for an open slot. */
  ghost?: boolean;
  title?: string;
}

/** Renders a team crest: metallic rim, accent line, panel, emblem and a ribbon with the team tag. */
export function TeamLogoBadge({ logo, abbr, className, size = 96, ghost, title }: TeamLogoBadgeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const Shape = SHAPES[logo.shape] ?? SHAPES.shield;
  const lettersOnly = logo.emblem === 'letters';
  const tag = (abbr || '').toUpperCase().slice(0, 4);

  const primary = ghost ? '#3f4b5e' : logo.primary;
  const secondary = ghost ? '#8a96a8' : logo.secondary;
  const accent = ghost ? '#5b6678' : logo.accent;
  const showRibbon = !ghost && !lettersOnly && !!tag;

  const id = (k: string) => `${k}${uid}`;
  const url = (k: string) => `url(#${id(k)})`;

  // Emblem box (100×100 → canvas); sits higher when there is a ribbon below it.
  const emblemBox = showRibbon ? 'translate(40 10) scale(1.2)' : 'translate(40 36) scale(1.2)';
  const letterSize = tag.length <= 2 ? 92 : tag.length === 3 ? 70 : 54;
  const ribbonText = tag.length <= 3 ? 38 : 31;

  return (
    <svg
      viewBox="-14 -6 228 214"
      width={size}
      height={size}
      className={cn('shrink-0', ghost ? 'opacity-40' : 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)]', className)}
      role="img"
      aria-label={title ?? `${tag} team logo`}
    >
      <defs>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={tint(secondary, 0.55)} />
          <stop offset="0.45" stopColor={secondary} />
          <stop offset="0.55" stopColor={tint(secondary, -0.18)} />
          <stop offset="1" stopColor={tint(secondary, 0.25)} />
        </linearGradient>
        <radialGradient id={id('panel')} cx="0.5" cy="0.36" r="0.75">
          <stop offset="0" stopColor={tint(primary, 0.28)} />
          <stop offset="0.55" stopColor={primary} />
          <stop offset="1" stopColor={tint(primary, -0.45)} />
        </radialGradient>
        <linearGradient id={id('emb')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tint(accent, 0.45)} />
          <stop offset="0.5" stopColor={accent} />
          <stop offset="1" stopColor={tint(accent, -0.3)} />
        </linearGradient>
        <linearGradient id={id('rib')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tint(primary, -0.25)} />
          <stop offset="1" stopColor={tint(primary, -0.65)} />
        </linearGradient>
        <linearGradient id={id('gloss')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.32} />
          <stop offset="0.45" stopColor="#fff" stopOpacity={0.05} />
          <stop offset="0.46" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id={id('clip')}>
          <Shape transform={scaleAt(0.8)} />
        </clipPath>
      </defs>

      {/* Layered rims: ink outline, metallic rim, ink line, accent line, panel */}
      <Shape fill={INK} transform={scaleAt(1.05)} />
      <Shape fill={url('rim')} />
      <Shape fill={INK} transform={scaleAt(0.87)} />
      <Shape fill={ghost ? '#4b5563' : accent} transform={scaleAt(0.845)} />
      <Shape fill={INK} transform={scaleAt(0.825)} />
      <Shape fill={url('panel')} transform={scaleAt(0.8)} />

      {/* Panel texture: speed stripes, lower shadow, gloss */}
      <g clipPath={url('clip')}>
        {!ghost && (
          <>
            <g fill="#fff" opacity={0.07}>
              <polygon points="-20,150 30,-10 44,-10 -6,150" />
              <polygon points="10,190 80,-10 92,-10 22,190" />
              <polygon points="150,210 220,10 232,10 162,210" />
            </g>
            <path d="M0 160 L200 96 V210 H0 Z" fill="#000" opacity={0.22} />
            <rect x="0" y="0" width="200" height="200" fill={url('gloss')} />
          </>
        )}
      </g>

      {ghost ? (
        <text x="100" y="132" textAnchor="middle" fontSize="96" fontWeight="900" fill={secondary} fontFamily="system-ui, sans-serif">?</text>
      ) : lettersOnly ? (
        <g fontFamily="'Arial Black', Impact, system-ui, sans-serif" fontStyle="italic" fontWeight="900" textAnchor="middle" letterSpacing="-3">
          <text x="104" y={104 + letterSize * 0.37} fontSize={letterSize} fill={INK} opacity={0.6}>{tag}</text>
          <text x="100" y={100 + letterSize * 0.37} fontSize={letterSize} fill={url('emb')} stroke={INK} strokeWidth="6" paintOrder="stroke" strokeLinejoin="round">{tag}</text>
        </g>
      ) : (
        <>
          {/* Drop shadow, then the emblem with a thick ink outline and gradient fill */}
          <g transform={`translate(5 6) ${emblemBox}`} fill={INK} opacity={0.5}>
            <EmblemShape emblem={logo.emblem} />
          </g>
          <g transform={emblemBox} fill={url('emb')} stroke={INK} strokeWidth={7} strokeLinejoin="round" paintOrder="stroke">
            <EmblemShape emblem={logo.emblem} detail={tint(accent, -0.45)} />
          </g>
        </>
      )}

      {showRibbon && (
        <g>
          {/* Folded tails behind the band */}
          <polygon points="-12,142 24,142 24,184 -12,184 0,163" fill={tint(primary, -0.7)} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <polygon points="212,142 176,142 176,184 212,184 200,163" fill={tint(primary, -0.7)} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          {/* Band */}
          <polygon points="0,130 200,130 191,176 9,176" fill={url('rib')} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <polygon points="5,133 195,133 193,142 7,142" fill="#fff" opacity={0.12} />
          <line x1="8" y1="136" x2="192" y2="136" stroke={accent} strokeWidth="3" opacity={0.95} />
          <line x1="12" y1="170" x2="188" y2="170" stroke={accent} strokeWidth="3" opacity={0.95} />
          <text
            x="100"
            y={153 + ribbonText * 0.36}
            textAnchor="middle"
            fontSize={ribbonText}
            fontWeight="900"
            fontStyle="italic"
            fontFamily="'Arial Black', Impact, system-ui, sans-serif"
            letterSpacing="2"
            fill={tint(secondary, 0.35)}
            stroke={INK}
            strokeWidth="4"
            paintOrder="stroke"
          >
            {tag}
          </text>
        </g>
      )}
    </svg>
  );
}
