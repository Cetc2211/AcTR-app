'use server';

import { z } from 'zod';

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
  aiModel: z.string().optional().describe('Optional preferred AI model'),
});

export type StudentFeedbackInput = z.infer<typeof StudentFeedbackInputSchema>;

export async function generateStudentFeedback(input: StudentFeedbackInput): Promise<string> {
    const { aiModel, ...flowInput } = input;
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
      // Call Cloud Run backend service with google-generativeai
      // Using gemini-pro model (December 2025)
      const endpoint = process.env.NEXT_PUBLIC_CLOUD_RUN_ENDPOINT || 'https://ai-report-service-jjaeoswhya-uc.a.run.app';
      const response = await fetch(`${endpoint}/generate-student-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: studentName,
          subject: `Evaluación del ${partial}`,
          grades: criteria.map(c => c.earnedPercentage),
          attendance: attendanceRate,
          observations: observations.join('; ')
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error calling Cloud Run AI service:', response.status, response.statusText, errorBody);
        throw new Error(`Error del servicio de IA (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      return data.feedback || data.report; // Fallback to report if feedback is missing, just in case

    } catch (error) {
      console.error('Failed to generate feedback via Cloud Run:', error);
      throw new Error('No se pudo generar la retroalimentación en este momento.');
    }
}
