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

  Based on the swimmer's input, generate a workout plan that helps them achieve their goals. Format the output as if you were writing on a whiteboard for a swimmer to read, using clear headings (like "Warm Up", "Main Set", "Cool Down") and bullet points for the sets. If the user provides a list of available equipment, incorporate it into the workout.

  Swimmer Experience: {{{experience}}}
  Practice Distance: {{{typicalDistance}}}
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
