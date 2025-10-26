
'use server';

import { googleAI } from '@genkit-ai/google-genai';
import { genkit } from 'genkit';

// This file is simplified to only export the googleAI plugin constructor.
// Genkit instances will be created dynamically where needed.
export { googleAI };

// We create a dummy instance here just to satisfy any legacy imports
// that might still be pointing to `ai` from this file.
// This helps prevent "module has no exported member 'ai'" errors during transition.
export const ai = genkit({
  plugins: [],
});
