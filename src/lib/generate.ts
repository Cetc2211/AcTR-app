'use server';

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

// This is a server-side file. It should not be imported directly into client components.

type CallResult = { text: string; model: string };

/**
 * Calls the Google AI API with a given prompt and API key, trying a list of candidate models.
 * This function is designed to work with simple, free-tier API keys from Google AI Studio.
 *
 * @param prompt The text prompt to send to the model.
 * @param apiKey The user's Google AI API key.
 * @param requestedModel An optional preferred model to try first.
 * @returns A promise that resolves to an object containing the generated text and the model used.
 */
async function callGoogleAI(
  prompt: string,
  apiKey: string,
  requestedModel?: string,
): Promise<CallResult> {
  if (!apiKey) {
    throw new Error(
      'No se ha configurado una clave API de Google AI válida. Ve a Ajustes para agregarla.',
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Build a prioritized list of models to try.
  // 'gemini-1.5-flash-latest' is the recommended and most capable model for free-tier API keys from AI Studio.
  const fallbackCandidates = [
    requestedModel,
    'gemini-1.5-flash-latest',
    'gemini-pro', // A solid fallback if 1.5-flash is unavailable for any reason.
  ].filter(Boolean) as string[]; // Filter out undefined/null if requestedModel is not provided

  const uniqueCandidates = Array.from(new Set(fallbackCandidates));
  const triedModels: string[] = [];
  let lastError: any = null;

  for (const modelName of uniqueCandidates) {
    triedModels.push(modelName);
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return { text, model: modelName };
    } catch (e: any) {
      lastError = e;
      const errorMessage = e.toString().toLowerCase();
      console.error(
        `[Google AI Error] Intento fallido para modelo=${modelName}:`,
        e.message,
      );

      // If the model is not found or permission is denied for it, try the next one.
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('permission denied') ||
        e.status === 404
      ) {
        console.warn(
          `[Google AI Fallback] Modelo '${modelName}' no encontrado o no accesible. Probando siguiente...`,
        );
        continue;
      }

      // Handle specific API key errors
      if (errorMessage.includes('api key not valid')) {
        throw new Error(
          'La clave API de Google AI proporcionada no es válida. ' +
            'Por favor, verifica que la copiaste correctamente desde Google AI Studio.',
        );
      }

      // Handle quota errors
      if (errorMessage.includes('quota') || e.status === 429) {
        throw new Error(
          'Has excedido la cuota de uso para tu clave de API. ' +
            'El plan gratuito tiene límites. Por favor, intenta de nuevo más tarde.',
        );
      }

      // For other errors, don't continue, as it's likely a fundamental issue.
      break;
    }
  }

  // If we looped through all candidates and none succeeded, throw a comprehensive error.
  let finalErrorMessage = `Ningún modelo disponible respondió correctamente. Modelos intentados: ${triedModels.join(
    ', ',
  )}.`;

  if (lastError) {
    const specificError = lastError.toString().toLowerCase();
    if (specificError.includes('api key not valid')) {
      finalErrorMessage =
        'La clave API de Google AI no es válida. Asegúrate de obtenerla de Google AI Studio.';
    } else if (specificError.includes('quota')) {
      finalErrorMessage =
        'Se ha excedido la cuota de uso de la API. Intenta de nuevo más tarde.';
    } else {
      finalErrorMessage += ` Último error: ${lastError.message}`;
    }
  }

  throw new Error(finalErrorMessage);
}

export async function generateFeedback(
  prompt: string,
  apiKey: string,
  model?: string,
): Promise<string> {
  const res = await callGoogleAI(prompt, apiKey, model);
  return res.text;
}

export async function generateGroupAnalysis(
  prompt: string,
  apiKey: string,
  model?: string,
): Promise<{ text: string; model: string }> {
  const res = await callGoogleAI(prompt, apiKey, model);
  return { text: res.text, model: res.model };
}

export async function generateSemesterAnalysis(
  prompt: string,
  apiKey: string,
  model?: string,
): Promise<string> {
  const res = await callGoogleAI(prompt, apiKey, model);
  return res.text;
}

// Función para probar la clave API
export async function testApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) {
    throw new Error('Por favor, introduce tu clave API de Google AI');
  }

  try {
    const testPrompt =
      "Responde únicamente con la palabra 'OK' si este mensaje llega correctamente.";
    const response = await callGoogleAI(testPrompt, apiKey);
    // Be lenient with the check, as the model might add extra whitespace.
    return response.text.trim().toUpperCase() === 'OK';
  } catch (error) {
    console.error('Error testing Google AI API key:', error);
    throw error; // Re-throw the specific, user-friendly error from callGoogleAI
  }
}
