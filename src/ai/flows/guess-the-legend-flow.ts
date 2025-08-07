
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
import { SPORTS } from '@/lib/constants';
import { LegendGameOutputSchema } from '@/lib/types';
import type { LegendGameOutput } from '@/lib/types';


const LegendGameInputSchema = z.object({
  sport: z.enum(SPORTS),
  usedPlayers: z.array(z.string()).describe('A list of players who have already been used in this game to avoid duplicates.'),
});
export type LegendGameInput = z.infer<typeof LegendGameInputSchema>;


export async function getLegendGameRound(input: LegendGameInput): Promise<LegendGameOutput> {
  const output = await legendGameFlow(input);
  if (!output) {
    throw new Error('The AI failed to generate a valid game round. Please try again.');
  }
  return output;
}

const prompt = ai.definePrompt({
  name: 'legendGamePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: LegendGameInputSchema },
  output: { schema: LegendGameOutputSchema },
  prompt: `Generate a single, high-quality trivia question about a famous player from the sport of **{{{sport}}}**.

**RULES:**
1.  Your entire response MUST be a single, valid JSON object that strictly adheres to the output schema.
2.  The "correctAnswer" player **MUST NOT** be any of these names: {{#if usedPlayers}}{{#each usedPlayers}}"{{this}}"{{#if @last}}{{else}}, {{/if}}{{/each}}{{else}}None{{/if}}.
3.  The "options" array MUST contain exactly 4 strings: the "correctAnswer" and three plausible distractors. The order must be random.
4.  The "clue" must be a single, clever sentence.
5.  The "justification" must be a short, fun explanation.

**EXAMPLE of a PERFECT RESPONSE:**
{
  "clue": "I was a dominant force in the 90s, known for my one-handed backhand and winning the French Open without dropping a set.",
  "correctAnswer": "Gustavo Kuerten",
  "options": [
    "Andre Agassi",
    "Gustavo Kuerten",
    "Pete Sampras",
    "Marat Safin"
  ],
  "justification": "Gustavo 'Guga' Kuerten famously won his first of three French Open titles in 1997 as an unseeded player, and his powerful one-handed backhand was his signature shot."
}
`,
});

const legendGameFlow = ai.defineFlow(
  {
    name: 'legendGameFlow',
    inputSchema: LegendGameInputSchema,
    outputSchema: LegendGameOutputSchema.nullable(),
  },
  async (input) => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const { output } = await prompt(input);
        if (output && output.options?.length === 4 && output.correctAnswer && output.clue) {
          return output;
        }
      } catch (error) {
        console.error(`Legend game AI attempt ${attempts + 1} failed:`, error);
      }
      attempts++;
      if (attempts < 3) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retrying
      }
    }
    return null; // Return null if all attempts fail
  }
);
