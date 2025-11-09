import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GroupAnalysisInputSchema, generateGroupAnalysisReport } from '@/ai/flows/generate-group-analysis-report';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  apiKey: z.string().min(1, 'API key requerida'),
  model: z.string().optional(),
  input: GroupAnalysisInputSchema,
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const { apiKey, model, input } = parsed.data;
    const { analysis, model: usedModel } = await generateGroupAnalysisReport(input, apiKey, model);

    return NextResponse.json({ ok: true, analysis, model: usedModel });
  } catch (error: any) {
    const message = error?.message || 'No se pudo generar el análisis grupal.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
