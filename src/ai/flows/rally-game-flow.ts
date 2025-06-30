'use server';
/**
 * @fileOverview AI flow for the Rally Game, generating game actions and outcomes.
 *
 * - playRallyPoint - A function that handles the game logic for a single point.
 * - RallyGameInput - The input type for the function.
 * - RallyGameOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ServeChoiceSchema = z.object({
  name: z.string(),
  description: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
  reward: z.enum(['low', 'medium', 'high']),
});

const ReturnChoiceSchema = z.object({
    name: z.string(),
    description: z.string(),
});

const RallyGameInputSchema = z.object({
  turn: z.enum(['serve', 'return']).describe('Whether the AI should generate serve options or evaluate a return.'),
  player1Rank: z.number().describe('The RacktRank of the serving player.'),
  player2Rank: z.number().describe('The RacktRank of the returning player.'),
  serveChoice: ServeChoiceSchema.optional().describe('The serve chosen by the serving player. Required when turn is "return".'),
  returnChoice: ReturnChoiceSchema.optional().describe('The return chosen by the returning player. Required for evaluation, but not for generating return options.'),
});
export type RallyGameInput = z.infer<typeof RallyGameInputSchema>;

const RallyGameOutputSchema = z.object({
  serveOptions: z.array(ServeChoiceSchema).optional().describe('An array of three distinct serve options.'),
  returnOptions: z.array(ReturnChoiceSchema).optional().describe('An array of three distinct return options based on the serve.'),
  pointWinner: z.enum(['server', 'returner']).optional().describe('The winner of the point after evaluation.'),
  narrative: z.string().optional().describe('An exciting, short narrative describing how the point played out.'),
});
export type RallyGameOutput = z.infer<typeof RallyGameOutputSchema>;


export async function playRallyPoint(input: RallyGameInput): Promise<RallyGameOutput> {
  return rallyGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rallyGamePrompt',
  input: { schema: RallyGameInputSchema },
  output: { schema: RallyGameOutputSchema },
  prompt: `You are a tennis commentator AI that powers a turn-based rally game. Your analysis should consider player ranks (higher is better).

  {{#if (eq turn "serve")}}
  The serving player (Rank: {{{player1Rank}}}) is about to serve. Generate three distinct and creative serve options for them. Each serve must have a name, a short description, and a risk/reward level (low, medium, high).
  - A higher-ranked player should get slightly better options.
  - The output must be an array of 3 serve options in the 'serveOptions' field.
  {{/if}}

  {{#if (eq turn "return")}}
  The serving player (Rank: {{{player1Rank}}}) has just hit a "{{{serveChoice.name}}}" ({{serveChoice.description}}).
  
    {{#if returnChoice}}
      The returning player (Rank: {{{player2Rank}}}) responded with a "{{{returnChoice.name}}}" ({{{returnChoice.description}}}).
      
      Now, act as the game engine. Based on the serve and return, and considering the player ranks, decide who wins the point. The logic should be like rock-paper-scissors:
      - A high-risk, high-reward serve might beat a standard return but could be countered by a specific defensive shot.
      - A safe serve is less likely to be an ace but is also harder to attack.
      - A tricky serve might be beaten by a player who reads it well.
      - A higher-ranked player has a better chance of executing their chosen shot successfully.

      Determine the winner ('server' or 'returner') and write a short, exciting, one or two-sentence narrative of how the point played out.
      - The output must have 'pointWinner' and 'narrative' fields.
    {{else}}
      The returning player (Rank: {{{player2Rank}}}) needs to respond. Generate three distinct and creative return options to counter the "{{{serveChoice.name}}}". Each return must have a name and a short description.
      - The options should be logical counters to the serve type. For example, against a power serve, offer a block or a chip. Against a wide serve, offer a sharp angle back.
      - A higher-ranked player should get slightly better return options.
      - The output must be an array of 3 return options in the 'returnOptions' field.
    {{/if}}
  {{/if}}
  `,
});

const rallyGameFlow = ai.defineFlow(
  {
    name: 'rallyGameFlow',
    inputSchema: RallyGameInputSchema,
    outputSchema: RallyGameOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
