'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Server action to test the API key
export async function testApiKeyAction(apiKey: string): Promise<{ success: boolean; error?: string }> {
    if (!apiKey) {
        return { success: false, error: 'La clave de API no puede estar vacía.' };
    }

    try {
        const testAI = genkit({
            plugins: [googleAI({ apiKey })],
        });
        await testAI.generate({
            model: 'gemini-1.5-flash-latest',
            prompt: 'Test',
            config: { temperature: 0 },
        });
        return { success: true };
    } catch (error: any) {
        if (error.message && (error.message.includes('API key not valid') || error.message.includes('permission_denied'))) {
            return { success: false, error: 'La clave de API proporcionada no es válida. Por favor, revísala.' };
        }
        return { success: false, error: 'No se pudo validar la clave de API. Verifica tu conexión o la clave.' };
    }
}
