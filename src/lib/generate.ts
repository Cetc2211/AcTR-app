'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// This is a server-side file. It should not be imported directly into client components.

async function callGoogleAI(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error("No se ha configurado una clave API de Google AI válida. Ve a Ajustes para agregarla.");
  }
  
  // Configure Genkit on-the-fly for each request.
  // This ensures the latest API key from settings is used.
  const ai = genkit({
    plugins: [googleAI({ apiKey: apiKey })],
  });
  
  try {
    const response = await ai.generate({
      model: 'gemini-1.5-flash-latest',
      prompt,
      config: {
        temperature: 0.5,
        safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH"
            },
        ],
      },
    });
    return response.text;
  } catch (e: any) {
    // Log error with as much context as is safe (avoid logging API keys)
    try {
      const safeInfo = {
        message: e?.message,
        name: e?.name,
        // if the library provides a status or code, include it
        code: e?.code || e?.status,
      };
      console.error("Genkit AI Error:", JSON.stringify(safeInfo));
      if (e?.response) {
        // response may be large - log only status and a short snippet if available
        console.error("Genkit AI response info:", { status: e.response?.status, bodySnippet: String(e.response?.body)?.slice(0, 200) });
      }
    } catch (logErr) {
      console.error('Error while logging Genkit AI error', logErr);
    }
    // Improve error message for common API key issues
    if (e.message && (e.message.includes('API key not valid') || e.message.includes('invalid api key'))) {
        throw new Error("La clave API de Google AI proporcionada no es válida. Verifica que sea correcta.");
    }
     if (e.message && e.message.includes('not found')) {
      throw new Error(`El modelo no fue encontrado o no está disponible. Asegúrate de usar un modelo válido como 'gemini-1.5-flash-latest'.`);
    }
    // Handle model-not-found errors specifically to provide actionable feedback to the user
    const msg = (e?.originalMessage || e?.message || '').toString().toLowerCase();
    if (msg.includes('model') && msg.includes('not found')) {
      // Try to extract the model name for a clearer message
      const m = (e?.originalMessage || e?.message || '').toString();
      const modelMatch = m.match(/Model '\s*([^']+)\s*' not found/i) || m.match(/Model "\s*([^\"]+)\s*" not found/i);
      const modelName = modelMatch ? modelMatch[1] : undefined;
      if (modelName) {
        throw new Error(`El modelo '${modelName}' no está disponible para la clave API proporcionada. Verifica que tu clave tenga permisos para usar ese modelo o prueba con otra clave.`);
      }
      throw new Error('El modelo solicitado no fue encontrado. Verifica que tu clave API tenga acceso al modelo solicitado.');
    }

    throw new Error(`Error del servicio de IA: ${e.message || 'Error desconocido'}`);
  }
}


export async function generateFeedback(prompt: string, apiKey: string): Promise<string> {
    return await callGoogleAI(prompt, apiKey);
}

export async function generateGroupAnalysis(prompt: string, apiKey: string): Promise<string> {
    return await callGoogleAI(prompt, apiKey);
}

export async function generateSemesterAnalysis(prompt: string, apiKey: string): Promise<string> {
    return await callGoogleAI(prompt, apiKey);
}

// Función para probar la clave API
export async function testApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) {
    throw new Error('Por favor, introduce tu clave API de Google AI');
  }

  try {
    const testPrompt = "Responde únicamente con la palabra 'OK' si este mensaje llega correctamente.";
    const response = await callGoogleAI(testPrompt, apiKey);
    return response.trim() === 'OK';
  } catch (error) {
    console.error('Error testing Google AI API key:', error);
    throw error; // Re-throw the specific error from callGoogleAI
  }
}
