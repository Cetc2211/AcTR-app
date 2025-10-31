import { NextResponse } from 'next/server';
import { generateGroupAnalysis } from '@/lib/generate';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    const apiKey = body?.apiKey;
    const model = body?.model;

    if (!prompt) {
      return NextResponse.json({ ok: false, error: 'Missing `prompt` in request body' }, { status: 400 });
    }

    // Delegate to server-side helper which will attempt fallbacks if model isn't available
    const result = await generateGroupAnalysis(prompt, apiKey, model);

    return NextResponse.json({ ok: true, text: result.text, model: result.model });
  } catch (err: any) {
    console.error('[api/generate-ia] Error generating AI response:', err?.message || err);
    // Do not leak sensitive data
    return NextResponse.json({ ok: false, error: 'Error generating AI response. Consulte los logs del servidor.' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
