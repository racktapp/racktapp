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

Your task is to generate a single, high-quality trivia question about a famous player from that sport. The output must be a single JSON object that strictly adheres to the required schema.

**Your Instructions:**

1.  **Select a Player:** Choose a well-known player from the sport of {{{sport}}}. Crucially, the player must NOT be one of the following already used players: {{#if usedPlayers}}{{else}}*(None)*{{/if}}{{#each usedPlayers}}"{{this}}"{{#if @last}}{{else}}, {{/if}}{{/each}}.
2.  **Create a Clue:** Write a clever, one-sentence, and slightly cryptic clue about your chosen player's career, style, or a famous achievement for the 'clue' field.
3.  **Generate Options:** Create a list of 4 multiple-choice options for the 'options' field.
    - The 'options' field must be an array of exactly four strings.
    - One option MUST be the name of the correct player you chose. This name must also be in the 'correctAnswer' field.
    - The other three options must be *plausible* but incorrect distractors. They should be players from a similar era or with a similar reputation to make the question challenging.
    - The final array of four options must be shuffled randomly.
4.  **Write Justification:** For the 'justification' field, provide a short, fun explanation of why the clue points to the correct player.
5.  **Format Output:** The entire output must be a single, valid JSON object. Do not include any other text, markdown, or explanations outside of the JSON structure.

**Example JSON format:**
\`\`\`json
{
  "clue": "This player was known for their one-handed backhand and completing a career Grand Slam.",
  "correctAnswer": "Roger Federer",
  "options": [
    "Rafael Nadal",
    "Roger Federer",
    "Novak Djokovic",
    "Andy Murray"
  ],
  "justification": "Roger Federer is famous for his elegant one-handed backhand and was one of the few to achieve a career Grand Slam."
}
\`\`\`
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
    return output || null;
  }
);
