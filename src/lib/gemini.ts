'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Tests if the provided Google AI API key is valid by making a simple request.
 * @param apiKey The Google AI API key to test.
 * @returns A promise that resolves to true if the key is valid, and throws an error otherwise.
 */
export async function testApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) {
    throw new Error('La clave de API no puede estar vacía.');
  }

  try {
    // Configure a temporary Genkit instance with the new key
    const testAI = genkit({
      plugins: [googleAI({ apiKey })],
    });

    // Make a simple, low-cost request to validate the key
    await testAI.generate({
      model: 'gemini-1.5-flash-latest',
      prompt: 'Test',
      config: { temperature: 0 },
    });

    return true;
  } catch (error: any) {
    console.error("API Key validation failed:", error);
    if (error.message && (error.message.includes('API key not valid') || error.message.includes('permission_denied'))) {
        throw new Error('La clave de API proporcionada no es válida. Por favor, revísala.');
    }
    throw new Error('No se pudo validar la clave de API. Verifica tu conexión o la clave.');
  }
}
