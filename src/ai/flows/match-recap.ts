// match-recap-flow.ts
'use server';
/**
 * @fileOverview Generates a short, exciting narrative of a match based on the score and players.
 *
 * - getMatchRecap - A function that handles the match recap generation process.
 * - MatchRecapInput - The input type for the getMatchRecap function.
 * - MatchRecapOutput - The return type for the getMatchRecap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchRecapInputSchema = z.object({
  player1Name: z.string().describe('The name of player 1.'),
  player2Name: z.string().describe('The name of player 2.'),
  score: z.string().describe('The score of the match (e.g., 6-4, 7-5).'),
  sport: z.string().describe('The sport the match was in (e.g. Tennis, Padel).'),
});
export type MatchRecapInput = z.infer<typeof MatchRecapInputSchema>;

const MatchRecapOutputSchema = z.object({
  recap: z.string().describe('A short, exciting narrative of the match.'),
});
export type MatchRecapOutput = z.infer<typeof MatchRecapOutputSchema>;

export async function getMatchRecap(input: MatchRecapInput): Promise<MatchRecapOutput> {
  return matchRecapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchRecapPrompt',
  input: {schema: MatchRecapInputSchema},
  output: {schema: MatchRecapOutputSchema},
  prompt: `You are a sports journalist AI, known for your ability to craft short, punchy, and exciting match recaps. Your tone should be energetic and a little dramatic.

Based on the provided match data, write a captivating 2-3 sentence narrative of how the match unfolded. Do not just state the result; invent a story for the match. For example, was it a comeback? A dominant performance? A nail-biting thriller?

**Key Instructions:**
- Use vivid, powerful language.
- Create a sense of drama and excitement.
- Do NOT mention that you are an AI.
- The output should be a single paragraph in the 'recap' field.

**Match Data:**
- **Sport:** {{{sport}}}
- **Players:** {{{player1Name}}} vs {{{player2Name}}}
- **Final Score:** {{{score}}}
  `,
});

const matchRecapFlow = ai.defineFlow(
  {
    name: 'matchRecapFlow',
    inputSchema: MatchRecapInputSchema,
    outputSchema: MatchRecapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
