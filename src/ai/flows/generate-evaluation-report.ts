import { z } from 'zod';
import { generateGroupAnalysis } from '@/lib/generate';

// Input schema for a structured, per-student evaluation/feedback
export const EvaluationInputSchema = z.object({
  studentName: z.string().min(1),
  subject: z.string().min(1),
  partialLabel: z.string().min(1),
  finalGrade: z.number().min(0).max(100),
  attendanceRate: z.number().min(0).max(100),
  topCriteria: z.array(z.string()).default([]),
  bottomCriteria: z.array(z.string()).default([]),
  observations: z.array(z.string()).default([]),
  tone: z.enum(['formal','empatico','directo']).default('empatico'),
});

export type EvaluationInput = z.infer<typeof EvaluationInputSchema>;

export const EvaluationOutputSchema = z.object({
  feedback: z.string().min(1),
});
export type EvaluationOutput = z.infer<typeof EvaluationOutputSchema>;

export function buildEvaluationPrompt(input: EvaluationInput): string {
  const top = input.topCriteria.length > 0 ? input.topCriteria.join(', ') : 'N/A';
  const bottom = input.bottomCriteria.length > 0 ? input.bottomCriteria.join(', ') : 'N/A';
  const obs = input.observations.length > 0 ? input.observations.join('; ') : 'Ninguna';
  const estilo = input.tone === 'formal' ? 'tono formal y académico' : input.tone === 'directo' ? 'tono claro y directo' : 'tono empático y motivador';
  return `Eres un docente experimentado. Redacta una retroalimentación ${estilo} y personalizada para el estudiante ${input.studentName} sobre su desempeño en ${input.subject} durante ${input.partialLabel}.

Datos del estudiante:
- Calificación Final: ${input.finalGrade.toFixed(1)}%
- Tasa de Asistencia: ${input.attendanceRate.toFixed(1)}%
- Criterios con mejor desempeño: ${top}
- Criterios con menor desempeño: ${bottom}
- Observaciones en bitácora: ${obs}

Redacta un único párrafo siguiendo esta estructura:
1) Saludo y reconocimiento ligado a una fortaleza
2) Área principal a mejorar (menciona criterios con bajo desempeño)
3) Sugerencia accionable concreta
4) Cierre motivacional

Formato: Solo un párrafo de texto, sin viñetas.`;
}

export async function generateEvaluationReport(input: EvaluationInput, apiKey: string, model?: string): Promise<{ feedback: string; model?: string }>{
  const prompt = buildEvaluationPrompt(input);
  const { text, model: usedModel } = await generateGroupAnalysis(prompt, apiKey, model);
  const output = { feedback: text };
  // Validate output shape to enforce contract
  const parsed = EvaluationOutputSchema.safeParse(output);
  if (!parsed.success) {
    // If model produced an empty string or invalid response, wrap in a generic message
    return { feedback: text || 'No se pudo generar una retroalimentación válida en este intento.', model: usedModel };
  }
  return { feedback: parsed.data.feedback, model: usedModel };
}
