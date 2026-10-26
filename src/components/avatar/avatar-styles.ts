// CSS for the 3D swimmer avatar and the lobby pool scene. Pure CSS 3D
// transforms (no WebGL), so it is light on phones and needs no extra packages.
// Kept as a string so it can be injected once with a <style> tag.

export const AVATAR_CSS = String.raw`
.sw-stage { position: relative; width: 120px; height: 180px; perspective: 520px; perspective-origin: 50% 35%; }
.sw-rig { position: absolute; inset: 0; transform-style: preserve-3d; animation: sw-sway 7s ease-in-out infinite; }
.sw-rig.sw-still { animation: none; transform: rotateY(-18deg); }
.sw-rig * { transform-style: preserve-3d; }
@keyframes sw-sway {
  0%, 100% { transform: translateY(0) rotateY(-32deg); }
  50% { transform: translateY(-4px) rotateY(32deg); }
}

/* Head: a sphere built from discs rotated around the vertical axis */
.sw-head { position: absolute; left: 28px; top: 0; width: 64px; height: 64px; }
.sw-disc { position: absolute; inset: 0; border-radius: 50%;
  background: radial-gradient(circle at 38% 22%, rgba(255,255,255,.35), transparent 38%),
              linear-gradient(180deg, var(--cap) 0 50%, var(--skin) 50% 100%); }
.sw-face { position: absolute; inset: 0; transform: translateZ(31.5px); backface-visibility: hidden; }
.sw-goggles { position: absolute; left: 9px; right: 9px; top: 29px; height: 14px; display: flex; justify-content: space-between; align-items: center; }
.sw-lens { width: 19px; height: 13px; border-radius: 50% 50% 45% 45%; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.85) 0 12%, var(--lens) 14% 100%);
  border: 2px solid #0b1220; box-shadow: 0 0 6px var(--lens); }
.sw-bridge { position: absolute; left: 50%; top: 50%; width: 8px; height: 3px; margin: -1.5px 0 0 -4px; background: #0b1220; border-radius: 2px; }
.sw-smile { position: absolute; left: 50%; top: 49px; width: 16px; height: 7px; margin-left: -8px; border-bottom: 2.5px solid rgba(60,20,10,.55); border-radius: 0 0 10px 10px; }
.sw-strap { position: absolute; left: -1px; top: 3px; width: 66px; height: 66px; border-radius: 50%; border: 3px solid #0b1220; transform: rotateX(90deg); }
.sw-back { position: absolute; inset: 0; transform: rotateY(180deg) translateZ(31.5px); backface-visibility: hidden; display: flex; justify-content: center; }
.sw-cap-text { margin-top: 12px; font: 800 12px/1 system-ui, sans-serif; letter-spacing: .08em; color: rgba(255,255,255,.92); text-shadow: 0 1px 2px rgba(0,0,0,.4); }

/* Neck */
.sw-neck { position: absolute; left: 47px; top: 56px; width: 26px; height: 22px; }
.sw-neck i { position: absolute; inset: 0; border-radius: 9px; background: var(--skin); filter: brightness(.9); }

/* Torso: rounded planes around the vertical axis, squashed front-to-back */
.sw-torso { position: absolute; left: 18px; top: 70px; width: 84px; height: 82px; transform: scale3d(1, 1, .55); }
.sw-slab { position: absolute; inset: 0; border-radius: 40px 40px 20px 20px;
  background: linear-gradient(90deg, transparent 43%, var(--stripe) 43% 57%, transparent 57%),
              linear-gradient(180deg, var(--skin) 0 14%, var(--suit) 14% 100%); }
.sw-chest { position: absolute; inset: 0; transform: translateZ(42.5px); backface-visibility: hidden; display: flex; align-items: center; justify-content: center; padding-top: 26px; }
.sw-chest span { font: 800 15px/1 system-ui, sans-serif; color: #fff; padding: 3px 6px; border-radius: 6px; background: rgba(0,0,0,.28); letter-spacing: .05em; }

/* Arms swing a little, like a swimmer shaking out before the race */
.sw-arm { position: absolute; top: 80px; width: 18px; height: 66px; transform-origin: 50% 6px; }
.sw-arm.l { left: 8px; animation: sw-arm-l 2.6s ease-in-out infinite; }
.sw-arm.r { left: 94px; animation: sw-arm-r 2.6s ease-in-out infinite; }
.sw-arm i { position: absolute; inset: 0; border-radius: 9px; background: linear-gradient(180deg, var(--skin), var(--skin)); }
.sw-arm i + i { transform: rotateY(90deg); filter: brightness(.86); }
@keyframes sw-arm-l { 0%,100% { transform: rotateZ(6deg); } 50% { transform: rotateZ(14deg) rotateX(12deg); } }
@keyframes sw-arm-r { 0%,100% { transform: rotateZ(-6deg); } 50% { transform: rotateZ(-14deg) rotateX(-12deg); } }

.sw-shadow { position: absolute; left: 22px; top: 156px; width: 76px; height: 18px; border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,.45), transparent); transform: rotateX(80deg); }

/* Ghost avatar for an empty lane */
.sw-ghost { filter: grayscale(1) brightness(1.6); opacity: .22; animation: sw-pulse 2.4s ease-in-out infinite; }
@keyframes sw-pulse { 0%,100% { opacity: .14; } 50% { opacity: .32; } }

/* ---------- Pool scene ---------- */
.pool-scene { position: relative; overflow: hidden; border-radius: 18px; min-height: 330px;
  background: linear-gradient(180deg, #072b4a 0%, #0b4f86 60%, #0f6fb3 100%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.08), 0 20px 60px rgba(2,12,27,.45); }
.pool-water { position: absolute; left: -30%; right: -30%; top: -10%; bottom: 92px; transform-origin: 50% 100%; transform: perspective(700px) rotateX(58deg);
  background:
    repeating-linear-gradient(90deg, transparent 0 calc(12.5% - 3px), rgba(255,255,255,.0) calc(12.5% - 3px)),
    radial-gradient(60% 40% at 30% 30%, rgba(255,255,255,.10), transparent 60%),
    radial-gradient(50% 35% at 70% 60%, rgba(255,255,255,.08), transparent 60%);
  animation: pool-shimmer 9s linear infinite; }
.pool-rope { position: absolute; top: 0; bottom: 0; width: 6px; margin-left: -3px;
  background: repeating-linear-gradient(180deg, #e11d48 0 14px, #f8fafc 14px 28px, #2563eb 28px 42px, #f8fafc 42px 56px);
  border-radius: 3px; opacity: .9; }
.pool-caustics { position: absolute; inset: 0; opacity: .35; mix-blend-mode: screen;
  background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,.35) 0 2px, transparent 3px), radial-gradient(circle at 70% 70%, rgba(255,255,255,.3) 0 2px, transparent 3px);
  background-size: 60px 60px, 90px 90px; animation: pool-caustics 12s linear infinite; }
@keyframes pool-shimmer { 0% { background-position: 0 0, 0 0, 0 0; } 100% { background-position: 0 0, 220px 160px, -180px 120px; } }
@keyframes pool-caustics { 0% { background-position: 0 0, 0 0; } 100% { background-position: 120px 240px, -180px 270px; } }
.pool-edge { position: absolute; z-index: 1; left: 0; right: 0; bottom: 88px; height: 10px; background: linear-gradient(180deg, #e9eef3, #9aa8b6); box-shadow: 0 -2px 10px rgba(255,255,255,.25); }
.pool-tiles { position: absolute; left: 0; right: 0; height: 88px; bottom: 0;
  background-color: #cfd8e1;
  background-image: linear-gradient(90deg, rgba(0,0,0,.08) 1px, transparent 1px), linear-gradient(180deg, rgba(0,0,0,.08) 1px, transparent 1px);
  background-size: 34px 34px; }

.pool-lanes { position: relative; z-index: 2; display: flex; gap: 6px; padding: 92px 12px 14px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: thin; }
.pool-lane { position: relative; flex: 0 0 112px; display: flex; flex-direction: column; align-items: center; scroll-snap-align: center; }
.pool-lane .pool-block { z-index: 3; }
/* Centred when the lanes fit, scrollable (without clipping lane 1) when they don't. */
.pool-lane:first-child { margin-left: auto; }
.pool-lane:last-child { margin-right: auto; }
.pool-lane .sw-stage { margin-bottom: -34px; z-index: 2; }

/* Starting block: a small 3D box */
.pool-block { position: relative; width: 78px; height: 46px; perspective: 400px; }
.pool-block .top { position: absolute; left: 0; right: 0; top: 0; height: 30px; transform-origin: 50% 100%; transform: rotateX(62deg);
  background: linear-gradient(180deg, #f8fafc, #cbd5e1); border-radius: 6px; box-shadow: inset 0 0 0 2px rgba(15,23,42,.08); }
.pool-block .front { position: absolute; left: 0; right: 0; bottom: 0; height: 34px; border-radius: 0 0 6px 6px;
  background: linear-gradient(180deg, #1e293b, #0f172a); display: flex; align-items: center; justify-content: center;
  font: 900 20px/1 system-ui, sans-serif; color: #facc15; text-shadow: 0 0 8px rgba(250,204,21,.6); }
.pool-block.empty .front { color: rgba(255,255,255,.35); text-shadow: none; }

.pool-name { margin-top: 8px; max-width: 108px; text-align: center; font: 700 12px/1.2 system-ui, sans-serif; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pool-name.me { color: #c2410c; }
.pool-name.wait { color: #475569; font-weight: 600; font-style: italic; }
.pool-flag { margin-top: 3px; height: 12px; border-radius: 2px; box-shadow: 0 0 0 1px rgba(0,0,0,.15); }

.pool-banner { position: absolute; z-index: 3; left: 12px; right: 12px; top: 14px; text-align: center; color: #fff; }
.pool-banner h2 { font: 800 19px/1.2 system-ui, sans-serif; letter-spacing: .02em; text-shadow: 0 2px 10px rgba(0,0,0,.4); }
.pool-banner p { margin-top: 4px; font: 600 12px/1.2 system-ui, sans-serif; opacity: .85; }
.pool-dots::after { content: ''; animation: pool-dots 1.6s steps(4, end) infinite; }
@keyframes pool-dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }

@media (max-width: 480px) {
  .pool-lane { flex-basis: 96px; }
  .pool-lane .sw-stage { transform: scale(.85); transform-origin: 50% 100%; margin-bottom: -38px; }
}
@media (prefers-reduced-motion: reduce) {
  .sw-rig, .sw-arm, .pool-water, .pool-caustics, .sw-ghost { animation: none !important; }
}
`;
