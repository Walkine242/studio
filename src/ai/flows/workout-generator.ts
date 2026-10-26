'use server';

/**
 * @fileOverview Workout generator AI agent.
 *
 * - generateWorkout - A function that handles the workout generation process.
 * - WorkoutGeneratorInput - The input type for the generateWorkout function.
 * - WorkoutGeneratorOutput - The return type for the generateWorkout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkoutGeneratorInputSchema = z.object({
  experience: z
    .string()
    .describe('The swimmer\'s experience level (e.g., beginner, intermediate, advanced).'),
  typicalDistance: z
    .string()
    .describe('The typical distance the swimmer usually swims in a practice session (e.g., 2000m, 3000m).'),
  currentTrainingPlan: z
    .string()
    .optional()
    .describe('The swimmer\'s current training plan, if any.  If none, say N/A.'),
  targetStroke: z
    .string()
    .optional()
    .describe('The target stroke the swimmer wants to focus on (e.g., freestyle, backstroke). If none, say N/A.'),
  equipment: z
    .array(z.string())
    .optional()
    .describe('A list of available swimming equipment (e.g., Kickboard, Fins, Paddles).'),
  duration: z
    .string()
    .optional()
    .describe('The target duration of the workout (e.g., 30 minutes, 60 minutes).'),
  intensity: z
    .string()
    .optional()
    .describe('The workout intensity/focus (e.g., recovery, aerobic endurance, threshold/sprint).'),
  basePace: z
    .string()
    .optional()
    .describe('The swimmer\'s target swim interval pace per 100m/yd (e.g., 1:30, 1:45). If none, say N/A.'),
  restInterval: z
    .string()
    .optional()
    .describe('The swimmer\'s preferred rest interval between repetitions in seconds (e.g., 15s, 30s). If none, say N/A.'),
});

export type WorkoutGeneratorInput = z.infer<typeof WorkoutGeneratorInputSchema>;

const WorkoutGeneratorOutputSchema = z.object({
  workout: z.string().describe('The generated workout plan tailored to the swimmer. Use markdown for formatting with headings and bullet points.'),
});

export type WorkoutGeneratorOutput = z.infer<typeof WorkoutGeneratorOutputSchema>;

export async function generateWorkout(input: WorkoutGeneratorInput): Promise<WorkoutGeneratorOutput> {
  return workoutGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutGeneratorPrompt',
  input: {schema: WorkoutGeneratorInputSchema},
  output: {schema: WorkoutGeneratorOutputSchema},
  prompt: `You are Coach Mikey, an expert swim coach, skilled at creating tailored workout plans for swimmers of all levels.

  Based on the swimmer's input, generate a workout plan that helps them achieve their goals. Format the output as if you were writing on a whiteboard for a swimmer to read, using clear headings (like "Warm Up", "Main Set", "Cool Down") and bullet points for the sets. Incorporate the custom swim intervals and rest pacing directly into the reps if specified. If the user provides a list of available equipment, incorporate it into the workout.

  Swimmer Experience: {{{experience}}}
  Practice Distance: {{{typicalDistance}}}
  Workout Duration: {{{duration}}}
  Workout Intensity: {{{intensity}}}
  Target Swim Pace: {{{basePace}}} per 100m
  Rest Interval: {{{restInterval}}}
  Current Training Plan: {{{currentTrainingPlan}}}
  Target Stroke: {{{targetStroke}}}
  Available Equipment: {{#if equipment}}{{#each equipment}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

  Workout Plan:`,
});

const workoutGeneratorFlow = ai.defineFlow(
  {
    name: 'workoutGeneratorFlow',
    inputSchema: WorkoutGeneratorInputSchema,
    outputSchema: WorkoutGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

const WorkoutAnalysisInputSchema = z.object({
  targetPace: z.string().describe('The swimmer\'s target swim interval pace (e.g. 1:30 per 100m).'),
  avgPace: z.string().describe('The swimmer\'s actual average swim pace recorded (e.g. 1:28 per 100m).'),
  duration: z.string().describe('The duration of the workout completed.'),
  laps: z.number().describe('The number of laps completed.'),
  avgHeartRate: z.number().optional().describe('The average heart rate in BPM, if a sensor was connected.'),
  strokeFocus: z.string().describe('The focus stroke of the workout.'),
  splits: z.array(z.string()).describe('Detailed lap split times.'),
});

const WorkoutAnalysisOutputSchema = z.object({
  feedback: z.string().describe('Constructive performance analysis from Coach Mikey. Use bullet points and paragraphs.'),
});

export async function analyzeWorkoutPerformance(input: z.infer<typeof WorkoutAnalysisInputSchema>) {
  return workoutAnalysisFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'workoutAnalysisPrompt',
  input: {schema: WorkoutAnalysisInputSchema},
  output: {schema: WorkoutAnalysisOutputSchema},
  prompt: `You are Coach Mikey, an expert swim coach. Analyze this swimmer's performance data and provide constructive, detailed feedback. Compare their target pace with their actual average pace, comment on their heart rate management during the session (or note if no sensor was connected), analyze their lap splits consistency, and give 2-3 specific recommendations for their technique.

  Target Pace: {{{targetPace}}}
  Actual Avg Pace: {{{avgPace}}}
  Duration: {{{duration}}}
  Laps Completed: {{{laps}}}
  Avg Heart Rate: {{#if avgHeartRate}}{{{avgHeartRate}}} BPM{{else}}No Heart Rate Sensor Connected{{/if}}
  Stroke Focus: {{{strokeFocus}}}
  Splits: {{{splits}}}

  Performance Analysis:`,
});

const workoutAnalysisFlow = ai.defineFlow(
  {
    name: 'workoutAnalysisFlow',
    inputSchema: WorkoutAnalysisInputSchema,
    outputSchema: WorkoutAnalysisOutputSchema,
  },
  async input => {
    const {output} = await analysisPrompt(input);
    return output!;
  }
);

