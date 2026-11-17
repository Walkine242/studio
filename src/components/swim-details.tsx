'use client';
import { HeartPulse, Timer, Waves, Activity, Gauge } from 'lucide-react';

interface StoredLap { d: number; t: number; st: string | null; sc: number | null; n: number | null; hr: number | null }
interface StoredSwim {
  device?: string;
  poolLengthM?: number | null;
  unit?: 'meters' | 'yards';
  movingS?: number;
  elapsedS?: number;
  avgHr?: number | null;
  maxHr?: number | null;
  strokes?: number | null;
  activeLengths?: number | null;
  laps?: StoredLap[];
}

const YARD = 0.9144;

function clock(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  const whole = Math.floor(rest);
  const tenth = Math.round((rest - whole) * 10);
  return `${m}:${String(tenth === 10 ? whole + 1 : whole).padStart(2, '0')}${tenth && tenth < 10 ? `.${tenth}` : ''}`;
}

/** Laps, pace, strokes and heart rate for a swim imported from a watch. */
export function SwimDetails({ details }: { details: unknown }) {
  if (!details || typeof details !== 'object') return null;
  const d = details as StoredSwim;
  const yards = d.unit === 'yards';
  const conv = (m: number) => (yards ? m / YARD : m);
  const u = yards ? 'yd' : 'm';
  const laps = Array.isArray(d.laps) ? d.laps : [];
  const swimLaps = laps.filter((l) => l.st !== 'Rest' && l.d > 0);

  // SWOLF = seconds + strokes per length (lower is more efficient).
  const swolfs = swimLaps
    .filter((l) => l.n && l.sc)
    .map((l) => l.t / (l.n as number) + (l.sc as number) / (l.n as number));
  const avgSwolf = swolfs.length ? Math.round(swolfs.reduce((a, b) => a + b, 0) / swolfs.length) : null;

  const chips = [
    d.poolLengthM ? { icon: Waves, label: `${Math.round(conv(d.poolLengthM))} ${u} pool` } : null,
    d.movingS ? { icon: Timer, label: `${clock(d.movingS)} swimming` } : null,
    d.activeLengths ? { icon: Activity, label: `${d.activeLengths} lengths` } : null,
    d.strokes ? { icon: Activity, label: `${d.strokes} strokes` } : null,
    avgSwolf ? { icon: Gauge, label: `SWOLF ${avgSwolf}` } : null,
    d.avgHr ? { icon: HeartPulse, label: `${d.avgHr} avg${d.maxHr ? ` · ${d.maxHr} max` : ''} bpm` } : null,
  ].filter(Boolean) as { icon: typeof Waves; label: string }[];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <span key={c.label} className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200">
            <c.icon className="size-3.5 text-cyan-400" /> {c.label}
          </span>
        ))}
        {d.device && <span className="px-1 py-1 text-xs text-slate-500">Recorded on {d.device}</span>}
      </div>
      {laps.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="py-1 pr-3 font-semibold">#</th>
                <th className="py-1 pr-3 font-semibold">Stroke</th>
                <th className="py-1 pr-3 font-semibold">Distance</th>
                <th className="py-1 pr-3 font-semibold">Time</th>
                <th className="py-1 pr-3 font-semibold">Pace /100{u}</th>
                <th className="py-1 pr-3 font-semibold">Strokes</th>
                <th className="py-1 pr-3 font-semibold">SWOLF</th>
                <th className="py-1 font-semibold">HR</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((l, i) => {
                const rest = l.st === 'Rest' || l.d <= 0;
                const dist = conv(l.d);
                const swolf = l.n && l.sc ? Math.round(l.t / l.n + l.sc / l.n) : null;
                return (
                  <tr key={i} className={rest ? 'text-slate-500' : 'text-slate-200'}>
                    <td className="py-1 pr-3">{i + 1}</td>
                    <td className="py-1 pr-3">{rest ? 'Rest' : l.st ?? 'Swim'}</td>
                    <td className="py-1 pr-3 font-mono">{rest ? '–' : `${Math.round(dist)} ${u}`}</td>
                    <td className="py-1 pr-3 font-mono">{clock(l.t)}</td>
                    <td className="py-1 pr-3 font-mono">{rest || dist <= 0 ? '–' : clock((l.t / dist) * 100)}</td>
                    <td className="py-1 pr-3">{rest ? '–' : l.sc ?? '–'}</td>
                    <td className="py-1 pr-3">{swolf ?? '–'}</td>
                    <td className="py-1">{l.hr ?? '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
