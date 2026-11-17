import { decodeFit, fitDate, FitError, type FitMessage } from './fit';
import { readZip } from './unzip';

// Turns a watch's activity file (.fit or .tcx) into a Dual swim summary.
// FIT field numbers below come from Garmin's FIT profile.

export type SwimStroke = 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'Drill' | 'Mixed' | 'IM' | 'Rest';

export interface SwimLap {
  distanceM: number;
  timeS: number;
  stroke: SwimStroke | null;
  strokes: number | null;
  lengths: number | null;
  avgHr: number | null;
}

export interface SwimImport {
  /** Stable id used to stop the same swim being imported twice. */
  externalId: string;
  /** Device key used across Dual ('garmin', 'apple-watch', ...). */
  source: string;
  deviceName: string;
  start: Date;
  kind: 'pool' | 'open-water' | 'other';
  poolLengthM: number | null;
  unit: 'meters' | 'yards';
  distanceM: number;
  elapsedS: number;
  movingS: number;
  avgHr: number | null;
  maxHr: number | null;
  strokes: number | null;
  calories: number | null;
  activeLengths: number | null;
  laps: SwimLap[];
}

export class ImportError extends Error {}

const STROKES: Record<number, SwimStroke> = {
  0: 'Freestyle', 1: 'Backstroke', 2: 'Breaststroke', 3: 'Butterfly', 4: 'Drill', 5: 'Mixed', 6: 'IM',
};

// file_id.manufacturer -> [Dual device key, brand name]
const MANUFACTURERS: Record<number, [string, string]> = {
  1: ['garmin', 'Garmin'],
  23: ['suunto', 'Suunto'],
  123: ['polar', 'Polar'],
  294: ['coros', 'COROS'],
  32: ['device', 'Wahoo'],
};

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const scaled = (v: unknown, scale: number): number | null => { const n = num(v); return n === null ? null : n / scale; };

/**
 * Reads a .fit, .tcx or .zip (Garmin "Export Original") file and returns every
 * swim in it. `fallbackSource` is used when the maker can't be detected.
 */
