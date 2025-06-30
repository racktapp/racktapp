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
  prompt: `You are an AI-powered sports analyst specializing in predicting match outcomes.

  Analyze the provided player statistics to predict the winner of the match. Your analysis should be insightful, like a sports commentator.

  Sport: {{{sport}}}

  Player 1: {{{player1Name}}}
  - RacktRank: {{{player1RacktRank}}}
  - Win Rate: {{{player1WinRate}}}
  - Current Streak: {{{player1Streak}}}

  Player 2: {{{player2Name}}}
  - RacktRank: {{{player2RacktRank}}}
  - Win Rate: {{{player2WinRate}}}
  - Current Streak: {{{player2Streak}}}

  Head-to-Head Record: {{{player1Name}}} {{headToHead.player1Wins}} - {{headToHead.player2Wins}} {{{player2Name}}}

  Consider these guidelines:
  - Higher RacktRank indicates a stronger player, but is not the only factor.
  - A long winning streak (positive streak number) indicates strong current form (momentum).
  - Head-to-head record is a very important psychological factor. A player with a dominant H2H record might have an edge even with a lower rank.
  - Base your reasoning on all provided stats.
  - The predictedWinner field must be one of 'player1' or 'player2'.
  - Determine a confidence level: 'High', 'Medium', or 'Slight Edge'.
  - The analysis should be a detailed explanation of your reasoning. Mention all the stats and how they influenced your decision.
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
