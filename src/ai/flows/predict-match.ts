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
import {z} from 'genkit';

const PredictMatchInputSchema = z.object({
  player1RacktRank: z.number().describe('The RacktRank of player 1.'),
  player2RacktRank: z.number().describe('The RacktRank of player 2.'),
  player1WinRate: z.number().describe('The win rate of player 1 (0 to 1).'),
  player2WinRate: z.number().describe('The win rate of player 2 (0 to 1).'),
  player1Streak: z.number().int().describe('The current win/loss streak of player 1 (positive for win streak, negative for loss streak).'),
  player2Streak: z.number().int().describe('The current win/loss streak of player 2 (positive for win streak, negative for loss streak).'),
  sport: z.enum(['Tennis', 'Padel', 'Badminton', 'Table Tennis']).describe('The sport being played.'),
});

export type PredictMatchInput = z.infer<typeof PredictMatchInputSchema>;

const PredictMatchOutputSchema = z.object({
  predictedWinner: z.enum(['player1', 'player2', 'draw']).describe('The predicted winner of the match.'),
  confidence: z.number().describe('The confidence level of the prediction (0 to 1).'),
  analysis: z.string().describe('An analysis of the factors contributing to the prediction.'),
});

export type PredictMatchOutput = z.infer<typeof PredictMatchOutputSchema>;

export async function predictMatchOutcome(input: PredictMatchInput): Promise<PredictMatchOutput> {
  return predictMatchFlow(input);
}

const predictMatchPrompt = ai.definePrompt({
  name: 'predictMatchPrompt',
  input: {schema: PredictMatchInputSchema},
  output: {schema: PredictMatchOutputSchema},
  prompt: `You are an AI-powered sports analyst specializing in predicting match outcomes.

  Analyze the provided player statistics to predict the winner of the match. Consider RacktRank, win rate, and current streak for both players.
  Provide a confidence level (0 to 1) for your prediction.
  Explain the factors contributing to your prediction in the analysis.

  Sport: {{{sport}}}

  Player 1 RacktRank: {{{player1RacktRank}}}
  Player 1 Win Rate: {{{player1WinRate}}}
  Player 1 Streak: {{{player1Streak}}}

  Player 2 RacktRank: {{{player2RacktRank}}}
  Player 2 Win Rate: {{{player2WinRate}}}
  Player 2 Streak: {{{player2Streak}}}

  Consider these guidelines:
  - Higher RacktRank indicates a stronger player.
  - Higher win rate indicates better performance.
  - Positive streak indicates good current form.
  - Factor in the sport being played.
  - The predictedWinner field must be one of 'player1', 'player2', or 'draw'.
  - The confidence field is a number between 0 and 1 representing the certainty of the prediction.
  - The analysis should be a detailed explanation as to why the winner was chosen, or why a draw was predicted. Mention each player's stats.
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
