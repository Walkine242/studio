'use client';
import { useId } from 'react';
import type { LogoEmblem, LogoShape, TeamLogo } from '@/lib/team-logo';
import { cn } from '@/lib/utils';

// Original crest artwork, drawn on a 200×200 canvas. Every shape is centred on
// (100,100) so the inner panel is the same path scaled down.
const SHAPES: Record<LogoShape, (props: React.SVGProps<SVGElement>) => JSX.Element> = {
  shield: (p) => <path {...(p as any)} d="M100 6 L184 34 V92 C184 148 148 180 100 196 C52 180 16 148 16 92 V34 Z" />,
  crest: (p) => <path {...(p as any)} d="M32 10 H168 L190 36 V108 C190 158 142 186 100 196 C58 186 10 158 10 108 V36 Z" />,
  circle: (p) => <circle {...(p as any)} cx="100" cy="100" r="94" />,
  hexagon: (p) => <polygon {...(p as any)} points="100,4 186,52 186,148 100,196 14,148 14,52" />,
  badge: (p) => <rect {...(p as any)} x="8" y="8" width="184" height="184" rx="40" />,
  diamond: (p) => <polygon {...(p as any)} points="100,2 198,100 100,198 2,100" />,
};

// Emblems on a 100×100 canvas.
function Emblem({ emblem, accent, shade }: { emblem: LogoEmblem; accent: string; shade: string }) {
  const common = { fill: accent, stroke: shade, strokeWidth: 3, strokeLinejoin: 'round' as const, paintOrder: 'stroke' as const };
  switch (emblem) {
    case 'fin':
      return (
        <g {...common}>
          <path d="M10 74 C28 60 42 34 62 4 C58 30 66 54 90 74 Z" />
          <path d="M2 80 C14 71 26 71 38 79 C50 87 62 87 74 79 C84 72 92 73 98 77 V90 C88 85 78 89 68 94 C56 99 44 96 34 90 C22 83 12 85 2 92 Z" />
        </g>
      );
    case 'wave':
      return (
        <g {...common}>
          <path d="M6 58 C14 26 44 8 70 16 C86 21 96 34 96 48 C88 38 76 34 66 38 C54 43 52 58 62 64 C46 70 30 60 34 46 C24 50 14 54 6 58 Z" />
          <path d="M4 76 C18 66 32 66 46 76 C60 86 74 86 96 72 V88 C74 100 60 100 46 90 C32 80 18 82 4 92 Z" />
        </g>
      );
    case 'bolt':
      return <path {...common} d="M60 2 L16 58 H44 L32 98 L84 36 H54 L68 2 Z" />;
    case 'flame':
      return (
        <g {...common}>
          <path d="M50 2 C58 26 84 38 84 66 C84 86 69 98 50 98 C31 98 16 86 16 66 C16 50 26 40 33 28 C36 42 42 50 48 52 C43 36 42 18 50 2 Z" />
          <path d="M50 46 C56 60 68 66 68 78 C68 90 60 96 50 96 C40 96 32 90 32 79 C32 70 38 64 42 58 C44 66 47 70 50 71 C47 62 46 54 50 46 Z" fill={shade} fillOpacity={0.35} stroke="none" />
        </g>
      );
    case 'trident':
      return (
        <path
          {...common}
          d="M50 0 L60 18 H55 V54 H64 C72 54 78 49 78 40 V22 H73 L82 4 L91 22 H87 V42 C87 56 77 64 64 64 H55 V98 H45 V64 H36 C23 64 13 56 13 42 V22 H9 L18 4 L27 22 H22 V40 C22 49 28 54 36 54 H45 V18 H40 Z"
        />
      );
    case 'anchor':
      return (
        <g {...common}>
          <path d="M50 2 A11 11 0 1 1 49.9 2 Z M50 9 A4 4 0 1 0 50.1 9 Z" fillRule="evenodd" />
          <path d="M45 24 H55 V34 H70 V43 H55 V86 C68 84 78 76 82 64 L74 60 L94 50 L96 74 L89 69 C82 86 67 96 50 96 C33 96 18 86 11 69 L4 74 L6 50 L26 60 L18 64 C22 76 32 84 45 86 V43 H30 V34 H45 Z" />
        </g>
      );
    case 'star':
      return <polygon {...common} points="50,3 62,37 98,37 69,58 80,94 50,73 20,94 31,58 2,37 38,37" />;
    case 'crown':
      return (
        <g {...common}>
          <path d="M8 78 L3 22 L30 46 L50 8 L70 46 L97 22 L92 78 Z" />
          <rect x="8" y="84" width="84" height="12" rx="3" />
        </g>
      );
    case 'drop':
      return (
        <g {...common}>
          <path d="M50 2 C64 28 86 48 86 70 C86 88 70 98 50 98 C30 98 14 88 14 70 C14 48 36 28 50 2 Z" />
          <path d="M34 66 C34 76 40 84 50 86" fill="none" stroke={shade} strokeOpacity={0.45} strokeWidth={5} strokeLinecap="round" />
        </g>
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

/** Renders a team crest: rim, panel, emblem and team tag. */
export function TeamLogoBadge({ logo, abbr, className, size = 96, ghost, title }: TeamLogoBadgeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const Shape = SHAPES[logo.shape] ?? SHAPES.shield;
  const lettersOnly = logo.emblem === 'letters';
  const tag = (abbr || '').toUpperCase().slice(0, 4);
  const diamond = logo.shape === 'diamond';
  const tagSize = lettersOnly
    ? (tag.length <= 2 ? 88 : tag.length === 3 ? 66 : 52) * (diamond ? 0.82 : 1)
    : (tag.length <= 3 ? 38 : 31) * (diamond ? 0.8 : 1);
  // Emblem box and tag line; the diamond narrows towards the bottom so it sits tighter.
  const emblemTransform = diamond ? 'translate(62 34) scale(0.76)' : 'translate(55 28) scale(0.9)';
  const tagY = diamond ? 148 : 160;
  const shade = '#0b1220';
  const primary = ghost ? '#475569' : logo.primary;
  const secondary = ghost ? '#94a3b8' : logo.secondary;
  const accent = ghost ? '#64748b' : logo.accent;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={cn('shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]', ghost && 'opacity-40', className)}
      role="img"
      aria-label={title ?? `${tag} team logo`}
    >
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.28} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.04} />
          <stop offset="1" stopColor="#000" stopOpacity={0.25} />
        </linearGradient>
        <clipPath id={`c${uid}`}>
          <Shape transform="translate(16 16) scale(0.84)" />
        </clipPath>
      </defs>

      {/* Rim */}
      <Shape fill={shade} transform="translate(-4 -4) scale(1.04)" />
      <Shape fill={secondary} />
      {/* Panel */}
      <Shape fill={primary} transform="translate(16 16) scale(0.84)" />
      <g clipPath={`url(#c${uid})`}>
        {!ghost && (
          <>
            <path d="M0 150 L200 90 V200 H0 Z" fill="#000" opacity={0.18} />
            <rect width="200" height="200" fill={`url(#g${uid})`} />
          </>
        )}
      </g>

      {ghost ? (
        <text x="100" y="128" textAnchor="middle" fontSize="92" fontWeight="900" fill={secondary} fontFamily="system-ui, sans-serif">?</text>
      ) : lettersOnly ? (
        <text
          x="100"
          y={100 + tagSize * 0.36}
          textAnchor="middle"
          fontSize={tagSize}
          fontWeight="900"
          fontStyle="italic"
          fontFamily="'Arial Black', Impact, system-ui, sans-serif"
          fill={accent}
          stroke={shade}
          strokeWidth="5"
          paintOrder="stroke"
          letterSpacing="-2"
        >
          {tag}
        </text>
      ) : (
        <>
          <g transform={emblemTransform}>
            <Emblem emblem={logo.emblem} accent={accent} shade={shade} />
          </g>
          {tag && (
            <text
              x="100"
              y={tagY}
              textAnchor="middle"
              fontSize={tagSize}
              fontWeight="900"
              fontStyle="italic"
              fontFamily="'Arial Black', Impact, system-ui, sans-serif"
              fill={secondary}
              stroke={shade}
              strokeWidth="5"
              paintOrder="stroke"
              letterSpacing="1"
            >
              {tag}
            </text>
          )}
        </>
      )}
    </svg>
  );
}
