// Styles for the Dual face-off ("VS") screen. Kept as a string and injected
// once with a <style> tag so the screen is self-contained.

export const VERSUS_CSS = String.raw`
.vs-screen { position: relative; overflow: hidden; border-radius: 18px; min-height: 360px; color: #fff; isolation: isolate;
  background: #05070f; box-shadow: 0 24px 70px rgba(2,6,23,.55), inset 0 0 0 1px rgba(255,255,255,.06);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }

/* The two halves, split on a diagonal */
.vs-half { position: absolute; inset: 0; }
.vs-half.blue { clip-path: polygon(0 0, 56% 0, 44% 100%, 0 100%);
  background: radial-gradient(120% 90% at 18% 45%, #1d4ed8 0%, #0b1f5c 45%, #050b24 100%); }
.vs-half.red { clip-path: polygon(56% 0, 100% 0, 100% 100%, 44% 100%);
  background: radial-gradient(120% 90% at 82% 45%, #be123c 0%, #5b0a24 45%, #1a030b 100%); }
.vs-half::after { content: ''; position: absolute; inset: 0; opacity: .35; mix-blend-mode: overlay;
  background-image: repeating-linear-gradient(115deg, rgba(255,255,255,.07) 0 2px, transparent 2px 9px); }

/* Neon frames */
.vs-neon { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
.vs-neon path { fill: none; stroke-width: 3; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
.vs-neon .b { stroke: #7dd3fc; filter: drop-shadow(0 0 4px #38bdf8) drop-shadow(0 0 12px #2563eb); }
.vs-neon .r { stroke: #fda4af; filter: drop-shadow(0 0 4px #fb7185) drop-shadow(0 0 12px #e11d48); }
.vs-neon .s { stroke: #fff7d6; stroke-width: 2.5; filter: drop-shadow(0 0 5px #fff) drop-shadow(0 0 14px #f59e0b); animation: vs-flicker 2.8s infinite; }

/* Sparks drifting up */
.vs-sparks { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.vs-sparks i { position: absolute; bottom: -10px; width: 3px; height: 3px; border-radius: 50%; background: #fdba74;
  box-shadow: 0 0 6px #f97316, 0 0 12px #f59e0b; animation: vs-spark linear infinite; opacity: 0; }
@keyframes vs-spark { 0% { transform: translate(0,0) scale(1); opacity: 0; } 10% { opacity: 1; }
  100% { transform: translate(var(--dx), -420px) scale(.3); opacity: 0; } }
@keyframes vs-flicker { 0%, 100% { opacity: .8; } 45% { opacity: .55; } 50% { opacity: 1; } 55% { opacity: .6; } }

/* Top strip */
.vs-top { position: relative; z-index: 3; display: flex; justify-content: space-between; align-items: center; gap: 8px;
  padding: 12px 18px; background: linear-gradient(180deg, rgba(0,0,0,.65), rgba(0,0,0,0)); }
.vs-event { font-weight: 800; letter-spacing: .04em; text-transform: uppercase; font-size: 13px; text-shadow: 0 2px 8px rgba(0,0,0,.6); }
.vs-status { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; padding: 4px 10px; border-radius: 999px;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.25); white-space: nowrap; }
.vs-status.live { background: #dc2626; border-color: #fca5a5; animation: vs-pulse 1.4s infinite; }
.vs-status.ready { background: #16a34a; border-color: #86efac; }

/* Players */
.vs-stage { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; align-items: center; padding: 6px 4% 26px; min-height: 300px; }
.vs-player { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; min-width: 0; }
.vs-player.left { padding-right: 18%; animation: vs-in-left .7s cubic-bezier(.2,.9,.25,1.2) both; }
.vs-player.right { padding-left: 18%; animation: vs-in-right .7s cubic-bezier(.2,.9,.25,1.2) both; }
@keyframes vs-in-left { from { transform: translateX(-60px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes vs-in-right { from { transform: translateX(60px); opacity: 0; } to { transform: none; opacity: 1; } }
.vs-tag { font: 900 italic 15px/1 'Arial Black', Impact, system-ui, sans-serif; letter-spacing: .04em; }
.vs-player.left .vs-tag { color: #7dd3fc; text-shadow: 0 0 10px #2563eb; }
.vs-player.right .vs-tag { color: #fda4af; text-shadow: 0 0 10px #e11d48; }
.vs-logo { animation: vs-float 4s ease-in-out infinite; }
.vs-player.right .vs-logo { animation-delay: -2s; }
@keyframes vs-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.vs-name { max-width: 100%; font: 900 italic clamp(17px, 3.2vw, 28px)/1.05 'Arial Black', Impact, system-ui, sans-serif; text-transform: uppercase;
  letter-spacing: .01em; text-shadow: 0 3px 0 rgba(0,0,0,.45), 0 0 18px rgba(0,0,0,.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vs-team { display: flex; align-items: center; justify-content: center; gap: 6px; max-width: 100%; font-size: 12px; font-weight: 700;
  color: rgba(255,255,255,.8); text-transform: uppercase; letter-spacing: .06em; }
.vs-team span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vs-flag { height: 12px; border-radius: 2px; box-shadow: 0 0 0 1px rgba(0,0,0,.3); }
.vs-you { font-size: 10px; font-weight: 800; letter-spacing: .1em; padding: 2px 7px; border-radius: 999px; background: rgba(255,255,255,.18); }
.vs-waiting { color: rgba(255,255,255,.75); font-weight: 700; font-size: 14px; letter-spacing: .04em; }
.vs-waiting::after { content: ''; animation: vs-dots 1.6s steps(4, end) infinite; }
@keyframes vs-dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
@keyframes vs-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,.6); } 50% { box-shadow: 0 0 0 8px rgba(220,38,38,0); } }

/* Field of opponents (3+ swimmers) */
.vs-field { display: flex; flex-direction: column; gap: 6px; width: 100%; max-width: 240px; }
.vs-field-row { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 10px; background: rgba(0,0,0,.28);
  border: 1px solid rgba(253,164,175,.25); text-align: left; animation: vs-in-right .6s both; }
.vs-field-row b { font: 900 italic 13px/1.1 'Arial Black', Impact, system-ui, sans-serif; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vs-field-row small { display: block; font-size: 10px; color: rgba(255,255,255,.7); text-transform: uppercase; letter-spacing: .05em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vs-field-row > div { min-width: 0; }
.vs-field-more { font-size: 11px; color: rgba(255,255,255,.7); text-align: center; }

/* VS mark */
.vs-mark { position: absolute; z-index: 3; left: 50%; top: 54%; transform: translate(-50%, -50%); pointer-events: none; }
.vs-mark::before { content: ''; position: absolute; left: 50%; top: 50%; width: 220px; height: 220px; margin: -110px 0 0 -110px; border-radius: 50%;
  background: radial-gradient(circle, rgba(253,230,138,.55) 0%, rgba(249,115,22,.25) 30%, transparent 65%); animation: vs-glow 2.2s ease-in-out infinite; }
.vs-mark span { position: relative; display: block; font: 900 italic clamp(64px, 11vw, 112px)/.9 'Arial Black', Impact, system-ui, sans-serif; letter-spacing: -.06em;
  background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 38%, #94a3b8 52%, #f8fafc 70%, #cbd5e1 100%); -webkit-background-clip: text; background-clip: text; color: transparent;
  -webkit-text-stroke: 1px rgba(255,255,255,.6); filter: drop-shadow(0 4px 0 rgba(0,0,0,.55)) drop-shadow(0 0 14px rgba(253,224,71,.65));
  animation: vs-slam .6s .25s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes vs-slam { from { transform: scale(2.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes vs-glow { 0%, 100% { transform: scale(.9); opacity: .75; } 50% { transform: scale(1.1); opacity: 1; } }

@media (max-width: 560px) {
  .vs-screen { min-height: 300px; }
  .vs-stage { min-height: 250px; padding: 0 1% 18px; }
  .vs-player.left { padding-right: 20%; }
  .vs-player.right { padding-left: 20%; }
  .vs-logo { width: 82px; height: 82px; }
  .vs-name { font-size: 15px; white-space: normal; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .vs-team { flex-wrap: wrap; font-size: 10px; gap: 4px; }
  .vs-mark span { font-size: 50px; }
  .vs-waiting { font-size: 12px; }
  .vs-field-row small { display: none; }
  .vs-field-row b { font-size: 11px; }
  .vs-field-row svg { width: 28px; height: 28px; }
  .vs-top { padding: 10px 12px; }
  .vs-event { font-size: 11px; }
  .vs-mark::before { width: 150px; height: 150px; margin: -75px 0 0 -75px; }
  .vs-field-row { padding: 3px 5px; gap: 5px; }
}
@media (prefers-reduced-motion: reduce) {
  .vs-screen *, .vs-screen *::before, .vs-screen *::after { animation: none !important; }
  .vs-sparks { display: none; }
}
`;
