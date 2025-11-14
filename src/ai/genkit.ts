import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// This configures Genkit for the entire application.
// By NOT providing an apiKey here, we ensure that each flow
// is responsible for providing its own key, which aligns with
// the multi-user API key requirement.
const ai = genkit({
  plugins: [
    googleAI(),
  ],
});

// We export the configured genkit instance as 'ai'.
// Flows will import this instance to define themselves.
export { ai };
