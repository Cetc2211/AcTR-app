
'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize the 'ai' object with plugins
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
    }),
  ],
});
