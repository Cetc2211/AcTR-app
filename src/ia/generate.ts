'use server';

// Función central para llamar a la API de Google AI (Gemini)
async function callGeminiAI(prompt: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error("No se ha configurado una clave API de Google AI válida. Ve a Ajustes para agregarla.");
  }

  const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ "text": prompt }]
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
          { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
          { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
          { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      }),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: response.statusText } }));
        const errorMessage = errorBody.error?.message || `Error ${response.status}`;
        
        if (response.status === 400) {
            throw new Error(`Clave API de Google inválida o malformada. Verifica que la clave sea correcta y que esté habilitada para usarse con la API de Google AI.`);
        }
        if (response.status === 404) {
             throw new Error(`El modelo solicitado no se encontró. Verifica que el nombre del modelo sea correcto. Error: ${errorMessage}`);
        }
        throw new Error(`Error del servicio de IA: ${errorMessage}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
      throw new Error('Respuesta inválida de la API de Gemini');
    }

    return data.candidates[0].content.parts[0].text;

  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    throw new Error(error.message || 'Error al conectar con el servicio de IA.');
  }
}

// Funciones exportadas
export async function generateFeedback(prompt: string, apiKey: string): Promise<string> {
  return await callGeminiAI(prompt, apiKey);
}

export async function generateGroupAnalysis(prompt: string, apiKey: string): Promise<string> {
  return await callGeminiAI(prompt, apiKey);
}

export async function generateSemesterAnalysis(prompt: string, apiKey: string): Promise<string> {
  return await callGeminiAI(prompt, apiKey);
}

// Función para probar la clave API
export async function testApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) {
    throw new Error('Por favor, introduce tu clave API de Google AI');
  }

  try {
    const testPrompt = "Responde únicamente con la palabra 'OK' si este mensaje llega correctamente.";
    const response = await callGeminiAI(testPrompt, apiKey);
    return response.includes('OK');
  } catch (error) {
    console.error('Error testing Google AI API key:', error);
    throw error;
  }
}
