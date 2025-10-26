'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { configureGenkit } from 'genkit';

// Configure Genkit and export the 'ai' object
configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { genkit as ai } from 'genkit';
