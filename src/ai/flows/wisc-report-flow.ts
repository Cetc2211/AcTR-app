'use server';
/**
 * @fileOverview Flujo de IA para generar un informe narrativo de WISC-V.
 *
 * - generateWiscReport: Genera un análisis cualitativo a partir de datos psicométricos.
 * - WiscReportInput: El tipo de entrada para el flujo.
 * - WiscReportOutput: El tipo de salida para el flujo.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const WiscReportInputSchema = z.object({
    studentName: z.string().describe('Nombre del evaluado.'),
    studentAge: z.number().describe('Edad del evaluado.'),
    compositeScores: z.array(z.object({
        name: z.string(),
        score: z.number(),
        classification: z.string(),
    })).describe('Listado de Índices Compuestos y sus puntajes.'),
    strengths: z.array(z.string()).describe('Lista de fortalezas detectadas.'),
    weaknesses: z.array(z.string()).describe('Lista de debilidades detectadas.'),
});
export type WiscReportInput = z.infer<typeof WiscReportInputSchema>;

export const WiscReportOutputSchema = z.object({
  narrativeReport: z.string().describe('El informe narrativo cualitativo generado.'),
  diagnosticSynthesis: z.string().describe('La síntesis diagnóstica final.'),
});
export type WiscReportOutput = z.infer<typeof WiscReportOutputSchema>;

const reportGenerationPrompt = ai.definePrompt({
    name: 'wiscReportPrompt',
    model: 'googleai/gemini-1.5-flash',
    input: { schema: WiscReportInputSchema },
    output: { schema: WiscReportOutputSchema },
    config: {
        temperature: 0.7,
    },
    prompt: `Rol: Actúa como un experto en Psicometría y Evaluación Clínica Neuropsicológica especializado en escalas Wechsler (WISC-V/WAIS-IV).

Entrada de Datos:
* Nombre del Estudiante: {{{studentName}}}
* Edad: {{{studentAge}}}
* Perfil de Índices:
{{#each compositeScores}}
  * {{{name}}}: PC = {{{score}}} (Clasificación: {{{classification}}})
{{/each}}
* Fortalezas detectadas: {{#each strengths}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
* Debilidades detectadas: {{#each weaknesses}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Instrucciones de Redacción:
1.  **Introducción**: Redacta una descripción de la capacidad intelectual general basada en el C.I. Total (CIT).
2.  **Análisis por Dominios**: Genera párrafos descriptivos para cada índice (Comprensión Verbal, Visoespacial, Razonamiento Fluido, Memoria de Trabajo, Velocidad de Procesamiento) siguiendo el estilo del manual.
3.  **Conclusión (Síntesis Diagnóstica)**: Finaliza con una **Síntesis Diagnóstica** clara y concisa. Integra los antecedentes relevantes del estudiante (si se proporcionan) con los resultados numéricos para ofrecer una visión clínica integral. Indica si el rendimiento es acorde a su edad o si sugiere algún déficit intelectual (DIL, DIM, etc.), supeditándolo siempre a la evaluación de la conducta adaptativa.
4.  **Formato**: El resultado debe ser un objeto JSON con dos claves: 'narrativeReport' (con la introducción y análisis de dominios) y 'diagnosticSynthesis' (con la conclusión).
`,
});


const wiscReportFlow = ai.defineFlow(
    {
        name: 'wiscReportFlow',
        inputSchema: WiscReportInputSchema,
        outputSchema: WiscReportOutputSchema,
    },
    async (input) => {
        const {output} = await reportGenerationPrompt(input);
        if (!output) {
            throw new Error("La IA no generó una respuesta válida.");
        }
        return output;
    }
);

export async function generateWiscReport(input: WiscReportInput): Promise<WiscReportOutput> {
    return wiscReportFlow(input);
}
