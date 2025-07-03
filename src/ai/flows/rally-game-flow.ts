'use server';
/**
 * @fileOverview AI flow for the Rally Game, generating game actions and outcomes.
 *
 * - playRallyPoint - A function that handles the game logic for a single point.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    ServeChoiceSchema, 
    ReturnChoiceSchema, 
    RallyGameInputSchema, 
    RallyGameOutputSchema,
    type RallyGameInput, 
    type RallyGameOutput
} from '@/lib/types';


export async function playRallyPoint(input: RallyGameInput): Promise<RallyGameOutput> {
  // This wrapper now simply calls the main flow.
  // The flow itself is now robust and handles errors internally.
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
    input: { schema: z.object({ servingPlayerRank: z.number(), returningPlayerRank: z.number() }) },
    output: { schema: z.object({ serveOptions: z.array(ServeChoiceSchema).length(3) }) },
    prompt: `You are a tennis strategy AI. Your task is to generate three distinct and creative serve options for a player.
    
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
    input: { schema: z.object({ serveChoice: ServeChoiceSchema, servingPlayerRank: z.number(), returningPlayerRank: z.number() }) },
    output: { schema: z.object({ returnOptions: z.array(ReturnChoiceSchema).length(3) }) },
    prompt: `You are a tennis strategy AI. The serving player (Rank: {{{servingPlayerRank}}}) has just hit a serve:
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
    input: { schema: z.object({ serveChoice: ServeChoiceSchema, returnChoice: ReturnChoiceSchema, servingPlayerRank: z.number(), returningPlayerRank: z.number() }) },
    output: { schema: z.object({ pointWinner: z.enum(['server', 'returner']), narrative: z.string().min(10) }) },
    prompt: `You are a tennis commentator AI. A point has just been played.
    
    - **Serving Player (Rank: {{{servingPlayerRank}}}) chose:** "{{{serveChoice.name}}}" ({{{serveChoice.description}}})
    - **Returning Player (Rank: {{{returningPlayerRank}}}) responded with:** "{{{returnChoice.name}}}" ({{{returnChoice.description}}})

    Your task is to decide who wins the point and write a short, exciting narrative of how it unfolded.
    - **The Logic:** High-risk serves are countered by defensive returns. Safe serves are attacked by aggressive returns. A higher-ranked player is more likely to execute their shot successfully and can turn a neutral situation into a winning one.
    
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
        servingPlayerRank: input.servingPlayerRank,
        returningPlayerRank: input.returningPlayerRank,
      });
      return output!; // The prompt's output schema ensures this is valid.

    } else if (!input.returnChoice) {
      // Turn 2: Returning
      const { output } = await returnPrompt({
        serveChoice: input.serveChoice,
        servingPlayerRank: input.servingPlayerRank,
        returningPlayerRank: input.returningPlayerRank,
      });
      return output!;

    } else {
      // Turn 3: Evaluating
      const { output } = await evaluatePrompt({
        serveChoice: input.serveChoice,
        returnChoice: input.returnChoice,
        servingPlayerRank: input.servingPlayerRank,
        returningPlayerRank: input.returningPlayerRank,
      });
      return output!;
    }
  }
);
