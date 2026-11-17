import { getSupabase } from '@/lib/supabase/client';
import {
  displayDistance, displayDuration, displayPace, displayPool, swimDetails, swimTitle, type SwimImport,
} from './parse-swim';

export interface ImportOutcome {
  added: number;
  duplicates: number;
  failed: { title: string; message: string }[];
}

/** Local calendar date of the swim (YYYY-MM-DD), not the UTC date. */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Saves imported swims to the signed-in swimmer's training log, skipping ones already imported. */
export async function saveImportedSwims(userId: string, swims: SwimImport[]): Promise<ImportOutcome> {
  const supabase = getSupabase();
  const outcome: ImportOutcome = { added: 0, duplicates: 0, failed: [] };

  for (const swim of swims) {
    const base = {
      user_id: userId,
      date: localDate(swim.start),
      title: swimTitle(swim),
      source: swim.source,
      duration: displayDuration(swim.elapsedS),
      distance: displayDistance(swim),
      avg_pace: displayPace(swim),
      location: displayPool(swim),
    };
    let { error } = await supabase
      .from('workout_logs')
      .insert({ ...base, details: swimDetails(swim), external_id: swim.externalId });

    if (error && /details|external_id/.test(error.message) && /column/i.test(error.message)) {
      // The device-import SQL hasn't been run yet: save the summary without splits.
      ({ error } = await supabase.from('workout_logs').insert(base));
    }
    if (!error) outcome.added++;
    else if (error.code === '23505') outcome.duplicates++;
    else outcome.failed.push({ title: base.title, message: error.message });
  }
  return outcome;
}
