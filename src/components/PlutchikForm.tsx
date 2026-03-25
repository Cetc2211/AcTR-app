'use client';

import { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// ============================================
// PLUTCHIK: ESCALA DE RIESGO SUICIDA
// ============================================

const plutchikItems = [
    { id: 'p1', text: '1. ¿Toma medicamentos habitualmente (aspirinas, para dormir)?', isCritical: false },
    { id: 'p2', text: '2. ¿Tiene dificultad para conciliar el sueño?', isCritical: false },
    { id: 'p3', text: '3. ¿Nota que podría perder el control?', isCritical: false },
    { id: 'p4', text: '4. ¿Tiene poco interés en relacionarse con la gente?', isCritical: false },
    { id: 'p5', text: '5. ¿Ve su futuro con más pesimismo que optimismo?', isCritical: false },
    { id: 'p6', text: '6. ¿Se ha sentido inútil o sin valor?', isCritical: false },
    { id: 'p7', text: '7. ¿Ve su futuro sin ninguna esperanza?', isCritical: false },
    { id: 'p8', text: '8. ¿Se ha sentido tan fracasado que quería abandonar?', isCritical: false },
    { id: 'p9', text: '9. ¿Está deprimido ahora?', isCritical: false },
    { id: 'p10', text: '10. ¿Está separado, divorciado o viudo?', isCritical: false },
    { id: 'p11', text: '11. ¿Sabe si algún familiar ha intentado suicidarse?', isCritical: false },
    { id: 'p12', text: '12. ¿Se ha sentido tan enfadado que podría matar a alguien?', isCritical: false },
    { id: 'p13', text: '13. ¿Ha pensado alguna vez en suicidarse?', isCritical: true },
    { id: 'p14', text: '14. ¿Ha comentado a alguien que quería suicidarse?', isCritical: true },
    { id: 'p15', text: '15. ¿Ha intentado alguna vez quitarse la vida?', isCritical: true }
];

function interpretPlutchik(score: number, hasCritical: boolean): { level: string; color: string; description: string; urgency: string } {
    if (score <= 2 && !hasCritical) {
        return { 
            level: 'Riesgo bajo', 
            color: 'bg-green-500', 
            description: 'No se detectan indicadores significativos de riesgo suicida inmediato.',
            urgency: 'Seguimiento rutinario'
        };
    }
    if (score <= 5) {
        return { 
            level: 'Riesgo bajo-moderado', 
            color: 'bg-yellow-500', 
            description: 'Algunos indicadores presentes. Se recomienda monitoreo y exploración clínica.',
            urgency: 'Seguimiento en 2-4 semanas'
        };
    }
    if (score <= 8) {
        return { 
            level: 'Riesgo moderado', 
            color: 'bg-orange-500', 
            description: 'Múltiples factores de riesgo presentes. Se requiere evaluación clínica.',
            urgency: 'Evaluación clínica en 1 semana'
        };
    }
    if (score <= 11) {
        return { 
            level: 'Riesgo alto', 
            color: 'bg-red-500', 
            description: 'Indicadores significativos de riesgo suicida. Requiere intervención.',
            urgency: 'Evaluación clínica urgente (24-48 hrs)'
        };
    }
    return { 
        level: 'RIESGO CRÍTICO', 
        color: 'bg-red-700', 
        description: 'Múltiples indicadores de alto riesgo. Requiere intervención inmediata.',
        urgency: 'INTERVENCIÓN INMEDIATA'
    };
}

interface PlutchikFormProps {
    studentId?: string;
    onComplete?: (result: { total: number; interpretation: string; criticalItems: number[] }) => void;
}

export default function PlutchikForm({ studentId, onComplete }: PlutchikFormProps) {
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        total: number;
        interpretation: { level: string; color: string; description: string; urgency: string };
        criticalItems: number[];
    } | null>(null);

    const handleResponseChange = useCallback((itemId: string, value: number) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const answeredCount = Object.keys(responses).length;
    const progress = (answeredCount / 15) * 100;

    const calculateResult = useCallback(() => {
        let total = 0;
        const criticalItems: number[] = [];

        Object.entries(responses).forEach(([key, value]) => {
            total += value;
            const itemNum = parseInt(key.replace('p', ''));
            const item = plutchikItems.find(i => i.id === key);
            if (item?.isCritical && value === 1) {
                criticalItems.push(itemNum);
            }
        });

        return {
            total,
            interpretation: interpretPlutchik(total, criticalItems.length > 0),
            criticalItems
        };
    }, [responses]);

    const handleSubmit = async () => {
        if (answeredCount < 15) {
            alert('Por favor, responda todas las preguntas.');
            return;
        }

        const calculatedResult = calculateResult();
        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({
                total: calculatedResult.total,
                interpretation: calculatedResult.interpretation.level,
                criticalItems: calculatedResult.criticalItems
            });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    testType: 'Plutchik',
                    date: Timestamp.now(),
                    score: calculatedResult.total,
                    interpretation: calculatedResult.interpretation.level,
                    criticalItems: calculatedResult.criticalItems,
                    urgency: calculatedResult.interpretation.urgency,
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

    // Render de resultado
    if (isSubmitted && result) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        Resultados Plutchik
                    </CardTitle>
                    <CardDescription>Escala de Riesgo Suicida</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-5xl font-bold text-gray-800">{result.total}</p>
                        <p className="text-sm text-gray-500 mt-1">Puntuación total (0-15)</p>
                    </div>

                    <div className={`p-4 rounded-lg ${result.interpretation.color} text-white`}>
                        <p className="text-xl font-semibold">{result.interpretation.level}</p>
                        <p className="text-sm opacity-90">{result.interpretation.description}</p>
                    </div>

                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Urgencia recomendada</AlertTitle>
                        <AlertDescription>{result.interpretation.urgency}</AlertDescription>
                    </Alert>

                    {result.criticalItems.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                            <p className="text-red-800 font-semibold flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Items críticos afirmativos
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {result.criticalItems.map(num => (
                                    <Badge key={num} variant="destructive">
                                        Ítem {num}: {num === 13 ? 'Ideación' : num === 14 ? 'Comunicación' : 'Intento previo'}
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-red-600 text-sm mt-2">
                                ⚠️ Se requiere evaluación clínica inmediata para estos indicadores.
                            </p>
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
                <CardTitle>Plutchik - Escala de Riesgo Suicida</CardTitle>
                <CardDescription>
                    Responda SÍ o NO a cada pregunta. Los items 13-15 son críticos.
                </CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredCount}/15</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {plutchikItems.map(item => (
                    <div key={item.id} className={`p-4 border rounded-lg ${item.isCritical ? 'border-red-200 bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <p className="font-medium flex-1">{item.text}</p>
                            {item.isCritical && (
                                <Badge variant="destructive" className="text-xs">Crítico</Badge>
                            )}
                        </div>
                        <RadioGroup
                            value={responses[item.id]?.toString() || ''}
                            onValueChange={(value) => handleResponseChange(item.id, parseInt(value))}
                            className="flex gap-6 mt-3"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="1" id={`${item.id}-si`} />
                                <Label htmlFor={`${item.id}-si`} className="cursor-pointer font-semibold">SÍ</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="0" id={`${item.id}-no`} />
                                <Label htmlFor={`${item.id}-no`} className="cursor-pointer font-semibold">NO</Label>
                            </div>
                        </RadioGroup>
                    </div>
                ))}

                <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={answeredCount < 15 || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
