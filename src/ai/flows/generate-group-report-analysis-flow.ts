'use server';

import { z } from 'zod';

const GroupReportInputSchema = z.object({
    groupName: z.string().describe('The name of the subject or group.'),
    partial: z.string().describe('The academic period being evaluated (e.g., "Primer Parcial", "Segundo Parcial").'),
    totalStudents: z.number().describe('The total number of students in the group.'),
    approvedCount: z.number().describe('The number of students who passed.'),
    failedCount: z.number().describe('The number of students who failed.'),
    groupAverage: z.number().describe('The average grade of the group.'),
    attendanceRate: z.number().describe('The average attendance rate of the group as a percentage.'),
    atRiskStudentCount: z.number().describe('The number of students identified as being at risk.'),
    aiModel: z.string().optional().describe('Optional preferred AI model (e.g., models/gemini-1.5-pro-latest)'),
});

export type GroupReportInput = z.infer<typeof GroupReportInputSchema>;

export async function generateGroupReportAnalysis(input: GroupReportInput): Promise<string> {
    const { aiModel, ...flowInput} = input;
    try {
      // Use Cloud Run backend service with google-generativeai
      const endpoint = process.env.NEXT_PUBLIC_CLOUD_RUN_ENDPOINT || 'https://backend-service-263108580734.us-central1.run.app';
      const response = await fetch(`${endpoint}/generate-group-report`, {
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
        const errorBody = await response.text();
        console.error('Error calling Cloud Run Group AI service:', response.status, response.statusText, errorBody);
        throw new Error(`Error del servicio de IA (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      return data.report;

    } catch (error) {
      console.error('Failed to generate group report via Cloud Run:', error);
      throw new Error('No se pudo generar el análisis del grupo en este momento.');
    }
}
