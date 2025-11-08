import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EvaluationInputSchema, generateEvaluationReport } from '@/ai/flows/generate-evaluation-report';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  apiKey: z.string().min(1, 'API key requerida'),
  model: z.string().optional(),
  input: EvaluationInputSchema,
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const { apiKey, model, input } = parsed.data;
    const { feedback, model: usedModel } = await generateEvaluationReport(input, apiKey, model);

    return NextResponse.json({ ok: true, feedback, model: usedModel });
  } catch (error: any) {
    const message = error?.message || 'No se pudo generar la retroalimentación.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
