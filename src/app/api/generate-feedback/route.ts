// Esta es la nueva ruta de API que ejecutará la llamada a la IA.

// Importa las dependencias necesarias.
// Como es una API Route (que se ejecuta en el servidor), NO necesita la directiva 'use server'.
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Mueve la lógica de la llamada a la IA aquí.
async function callGoogleAI(prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) {
        throw new Error("No se ha configurado una clave API de Google AI válida.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            generationConfig: {
                temperature: 0.5,
            },
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
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
        console.error("Google Generative AI Error:", e);
        let errorMessage = `Error del servicio de IA: ${e.message || 'Error desconocido'}`;
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


// Definición del método POST para esta API Route
export async function POST(request: Request) {
    try {
        const { prompt, apiKey } = await request.json();

        if (!prompt || !apiKey) {
            return NextResponse.json({ error: "Faltan parámetros 'prompt' o 'apiKey'." }, { status: 400 });
        }

        // 1. Llama a la lógica de la IA
        const feedbackText = await callGoogleAI(prompt, apiKey);

        // 2. Devuelve la respuesta exitosa al cliente
        return NextResponse.json({ feedbackText }, { status: 200 });

    } catch (error: any) {
        console.error("API Route Error:", error);
        // Devuelve una respuesta de error al cliente
        return NextResponse.json({ error: error.message || 'Error interno del servidor al generar retroalimentación.' }, { status: 500 });
    }
}
