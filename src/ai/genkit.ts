import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: 'AIzaSyAcSm8ZhLI6epx4zbRYvJZNJGHEJdTaLdY'})