export async function parseSwimFiles(file: File, fallbackSource = 'device'): Promise<SwimImport[]> {
  const name = file.name.toLowerCase();
  if (file.size > 50 * 1024 * 1024) throw new ImportError(`${file.name} is too large (max 50 MB).`);
  if (name.endsWith('.zip')) {
    let entries;
    try {
      entries = await readZip(await file.arrayBuffer(), /\.(fit|tcx)$/i);
    } catch (e) {
      throw new ImportError(e instanceof Error ? e.message : `${file.name} couldn't be opened.`);
    }
    if (entries.length === 0) throw new ImportError(`${file.name} has no .fit or .tcx activity inside.`);
    const swims: SwimImport[] = [];
    const errors: string[] = [];
    for (const entry of entries) {
      try {
        swims.push(
          /\.tcx$/i.test(entry.name)
            ? parseTcx(new TextDecoder().decode(entry.data), fallbackSource)
            : parseFitSwim(entry.data.buffer.slice(entry.data.byteOffset, entry.data.byteOffset + entry.data.byteLength) as ArrayBuffer, fallbackSource)
        );
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    if (swims.length === 0) throw new ImportError(errors[0] ?? 'No swims found in this file.');
    return swims;
  }
  return [await parseSwimFile(file, fallbackSource)];
}

/** Reads a single .fit or .tcx file. */
export async function parseSwimFile(file: File, fallbackSource = 'device'): Promise<SwimImport> {
  const name = file.name.toLowerCase();
  if (file.size > 25 * 1024 * 1024) throw new ImportError(`${file.name} is too large (max 25 MB).`);
  if (name.endsWith('.tcx')) return parseTcx(await file.text(), fallbackSource);
  if (!name.endsWith('.fit')) throw new ImportError(`${file.name}: choose a .fit, .tcx or .zip activity file.`);
  try {
    return parseFitSwim(await file.arrayBuffer(), fallbackSource);
  } catch (e) {
    if (e instanceof ImportError) throw e;
    if (e instanceof FitError) throw new ImportError(`${file.name}: ${e.message}`);
    throw new ImportError(`${file.name} couldn't be read.`);
  }
}

export function parseFitSwim(buffer: ArrayBuffer, fallbackSource = 'device'): SwimImport {
  const messages = decodeFit(buffer);
  const of = (n: number) => messages.filter((m) => m.num === n);
  const fileId = of(0)[0];
  // Multisport files (triathlons) hold one session per leg: use the swim leg.
  const sessions = of(18);
  const session = (sessions.find((m) => num(m.fields[5]) === 5) ?? sessions[0]) as FitMessage | undefined;
  const inSession = (m: FitMessage) => {
    if (sessions.length < 2 || !session) return true;
    const s0 = num(session.fields[2]);
    const len = scaled(session.fields[7], 1000);
    const t = num(m.fields[2]) ?? num(m.fields[253]);
    return s0 === null || len === null || t === null || (t >= s0 && t <= s0 + len + 1);
  };
  const laps = of(19).filter(inSession);
  const lengths = of(101).filter(inSession);

  // Activity type: session.sport 5 = swimming; sub_sport 17 = lap swimming, 18 = open water.
  const sport = num(session?.fields[5]) ?? num(laps[0]?.fields[25]);
  if (sport !== null && sport !== 5) {
    throw new ImportError('This activity isn’t a swim. Choose a pool or open-water swim file.');
  }
  if (!session && laps.length === 0) throw new ImportError('No activity found in this file.');
  const subSport = num(session?.fields[6]);

  const manufacturer = num(fileId?.fields[1]);
  const productName = typeof fileId?.fields[8] === 'string' ? (fileId.fields[8] as string) : '';
  let [source, brand] = (manufacturer !== null && MANUFACTURERS[manufacturer]) || [fallbackSource, ''];
  if (/apple/i.test(productName)) [source, brand] = ['apple-watch', 'Apple Watch'];
  const deviceName = productName || brand || 'Watch';

  const startRaw = num(session?.fields[2]) ?? num(laps[0]?.fields[2]) ?? num(fileId?.fields[4]) ?? num(session?.fields[253]);
  if (startRaw === null) throw new ImportError('This file has no start time.');
  const start = fitDate(startRaw);

  const poolLengthM = scaled(session?.fields[44], 100);
  const poolUnit = num(session?.fields[46]) === 1 ? 'yards' : 'meters';

  const lapList: SwimLap[] = laps.map((l) => {
    const distanceM = scaled(l.fields[9], 100) ?? 0;
    const active = num(l.fields[40]);
    const strokeCode = num(l.fields[38]);
    const isRest = distanceM === 0 || active === 0;
    return {
      distanceM,
      timeS: scaled(l.fields[8], 1000) ?? scaled(l.fields[7], 1000) ?? 0,
      stroke: isRest ? 'Rest' : strokeCode !== null ? STROKES[strokeCode] ?? null : null,
      strokes: num(l.fields[10]),
      lengths: active ?? num(l.fields[32]),
      avgHr: num(l.fields[15]),
    };
  });

  const sumLaps = (k: 'distanceM' | 'timeS') => lapList.reduce((s, l) => s + (l[k] || 0), 0);
  const distanceM = scaled(session?.fields[9], 100) ?? sumLaps('distanceM');
  const elapsedS = scaled(session?.fields[7], 1000) ?? sumLaps('timeS');
  const activeLengthMsgs = lengths.filter((l) => num(l.fields[12]) === 1);
  const movingFromLengths = activeLengthMsgs.reduce((s, l) => s + (scaled(l.fields[4], 1000) ?? 0), 0);
  const movingS = movingFromLengths > 0
    ? movingFromLengths
    : lapList.filter((l) => l.stroke !== 'Rest').reduce((s, l) => s + l.timeS, 0) || (scaled(session?.fields[8], 1000) ?? elapsedS);

  if (distanceM <= 0 && elapsedS <= 0) throw new ImportError('This swim has no distance or time recorded.');

  return {
    externalId: `${source}:${Math.round(start.getTime() / 1000)}`,
    source,
    deviceName,
    start,
    kind: subSport === 18 ? 'open-water' : poolLengthM || subSport === 17 ? 'pool' : 'other',
    poolLengthM,
    unit: poolUnit,
    distanceM,
    elapsedS,
    movingS,
    avgHr: num(session?.fields[16]),
    maxHr: num(session?.fields[17]),
    strokes: num(session?.fields[10]),
    calories: num(session?.fields[11]),
    activeLengths: num(session?.fields[47]) ?? (activeLengthMsgs.length || null),
    laps: lapList.slice(0, 300),
  };
}

/** TCX (Polar Flow and others). Laps only; TCX has no pool or stroke data. */
export function parseTcx(xml: string, fallbackSource = 'device'): SwimImport {
  if (!/<TrainingCenterDatabase/i.test(xml)) throw new ImportError('Not a TCX activity file.');
  const sport = /<Activity\s+Sport="([^"]*)"/i.exec(xml)?.[1] ?? '';
  if (/^(running|biking)$/i.test(sport)) throw new ImportError('This activity isn’t a swim.');
  const id = /<Id>([^<]+)<\/Id>/i.exec(xml)?.[1];
  const creator = (/<Creator[^>]*>[\s\S]*?<Name>([^<]+)<\/Name>/i.exec(xml)?.[1]
    ?? /<Author[^>]*>[\s\S]*?<Name>([^<]+)<\/Name>/i.exec(xml)?.[1] ?? '').trim();
  const tag = (block: string, t: string) => {
    const m = new RegExp(`<${t}>\\s*(?:<Value>)?\\s*([\\d.]+)`, 'i').exec(block);
    return m ? Number(m[1]) : null;
  };
  const lapBlocks = xml.match(/<Lap\b[\s\S]*?<\/Lap>/gi) ?? [];
  const laps: SwimLap[] = lapBlocks.map((b) => {
    const distanceM = tag(b, 'DistanceMeters') ?? 0;
    return {
      distanceM,
      timeS: tag(b, 'TotalTimeSeconds') ?? 0,
      stroke: distanceM === 0 ? ('Rest' as const) : null,
      strokes: null,
      lengths: null,
      avgHr: tag(b, 'AverageHeartRateBpm'),
    };
  });
  const startStr = /<Lap\s+StartTime="([^"]+)"/i.exec(xml)?.[1] ?? id;
  const start = startStr ? new Date(startStr) : null;
  if (!start || Number.isNaN(start.getTime())) throw new ImportError('This file has no start time.');
  const distanceM = laps.reduce((s, l) => s + l.distanceM, 0);
  const elapsedS = laps.reduce((s, l) => s + l.timeS, 0);
  if (distanceM <= 0 && elapsedS <= 0) throw new ImportError('This swim has no distance or time recorded.');
  const hrs = laps.map((l) => l.avgHr).filter((h): h is number => h !== null);
  const maxes = lapBlocks.map((b) => tag(b, 'MaximumHeartRateBpm')).filter((h): h is number => h !== null);
  let source = fallbackSource;
  if (/polar/i.test(creator)) source = 'polar';
  else if (/garmin|forerunner|fenix|swim 2/i.test(creator)) source = 'garmin';
  else if (/suunto/i.test(creator)) source = 'suunto';
  else if (/coros/i.test(creator)) source = 'coros';
  return {
    externalId: `${source}:${Math.round(start.getTime() / 1000)}`,
    source,
    deviceName: creator || 'Watch',
    start,
    kind: 'other',
    poolLengthM: null,
    unit: 'meters',
    distanceM,
    elapsedS,
    movingS: laps.filter((l) => l.stroke !== 'Rest').reduce((s, l) => s + l.timeS, 0) || elapsedS,
    avgHr: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null,
    maxHr: maxes.length ? Math.max(...maxes) : null,
    strokes: null,
    calories: lapBlocks.reduce((s, b) => s + (tag(b, 'Calories') ?? 0), 0) || null,
    activeLengths: null,
    laps: laps.slice(0, 300),
  };
}

