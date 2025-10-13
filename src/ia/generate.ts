'use server';

import * as genai from "@google/generative-ai";

// Función asincrónica para llamar a la API de Google AI
async function callGoogleAI(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error("No se ha configurado una clave API de Google AI válida. Ve a Ajustes para agregarla.");
  }

  const genAI = new genai.GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.5,
      },
      safetySettings: [
        {
          category: genai.HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: genai.HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("La IA no generó una respuesta de texto.");
    }

    return text;

  } catch (e: any) {
    console.error("Google GenAI Error:", e);
    
    let errorMessage = `Error del servicio de IA: ${e.message || 'Error desconocido'}`;
    if (e.message && (e.message.includes('API key not valid') || e.message.includes('invalid api key'))) {
      errorMessage = "La clave API de Google AI proporcionada no es válida.";
    } else if (e.message && e.message.includes('permission denied')) {
        errorMessage = "Permiso denegado. Revisa que tu clave API esté habilitada para el modelo Gemini.";
    } else if (e.message && e.message.includes('not found')) {
        errorMessage = `Error del servicio de IA: El modelo 'gemini-1.5-flash' no fue encontrado. Asegúrate de que es el nombre correcto y tienes acceso.`;
    }
    
    throw new Error(errorMessage);
  }
}

// Tus funciones exportadas quedan igual, llamando a callGoogleAI
export async function testApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await callGoogleAI("Responde solo con la palabra 'test'", apiKey);
        return response.toLowerCase().includes('test');
    } catch (e: any) {
        console.error("Error al probar la clave API:", e);
        // Lanzamos el error para que el frontend lo pueda mostrar al usuario.
        throw e;
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
