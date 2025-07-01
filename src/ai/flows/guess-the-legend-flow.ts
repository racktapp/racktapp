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
  const output = await legendGameFlow(input);
  if (!output) {
    throw new Error('The AI failed to generate a valid game round. Please try again.');
  }
  return output;
}

const prompt = ai.definePrompt({
  name: 'legendGamePrompt',
  input: { schema: LegendGameInputSchema },
  output: { schema: LegendGameOutputSchema },
  prompt: `You are an expert sports historian and trivia master for the sport of **{{{sport}}}**.

Your task is to generate a single, high-quality trivia question about a famous player from that sport. Your output **MUST** be a single, valid JSON object that conforms to the specified schema, and nothing else. Do not add any text before or after the JSON object. Your response must start with \`{\` and end with \`}\`.

**Example JSON Output:**
\`\`\`json
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
\`\`\`

The JSON object must have the following structure and content:
- **\`clue\` (string):** A clever, one-sentence, slightly cryptic clue about your chosen player's career, style, or a famous achievement.
- **\`correctAnswer\` (string):** The full name of the correct player. This player must NOT be one of the following already used players: {{#if usedPlayers}}{{else}}*(None)*{{/if}}{{#each usedPlayers}}"{{this}}"{{#if @last}}{{else}}, {{/if}}{{/each}}.
- **\`options\` (array of 4 strings):** An array containing exactly four player names.
    - One of the names MUST be the value from the \`correctAnswer\` field.
    - The other three names must be *plausible* but incorrect distractors from a similar era or with a similar reputation.
    - The array of four options must be shuffled randomly.
- **\`justification\` (string):** A short, fun explanation of why the \`clue\` points to the \`correctAnswer\`.
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
      const { output } = await prompt(input);
      // The definePrompt's outputSchema will handle parsing and validation.
      // If output is defined, it's valid according to the schema.
      if (output) {
        return output;
      }
      attempts++;
      if (attempts < 3) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    return null; // All attempts failed
  }
);