// ---------- Formatting for training logs ----------

const YARD = 0.9144;

export function displayDistance(s: Pick<SwimImport, 'distanceM' | 'unit'>): string {
  const v = s.unit === 'yards' ? s.distanceM / YARD : s.distanceM;
  return `${Math.round(v).toLocaleString('en-US')} ${s.unit === 'yards' ? 'yd' : 'm'}`;
}

export function displayDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(sec).padStart(2, '0')}s`;
}

export function displayPace(s: Pick<SwimImport, 'distanceM' | 'movingS' | 'unit'>): string {
  const d = s.unit === 'yards' ? s.distanceM / YARD : s.distanceM;
  if (d <= 0 || s.movingS <= 0) return '';
  const per100 = (s.movingS / d) * 100;
  const m = Math.floor(per100 / 60);
  const sec = Math.round(per100 % 60);
  const [mm, ss] = sec === 60 ? [m + 1, 0] : [m, sec];
  return `${mm}:${String(ss).padStart(2, '0')} /100${s.unit === 'yards' ? 'yd' : 'm'}`;
}

export function displayPool(s: Pick<SwimImport, 'kind' | 'poolLengthM' | 'unit'>): string {
  if (s.kind === 'open-water') return 'Open water';
  if (!s.poolLengthM) return 'Pool';
  const len = s.unit === 'yards' ? Math.round(s.poolLengthM / YARD) : Math.round(s.poolLengthM * 10) / 10;
  return `${len} ${s.unit === 'yards' ? 'yd' : 'm'} pool`;
}

export function swimTitle(s: SwimImport): string {
  const when = s.start.getHours() < 12 ? 'Morning' : s.start.getHours() < 17 ? 'Afternoon' : 'Evening';
  return `${when} ${s.kind === 'open-water' ? 'Open Water Swim' : 'Swim'}`;
}

/** Compact detail record stored with the training log. */
export function swimDetails(s: SwimImport) {
  return {
    device: s.deviceName,
    start: s.start.toISOString(),
    kind: s.kind,
    poolLengthM: s.poolLengthM,
    unit: s.unit,
    distanceM: Math.round(s.distanceM),
    elapsedS: Math.round(s.elapsedS),
    movingS: Math.round(s.movingS),
    avgHr: s.avgHr,
    maxHr: s.maxHr,
    strokes: s.strokes,
    calories: s.calories,
    activeLengths: s.activeLengths,
    laps: s.laps.map((l) => ({
      d: Math.round(l.distanceM),
      t: Math.round(l.timeS * 10) / 10,
      st: l.stroke,
      sc: l.strokes,
      n: l.lengths,
      hr: l.avgHr,
    })),
  };
}
