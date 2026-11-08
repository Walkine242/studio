'use client';
import { TeamLogoBadge } from './team-logo-badge';
import { VERSUS_CSS } from './versus-styles';
import { resolveTeam, defaultLogo } from '@/lib/team-logo';
import { getCountryByCode } from '@/lib/countries';

export interface VersusSwimmer {
  id: string;
  name: string;
  country: string;
  /** Raw team row from Supabase, or null. */
  team?: unknown;
}

export type VersusStatus = 'waiting' | 'ready' | 'racing';

interface VersusScreenProps {
  swimmers: VersusSwimmer[];
  currentUserId?: string;
  hostId?: string;
  event: string;
  status: VersusStatus;
}

// Fixed spark positions so server and client render the same markup.
const SPARKS = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: ((i * 0.53) % 4).toFixed(2),
  duration: (3 + ((i * 7) % 5) * 0.6).toFixed(2),
  dx: `${((i * 29) % 80) - 40}px`,
}));

const STATUS_LABEL: Record<VersusStatus, string> = { waiting: 'Waiting', ready: 'Ready', racing: 'Live' };

function Flag({ code }: { code: string }) {
  const country = getCountryByCode(code);
  if (!country) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="vs-flag" src={country.flag} alt={country.name} />;
}

function Player({ swimmer, side, isYou, isHost }: { swimmer: VersusSwimmer; side: 'left' | 'right'; isYou: boolean; isHost: boolean }) {
  const team = resolveTeam(swimmer.team, swimmer.id, swimmer.name);
  return (
    <div className={`vs-player ${side}`}>
      <div className="vs-tag">{side === 'left' ? 'P1' : 'P2'}{isHost ? ' 👑' : ''}</div>
      <TeamLogoBadge className="vs-logo" logo={team.logo} abbr={team.abbr} size={132} title={`${team.name} logo`} />
      <div className="vs-name" title={swimmer.name}>{swimmer.name}</div>
      <div className="vs-team">
        <Flag code={swimmer.country} />
        <span>{team.name}</span>
        {isYou && <em className="vs-you">YOU</em>}
      </div>
    </div>
  );
}

/**
 * The Dual face-off screen: you on the blue side, your opponent on the red
 * side, team logos facing each other. With 3+ swimmers the red side lists the
 * whole field; with only you it shows an open slot waiting for a challenger.
 */
export function VersusScreen({ swimmers, currentUserId, hostId, event, status }: VersusScreenProps) {
  const me = swimmers.find((s) => s.id === currentUserId) ?? swimmers[0];
  const others = swimmers.filter((s) => s !== me);

  return (
    <div className="vs-screen" role="img" aria-label={`${event}: ${swimmers.map((s) => s.name).join(' versus ')}`}>
      <style dangerouslySetInnerHTML={{ __html: VERSUS_CSS }} />
      <div className="vs-half blue" />
      <div className="vs-half red" />
      <svg className="vs-neon" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
        <path className="b" d="M18 34 H528 L428 368 H18" />
        <path className="r" d="M982 34 H572 L472 368 H982" />
        <path className="s" d="M560 0 L440 400" />
      </svg>
      <div className="vs-sparks" aria-hidden="true">
        {SPARKS.map((s, i) => (
          <i
            key={i}
            style={{ left: `${s.left}%`, animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`, ['--dx' as any]: s.dx }}
          />
        ))}
      </div>

      <div className="vs-top">
        <div className="vs-event">{event}</div>
        <div className={`vs-status ${status === 'racing' ? 'live' : status === 'ready' ? 'ready' : ''}`}>{STATUS_LABEL[status]}</div>
      </div>

      <div className="vs-stage">
        {me ? (
          <Player swimmer={me} side="left" isYou={me.id === currentUserId} isHost={me.id === hostId} />
        ) : (
          <div />
        )}

        {others.length === 1 ? (
          <Player swimmer={others[0]} side="right" isYou={others[0].id === currentUserId} isHost={others[0].id === hostId} />
        ) : others.length > 1 ? (
          <div className="vs-player right">
            <div className="vs-tag">The Field · {others.length}</div>
            <div className="vs-field">
              {others.slice(0, 5).map((s, i) => {
                const team = resolveTeam(s.team, s.id, s.name);
                return (
                  <div className="vs-field-row" key={s.id} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                    <TeamLogoBadge logo={team.logo} abbr={team.abbr} size={38} />
                    <div>
                      <b>{s.id === hostId ? '👑 ' : ''}{s.name}</b>
                      <small>{team.name}</small>
                    </div>
                  </div>
                );
              })}
              {others.length > 5 && <div className="vs-field-more">+{others.length - 5} more</div>}
            </div>
          </div>
        ) : (
          <div className="vs-player right">
            <div className="vs-tag">P2</div>
            <TeamLogoBadge ghost className="vs-logo" logo={defaultLogo('open')} abbr="" size={132} />
            <div className="vs-waiting">Waiting for a challenger</div>
          </div>
        )}
      </div>

      <div className="vs-mark" aria-hidden="true"><span>VS</span></div>
    </div>
  );
}
