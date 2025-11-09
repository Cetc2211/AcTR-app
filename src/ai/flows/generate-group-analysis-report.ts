import { z } from 'zod';
import { generateGroupAnalysis } from '@/lib/generate';

// Input para análisis grupal estructurado
export const GroupAnalysisInputSchema = z.object({
  subject: z.string().min(1),
  partialLabel: z.string().min(1),
  totalStudents: z.number().min(0),
  approvedCount: z.number().min(0),
  failedCount: z.number().min(0),
  groupAverage: z.number().min(0).max(100),
  attendanceRate: z.number().min(0).max(100),
  participationRate: z.number().min(0).max(100),
  atRiskCount: z.number().min(0),
  recentObservations: z.array(z.string()).max(10).default([]),
  tone: z.enum(['formal','empatico','directo']).default('formal'),
});
export type GroupAnalysisInput = z.infer<typeof GroupAnalysisInputSchema>;

export const GroupAnalysisOutputSchema = z.object({
  analysis: z.string().min(1),
});
export type GroupAnalysisOutput = z.infer<typeof GroupAnalysisOutputSchema>;

function buildGroupAnalysisPrompt(input: GroupAnalysisInput): string {
  const estilo = input.tone === 'formal' ? 'tono formal y profesional' : input.tone === 'directo' ? 'tono claro y directo' : 'tono empático y motivador';
  const obs = input.recentObservations.length > 0 ? input.recentObservations.join('; ') : 'Sin observaciones relevantes registradas.';
  return `Eres un asesor pedagógico experto. Redacta un análisis narrativo ${estilo} para el grupo de la asignatura ${input.subject} correspondiente a ${input.partialLabel}.

Datos:
- Total estudiantes: ${input.totalStudents}
- Aprobados: ${input.approvedCount}
- Reprobados: ${input.failedCount}
- Promedio general: ${input.groupAverage.toFixed(1)} / 100
- Asistencia global: ${input.attendanceRate.toFixed(1)}%
- Participación global: ${input.participationRate.toFixed(1)}%
- Estudiantes en riesgo: ${input.atRiskCount}
- Observaciones recientes: ${obs}

Estructura del párrafo (solo uno):
1) Panorama general del rendimiento (aprobación y promedio)
2) Comentario sobre asistencia y participación (fortaleza o área crítica)
3) Identificación de foco de mejora (reprobados y en riesgo)
4) 1-2 recomendaciones concretas accionables
5) Cierre motivacional positivo

Formato de salida: Único párrafo, sin listas, sin viñetas.`;
}

export async function generateGroupAnalysisReport(input: GroupAnalysisInput, apiKey: string, model?: string): Promise<{ analysis: string; model?: string }> {
  const prompt = buildGroupAnalysisPrompt(input);
  const { text, model: usedModel } = await generateGroupAnalysis(prompt, apiKey, model);
  const output = { analysis: text };
  const parsed = GroupAnalysisOutputSchema.safeParse(output);
  if (!parsed.success) {
    return { analysis: text || 'No se pudo generar un análisis válido en este intento.', model: usedModel };
  }
  return { analysis: parsed.data.analysis, model: usedModel };
}
