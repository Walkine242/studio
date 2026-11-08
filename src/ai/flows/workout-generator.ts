'use server';

/**
 * Coach Mikey: AI workout generation and practice review, powered by Claude.
 * These are server actions: they run on the server, so the API key never
 * reaches the browser, and they only work for signed-in swimmers.
 */

import { z } from 'zod';
import { askClaude } from '@/ai/claude';
import { getServerUser } from '@/lib/supabase/server';

const short = (max: number) => z.string().trim().max(max);

const WorkoutGeneratorInputSchema = z.object({
  experience: short(50),
  typicalDistance: short(50),
  currentTrainingPlan: short(500).optional(),
  targetStroke: short(50).optional(),
  equipment: z.array(short(50)).max(20).optional(),
  duration: short(50).optional(),
  intensity: short(80).optional(),
  basePace: short(20).optional(),
  restInterval: short(20).optional(),
});

export type WorkoutGeneratorInput = z.infer<typeof WorkoutGeneratorInputSchema>;
export type WorkoutGeneratorOutput = { workout: string };

const COACH = `You are Coach Mikey, an expert swim coach who writes tailored workouts for swimmers of all levels.
Write like you're on a pool-deck whiteboard: short headings (Warm Up, Pre Set, Main Set, Cool Down), one set per line,
with reps, distances, stroke and send-off intervals (e.g. "4 x 100 Free @ 1:45"). Include the total distance at the end.
Plain text only: no markdown symbols such as #, * or **, no tables, no preamble, no sign-off.`;

async function requireUser() {
  const { user } = await getServerUser();
  if (!user) throw new Error('Please log in to use Coach Mikey.');
  return user;
}

const orNA = (v?: string) => (v && v.trim() ? v.trim() : 'N/A');

export async function generateWorkout(input: WorkoutGeneratorInput): Promise<WorkoutGeneratorOutput> {
  await requireUser();
  const v = WorkoutGeneratorInputSchema.parse(input);

  const prompt = `Create one swim workout for this swimmer. Build the intervals from their target pace and rest if given, and use only the equipment listed.

Swimmer experience: ${v.experience}
Usual practice distance: ${v.typicalDistance}
Workout duration: ${orNA(v.duration)}
Workout intensity / focus: ${orNA(v.intensity)}
Target pace per 100: ${orNA(v.basePace)}
Rest between reps: ${orNA(v.restInterval)}
Current training plan: ${orNA(v.currentTrainingPlan)}
Target stroke: ${orNA(v.targetStroke)}
Available equipment: ${v.equipment && v.equipment.length ? v.equipment.join(', ') : 'None'}`;

  const workout = await askClaude({ system: COACH, prompt, maxTokens: 1500 });
  return { workout };
}

const WorkoutAnalysisInputSchema = z.object({
  targetPace: short(20),
  avgPace: short(20),
  duration: short(20),
  laps: z.number().int().min(0).max(1000),
  strokeFocus: short(50),
  splits: z.array(short(20)).max(500),
  avgHeartRate: z.number().optional(),
});

export async function analyzeWorkoutPerformance(input: z.infer<typeof WorkoutAnalysisInputSchema>) {
  await requireUser();
  const v = WorkoutAnalysisInputSchema.parse(input);

  const prompt = `Review this practice and give constructive feedback: compare target pace with actual average,
comment on how consistent the lap splits were (call out fade or negative splitting), and finish with 2-3 specific
technique or pacing recommendations. Keep it under 200 words, plain text, short paragraphs or "- " bullet lines.

Target pace: ${v.targetPace}
Actual average split: ${v.avgPace}
Total time: ${v.duration}
Laps recorded: ${v.laps}
Stroke focus: ${v.strokeFocus}
Lap splits: ${v.splits.join(', ')}${v.avgHeartRate ? `\nAverage heart rate: ${v.avgHeartRate} BPM` : ''}`;

  const feedback = await askClaude({
    system: 'You are Coach Mikey, an encouraging but honest expert swim coach. Plain text only, no markdown symbols.',
    prompt,
    maxTokens: 800,
  });
  return { feedback };
}
