'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ClinicalAssessment, getEvidenceRepository, EvidenceReference } from '@/lib/store';
import { Lightbulb, Bot, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import PIEIValidation from './PIEIValidation';

interface PIEIGeneratorProps {
    clinicalData?: ClinicalAssessment;
}

// --- Algoritmo de Traducción (Simulación) ---
// Mapea hallazgos clínicos a instrucciones pedagógicas NO clínicas.
const translationMap: { [key: string]: { condition: (data: ClinicalAssessment) => boolean; instructions: { id: string, text: string, evidenceTag: string }[] } } = {
    AjustesMetodologicos: {
        condition: (data) => data.neuro_mt_score < 85, // Memoria de Trabajo baja
        instructions: [
            { id: 'met_1', text: 'Entregar instrucciones de forma segmentada (un paso a la vez).', evidenceTag: 'educativa' },
            { id: 'met_2', text: 'Utilizar apoyos visuales (diagramas, mapas conceptuales) para las tareas.', evidenceTag: 'educativa' },
            { id: 'met_3', text: 'Confirmar la comprensión de las instrucciones pidiendo que las repita.', evidenceTag: 'educativa' },
        ]
    },
    AjustesActivacion: {
        condition: (data) => data.bdi_ii_score > 20, // Síntomas depresivos significativos (apatía, anhedonia)
        instructions: [
            { id: 'act_1', text: 'Aplicar la "técnica de los 5 minutos" para iniciar tareas académicas.', evidenceTag: 'activacion-conductual' },
            { id: 'act_2', text: 'Establecer metas de tarea muy pequeñas y concretas (ej. "leer 2 párrafos").', evidenceTag: 'activacion-conductual' },
            { id: 'act_3', text: 'Permitir una pausa activa breve (2-3 min) entre bloques de trabajo.', evidenceTag: 'dbt' },
        ]
    },
    AjustesAcceso: {
        condition: (data) => data.bai_score > 16, // Síntomas de ansiedad significativos
        instructions: [
            { id: 'acc_1', text: 'Permitir el uso de audífonos con música instrumental durante el trabajo individual.', evidenceTag: 'educativa' },
            { id: 'acc_2', text: 'Ofrecer un espacio tranquilo y con menos estímulos para presentar exámenes.', evidenceTag: 'educativa' },
        ]
    }
};

const allEvidence = getEvidenceRepository();

export default function PIEIGenerator({ clinicalData }: PIEIGeneratorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
    const [isPieiModalOpen, setIsPieiModalOpen] = useState(false);

    const generatedSuggestions = useMemo(() => {
        if (!clinicalData) return [];
        
        let suggestions: { id: string, text: string, evidenceTag: string }[] = [];
        for (const key in translationMap) {
            if (translationMap[key].condition(clinicalData)) {
                suggestions.push(...translationMap[key].instructions);
            }
        }
        return suggestions;
    }, [clinicalData]);
    
    useEffect(() => {
        // Pre-seleccionar todas las sugerencias generadas
        setSelectedInstructions(generatedSuggestions.map(instr => instr.id));
    }, [generatedSuggestions]);

    const handleCheckboxChange = (instructionId: string) => {
        setSelectedInstructions(prev => 
            prev.includes(instructionId) 
                ? prev.filter(id => id !== instructionId) 
                : [...prev, instructionId]
        );
    };

    const handleTriggerFinalize = () => {
        setIsPieiModalOpen(true);
    };

    const handleFinalizePiei = () => {
        setIsLoading(true);
        const finalPlan = generatedSuggestions.filter(instr => selectedInstructions.includes(instr.id));
        
        const evidenceTags = new Set(finalPlan.map(instr => instr.evidenceTag));
        const supportingEvidence = allEvidence.filter(ref => ref.tags.some(tag => evidenceTags.has(tag)));

        console.log("--- CORTAFUEGOS ÉTICO Y VALIDACIÓN DE EVIDENCIA ---");
        console.log("Generando PIEI para Rol Orientador/Docente...");
        console.log("Datos Clínicos (Privados, no se envían):", clinicalData);
        console.log("Instrucciones Pedagógicas (Públicas, filtradas):", finalPlan);
        console.log("Justificación Bibliográfica (Automática):", supportingEvidence.map(e => `${e.autor} (${e.ano})`));

        console.log("Guardando en 'piei_plans' (simulación):", {
            studentId: clinicalData?.studentId,
            approved_instructions: finalPlan,
            supporting_evidence: supportingEvidence.map(e => e.id),
            approved_at: new Date().toISOString(),
            approved_by: 'Rol Clínico'
        });
        
        setIsPieiModalOpen(false);
        setTimeout(() => {
            setIsLoading(false);
            alert("PIEI finalizado y enviado al Rol Orientador (simulación). La justificación bibliográfica ha sido adjuntada automáticamente.");
        }, 500);
    };

    if (!clinicalData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Módulo 7: Generador de Plan de Intervención Educativa (PIEI)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-center text-gray-500">
                        Complete la Evaluación Clínica para activar el generador de sugerencias del PIEI.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Módulo 7: Generador de Plan de Intervención Educativa (PIEI)</CardTitle>
                    <CardDescription>
                        Traducción de hallazgos clínicos a instrucciones pedagógicas para el personal de apoyo. Las intervenciones se justifican con la evidencia del <Link href="/tools" className="underline text-blue-600">Repositorio</Link>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="flex items-center gap-2 font-semibold text-blue-800">
                                <Bot />
                                Sugerencias del Algoritmo de Traducción Clínica
                            </h3>
                            <p className="text-sm text-blue-700 mt-2">
                            Basado en los datos clínicos, el sistema sugiere las siguientes intervenciones pedagógicas. Desmarque las que no considere apropiadas.
                            </p>
                        </div>

                        {generatedSuggestions.length > 0 ? (
                            <div className="space-y-4">
                                {generatedSuggestions.map(instr => (
                                    <div key={instr.id} className="flex items-start space-x-3 p-3 rounded-md bg-gray-50 border">
                                        <Checkbox
                                            id={instr.id}
                                            onCheckedChange={() => handleCheckboxChange(instr.id)}
                                            checked={selectedInstructions.includes(instr.id)}
                                        />
                                        <Label htmlFor={instr.id} className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {instr.text}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic text-center">No se generaron sugerencias automáticas basadas en los datos clínicos actuales.</p>
                        )}

                        <Separator />

                        <div className="flex justify-end">
                            <Button onClick={handleTriggerFinalize} disabled={isLoading || selectedInstructions.length === 0}>
                                <ShieldCheck className="mr-2"/>
                                {isLoading ? 'Finalizando...' : 'Finalizar y Validar PIEI'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <PIEIValidation 
                isOpen={isPieiModalOpen}
                onClose={() => setIsPieiModalOpen(false)}
                onConfirm={handleFinalizePiei}
            />
        </>
    );
}
