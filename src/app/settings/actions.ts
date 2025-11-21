'use server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-service-263108580734.us-central1.run.app';

// Server action to test the API key (Now tests Backend Connectivity)
export async function testApiKeyAction(apiKey: string): Promise<{ success: boolean; error?: string }> {
    // We are transitioning to a managed backend that uses its own secrets.
    // However, to keep the UI consistent for now, we will treat this "Test" as a connectivity check.
    // The apiKey param is currently unused by the backend but kept for signature compatibility.
    
    // if (!apiKey) {
    //    return { success: false, error: 'La clave de API no puede estar vacía.' };
    // }

    try {
        // Ping the backend service to ensure it's reachable and running
        const response = await fetch(`${BACKEND_URL}/`, {
            method: 'GET',
            cache: 'no-store'
        });

        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: `El servicio de IA no está respondiendo correctamente (Status: ${response.status}).` };
        }
    } catch (error: any) {
        console.error('Backend Connectivity Test Error:', error);
        const message = error?.message || 'No se pudo conectar con el servicio de IA.';
        return { success: false, error: message };
    }
}
