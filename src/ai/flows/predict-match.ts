// src/ai/flows/predict-match.ts
'use server';
/**
 * @fileOverview AI-powered match prediction flow.
 *
 * - predictMatchOutcome - Predicts the outcome of a match based on player stats.
 * - PredictMatchInput - Input type for predictMatchOutcome.
 * - PredictMatchOutput - Output type for predictMatchOutcome.
 */

import {ai} from '@/ai/genkit';
import {PredictMatchInputSchema, PredictMatchOutputSchema, type PredictMatchInput, type PredictMatchOutput } from '@/lib/types';
import {z} from 'genkit'; // z is also exported from genkit

export async function predictMatchOutcome(input: PredictMatchInput): Promise<PredictMatchOutput> {
  return predictMatchFlow(input);
}

const predictMatchPrompt = ai.definePrompt({
  name: 'predictMatchPrompt',
  input: {schema: PredictMatchInputSchema},
  output: {schema: PredictMatchOutputSchema},
  prompt: `You are an AI-powered sports analyst, acting as an expert commentator for an upcoming match in {{{sport}}}. Your task is to provide a confident prediction and a compelling analysis based on the provided data.

**Match Data:**

*   **Player 1:** {{{player1Name}}}
    *   RacktRank: {{{player1RacktRank}}}
    *   Win Rate: {{player1WinRate}}
    *   Current Streak: {{{player1Streak}}}
*   **Player 2:** {{{player2Name}}}
    *   RacktRank: {{{player2RacktRank}}}
    *   Win Rate: {{player2WinRate}}
    *   Current Streak: {{{player2Streak}}}
*   **Head-to-Head:** {{{player1Name}}} {{headToHead.player1Wins}} - {{headToHead.player2Wins}} {{{player2Name}}}

**Your Task:**

1.  **Predict the Winner:** Choose between 'player1' and 'player2' for the \`predictedWinner\` field.
2.  **Set Confidence:** Determine a \`confidence\` level: 'High', 'Medium', or 'Slight Edge'.
3.  **Write Your Analysis:** In the \`analysis\` field, write a detailed breakdown of your reasoning. You MUST reference all the provided stats (RacktRank, Win Rate, Streak, and Head-to-Head) and explain how each factor contributes to your decision. Weigh the factors against each other. For example, discuss if a strong head-to-head record might overcome a lower RacktRank, or if a current hot streak suggests an upset is possible. Be insightful and professional. The win rate is a number between 0 and 1.
`,
});

const predictMatchFlow = ai.defineFlow(
  {
    name: 'predictMatchFlow',
    inputSchema: PredictMatchInputSchema,
    outputSchema: PredictMatchOutputSchema,
  },
  async input => {
    const {output} = await predictMatchPrompt(input);
    return output!;
  }
);
