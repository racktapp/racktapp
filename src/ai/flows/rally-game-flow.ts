
'use server';
/**
 * @fileOverview AI flow for the Rally Game, generating game actions and outcomes.
 *
 * - playRallyPoint - A function that handles the game logic for a single point.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SPORTS } from '@/lib/constants';

// --- Schema Definitions ---
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
  sport: z.enum(SPORTS),
  servingPlayerRank: z.number().describe('The RacktRank of the player who is serving this turn.'),
  returningPlayerRank: z.number().describe('The RacktRank of the player who is receiving serve this turn.'),
  serveChoice: ServeChoiceSchema.optional().describe('The serve chosen by the serving player. If present, the AI should generate return options or evaluate the point.'),
  returnChoice: ReturnChoiceSchema.optional().describe('The return chosen by the returning player. If present (along with serveChoice), the AI should evaluate the point.'),
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
  const output = await rallyGameFlow(input);
  if (!output) {
      throw new Error('The AI failed to generate a valid game action.');
  }
  return output;
}

// --- Prompt Definitions ---

// Prompt 1: Generate Serve Options
const servePrompt = ai.definePrompt({
    name: 'rallyGameServePrompt',
    input: { schema: z.object({ sport: z.enum(SPORTS), servingPlayerRank: z.number(), returningPlayerRank: z.number() }) },
    output: { schema: z.object({ serveOptions: z.array(ServeChoiceSchema).length(3) }) },
    prompt: `You are a {{{sport}}} strategy AI. Your task is to generate three distinct and creative serve options for a player.
    
    The serving player has a rank of **{{{servingPlayerRank}}}**.
    The returning player has a rank of **{{{returningPlayerRank}}}**.

    A higher rank means a more skilled player. The options should reflect this; a higher-ranked player might get more advantageous or complex options.

    You MUST return a valid JSON object with a 'serveOptions' field, which is an array of exactly 3 serve option objects.
    Each serve option must have a \`name\`, a \`description\`, a \`risk\` level ('low', 'medium', 'high'), and a \`reward\` level ('low', 'medium', 'high').
    `,
});

// Prompt 2: Generate Return Options
const returnPrompt = ai.definePrompt({
    name: 'rallyGameReturnPrompt',
    input: { schema: z.object({ sport: z.enum(SPORTS), serveChoice: ServeChoiceSchema, servingPlayerRank: z.number(), returningPlayerRank: z.number() }) },
    output: { schema: z.object({ returnOptions: z.array(ReturnChoiceSchema).length(3) }) },
    prompt: `You are a {{{sport}}} strategy AI. The serving player (Rank: {{{servingPlayerRank}}}) has just hit a serve:
    - **Serve Name:** {{{serveChoice.name}}}
    - **Description:** {{{serveChoice.description}}}

    Your task is to generate three distinct and logical return options for the returning player (Rank: {{{returningPlayerRank}}}).
    - The options must be logical counters to the specific serve.
    - A higher-ranked returning player should get slightly better tactical options.

    You MUST return a valid JSON object with a 'returnOptions' field, which is an array of exactly 3 return option objects.
    Each return option must have a \`name\` and a \`description\`.
    `,
});

// Prompt 3: Evaluate the Point
const evaluatePrompt = ai.definePrompt({
    name: 'rallyGameEvaluatePrompt',
    input: { schema: z.object({ sport: z.enum(SPORTS), serveChoice: ServeChoiceSchema, returnChoice: ReturnChoiceSchema, servingPlayerRank: z.number(), returningPlayerRank: z.number() }) },
    output: { schema: z.object({ pointWinner: z.enum(['server', 'returner']), narrative: z.string().min(10) }) },
    prompt: `You are an expert {{{sport}}} analyst and commentator AI. Your task is to determine the winner of a single point of {{{sport}}} and write a compelling narrative for how it unfolded.

**MATCHUP DATA:**
- **Serving Player (Rank: {{{servingPlayerRank}}}) chose a serve:**
    - Name: "{{{serveChoice.name}}}"
    - Description: "{{{serveChoice.description}}}"
    - Risk: "{{{serveChoice.risk}}}"
    - Reward: "{{{serveChoice.reward}}}"
- **Returning Player (Rank: {{{returningPlayerRank}}}) chose a return:**
    - Name: "{{{returnChoice.name}}}"
    - Description: "{{{returnChoice.description}}}"

**YOUR TASK:**
1.  **DETERMINE THE WINNER:** Analyze the matchup between the serve and the return. There must be variety in the outcomes. The server does not always lose.
    - **Server Wins (Ace or Forced Error):** If the serve has a high reward and high risk, there's a good chance it's an ace or an unreturnable serve, especially if the server's rank is high.
    - **Server Wins (In a Rally):** If the serve is solid (e.g., medium reward) and the return is defensive, the server might gain an advantage and win the point after a short, invented rally.
    - **Returner Wins (Winner or Forced Error):** If the serve is low risk/low reward, the returner has a chance to be aggressive and hit a winner. A high-skill returner can also punish a medium-risk serve.
    - **Player Rank Matters:** A higher-ranked player is more likely to execute their intended shot successfully. A large rank difference can turn a disadvantage into an advantage. For example, a high-ranked server can still win even with a low-risk serve if the returner is much lower-ranked.
    - **BE PROBABILISTIC:** Do not use a deterministic "rock-paper-scissors" logic. Introduce randomness. The same matchup of serve/return should not always produce the same winner. The server should win roughly 40-60% of the time to keep it realistic.

2.  **WRITE THE NARRATIVE:** Create a short (1-2 sentence) story of the point. This narrative should **invent a short rally** if appropriate. Do not just describe the serve and return.
    - **Example of a Rally Narrative (Server Win):** "The server hits a heavy kick serve out wide, pulling the returner off the court. The returner manages a defensive slice back, but the server steps in and drills a forehand winner down the line."
    - **Example (Returner Win):** "A risky second serve just clips the line, but the returner was ready, taking the ball early and ripping a clean backhand winner cross-court."
    - **Example (Ace):** "What a serve! A perfectly placed ace down the T, leaving the returner flat-footed."

You MUST return a valid JSON object with a 'pointWinner' field ('server' or 'returner') and a 'narrative' field describing the point.
`,
});


// --- Main Flow Definition ---

const rallyGameFlow = ai.defineFlow(
  {
    name: 'rallyGameFlow',
    inputSchema: RallyGameInputSchema,
    outputSchema: RallyGameOutputSchema,
  },
  async (input) => {
    // This flow acts as a router, calling the correct, simple prompt.
    // This is much more robust than a single complex prompt.

    if (!input.serveChoice) {
      // Turn 1: Serving
      const { output } = await servePrompt({
        sport: input.sport,
        servingPlayerRank: input.servingPlayerRank,
        returningPlayerRank: input.returningPlayerRank,
      });
      return output!;

    } else if (!input.returnChoice) {
      // Turn 2: Returning
      const { output } = await returnPrompt({
        sport: input.sport,
        serveChoice: input.serveChoice,
        servingPlayerRank: input.servingPlayerRank,
        returningPlayerRank: input.returningPlayerRank,
      });
      return output!;

    } else {
      // Turn 3: Evaluating
      const { output } = await evaluatePrompt({
        sport: input.sport,
        serveChoice: input.serveChoice,
        returnChoice: input.returnChoice,
        servingPlayerRank: input.servingPlayerRank,
        returningPlayerRank: input.returningPlayerRank,
      });
      return output!;
    }
  }
);
