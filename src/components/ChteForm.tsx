'use client';

import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Save, RotateCcw } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const chteQuestions = [
    { id: 'q1', text: '1. ¿Hago un plan o un horario para mis horas de estudio?', domain: 'planificacion' },
    { id: 'q2', text: '2. ¿Tengo un lugar fijo y adecuado para estudiar, libre de distracciones?', domain: 'concentracion' },
    { id: 'q3', text: '3. Cuando leo un texto, ¿subrayo las ideas principales o hago anotaciones al margen?', domain: 'estrategias' },
    { id: 'q4', text: '4. ¿Priorizo las tareas más difíciles para cuando estoy más descansado?', domain: 'planificacion' },
    { id: 'q5', text: '5. ¿Suelo revisar mis apuntes después de clase para asegurarme de que los entiendo?', domain: 'estrategias' },
    { id: 'q6', text: '6. ¿Uso técnicas de memorización como asociaciones, esquemas o resúmenes?', domain: 'estrategias' },
    { id: 'q7', text: '7. ¿Me organizo el tiempo para cumplir con mis tareas y deberes escolares?', domain: 'planificacion' },
    { id: 'q8', text: '8. ¿Puedo mantener la concentración durante periodos largos de estudio?', domain: 'concentracion' },
    { id: 'q9', text: '9. ¿Busco información complementaria cuando no entiendo un tema?', domain: 'estrategias' },
    { id: 'q10', text: '10. ¿Evito las distracciones (celular, redes sociales) mientras estudio?', domain: 'concentracion' },
];

const options = [
    { value: 'siempre', label: 'Siempre', score: 4 },
    { value: 'casi_siempre', label: 'Casi Siempre', score: 3 },
    { value: 'a_veces', label: 'A Veces', score: 2 },
    { value: 'rara_vez', label: 'Rara Vez', score: 1 },
    { value: 'nunca', label: 'Nunca', score: 0 },
];

function interpretCHTE(scores: Record<string, number>): {
    planificacion: number;
    concentracion: number;
    estrategias: number;
    total: number;
    nivel: string;
    recomendaciones: string[];
} {
    const planificacion = ((scores['planificacion'] || 0) / 12) * 100;
    const concentracion = ((scores['concentracion'] || 0) / 12) * 100;
    const estrategias = ((scores['estrategias'] || 0) / 20) * 100;
    const total = (planificacion + concentracion + estrategias) / 3;

    let nivel = 'Adecuado';
    const recomendaciones: string[] = [];

    if (total < 40) {
        nivel = 'Necesita mejorar significativamente';
        recomendaciones.push('Se recomienda asistir a talleres de técnicas de estudio.');
        recomendaciones.push('Establecer un horario fijo de estudio.');
    } else if (total < 60) {
        nivel = 'Regular - Puede mejorar';
        recomendaciones.push('Practicar más técnicas de organización.');
    } else if (total < 80) {
        nivel = 'Bueno';
        recomendaciones.push('Continuar con las estrategias actuales.');
    } else {
        nivel = 'Excelente';
        recomendaciones.push('Mantener los hábitos de estudio actuales.');
    }

    if (concentracion < 50) {
        recomendaciones.push('Trabajar en reducir distracciones durante el estudio.');
    }

    return { planificacion, concentracion, estrategias, total, nivel, recomendaciones };
}

interface ChteFormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: { total: number; interpretation: string }) => void;
}

export default function ChteForm({ studentId, grupoId, matricula, onComplete }: ChteFormProps) {
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<ReturnType<typeof interpretCHTE> | null>(null);

    const handleResponseChange = useCallback((questionId: string, value: string) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
    }, []);

    const answeredCount = Object.keys(responses).length;

    const calculateResult = useCallback(() => {
        if (answeredCount < chteQuestions.length) return null;

        const domainScores: Record<string, number> = {};
        chteQuestions.forEach(q => {
            const response = responses[q.id];
            const option = options.find(o => o.value === response);
            if (option) {
                domainScores[q.domain] = (domainScores[q.domain] || 0) + option.score;
            }
        });

        return interpretCHTE(domainScores);
    }, [responses, answeredCount]);

    const handleSubmit = async () => {
        const calculatedResult = calculateResult();
        if (!calculatedResult) {
            alert('Responda todas las preguntas.');
            return;
        }

        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({ total: Math.round(calculatedResult.total), interpretation: calculatedResult.nivel });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    grupoId: grupoId || null,
                    matricula: matricula || null,
                    testType: 'CHTE',
                    date: Timestamp.now(),
                    score: Math.round(calculatedResult.total),
                    interpretation: calculatedResult.nivel,
                    level: calculatedResult.nivel,
                    planificacion: calculatedResult.planificacion,
                    concentracion: calculatedResult.concentracion,
                    estrategias: calculatedResult.estrategias,
                    responses
                });
            } catch (error) {
                console.error('Error guardando CHTE:', error);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleReset = () => {
        setResponses({});
        setIsSubmitted(false);
        setResult(null);
    };

    if (isSubmitted && result) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        Resultados CHTE
                    </CardTitle>
                    <CardDescription>Cuestionario de Hábitos y Técnicas de Estudio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-5xl font-bold">{Math.round(result.total)}%</p>
                        <p className="text-sm text-gray-500">Puntuación global de hábitos de estudio</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500 text-white">
                        <p className="text-xl font-semibold">{result.nivel}</p>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Planificación</span>
                                <span>{Math.round(result.planificacion)}%</span>
                            </div>
                            <Progress value={result.planificacion} className="h-2" />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Concentración</span>
                                <span>{Math.round(result.concentracion)}%</span>
                            </div>
                            <Progress value={result.concentracion} className="h-2" />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Estrategias</span>
                                <span>{Math.round(result.estrategias)}%</span>
                            </div>
                            <Progress value={result.estrategias} className="h-2" />
                        </div>
                    </div>
                    {result.recomendaciones.length > 0 && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="font-semibold text-amber-800 mb-2">Recomendaciones:</p>
                            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                                {result.recomendaciones.map((rec, idx) => (
                                    <li key={idx}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <Button onClick={handleReset} variant="outline" className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Nueva Evaluación
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>CHTE - Cuestionario de Hábitos y Técnicas de Estudio</CardTitle>
                <CardDescription>Responda según sus hábitos de estudio actuales</CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredCount}/{chteQuestions.length}</span>
                    </div>
                    <Progress value={(answeredCount / chteQuestions.length) * 100} className="h-2" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {chteQuestions.map((q) => (
                        <div key={q.id} className="p-4 border rounded-lg bg-gray-50/80">
                            <p className="font-semibold mb-4 text-gray-800">{q.text}</p>
                            <RadioGroup
                                value={responses[q.id] || ''}
                                onValueChange={(value) => handleResponseChange(q.id, value)}
                                className="flex flex-wrap gap-x-6 gap-y-2"
                            >
                                {options.map(opt => (
                                    <div key={opt.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt.value} id={`${q.id}-${opt.value}`} />
                                        <Label htmlFor={`${q.id}-${opt.value}`}>{opt.label}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    ))}
                </div>
                <Button
                    onClick={handleSubmit}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                    disabled={answeredCount < chteQuestions.length || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
