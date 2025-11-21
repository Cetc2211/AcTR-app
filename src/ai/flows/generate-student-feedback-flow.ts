'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { generateFeedback } from '@/lib/generate';

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
  aiModel: z.string().optional().describe('Optional preferred AI model'),
});

export type StudentFeedbackInput = z.infer<typeof StudentFeedbackInputSchema>;

const generateStudentFeedbackFlow = ai.defineFlow(
  {
    name: 'generateStudentFeedbackFlow',
    inputSchema: StudentFeedbackInputSchema,
    outputSchema: z.string(),
  },
  async ({ apiKey, aiModel, ...flowInput }) => {
    const { studentName, partial, finalGrade, attendanceRate, criteria, observations } = flowInput;

    const topCriteria = criteria.sort((a, b) => b.earnedPercentage - a.earnedPercentage).slice(0, 2);
    const bottomCriteria = criteria.sort((a, b) => a.earnedPercentage - b.earnedPercentage).slice(0, 2);

    // Construimos una descripción detallada para enviar al servicio de Cloud Run
    const gradesDescription = `
      Calificación Final: ${finalGrade.toFixed(1)}/100.
      Asistencia: ${attendanceRate.toFixed(1)}%.
      Mejores criterios: ${topCriteria.map(c => c.name).join(', ')}.
      Criterios a mejorar: ${bottomCriteria.map(c => c.name).join(', ')}.
      Observaciones: ${observations.length > 0 ? observations.join('; ') : 'Ninguna'}.
    `;

    try {
      // Llamada al microservicio de IA en Cloud Run
      const response = await fetch('https://backend-service-263108580734.us-central1.run.app/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: studentName,
          subject: `Evaluación del ${partial}`, // Usamos el parcial como contexto de la asignatura/periodo
          grades: gradesDescription
        })
      });

      if (!response.ok) {
        console.error('Error calling Cloud Run AI service:', response.status, response.statusText);
        throw new Error('Error al comunicarse con el servicio de IA.');
      }

      const data = await response.json();
      return data.report;

    } catch (error) {
      console.error('Failed to generate feedback via Cloud Run:', error);
      throw new Error('No se pudo generar la retroalimentación en este momento.');
    }
  }
);

export async function generateStudentFeedback(input: StudentFeedbackInput): Promise<string> {
    return await generateStudentFeedbackFlow(input);
};
