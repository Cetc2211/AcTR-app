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
    console.error("Genkit AI Error:", e);
    // Improve error message for common API key issues
    if (e.message && (e.message.includes('API key not valid') || e.message.includes('invalid api key'))) {
        throw new Error("La clave API de Google AI proporcionada no es válida. Verifica que sea correcta.");
    }
     if (e.message && e.message.includes('not found')) {
      throw new Error(`El modelo no fue encontrado o no está disponible. Asegúrate de usar un modelo válido como 'gemini-1.5-flash-latest'.`);
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
