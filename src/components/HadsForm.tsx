'use client';

import { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Save, RotateCcw } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// 14 ítems del HADS (7 ansiedad + 7 depresión)
const hadsItems = [
    // Ansiedad (A)
    { id: 'a1', text: "Me siento tenso o 'con los nervios de punta':", type: 'A', options: [
        { value: 0, text: "La mayoría de las veces" },
        { value: 1, text: "Muchas veces" },
        { value: 2, text: "Algunas veces" },
        { value: 3, text: "En ninguna ocasión" }
    ]},
    { id: 'a2', text: "Siento una especie de miedo o terror como si algo horrible fuera a pasarme:", type: 'A', options: [
        { value: 0, text: "Definitivamente y bastante intenso" },
        { value: 1, text: "Sí, pero no demasiado" },
        { value: 2, text: "Un poco, pero no me preocupa" },
        { value: 3, text: "En absoluto" }
    ]},
    { id: 'a3', text: "Tengo pensamientos que me intranquilizan:", type: 'A', options: [
        { value: 0, text: "La mayoría de las veces" },
        { value: 1, text: "Muchas veces" },
        { value: 2, text: "Algunas veces" },
        { value: 3, text: "En ninguna ocasión" }
    ]},
    { id: 'a4', text: "Me siento tranquilo/a y puedo estar relajado/a:", type: 'A', inverted: true, options: [
        { value: 0, text: "Definitivamente" },
        { value: 1, text: "Generalmente" },
        { value: 2, text: "No muy a menudo" },
        { value: 3, text: "En absoluto" }
    ]},
    { id: 'a5', text: "Tengo mala sensación en el estómago (como si tuviera 'mariposas'):", type: 'A', options: [
        { value: 0, text: "Muy a menudo" },
        { value: 1, text: "Algunas veces" },
        { value: 2, text: "Casi nunca" },
        { value: 3, text: "Nunca" }
    ]},
    { id: 'a6', text: "Me siento inquieto/a como si no pudiera estar quieto/a:", type: 'A', options: [
        { value: 0, text: "Muchísimo" },
        { value: 1, text: "Bastante" },
        { value: 2, text: "Algo" },
        { value: 3, text: "En absoluto" }
    ]},
    { id: 'a7', text: "Tengo ataques de pánico repentinos que me descontrolan:", type: 'A', options: [
        { value: 0, text: "Realmente mucho" },
        { value: 1, text: "Bastante" },
        { value: 2, text: "No mucho" },
        { value: 3, text: "En absoluto" }
    ]},
    // Depresión (D)
    { id: 'd1', text: "Todavía disfruto de las cosas que antes disfrutaba:", type: 'D', inverted: true, options: [
        { value: 0, text: "Definitivamente tanto como antes" },
        { value: 1, text: "Algo menos que antes" },
        { value: 2, text: "Solo un poco" },
        { value: 3, text: "Casi nada" }
    ]},
    { id: 'd2', text: "Puedo reírme y ver el lado divertido de las cosas:", type: 'D', inverted: true, options: [
        { value: 0, text: "Tanto como siempre" },
        { value: 1, text: "Ahora no tanto" },
        { value: 2, text: "Definitivamente no tanto" },
        { value: 3, text: "En absoluto" }
    ]},
    { id: 'd3', text: "Me siento alegre:", type: 'D', inverted: true, options: [
        { value: 0, text: "Nunca" },
        { value: 1, text: "Algunas veces" },
        { value: 2, text: "No muy a menudo" },
        { value: 3, text: "En absoluto" }
    ]},
    { id: 'd4', text: "Me siento lento/a y aletargado/a:", type: 'D', options: [
        { value: 0, text: "Casi todo el tiempo" },
        { value: 1, text: "Muchas veces" },
        { value: 2, text: "Algunas veces" },
        { value: 3, text: "En ninguna ocasión" }
    ]},
    { id: 'd5', text: "He perdido interés en mi apariencia personal:", type: 'D', options: [
        { value: 0, text: "Definitivamente" },
        { value: 1, text: "No me preocupo tanto como antes" },
        { value: 2, text: "Quizás me preocupo un poco menos" },
        { value: 3, text: "Me preocupo igual que antes" }
    ]},
    { id: 'd6', text: "Espero con ilusión divertirme y disfrutar de las cosas:", type: 'D', inverted: true, options: [
        { value: 0, text: "Tanto como siempre" },
        { value: 1, text: "Algo menos que antes" },
        { value: 2, text: "Definitivamente menos" },
        { value: 3, text: "Casi nada" }
    ]},
    { id: 'd7', text: "Puedo disfrutar de un buen libro, un programa de radio o la TV:", type: 'D', inverted: true, options: [
        { value: 0, text: "A menudo" },
        { value: 1, text: "Algunas veces" },
        { value: 2, text: "No muy a menudo" },
        { value: 3, text: "Muy rara vez" }
    ]}
];

// Interpretación HADS
function interpretHADS(score: number): { level: string; color: string; description: string } {
    if (score <= 7) {
        return { level: 'Normal', color: 'bg-green-500', description: 'Sin indicadores clínicos significativos.' };
    } else if (score <= 10) {
        return { level: 'Borde', color: 'bg-yellow-500', description: 'Indicadores leves. Monitoreo recomendado.' };
    } else {
        return { level: 'Caso', color: 'bg-red-500', description: 'Indicadores clínicos significativos. Evaluación requerida.' };
    }
}

