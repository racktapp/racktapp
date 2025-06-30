'use server';
/**
 * @fileOverview Generates a trivia round for the "Guess the Legend" game.
 *
 * - getLegendGameRound - A function that handles the trivia generation process.
 * - LegendGameInput - The input type for the function.
 * - LegendGameOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Sport } from '@/lib/types';

const LegendGameInputSchema = z.object({
  sport: z.nativeEnum(Sport),
  usedPlayers: z.array(z.string()).describe('A list of players who have already been used in this game to avoid duplicates.'),
});
export type LegendGameInput = z.infer<typeof LegendGameInputSchema>;

const LegendGameOutputSchema = z.object({
  clue: z.string().describe("A clever, one-sentence, slightly cryptic clue about a famous player."),
  correctAnswer: z.string().describe("The name of the correct player."),
  options: z.array(z.string()).length(4).describe("An array of four player names, including the correct answer and three plausible distractors."),
  justification: z.string().describe("A short, fun justification for why the clue points to the correct player."),
});
export type LegendGameOutput = z.infer<typeof LegendGameOutputSchema>;


export async function getLegendGameRound(input: LegendGameInput): Promise<LegendGameOutput> {
  return legendGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'legendGamePrompt',
  input: { schema: LegendGameInputSchema },
  output: { schema: LegendGameOutputSchema },
  prompt: `You are a sports trivia expert for the sport of {{{sport}}}.

  Your task is to generate a single trivia question about a famous player.

  1.  **Generate a Clue:** Create a clever, one-sentence, slightly cryptic clue about a famous player from any era.
  2.  **Avoid Duplicates:** The player must NOT be one of these: {{#each usedPlayers}}"{{this}}"{{#if @last}}{{else}}, {{/if}}{{/each}}.
  3.  **Provide Options:** Create a list of 4 multiple-choice options. One must be the correct answer, and the other three must be plausible but incorrect distractors. The final array of options should be shuffled.
  4.  **Justify:** Provide a short, fun justification explaining why the clue points to the correct player.
  `,
});

const legendGameFlow = ai.defineFlow(
  {
    name: 'legendGameFlow',
    inputSchema: LegendGameInputSchema,
    outputSchema: LegendGameOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
