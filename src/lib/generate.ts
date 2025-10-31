'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// This is a server-side file. It should not be imported directly into client components.

type CallResult = { text: string; model: string };

async function callGoogleAI(prompt: string, apiKey: string, requestedModel?: string): Promise<CallResult> {
  if (!apiKey) {
    throw new Error("No se ha configurado una clave API de Google AI válida. Ve a Ajustes para agregarla.");
  }
  
  // Configure Genkit on-the-fly for each request.
  // This ensures the latest API key from settings is used.
  const ai = genkit({
    plugins: [googleAI({ apiKey: apiKey })],
  });

  // Build a prioritized list of models to try: requested first, then fallbacks
  const fallbackCandidates = [
    ...(requestedModel ? [requestedModel] : []),
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
  ];

  const triedModels: string[] = [];

  for (const model of fallbackCandidates) {
    if (!model) continue;
    triedModels.push(model);
    try {
      const response = await ai.generate({
        model,
        prompt,
        config: {
          temperature: 0.5,
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_ONLY_HIGH',
            },
          ],
        },
      });
      return { text: response.text, model };
    } catch (e: any) {
      // Log error with as much context as is safe (avoid logging API keys)
      try {
        const safeInfo = {
          message: e?.message,
          name: e?.name,
          code: e?.code || e?.status,
        };
        console.error(`Genkit AI Error for model=${model}:`, JSON.stringify(safeInfo));
        if (e?.response) {
          console.error(`Genkit AI response info for model=${model}:`, { status: e.response?.status, bodySnippet: String(e.response?.body)?.slice(0, 200) });
        }
      } catch (logErr) {
        console.error('Error while logging Genkit AI error', logErr);
      }

      const msg = (e?.originalMessage || e?.message || '').toString().toLowerCase();
      // If error is model-not-found, continue to next fallback
      if (msg.includes('model') && msg.includes('not found')) {
        console.warn(`Model not found for requested model '${model}'. Trying next fallback if available.`);
        continue; // try next model
      }

      // For API key invalid errors, give a clear message
      if (msg.includes('api key') || msg.includes('invalid') || msg.includes('not authorized') || msg.includes('permission')) {
        throw new Error('La clave API de Google AI proporcionada no es válida o no tiene permisos. Verifica la clave.');
      }

      // For other errors, stop and rethrow a friendly message
      throw new Error(`Error del servicio de IA: ${e?.message || 'Error desconocido'}`);
    }
  }

  // If we reached here, none of the candidate models succeeded
  throw new Error(`Ningún modelo disponible respondió correctamente. Modelos intentados: ${triedModels.join(', ')}. Verifica tu clave o selecciona otro modelo en Ajustes.`);
}
export async function generateFeedback(prompt: string, apiKey: string, model?: string): Promise<string> {
  const res = await callGoogleAI(prompt, apiKey, model);
  return res.text;
}

export async function generateGroupAnalysis(prompt: string, apiKey: string, model?: string): Promise<{ text: string; model: string }> {
  const res = await callGoogleAI(prompt, apiKey, model);
  return { text: res.text, model: res.model };
}

export async function generateSemesterAnalysis(prompt: string, apiKey: string, model?: string): Promise<string> {
  const res = await callGoogleAI(prompt, apiKey, model);
  return res.text;
}

// Función para probar la clave API
export async function testApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) {
    throw new Error('Por favor, introduce tu clave API de Google AI');
  }

  try {
    const testPrompt = "Responde únicamente con la palabra 'OK' si este mensaje llega correctamente.";
    const response = await callGoogleAI(testPrompt, apiKey);
    return response.text.trim() === 'OK';
  } catch (error) {
    console.error('Error testing Google AI API key:', error);
    throw error; // Re-throw the specific error from callGoogleAI
  }
}