interface HadsFormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: {
        anxiety: number;
        depression: number;
        anxietyInterpretation: string;
        depressionInterpretation: string;
    }) => void;
}

export default function HadsForm({ studentId, grupoId, matricula, onComplete }: HadsFormProps) {
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        anxiety: number;
        depression: number;
        anxietyInterpretation: { level: string; color: string; description: string };
        depressionInterpretation: { level: string; color: string; description: string };
    } | null>(null);

    const handleResponseChange = useCallback((itemId: string, value: number) => {
        setResponses(prev => ({
            ...prev,
            [itemId]: value
        }));
    }, []);

    const answeredCount = Object.keys(responses).length;
    const progress = (answeredCount / 14) * 100;

    const calculateResult = useCallback(() => {
        if (answeredCount < 14) return null;

        let anxiety = 0;
        let depression = 0;

        Object.entries(responses).forEach(([key, value]) => {
            if (key.startsWith('a')) {
                anxiety += value;
            } else {
                depression += value;
            }
        });

        return {
            anxiety,
            depression,
            anxietyInterpretation: interpretHADS(anxiety),
            depressionInterpretation: interpretHADS(depression)
        };
    }, [responses, answeredCount]);

    const handleSubmit = async () => {
        const calculatedResult = calculateResult();
        if (!calculatedResult) {
            alert('Por favor, responda todas las preguntas.');
            return;
        }

        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({
                anxiety: calculatedResult.anxiety,
                depression: calculatedResult.depression,
                anxietyInterpretation: calculatedResult.anxietyInterpretation.level,
                depressionInterpretation: calculatedResult.depressionInterpretation.level
            });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    grupoId: grupoId || null,
                    matricula: matricula || null,
                    testType: 'HADS',
                    date: Timestamp.now(),
                    score: calculatedResult.anxiety + calculatedResult.depression,
                    interpretation: `A:${calculatedResult.anxietyInterpretation.level} D:${calculatedResult.depressionInterpretation.level}`,
                    level: `A:${calculatedResult.anxietyInterpretation.level} D:${calculatedResult.depressionInterpretation.level}`,
                    details: {
                        anxiety: calculatedResult.anxiety,
                        depression: calculatedResult.depression,
                        anxietyInterpretation: calculatedResult.anxietyInterpretation.level,
                        depressionInterpretation: calculatedResult.depressionInterpretation.level
                    },
                    responses
                });
            } catch (error) {
                console.error('Error guardando:', error);
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
                        Resultados HADS
                    </CardTitle>
                    <CardDescription>Hospital Anxiety and Depression Scale</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Resultados lado a lado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-4xl font-bold text-blue-600">{result.anxiety}</p>
                            <p className="text-sm text-gray-500">Ansiedad (0-21)</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-4xl font-bold text-purple-600">{result.depression}</p>
                            <p className="text-sm text-gray-500">Depresión (0-21)</p>
                        </div>
                    </div>

                    {/* Interpretaciones */}
                    <div className={`p-4 rounded-lg ${result.anxietyInterpretation.color} text-white`}>
                        <p className="font-semibold">Ansiedad: {result.anxietyInterpretation.level}</p>
                        <p className="text-sm opacity-90">{result.anxietyInterpretation.description}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${result.depressionInterpretation.color} text-white`}>
                        <p className="font-semibold">Depresión: {result.depressionInterpretation.level}</p>
                        <p className="text-sm opacity-90">{result.depressionInterpretation.description}</p>
                    </div>

                    {/* Rangos */}
                    <div className="p-4 bg-gray-50 rounded-lg text-sm">
                        <p className="font-semibold mb-2">Interpretación:</p>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-green-500"></div>
                                <span>0-7: Normal</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                                <span>8-10: Borde</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-red-500"></div>
                                <span>11-21: Caso</span>
                            </div>
                        </div>
                    </div>

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
                <CardTitle>HADS - Escala Hospitalaria de Ansiedad y Depresión</CardTitle>
                <CardDescription>Responda cómo se ha sentido durante la última semana.</CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredCount}/14</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {hadsItems.map((item, index) => (
                    <div key={item.id} className={`p-4 border rounded-lg ${item.type === 'A' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <p className="font-medium">{item.text}</p>
                            <span className={`text-xs px-2 py-1 rounded ${item.type === 'A' ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'}`}>
                                {item.type === 'A' ? 'Ansiedad' : 'Depresión'}
                            </span>
                        </div>
                        <RadioGroup
                            value={responses[item.id]?.toString() || ''}
                            onValueChange={(value) => handleResponseChange(item.id, parseInt(value))}
                            className="space-y-2"
                        >
                            {item.options.map(opt => (
                                <div key={opt.value} className="flex items-center space-x-3 p-2 rounded hover:bg-white">
                                    <RadioGroupItem value={opt.value.toString()} id={`${item.id}-${opt.value}`} />
                                    <Label htmlFor={`${item.id}-${opt.value}`} className="cursor-pointer">{opt.text}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                ))}

                <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={answeredCount < 14 || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
