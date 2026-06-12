// DEPRECATED: This file is no longer used.
// It was replaced by direct calls to Cloud Run service.
export async function generateFeedback(prompt: string, apiKey: string, model?: string): Promise<string> {
  throw new Error('Deprecated');
}

export async function generateGroupAnalysis(prompt: string, apiKey: string, model?: string): Promise<{ text: string; model: string }> {
  throw new Error('Deprecated');
}

export async function generateSemesterAnalysis(prompt: string, apiKey: string, model?: string): Promise<string> {
  throw new Error('Deprecated');
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  throw new Error('Deprecated');
}

