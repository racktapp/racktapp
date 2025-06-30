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
  prompt: `You are an expert sports historian and trivia master for the sport of **{{{sport}}}**.

Your task is to generate a single, high-quality trivia question about a famous player from that sport.

**Your Instructions:**

1.  **Select a Player:** Choose a well-known player. Crucially, the player must NOT be one of the following already used players: {{#if usedPlayers}}{{else}}*(None)*{{/if}}{{#each usedPlayers}}"{{this}}"{{#if @last}}{{else}}, {{/if}}{{/each}}.
2.  **Create a Clue:** Write a clever, one-sentence, and slightly cryptic clue about your chosen player's career, style, or a famous achievement.
3.  **Generate Distractors:** Create a list of 4 multiple-choice options.
    - One option MUST be the correct player.
    - The other three options must be *plausible* but incorrect distractors. They should be players from a similar era or with a similar reputation to make the question challenging.
    - The final array of four options must be shuffled randomly.
4.  **Write Justification:** Provide a short, fun justification explaining exactly why the clue points to the correct answer.

The output must follow the specified schema precisely.
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
