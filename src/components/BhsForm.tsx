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

// 20 ítems del BHS con ítems invertidos
const bhsItems = [
    { id: 1, text: "Espero el futuro con esperanza y entusiasmo.", inverted: true },
    { id: 2, text: "Es posible que no logre lo que me proponga.", inverted: false },
    { id: 3, text: "Cuando las cosas van mal, me ayuda saber que no pueden seguir así siempre.", inverted: true },
    { id: 4, text: "No puedo imaginar cómo será mi vida dentro de 10 años.", inverted: false },
    { id: 5, text: "Tengo suficiente tiempo para lograr las cosas que quiero hacer.", inverted: true },
    { id: 6, text: "En el futuro, espero tener éxito en lo que más me interesa.", inverted: true },
    { id: 7, text: "El futuro me parece oscuro y sin esperanza.", inverted: false },
    { id: 8, text: "Espero tener más cosas buenas que malas.", inverted: true },
    { id: 9, text: "Simplemente no creo que las cosas vayan a mejorar para mí.", inverted: false },
    { id: 10, text: "Los tiempos pasados fueron mejores que los actuales.", inverted: false },
    { id: 11, text: "Las cosas que quiero hacer en el futuro probablemente no se harán realidad.", inverted: false },
    { id: 12, text: "Alcanzo mis metas.", inverted: true },
    { id: 13, text: "El futuro es un misterio para mí.", inverted: false },
    { id: 14, text: "Tengo grandes esperanzas.", inverted: true },
    { id: 15, text: "Es muy probable que no tenga éxito en la vida.", inverted: false },
    { id: 16, text: "Tengo una visión clara de lo que quiero ser.", inverted: true },
    { id: 17, text: "Rara vez espero que algo bueno me suceda.", inverted: false },
    { id: 18, text: "Me resulta imposible alcanzar mis objetivos.", inverted: false },
    { id: 19, text: "Puedo ver posibilidades en el futuro.", inverted: true },
    { id: 20, text: "Las cosas no van a mejorar para mí.", inverted: false }
];

// Ítems que suman punto cuando la respuesta es TRUE (no invertidos)
const TRUE_SCORES = [2, 4, 7, 9, 11, 12, 14, 16, 17, 18, 20];

// Interpretación BHS
function interpretBHS(score: number): { level: string; color: string; description: string } {
    if (score <= 3) {
        return { level: 'Bajo', color: 'bg-green-500', description: 'Desesperanza baja. Sin indicadores de riesgo.' };
    } else if (score <= 8) {
        return { level: 'Medio', color: 'bg-yellow-500', description: 'Desesperanza media. Monitoreo recomendado.' };
    } else {
        return { level: 'Alto', color: 'bg-red-500', description: 'Desesperanza alta. Factor de riesgo suicida. Evaluación requerida.' };
    }
}

interface BhsFormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: { total: number; interpretation: string }) => void;
}

export default function BhsForm({ studentId, grupoId, matricula, onComplete }: BhsFormProps) {
    const [responses, setResponses] = useState<Record<number, boolean>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        total: number;
        interpretation: { level: string; color: string; description: string };
    } | null>(null);

    const handleResponseChange = useCallback((itemId: number, value: boolean) => {
        setResponses(prev => ({
            ...prev,
            [itemId]: value
        }));
    }, []);

    const answeredCount = Object.keys(responses).length;
    const progress = (answeredCount / 20) * 100;

    const calculateResult = useCallback(() => {
        if (answeredCount < 20) return null;

        let total = 0;
        Object.entries(responses).forEach(([key, value]) => {
            const itemId = parseInt(key);
            if (value === true && TRUE_SCORES.includes(itemId)) {
                total += 1;
            } else if (value === false && !TRUE_SCORES.includes(itemId)) {
                total += 1;
            }
        });

        return {
            total,
            interpretation: interpretBHS(total)
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
                total: calculatedResult.total,
                interpretation: calculatedResult.interpretation.level
            });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    grupoId: grupoId || null,
                    matricula: matricula || null,
                    testType: 'BHS',
                    date: Timestamp.now(),
                    score: calculatedResult.total,
                    interpretation: calculatedResult.interpretation.level,
                    level: calculatedResult.interpretation.level,
                    responses: Object.fromEntries(Object.entries(responses).map(([k, v]) => [k, v ? 'T' : 'F']))
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
                        Resultados BHS
                    </CardTitle>
                    <CardDescription>Escala de Desesperanza de Beck</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-5xl font-bold text-gray-800">{result.total}</p>
                        <p className="text-sm text-gray-500 mt-1">Puntuación total (0-20)</p>
                    </div>

                    <div className={`p-4 rounded-lg ${result.interpretation.color} text-white`}>
                        <p className="text-xl font-semibold">{result.interpretation.level}</p>
                        <p className="text-sm opacity-90">{result.interpretation.description}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg text-sm">
                        <p className="font-semibold mb-2">Interpretación:</p>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-green-500"></div>
                                <span>0-3: Bajo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                                <span>4-8: Medio</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-red-500"></div>
                                <span>9-20: Alto</span>
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
                <CardTitle>BHS - Escala de Desesperanza de Beck</CardTitle>
                <CardDescription>Responda Verdadero o Falso según cómo se ha sentido durante la última semana.</CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredCount}/20</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="text-left p-3 font-semibold">Afirmación</th>
                                <th className="text-center p-3 font-semibold w-20">Verdadero</th>
                                <th className="text-center p-3 font-semibold w-20">Falso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bhsItems.map((item, index) => (
                                <tr key={item.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                                    <td className="p-3 text-sm">{item.id}. {item.text}</td>
                                    <td className="text-center p-3">
                                        <input
                                            type="radio"
                                            name={`bhs-${item.id}`}
                                            checked={responses[item.id] === true}
                                            onChange={() => handleResponseChange(item.id, true)}
                                            className="w-5 h-5 cursor-pointer accent-blue-600"
                                        />
                                    </td>
                                    <td className="text-center p-3">
                                        <input
                                            type="radio"
                                            name={`bhs-${item.id}`}
                                            checked={responses[item.id] === false}
                                            onChange={() => handleResponseChange(item.id, false)}
                                            className="w-5 h-5 cursor-pointer accent-blue-600"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Button
                    onClick={handleSubmit}
                    className="w-full mt-6"
                    disabled={answeredCount < 20 || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
