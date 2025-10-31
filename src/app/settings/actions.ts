'use server';

import { testApiKey } from '@/lib/generate';

// Server action to test the API key
export async function testApiKeyAction(apiKey: string): Promise<{ success: boolean; error?: string }> {
    if (!apiKey) {
        return { success: false, error: 'La clave de API no puede estar vacía.' };
    }

    try {
        const ok = await testApiKey(apiKey);
        return { success: ok };
    } catch (error: any) {
        console.error('API Key Test Error:', error);
        const message = error?.message || 'No se pudo validar la clave de API. Verifica tu conexión y permisos.';
        return { success: false, error: message };
    }
}
