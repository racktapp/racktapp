
'use server';
/**
 * @fileOverview AI-powered sports swing analysis.
 *
 * - analyzeSwing - A function that handles the swing analysis process.
 * - SwingAnalysisInput - The input type for the analyzeSwing function.
 * - SwingAnalysisOutput - The return type for the analyzeSwing function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SPORTS } from '@/lib/constants';

const ShotTypeSchema = z.enum(['Forehand', 'Backhand', 'Serve']);

const SwingAnalysisInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a sports swing, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  sport: z.enum(SPORTS).describe('The sport the user is playing.'),
  shotType: z.string().describe('The type of shot the user was attempting.'),
});
export type SwingAnalysisInput = z.infer<typeof SwingAnalysisInputSchema>;

const FeedbackSchema = z.object({
  positive: z.string().describe('One specific thing the player did well in this phase.'),
  improvement: z.string().describe('A single, actionable tip for what the player can improve.'),
});

const SwingAnalysisOutputSchema = z.object({
  isCorrectShotType: z.boolean().describe('Whether the video shows the shot type selected by the user.'),
  detectedShotType: ShotTypeSchema.optional().describe('The shot type detected by the AI if it differs from the user\'s selection.'),
  summary: z.string().describe('A concise summary of the overall form.'),
  preparation: FeedbackSchema.describe('Feedback on the preparation phase of the swing.'),
  execution: FeedbackSchema.describe('Feedback on the execution phase of the swing.'),
  followThrough: FeedbackSchema.describe('Feedback on the follow-through phase of the swing.'),
});
export type SwingAnalysisOutput = z.infer<typeof SwingAnalysisOutputSchema>;


export async function analyzeSwing(input: SwingAnalysisInput): Promise<SwingAnalysisOutput> {
  return swingAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'swingAnalysisPrompt',
  input: { schema: SwingAnalysisInputSchema },
  output: { schema: SwingAnalysisOutputSchema },
  prompt: `You are an expert {{{sport}}} coach AI. Your task is to analyze a video of a player's swing and provide constructive, encouraging, and highly specific feedback for that sport.

The user has specified they were attempting a {{{shotType}}}.

1.  **Analyze the video:** Watch the video provided carefully.
2.  **Verify Shot Type:** First, determine if the swing in the video matches the selected shot type "{{{shotType}}}" for the sport "{{{sport}}}".
    - If it does not match, set 'isCorrectShotType' to false. Identify the 'detectedShotType' if possible. Provide a brief, helpful 'summary' explaining the mismatch (e.g., "This looks like a forehand, but you selected 'serve'."). Do not fill out the detailed feedback fields.
    - If it matches, set 'isCorrectShotType' to true and proceed.
3.  **Provide Structured Feedback (if shot type is correct):** Break down the swing into three distinct phases: Preparation, Execution, and Follow-through. For each phase, you must provide:
    - **Positive:** One specific thing the player did well. Be genuine and encouraging.
    - **Improvement:** A single, actionable tip for what the player can improve. This should be a concrete instruction, not a vague comment.
4.  **Provide a Summary:** Write a concise, one or two-sentence summary of the player's overall form and potential.

Video: {{media url=videoDataUri}}`,
});

const swingAnalysisFlow = ai.defineFlow(
  {
    name: 'swingAnalysisFlow',
    inputSchema: SwingAnalysisInputSchema,
    outputSchema: SwingAnalysisOutputSchema,
  },
  async (input) => {
    // This flow uses a model capable of video understanding.
    // The model is specified in the genkit config.
    const { output } = await prompt(input);
    return output!;
  }
);
