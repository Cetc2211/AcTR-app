'use server';

import { genkit } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Server action to test the API key
export async function testApiKeyAction(apiKey: string): Promise<{ success: boolean; error?: string }> {
    if (!apiKey) {
        return { success: false, error: 'La clave de API no puede estar vacía.' };
    }

    try {
        const model = googleAI({ apiKey }).model('gemini-1.5-flash-latest');
        
        await genkit.generate({
            model: model,
            prompt: 'Test',
            config: { temperature: 0 },
        });

        return { success: true };
    } catch (error: any) {
        console.error("API Key Test Error:", error);
        if (error.message && (error.message.includes('API key not valid') || error.message.includes('permission_denied') || error.message.includes('invalid api key'))) {
            return { success: false, error: 'La clave de API proporcionada no es válida. Por favor, revísala.' };
        }
        return { success: false, error: 'No se pudo validar la clave de API. Verifica tu conexión, que la API esté habilitada en tu proyecto de Google Cloud, o la propia clave.' };
    }
}
