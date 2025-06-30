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

const RallyGamePromptInputSchema = RallyGameInputSchema.extend({
  isServeTurn: z.boolean(),
  isReturnTurn: z.boolean(),
});

const prompt = ai.definePrompt({
  name: 'rallyGamePrompt',
  input: { schema: RallyGamePromptInputSchema },
  output: { schema: RallyGameOutputSchema },
  prompt: `You are a tennis strategy AI and commentator that powers a turn-based rally game. Your analysis must always consider the player ranks (a higher rank means a more skilled player).

{{#if isServeTurn}}
**ROLE: Serve Strategist**
The serving player (Rank: {{{player1Rank}}}) is preparing to serve against the returning player (Rank: {{{player2Rank}}}). Your task is to generate three distinct and creative serve options. Each serve must have a \`name\`, a \`description\`, a \`risk\` level, and a \`reward\` level.
- Be creative with the names (e.g., "The Cannonball", "Wicked Slice", "The Ghoster").
- A higher-ranked player should receive slightly more advantageous options.
- The output MUST be an array of 3 serve options in the 'serveOptions' field.
{{/if}}

{{#if isReturnTurn}}
The serve has been hit! The serving player (Rank: {{{player1Rank}}}) used: **"{{{serveChoice.name}}}"** ({{serveChoice.description}}).

  {{#if returnChoice}}
    **ROLE: Point Evaluator**
    The returning player (Rank: {{{player2Rank}}}) responded with a **"{{{returnChoice.name}}}"** ({{{returnChoice.description}}}).

    Now, act as the game engine. Based on the serve and the return, decide who wins the point. The logic is a strategic contest, not random:
    - High-risk serves are powerful but can be countered by smart, defensive returns.
    - Safe serves are consistent but can be attacked by aggressive returns.
    - Tricky serves rely on deception and can be beaten by a player who anticipates them well.
    - **Rank Matters:** A higher-ranked player is more likely to successfully execute their shot and overcome a slight disadvantage in shot selection. A significant rank difference can turn a neutral situation into a winning one.

    You must determine the \`pointWinner\` ('server' or 'returner') and write a short, exciting, one or two-sentence \`narrative\` of how the point played out.
  {{else}}
    **ROLE: Return Strategist**
    The returning player (Rank: {{{player2Rank}}}) must react. Your task is to generate three distinct and logical return options to counter the serve. Each return must have a \`name\` and a \`description\`.
    - The options must be logical counters. Against a power serve, offer a block or a chip. Against a wide slice, offer a sharp cross-court angle or a down-the-line surprise.
    - A higher-ranked player should receive slightly better tactical options.
    - The output MUST be an array of 3 return options in the 'returnOptions' field.
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
    const promptInput = {
      ...input,
      isServeTurn: input.turn === 'serve',
      isReturnTurn: input.turn === 'return',
    };
    const { output } = await prompt(promptInput);
    return output!;
  }
);
