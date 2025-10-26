
'use server';

import { z } from 'zod';
import { ai } from './generate';

const GroupReportInputSchema = z.object({
    groupName: z.string().describe('The name of the subject or group.'),
    partial: z.string().describe('The academic period being evaluated (e.g., "Primer Parcial", "Segundo Parcial").'),
    totalStudents: z.number().describe('The total number of students in the group.'),
    approvedCount: z.number().describe('The number of students who passed.'),
    failedCount: z.number().describe('The number of students who failed.'),
    groupAverage: z.number().describe('The average grade of the group.'),
    attendanceRate: z.number().describe('The average attendance rate of the group as a percentage.'),
    atRiskStudentCount: z.number().describe('The number of students identified as being at risk.'),
});

export const generateGroupReportAnalysis = ai.defineFlow(
  {
    name: 'generateGroupReportAnalysis',
    inputSchema: GroupReportInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const prompt = `
      Eres un asistente pedagógico experto en análisis de datos académicos.
      Tu tarea es redactar un análisis narrativo profesional y constructivo sobre el rendimiento de un grupo de estudiantes.
      Utiliza un tono formal pero comprensible, enfocado en la mejora continua.

      Aquí están los datos del grupo para el ${input.partial}:
      - Asignatura: ${input.groupName}
      - Total de Estudiantes: ${input.totalStudents}
      - Estudiantes Aprobados: ${input.approvedCount}
      - Estudiantes Reprobados: ${input.failedCount}
      - Calificación Promedio del Grupo: ${input.groupAverage.toFixed(1)}/100
      - Tasa de Asistencia General: ${input.attendanceRate.toFixed(1)}%
      - Estudiantes en Riesgo: ${input.atRiskStudentCount}

      Basado en estos datos, redacta un párrafo de análisis que aborde los siguientes puntos:
      1.  **Análisis General**: Comienza con una visión general del rendimiento del grupo. Menciona el índice de aprobación y la calificación promedio, comparándolos con un estándar esperado (puedes asumir que un promedio sobre 70 es aceptable y una tasa de aprobación sobre 80% es buena).
      2.  **Asistencia**: Comenta sobre la tasa de asistencia. Si es baja, resalta su impacto negativo en el aprendizaje. Si es alta, reconócela como una fortaleza.
      3.  **Áreas de Enfoque**: Identifica las áreas clave que requieren atención. Menciona el número de estudiantes reprobados y en riesgo como el principal punto de enfoque.
      4.  **Recomendaciones**: Ofrece 1 o 2 recomendaciones generales y accionables para el grupo. Por ejemplo, "implementar sesiones de tutoría entre pares" o "realizar un repaso de los temas con mayor dificultad".
      5.  **Conclusión Positiva**: Termina con una nota alentadora que motive tanto a los estudiantes como al docente a seguir mejorando.

      Formato de salida: Un único párrafo de texto. No uses listas ni viñetas.
    `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'gemini-1.5-flash-latest',
      config: { temperature: 0.5 },
    });

    return llmResponse.text;
  }
);
