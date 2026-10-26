'use client';
import { SwimmerAvatar, AvatarStyles } from './swimmer-avatar';
import { defaultLook, resolveLook } from '@/lib/avatar';
import { getCountryByCode } from '@/lib/countries';

export interface LobbySwimmer {
  id: string;
  name: string;
  country: string;
  avatar?: unknown;
}

interface LobbyPoolSceneProps {
  swimmers: LobbySwimmer[];
  currentUserId?: string;
  hostId?: string;
  title: string;
  subtitle?: string;
  /** Show "Waiting for swimmers..." with open lanes. */
  waiting?: boolean;
  /** Lanes to draw; extra lanes appear empty. */
  lanes?: number;
}

/** The pool deck: each swimmer on a starting block in their own lane. */
export function LobbyPoolScene({ swimmers, currentUserId, hostId, title, subtitle, waiting = true, lanes }: LobbyPoolSceneProps) {
  const laneCount = Math.min(8, Math.max(lanes ?? 0, swimmers.length + (waiting ? 1 : 0), 2));
  const ropes = Array.from({ length: laneCount + 1 }, (_, i) => (i / laneCount) * 100);

  return (
    <div className="pool-scene">
      <AvatarStyles />
      <div className="pool-water">
        {ropes.map((left, i) => (
          <div key={i} className="pool-rope" style={{ left: `${left}%` }} />
        ))}
        <div className="pool-caustics" />
      </div>
      <div className="pool-edge" />
      <div className="pool-tiles" />

      <div className="pool-banner">
        <h2 className={waiting && /^waiting/i.test(title) ? 'pool-dots' : undefined}>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="pool-lanes">
        {Array.from({ length: laneCount }, (_, i) => {
          const swimmer = swimmers[i];
          if (!swimmer) {
            return (
              <div className="pool-lane" key={`empty-${i}`}>
                <SwimmerAvatar ghost look={defaultLook(`lane-${i}`)} name="" />
                <div className="pool-block empty"><div className="top" /><div className="front">{i + 1}</div></div>
                <div className="pool-name wait">Open lane</div>
              </div>
            );
          }
          const country = getCountryByCode(swimmer.country);
          const isMe = swimmer.id === currentUserId;
          return (
            <div className="pool-lane" key={swimmer.id}>
              <SwimmerAvatar look={resolveLook(swimmer.avatar, swimmer.id)} name={swimmer.name} capText={swimmer.country || undefined} />
              <div className="pool-block"><div className="top" /><div className="front">{i + 1}</div></div>
              <div className={`pool-name ${isMe ? 'me' : ''}`}>
                {swimmer.id === hostId ? '👑 ' : ''}{swimmer.name}{isMe ? ' (You)' : ''}
              </div>
              {country && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="pool-flag" src={country.flag} alt={country.name} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
