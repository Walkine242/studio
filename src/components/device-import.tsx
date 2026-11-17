'use client';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, FileUp, HeartPulse, Loader2, Timer, Waves } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/auth-provider';
import {
  parseSwimFiles, displayDistance, displayDuration, displayPace, displayPool, swimTitle, type SwimImport,
} from '@/lib/device-import/parse-swim';
import { saveImportedSwims } from '@/lib/device-import/save';
import { cn } from '@/lib/utils';

type Guide = 'garmin' | 'apple' | 'apps' | 'polar';

const GUIDE_FOR_DEVICE: Record<string, Guide> = {
  garmin: 'garmin',
  'apple-watch': 'apple',
  coros: 'apps',
  suunto: 'apps',
  fitbit: 'apps',
  'form-goggles': 'apps',
  polar: 'polar',
};

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-1.5 text-sm text-slate-300">
      {items.map((s, i) => (
        <li key={i} className="flex gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-bold text-cyan-300">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

interface Row { key: string; fileName: string; swim?: SwimImport; error?: string; include: boolean }

/**
 * Upload swims recorded on a watch (.fit / .tcx / Garmin .zip export) into the
 * training log, with a preview of each swim before saving.
 */
export function DeviceImport({ defaultDevice = 'garmin', onDone }: { defaultDevice?: string; onDone?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fallback = defaultDevice in GUIDE_FOR_DEVICE ? defaultDevice : 'device';

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 30);
    if (list.length === 0) return;
    setReading(true);
    const next: Row[] = [];
    for (const file of list) {
      try {
        const swims = await parseSwimFiles(file, fallback);
        swims.forEach((swim, i) => next.push({ key: `${file.name}-${i}-${swim.externalId}`, fileName: file.name, swim, include: true }));
      } catch (e) {
        next.push({ key: `${file.name}-err-${Math.random()}`, fileName: file.name, error: e instanceof Error ? e.message : 'Couldn’t read this file.', include: false });
      }
    }
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.swim?.externalId).filter(Boolean));
      return [...prev, ...next.filter((r) => !r.swim || !seen.has(r.swim.externalId))];
    });
    setReading(false);
  };

  const selected = rows.filter((r) => r.swim && r.include).map((r) => r.swim!) ;

  const save = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Log in first', description: 'Sign in to save swims to your training log.' });
      return;
    }
    setSaving(true);
    try {
      const out = await saveImportedSwims(user.id, selected);
      const parts = [
        out.added ? `${out.added} swim${out.added === 1 ? '' : 's'} added to your training log` : '',
        out.duplicates ? `${out.duplicates} already imported` : '',
      ].filter(Boolean);
      if (out.failed.length) {
        toast({ variant: 'destructive', title: 'Some swims weren’t saved', description: out.failed[0].message });
      } else {
        toast({ title: out.added ? 'Swims imported! 🏊' : 'Nothing new to import', description: parts.join(' · ') || undefined });
      }
      if (out.added || out.duplicates) {
        setRows([]);
        onDone?.();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue={GUIDE_FOR_DEVICE[defaultDevice] ?? 'garmin'}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-900">
          <TabsTrigger value="garmin" className="text-xs">Garmin</TabsTrigger>
          <TabsTrigger value="apple" className="text-xs">Apple</TabsTrigger>
          <TabsTrigger value="apps" className="text-xs">COROS · Suunto</TabsTrigger>
          <TabsTrigger value="polar" className="text-xs">Polar</TabsTrigger>
        </TabsList>
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <TabsContent value="garmin" className="mt-0">
            <Steps items={[
              <>Sync your watch with the Garmin Connect app as usual.</>,
              <>Open <a className="font-semibold text-cyan-300 underline" href="https://connect.garmin.com/modern/activities" target="_blank" rel="noreferrer">connect.garmin.com</a> in a browser (works on your phone too) and open the swim.</>,
              <>Tap the <b>⚙ gear</b> icon → <b>Export Original</b>. A .zip downloads.</>,
              <>Upload that .zip below. No need to unzip it.</>,
            ]} />
          </TabsContent>
          <TabsContent value="apple" className="mt-0">
            <Steps items={[
              <>Apple Health can’t export a single workout, so install an export app such as <b>HealthFit</b> or <b>RunGap</b> from the App Store on your iPhone.</>,
              <>In that app, open your Apple Watch pool swim and export it as a <b>.FIT</b> file to the Files app.</>,
              <>Upload the .fit file below. Laps, strokes and heart rate come with it.</>,
            ]} />
          </TabsContent>
          <TabsContent value="apps" className="mt-0">
            <Steps items={[
              <>Open the swim in the COROS, Suunto or other watch app (or its website).</>,
              <>Use <b>Export</b> or <b>Share</b> and pick <b>.FIT</b> (or .TCX if FIT isn’t offered).</>,
              <>Upload the file below.</>,
            ]} />
          </TabsContent>
          <TabsContent value="polar" className="mt-0">
            <Steps items={[
              <>Open <a className="font-semibold text-cyan-300 underline" href="https://flow.polar.com" target="_blank" rel="noreferrer">flow.polar.com</a> and open the swim.</>,
              <>Choose <b>Export session</b> → <b>TCX</b>.</>,
              <>Upload the .tcx file below. (TCX includes laps and heart rate but not stroke type.)</>,
            ]} />
          </TabsContent>
        </div>
      </Tabs>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
          dragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 hover:border-cyan-500/60 hover:bg-slate-900'
        )}
      >
        {reading ? <Loader2 className="size-8 animate-spin text-cyan-300" /> : <FileUp className="size-8 text-cyan-300" />}
        <p className="font-semibold text-white">{reading ? 'Reading your swims…' : 'Tap to choose files, or drag them here'}</p>
        <p className="text-xs text-slate-400">.fit, .tcx or Garmin .zip · several at once is fine</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".fit,.tcx,.zip,application/zip,application/octet-stream"
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {rows.length > 0 && (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {rows.map((r) =>
            r.swim ? (
              <label key={r.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                <Checkbox
                  checked={r.include}
                  onCheckedChange={(v) => setRows((prev) => prev.map((x) => (x.key === r.key ? { ...x, include: !!v } : x)))}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="font-bold text-white">{swimTitle(r.swim)}</span>
                    <span className="text-xs text-slate-400">
                      {r.swim.start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                      {r.swim.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-300">
                    <span className="font-mono font-semibold text-cyan-300">{displayDistance(r.swim)}</span>
                    <span className="flex items-center gap-1"><Timer className="size-3" /> {displayDuration(r.swim.elapsedS)}</span>
                    {displayPace(r.swim) && <span>{displayPace(r.swim)}</span>}
                    <span className="flex items-center gap-1"><Waves className="size-3" /> {displayPool(r.swim)}</span>
                    {r.swim.avgHr && <span className="flex items-center gap-1"><HeartPulse className="size-3 text-rose-400" /> {r.swim.avgHr} bpm</span>}
                    <span className="text-slate-500">{r.swim.laps.filter((l) => l.stroke !== 'Rest').length} intervals · {r.swim.deviceName}</span>
                  </div>
                </div>
              </label>
            ) : (
              <div key={r.key} className="flex items-start gap-2 rounded-xl border border-rose-900/60 bg-rose-950/30 p-3 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span><b>{r.fileName}</b>: {r.error}</span>
              </div>
            )
          )}
        </div>
      )}

      {rows.some((r) => r.swim) && (
        <Button className="w-full font-bold" disabled={saving || selected.length === 0} onClick={save}>
          {saving ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 className="mr-2" />}
          Import {selected.length} {selected.length === 1 ? 'Swim' : 'Swims'}
        </Button>
      )}
    </div>
  );
}
