// Esta es la nueva ruta de API que ejecutará la llamada a la IA.

// Importa las dependencias necesarias.
// Como es una API Route (que se ejecuta en el servidor), NO necesita la directiva 'use server'.
import { NextResponse } from 'next/server';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Mueve la lógica de la llamada a la IA aquí.
async function callGoogleAI(prompt: string, apiKey: string): Promise<string> {
    // La lógica de la IA se mantiene igual, pero ahora se ejecuta en esta API Route.
    if (!apiKey) {
        throw new Error("No se ha configurado una clave API de Google AI válida.");
    }
    
    const ai = genkit({
        plugins: [googleAI({ apiKey })],
    });
    
    try {
        const response = await ai.generate({
            model: 'gemini-1.5-flash',
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

        const text = response.text;
        if (!text) {
            throw new Error("La IA no generó una respuesta de texto.");
        }
        
        return text;

    } catch (e: any) {
        console.error("Genkit AI Error:", e);
        let errorMessage = `Error del servicio de IA: ${e.message || 'Error desconocido'}`;
        if (e.message && e.message.includes('API key not valid')) {
            errorMessage = "La clave API de Google AI proporcionada no es válida.";
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
