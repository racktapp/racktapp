
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This is the correct way to initialize Genkit in a server environment
// that uses environment variables. The API key will be automatically
// picked up from the process.env.GEMINI_API_KEY.
export const ai = genkit({
  plugins: [googleAI()],
});
