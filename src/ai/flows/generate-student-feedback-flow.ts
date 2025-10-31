'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { genkit } from 'genkit';

const StudentFeedbackInputSchema = z.object({
  studentName: z.string().describe("The student's name."),
  partial: z.string().describe('The academic period being evaluated (e.g., "Primer Parcial").'),
  finalGrade: z.number().describe("The student's final grade for the partial."),
  attendanceRate: z.number().describe('The attendance rate of the student as a percentage.'),
  criteria: z.array(z.object({
    name: z.string(),
    earnedPercentage: z.number(),
  })).describe('Breakdown of the grade by evaluation criteria.'),
  observations: z.array(z.string()).describe('List of observations from the behavioral log.'),
  apiKey: z.string().optional().describe('The user-provided Google AI API key.'),
});

export type StudentFeedbackInput = z.infer<typeof StudentFeedbackInputSchema>;

const generateStudentFeedbackFlow = ai.defineFlow(
  {
    name: 'generateStudentFeedbackFlow',
    inputSchema: StudentFeedbackInputSchema,
    outputSchema: z.string(),
  },
  async ({ apiKey, ...flowInput }) => {
    
    // Initialize a per-request Genkit instance with the user's API key.
    const perRequestAi = genkit({
      plugins: [googleAI({ apiKey: apiKey || process.env.GEMINI_API_KEY })],
    });
    
    const { studentName, partial, finalGrade, attendanceRate, criteria, observations } = flowInput;

    const topCriteria = criteria.sort((a, b) => b.earnedPercentage - a.earnedPercentage).slice(0, 2);
    const bottomCriteria = criteria.sort((a, b) => a.earnedPercentage - b.earnedPercentage).slice(0, 2);

    const prompt = `
      Eres un docente experimentado y empático. Tu objetivo es redactar una retroalimentación constructiva y personalizada para un estudiante llamado ${studentName} sobre su rendimiento en el ${partial}.
      La retroalimentación debe ser balanceada, reconociendo fortalezas y señalando áreas de oportunidad de manera clara y motivadora.

      Aquí están los datos del estudiante:
      - Calificación Final: ${finalGrade.toFixed(1)}/100
      - Tasa de Asistencia: ${attendanceRate.toFixed(1)}%
      - Criterios con mejor desempeño: ${topCriteria.map(c => c.name).join(', ')}
      - Criterios con menor desempeño: ${bottomCriteria.map(c => c.name).join(', ')}
      - Observaciones en bitácora: ${observations.length > 0 ? observations.join('; ') : 'Ninguna'}

      Basado en estos datos, redacta un párrafo de retroalimentación que siga esta estructura:
      1.  **Saludo y Reconocimiento**: Empieza saludando a ${studentName} y reconociendo su esfuerzo durante el parcial. Menciona una fortaleza específica, idealmente relacionada con sus criterios de mejor desempeño o una alta asistencia si aplica.
      2.  **Área de Oportunidad Principal**: Identifica el área más importante a mejorar. Si la calificación es reprobatoria, enfócate en eso. Si la asistencia es baja, conéctala con el rendimiento. Menciona los criterios de menor desempeño como puntos concretos a trabajar.
      3.  **Sugerencia Accionable**: Proporciona una recomendación clara y específica para abordar el área de oportunidad. Por ejemplo, "Te sugiero que nos reunamos brevemente después de clase para repasar los conceptos de [criterio con bajo desempeño]" o "Intenta participar activamente al menos una vez por clase para mejorar en [criterio]". Si hubo observaciones negativas en la bitácora, sugiere una reflexión sobre la conducta.
      4.  **Cierre Motivacional**: Concluye con una nota de ánimo, expresando confianza en su capacidad para mejorar en el siguiente parcial.

      Ejemplo de tono: "Hola ${studentName}, reconozco tu dedicación en la entrega de actividades. He notado que tu calificación final fue de ${finalGrade.toFixed(1)}%, y un área clave para mejorar es en los exámenes. Te invito a que te acerques para resolver dudas antes de la próxima evaluación. Confío en que con un poco más de enfoque, tus resultados mejorarán significativamente."

      Formato de salida: Un único párrafo de texto.
    `;

    const llmResponse = await perRequestAi.generate({
      model: 'gemini-1.5-flash-latest',
      prompt: prompt,
      config: { temperature: 0.7 },
    });

    return llmResponse.text;
  }
);

export async function generateStudentFeedback(input: StudentFeedbackInput): Promise<string> {
    return await generateStudentFeedbackFlow(input);
};
