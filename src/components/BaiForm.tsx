'use client';

import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Save, RotateCcw } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// 21 ítems del BAI
const baiItems = [
    "1. Entumecimiento u hormigueo", "2. Sensación de calor", "3. Temblor en las piernas",
    "4. Incapacidad para relajarse", "5. Miedo a que suceda lo peor", "6. Mareo o aturdimiento",
    "7. Palpitaciones o taquicardia", "8. Sensación de inestabilidad", "9. Sensación de terror",
    "10. Nerviosismo", "11. Sensación de ahogo", "12. Temblor de manos",
    "13. Temblor generalizado", "14. Miedo a perder el control", "15. Dificultad para respirar",
    "16. Miedo a morir", "17. Asustado", "18. Indigestión o malestar abdominal",
    "19. Sensación de desmayo", "20. Rubor facial", "21. Sudoración (no debida al calor)"
];

// Factores: F1=Cognitivo(4,5,9,10,14,16,17), F2=Somático(1,2,3,6,7,8,12,13,19,20,21), F3=Autonómico(11,15,18), F4=Pánico(7,11,15,16)
const FACTOR_ITEMS = {
    cognitive: [4, 5, 9, 10, 14, 16, 17],
    somatic: [1, 2, 3, 6, 7, 8, 12, 13, 19, 20, 21],
    autonomic: [11, 15, 18],
    panic: [7, 11, 15, 16]
};

function interpretBAI(score: number): { level: string; color: string; description: string } {
    if (score <= 10) return { level: 'Mínima', color: 'bg-green-500', description: 'Ansiedad mínima o ausente.' };
    if (score <= 18) return { level: 'Leve', color: 'bg-yellow-500', description: 'Ansiedad leve. Monitoreo recomendado.' };
    if (score <= 25) return { level: 'Moderada', color: 'bg-orange-500', description: 'Ansiedad moderada. Intervención recomendada.' };
    return { level: 'Grave', color: 'bg-red-500', description: 'Ansiedad grave. Requiere atención prioritaria.' };
}

interface BaiFormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: { total: number; interpretation: string; factors: { cognitive: number; somatic: number; autonomic: number; panic: number } }) => void;
}

export default function BaiForm({ studentId, grupoId, matricula, onComplete }: BaiFormProps) {
    const [responses, setResponses] = useState<Record<number, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        total: number; interpretation: { level: string; color: string; description: string };
        factors: { cognitive: number; somatic: number; autonomic: number; panic: number };
    } | null>(null);

    const handleResponseChange = useCallback((itemId: number, value: number) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const answeredCount = Object.keys(responses).length;

    const calculateResult = useCallback(() => {
        if (answeredCount < 21) return null;
        
        let total = 0;
        Object.values(responses).forEach(v => total += v);

        const factors = {
            cognitive: FACTOR_ITEMS.cognitive.reduce((sum, i) => sum + (responses[i] || 0), 0),
            somatic: FACTOR_ITEMS.somatic.reduce((sum, i) => sum + (responses[i] || 0), 0),
            autonomic: FACTOR_ITEMS.autonomic.reduce((sum, i) => sum + (responses[i] || 0), 0),
            panic: FACTOR_ITEMS.panic.reduce((sum, i) => sum + (responses[i] || 0), 0)
        };

        return { total, interpretation: interpretBAI(total), factors };
    }, [responses, answeredCount]);

    const handleSubmit = async () => {
        const calculatedResult = calculateResult();
        if (!calculatedResult) { alert('Responda todas las preguntas.'); return; }

        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({ total: calculatedResult.total, interpretation: calculatedResult.interpretation.level, factors: calculatedResult.factors });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    grupoId: grupoId || null,
                    matricula: matricula || null,
                    testType: 'BAI',
                    date: Timestamp.now(),
                    score: calculatedResult.total,
                    interpretation: calculatedResult.interpretation.level,
                    level: calculatedResult.interpretation.level,
                    details: { factors: calculatedResult.factors },
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
                    <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-6 w-6 text-green-600" />Resultados BAI</CardTitle>
                    <CardDescription>Inventario de Ansiedad de Beck</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-5xl font-bold">{result.total}</p>
                        <p className="text-sm text-gray-500">Puntuación total (0-63)</p>
                    </div>
                    <div className={`p-4 rounded-lg ${result.interpretation.color} text-white`}>
                        <p className="text-xl font-semibold">{result.interpretation.level}</p>
                        <p className="text-sm opacity-90">{result.interpretation.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg"><p className="text-sm">F1 - Cognitivo</p><p className="text-2xl font-bold text-blue-600">{result.factors.cognitive}</p></div>
                        <div className="p-3 bg-green-50 rounded-lg"><p className="text-sm">F2 - Somático</p><p className="text-2xl font-bold text-green-600">{result.factors.somatic}</p></div>
                        <div className="p-3 bg-purple-50 rounded-lg"><p className="text-sm">F3 - Autonómico</p><p className="text-2xl font-bold text-purple-600">{result.factors.autonomic}</p></div>
                        <div className="p-3 bg-red-50 rounded-lg"><p className="text-sm">F4 - Pánico</p><p className="text-2xl font-bold text-red-600">{result.factors.panic}</p></div>
                    </div>
                    <Button onClick={handleReset} variant="outline" className="w-full"><RotateCcw className="mr-2 h-4 w-4" />Nueva Evaluación</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>BAI - Inventario de Ansiedad de Beck</CardTitle>
                <CardDescription>Indique cuánto le ha molestado cada síntoma durante la última semana.</CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Progreso</span><span>{answeredCount}/21</span></div>
                    <Progress value={(answeredCount / 21) * 100} className="h-2" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-green-100">
                                <th className="text-left p-3 font-semibold text-green-800">Síntoma</th>
                                <th className="text-center p-2 w-16">Nada (0)</th>
                                <th className="text-center p-2 w-16">Leve (1)</th>
                                <th className="text-center p-2 w-16">Mod (2)</th>
                                <th className="text-center p-2 w-16">Sev (3)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {baiItems.map((item, index) => {
                                const itemNumber = index + 1;
                                return (
                                    <tr key={itemNumber} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="p-3 text-sm">{item}</td>
                                        {[0, 1, 2, 3].map(value => (
                                            <td key={value} className="text-center p-2">
                                                <input type="radio" name={`bai-${itemNumber}`} value={value}
                                                    checked={responses[itemNumber] === value}
                                                    onChange={() => handleResponseChange(itemNumber, value)}
                                                    className="w-5 h-5 cursor-pointer accent-green-600" />
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Button onClick={handleSubmit} className="w-full mt-6" disabled={answeredCount < 21 || isSaving} size="lg">
                    <Save className="mr-2 h-4 w-4" />{isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
