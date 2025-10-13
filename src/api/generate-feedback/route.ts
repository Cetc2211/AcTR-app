// ./src/app/api/generate-feedback/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

/**
 * @description Llama a la API de Google AI para generar texto.
 * @param {string} prompt El texto de la solicitud (prompt) para la IA.
 * @param {string} apiKey La clave API de Google AI.
 * @returns {Promise<string>} El texto de respuesta generado por la IA.
 */
async function callGoogleAI(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error("No se ha configurado una clave API de Google AI válida.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro", // Puedes usar gemini-1.5-flash si está disponible
      generationConfig: {
        temperature: 0.5,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
      const text = response.text(); // Usar directamente 'response.text' o 'response.text()' dependiendo de la versión

    if (!text) {
      throw new Error("La IA no generó una respuesta de texto.");
    }

    return text;

  } catch (e: any) {
    console.error("Google Generative AI Error:", e);
    let errorMessage = `Error del servicio de IA: ${e.message || 'Error desconocido'}`;
    
    // Mejor manejo de errores para el usuario final
    if (e.message && (e.message.includes('API key not valid') || e.message.includes('invalid api key'))) {
      errorMessage = "La clave API de Google AI proporcionada no es válida.";
    } else if (e.message && e.message.includes('permission denied')) {
      errorMessage = "Permiso denegado. Revisa que tu clave API esté habilitada para el modelo.";
    } else if (e.message && e.message.includes('not found')) {
      errorMessage = `Error del servicio de IA: El modelo no fue encontrado o no está disponible.`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * @description Maneja la solicitud POST para generar retroalimentación.
 * Espera un JSON con 'prompt' y 'apiKey'.
 */
export async function POST(request: Request) {
  try {
    const { prompt, apiKey } = await request.json();

    if (!prompt || !apiKey) {
      // Usamos 400 Bad Request si faltan parámetros.
      return NextResponse.json({ error: "Faltan parámetros 'prompt' o 'apiKey'." }, { status: 400 });
    }

    // Llama a la función principal de la IA
    const feedbackText = await callGoogleAI(prompt, apiKey);

    // Retorna la respuesta exitosa
    return NextResponse.json({ feedbackText }, { status: 200 });

  } catch (error: any) {
    console.error("API Route Error:", error);
    // Usamos 500 Internal Server Error para cualquier error del servidor (incluyendo errores de la API de IA propagados)
    return NextResponse.json({ error: error.message || 'Error interno del servidor al generar retroalimentación.' }, { status: 500 });
  }
}
