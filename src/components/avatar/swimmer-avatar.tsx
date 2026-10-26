'use client';
import type { CSSProperties } from 'react';
import { AVATAR_CSS } from './avatar-styles';
import { initials, type AvatarLook } from '@/lib/avatar';

const HEAD_DISCS = [0, 20, 40, 60, 80, 100, 120, 140, 160];
const NECK_DISCS = [0, 45, 90, 135];
const TORSO_SLABS = [0, 20, 40, 60, 80, 100, 120, 140, 160];

/** Injects the avatar CSS once per page. Render it anywhere avatars appear. */
export function AvatarStyles() {
  return <style dangerouslySetInnerHTML={{ __html: AVATAR_CSS }} />;
}

interface SwimmerAvatarProps {
  look: AvatarLook;
  name: string;
  /** Shown on the back of the cap, e.g. "USA". */
  capText?: string;
  /** No idle animation (e.g. in a small preview). */
  still?: boolean;
  /** Faded, pulsing placeholder for an empty lane. */
  ghost?: boolean;
  className?: string;
}

export function SwimmerAvatar({ look, name, capText, still, ghost, className }: SwimmerAvatarProps) {
  const vars = {
    '--skin': look.skin,
    '--cap': look.cap,
    '--suit': look.suit,
    '--stripe': look.stripe,
    '--lens': look.lens,
  } as CSSProperties;

  return (
    <div className={`sw-stage ${ghost ? 'sw-ghost' : ''} ${className ?? ''}`} style={vars} role="img" aria-label={ghost ? 'Open lane' : `${name}'s swimmer avatar`}>
      <div className={`sw-rig ${still ? 'sw-still' : ''}`}>
        <div className="sw-shadow" />

        <div className="sw-arm l"><i /><i /></div>
        <div className="sw-arm r"><i /><i /></div>

        <div className="sw-torso">
          {TORSO_SLABS.map((deg) => (
            <div
              key={deg}
              className="sw-slab"
              style={{ transform: `rotateY(${deg}deg)`, filter: `brightness(${0.82 + 0.18 * Math.abs(Math.cos((deg * Math.PI) / 180))})` }}
            />
          ))}
          {!ghost && <div className="sw-chest"><span>{initials(name)}</span></div>}
        </div>

        <div className="sw-neck">
          {NECK_DISCS.map((deg) => <i key={deg} style={{ transform: `rotateY(${deg}deg)` }} />)}
        </div>

        <div className="sw-head">
          {HEAD_DISCS.map((deg) => (
            <div
              key={deg}
              className="sw-disc"
              style={{ transform: `rotateY(${deg}deg)`, filter: `brightness(${0.84 + 0.16 * Math.abs(Math.cos((deg * Math.PI) / 180))})` }}
            />
          ))}
          <div className="sw-strap" />
          {!ghost && (
            <>
              <div className="sw-face">
                <div className="sw-goggles">
                  <div className="sw-lens" />
                  <div className="sw-bridge" />
                  <div className="sw-lens" />
                </div>
                <div className="sw-smile" />
              </div>
              <div className="sw-back">
                <span className="sw-cap-text">{capText ?? initials(name)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
