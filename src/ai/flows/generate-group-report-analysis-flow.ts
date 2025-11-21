'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

const GroupReportInputSchema = z.object({
    groupName: z.string().describe('The name of the subject or group.'),
    partial: z.string().describe('The academic period being evaluated (e.g., "Primer Parcial", "Segundo Parcial").'),
    totalStudents: z.number().describe('The total number of students in the group.'),
    approvedCount: z.number().describe('The number of students who passed.'),
    failedCount: z.number().describe('The number of students who failed.'),
    groupAverage: z.number().describe('The average grade of the group.'),
    attendanceRate: z.number().describe('The average attendance rate of the group as a percentage.'),
    atRiskStudentCount: z.number().describe('The number of students identified as being at risk.'),
    apiKey: z.string().optional().describe('The user-provided Google AI API key.'),
  aiModel: z.string().optional().describe('Optional preferred AI model (e.g., models/gemini-1.5-pro-latest)'),
});

export type GroupReportInput = z.infer<typeof GroupReportInputSchema>;

const generateGroupReportAnalysisFlow = ai.defineFlow(
  {
    name: 'generateGroupReportAnalysisFlow',
    inputSchema: GroupReportInputSchema,
    outputSchema: z.string(),
  },
  async ({ apiKey, aiModel, ...flowInput}) => {
    try {
      const response = await fetch('https://backend-service-263108580734.us-central1.run.app/generate-group-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_name: flowInput.groupName,
          partial: flowInput.partial,
          stats: {
            totalStudents: flowInput.totalStudents,
            approvedCount: flowInput.approvedCount,
            failedCount: flowInput.failedCount,
            groupAverage: flowInput.groupAverage.toFixed(1),
            attendanceRate: flowInput.attendanceRate.toFixed(1),
            atRiskStudentCount: flowInput.atRiskStudentCount
          }
        })
      });

      if (!response.ok) {
        console.error('Error calling Cloud Run Group AI service:', response.status, response.statusText);
        throw new Error('Error al comunicarse con el servicio de IA para grupos.');
      }

      const data = await response.json();
      return data.report;

    } catch (error) {
      console.error('Failed to generate group report via Cloud Run:', error);
      throw new Error('No se pudo generar el análisis del grupo en este momento.');
    }
  }
);

export async function generateGroupReportAnalysis(input: GroupReportInput): Promise<string> {
    return await generateGroupReportAnalysisFlow(input);
};
