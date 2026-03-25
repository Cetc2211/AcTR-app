'use client';

import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Save, RotateCcw } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const gad7Items = [
    "1. Sentirse nervioso(a), ansioso(a) o con los nervios de punta",
    "2. No poder dejar de preocuparse o no poder controlar la preocupación",
    "3. Preocuparse demasiado por diferentes cosas",
    "4. Dificultad para relajarse",
    "5. Sentirse tan inquieto(a) que es difícil quedarse quieto(a)",
    "6. Sentirse fácilmente molesto(a) o irritable",
    "7. Sentir miedo como si algo terrible fuera a pasar"
];

const responseOptions = [
    { value: 0, label: "Nunca (0)" },
    { value: 1, label: "Varios días (1)" },
    { value: 2, label: "Más de la mitad (2)" },
    { value: 3, label: "Casi todos (3)" }
];

function interpretGAD7(score: number): { level: string; color: string; description: string } {
    if (score <= 4) return { level: 'Mínimo', color: 'bg-green-500', description: 'Ansiedad mínima.' };
    if (score <= 9) return { level: 'Leve', color: 'bg-yellow-500', description: 'Ansiedad leve.' };
    if (score <= 14) return { level: 'Moderado', color: 'bg-orange-500', description: 'Ansiedad moderada.' };
    return { level: 'Grave', color: 'bg-red-500', description: 'Ansiedad grave.' };
}

interface Gad7FormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: { total: number; interpretation: string }) => void;
}

export default function Gad7Form({ studentId, grupoId, matricula, onComplete }: Gad7FormProps) {
    const [responses, setResponses] = useState<Record<number, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        total: number; interpretation: { level: string; color: string; description: string };
    } | null>(null);

    const handleResponseChange = useCallback((itemId: number, value: number) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const answeredCount = Object.keys(responses).length;

    const calculateResult = useCallback(() => {
        if (answeredCount < 7) return null;
        let total = 0;
        Object.values(responses).forEach(v => total += v);
        return { total, interpretation: interpretGAD7(total) };
    }, [responses, answeredCount]);

    const handleSubmit = async () => {
        const calculatedResult = calculateResult();
        if (!calculatedResult) { alert('Responda todas las preguntas.'); return; }

        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({ total: calculatedResult.total, interpretation: calculatedResult.interpretation.level });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    grupoId: grupoId || null,
                    matricula: matricula || null,
                    testType: 'GAD-7',
                    date: Timestamp.now(),
                    score: calculatedResult.total,
                    interpretation: calculatedResult.interpretation.level,
                    level: calculatedResult.interpretation.level,
                    responses
                });
            } catch (error) { console.error('Error:', error); }
            finally { setIsSaving(false); }
        }
    };

    const handleReset = () => { setResponses({}); setIsSubmitted(false); setResult(null); };

    if (isSubmitted && result) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-6 w-6 text-green-600" />Resultados GAD-7</CardTitle>
                    <CardDescription>Generalized Anxiety Disorder-7</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-5xl font-bold">{result.total}</p>
                        <p className="text-sm text-gray-500">Puntuación total (0-21)</p>
                    </div>
                    <div className={`p-4 rounded-lg ${result.interpretation.color} text-white`}>
                        <p className="text-xl font-semibold">{result.interpretation.level}</p>
                        <p className="text-sm opacity-90">{result.interpretation.description}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500"></div><span>0-4: Mínimo</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-500"></div><span>5-9: Leve</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500"></div><span>10-14: Moderado</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500"></div><span>15-21: Grave</span></div>
                        </div>
                    </div>
                    <Button onClick={handleReset} variant="outline" className="w-full"><RotateCcw className="mr-2 h-4 w-4" />Nueva Evaluación</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>GAD-7 - Escala de Ansiedad Generalizada</CardTitle>
                <CardDescription>Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado estos problemas?</CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Progreso</span><span>{answeredCount}/7</span></div>
                    <Progress value={(answeredCount / 7) * 100} className="h-2" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-orange-100">
                                <th className="text-left p-3 font-semibold text-orange-800">Problema</th>
                                {responseOptions.map(opt => (
                                    <th key={opt.value} className="text-center p-2 font-semibold text-orange-800 w-20 text-xs">{opt.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {gad7Items.map((item, index) => {
                                const itemNumber = index + 1;
                                return (
                                    <tr key={itemNumber} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="p-3 text-sm">{item}</td>
                                        {responseOptions.map(opt => (
                                            <td key={opt.value} className="text-center p-2">
                                                <input type="radio" name={`gad7-${itemNumber}`} value={opt.value}
                                                    checked={responses[itemNumber] === opt.value}
                                                    onChange={() => handleResponseChange(itemNumber, opt.value)}
                                                    className="w-5 h-5 cursor-pointer accent-orange-600" />
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Button onClick={handleSubmit} className="w-full mt-6 bg-orange-600 hover:bg-orange-700" disabled={answeredCount < 7 || isSaving} size="lg">
                    <Save className="mr-2 h-4 w-4" />{isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
