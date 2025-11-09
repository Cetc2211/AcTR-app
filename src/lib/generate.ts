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
    plugins: [googleAI({ apiKey: apiKey, location: 'us-central1' })],
  });

  // Lista de modelos válidos conocidos (texto)
  const allowedModels = [
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ] as const;

  // Normalizamos el modelo solicitado: si no es válido, lo ignoramos
  const requestedFirst = requestedModel && allowedModels.includes(requestedModel as any) ? [requestedModel] : [];

    // Build a prioritized list of models to try: requested first, then fallbacks
  // Use official, stable model names for broad compatibility.
  const fallbackCandidates = [
    ...(requestedModel ? [requestedModel] : []),
    'gemini-1.5-flash-latest',
    'gemini-pro',
  ];

  const uniqueCandidates = Array.from(new Set(fallbackCandidates));
  const triedModels: string[] = [];

  for (const model of uniqueCandidates) {
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
          modelTried: model,
          isModelNotFound: (e?.originalMessage || e?.message || '').toString().toLowerCase().includes('not found'),
          responseStatus: e?.response?.status,
          responseType: e?.response?.type,
        };
        console.error(`[Genkit AI Error] Intento fallido para modelo=${model}:`, JSON.stringify(safeInfo, null, 2));
        
        if (e?.response?.body) {
          const bodySnippet = String(e.response.body).slice(0, 200);
          console.error(`[Genkit AI Response] Detalle para modelo=${model}:`, { 
            bodyPreview: bodySnippet,
            contentType: e.response.headers?.['content-type']
          });
        }
      } catch (logErr) {
        console.error('[Error de Logging] No se pudo registrar el error de Genkit:', logErr);
      }

      const msg = (e?.originalMessage || e?.message || '').toString().toLowerCase();
      // Si el modelo no se encuentra, intentar el siguiente
      if (msg.includes('model') && msg.includes('not found')) {
        console.warn(`[Genkit Fallback] Modelo '${model}' no encontrado o no disponible. Probando siguiente modelo...`);
        continue; // Probar siguiente modelo
      }

      // Para errores de clave API, dar mensaje claro
      if (msg.includes('api key') || msg.includes('invalid') || msg.includes('not authorized') || msg.includes('permission')) {
        throw new Error(
          'La clave API de Google AI proporcionada no es válida o no tiene acceso a los modelos de Gemini. ' +
          'Verifica que: \n' +
          '1. La clave API sea correcta\n' +
          '2. Tengas acceso a la API de Gemini\n' +
          '3. Tu cuenta tenga permisos para los modelos solicitados'
        );
      }

      // Para errores de cuota o límites
      if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('capacity')) {
        throw new Error(
          'Se ha alcanzado el límite de uso de la API. ' +
          'Esto puede ocurrir si:\n' +
          '1. Has excedido tu cuota gratuita\n' +
          '2. Hay muchas solicitudes simultáneas\n' +
          'Intenta nuevamente en unos minutos o contacta al soporte si persiste.'
        );
      }

      // Para otros errores, detener y relanzar con mensaje amigable
      throw new Error(`Error del servicio de IA: ${e?.message || 'Error desconocido'}\n` +
        'Si el problema persiste, verifica tu conexión e intenta con otro modelo en Ajustes.');
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
