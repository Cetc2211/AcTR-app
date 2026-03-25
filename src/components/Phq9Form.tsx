'use client';

import { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const phq9Items = [
    { id: 1, text: "1. Poco interés o placer en hacer cosas", isCritical: false },
    { id: 2, text: "2. Se ha sentido desanimado(a), deprimido(a) o sin esperanzas", isCritical: false },
    { id: 3, text: "3. Ha tenido dificultad para dormir o ha estado durmiendo demasiado", isCritical: false },
    { id: 4, text: "4. Se ha sentido cansado(a) o con poca energía", isCritical: false },
    { id: 5, text: "5. Ha perdido el apetito o ha estado comiendo en exceso", isCritical: false },
    { id: 6, text: "6. Se ha sentido mal consigo mismo(a)", isCritical: false },
    { id: 7, text: "7. Ha tenido dificultad para concentrarse", isCritical: false },
    { id: 8, text: "8. Se ha estado moviendo muy lento o muy inquieto", isCritical: false },
    { id: 9, text: "9. Pensamientos de que sería mejor estar muerto(a) o de lastimarse", isCritical: true }
];

const responseOptions = [
    { value: 0, label: "Nunca (0)" },
    { value: 1, label: "Varios días (1)" },
    { value: 2, label: "Más de la mitad (2)" },
    { value: 3, label: "Casi todos (3)" }
];

const functionalityOptions = [
    { value: "Ninguna", text: "Ninguna dificultad" },
    { value: "Algo", text: "Algo de dificultad" },
    { value: "Mucha", text: "Mucha dificultad" },
    { value: "Extrema", text: "Extrema dificultad" }
];

function interpretPHQ9(score: number): { level: string; color: string; description: string } {
    if (score <= 4) return { level: 'Mínimo', color: 'bg-green-500', description: 'Sintomatología mínima.' };
    if (score <= 9) return { level: 'Leve', color: 'bg-yellow-500', description: 'Sintomatología leve.' };
    if (score <= 14) return { level: 'Moderado', color: 'bg-orange-500', description: 'Sintomatología moderada.' };
    if (score <= 19) return { level: 'Mod. Grave', color: 'bg-red-400', description: 'Sintomatología moderadamente grave.' };
    return { level: 'Grave', color: 'bg-red-600', description: 'Sintomatología grave.' };
}

interface Phq9FormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: { total: number; interpretation: string; item9Alert: boolean; functionality?: string }) => void;
}

export default function Phq9Form({ studentId, grupoId, matricula, onComplete }: Phq9FormProps) {
    const [responses, setResponses] = useState<Record<number, number>>({});
    const [functionality, setFunctionality] = useState<string>("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        total: number; interpretation: { level: string; color: string; description: string };
        item9Alert: boolean; item9Value: number; functionality: string;
    } | null>(null);

    const handleResponseChange = useCallback((itemId: number, value: number) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const answeredCount = Object.keys(responses).length;

    const calculateResult = useCallback(() => {
        if (answeredCount < 9) return null;
        let total = 0, item9Value = 0;
        Object.entries(responses).forEach(([key, value]) => {
            total += value;
            if (parseInt(key) === 9) item9Value = value;
        });
        return {
            total, interpretation: interpretPHQ9(total),
            item9Alert: item9Value >= 1, item9Value, functionality: functionality || "No especificado"
        };
    }, [responses, answeredCount, functionality]);

    const handleSubmit = async () => {
        const calculatedResult = calculateResult();
        if (!calculatedResult) { alert('Responda todas las preguntas.'); return; }

        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({
                total: calculatedResult.total, interpretation: calculatedResult.interpretation.level,
                item9Alert: calculatedResult.item9Alert, functionality: calculatedResult.functionality
            });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    grupoId: grupoId || null,
                    matricula: matricula || null,
                    testType: 'PHQ-9',
                    date: Timestamp.now(),
                    score: calculatedResult.total,
                    interpretation: calculatedResult.interpretation.level,
                    level: calculatedResult.interpretation.level,
                    alerts: calculatedResult.item9Alert ? ['A9 - Ideación suicida'] : [],
                    details: { item9Value: calculatedResult.item9Value, item9Alert: calculatedResult.item9Alert, functionality: calculatedResult.functionality },
                    responses
                });
            } catch (error) { console.error('Error:', error); }
            finally { setIsSaving(false); }
        }
    };

    const handleReset = () => { setResponses({}); setFunctionality(""); setIsSubmitted(false); setResult(null); };

    if (isSubmitted && result) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-6 w-6 text-green-600" />Resultados PHQ-9</CardTitle>
                    <CardDescription>Patient Health Questionnaire-9</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-5xl font-bold">{result.total}</p>
                        <p className="text-sm text-gray-500">Puntuación total (0-27)</p>
                    </div>
                    <div className={`p-4 rounded-lg ${result.interpretation.color} text-white`}>
                        <p className="text-xl font-semibold">{result.interpretation.level}</p>
                        <p className="text-sm opacity-90">{result.interpretation.description}</p>
                    </div>
                    {result.item9Alert && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>¡ALERTA - Riesgo Detectado!</AlertTitle>
                            <AlertDescription>El ítem 9 fue respondido positivamente. Se requiere evaluación de riesgo suicida inmediata.</AlertDescription>
                        </Alert>
                    )}
                    {result.functionality && result.functionality !== "No especificado" && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium">Dificultad funcional: {result.functionality}</p>
                        </div>
                    )}
                    <Button onClick={handleReset} variant="outline" className="w-full"><RotateCcw className="mr-2 h-4 w-4" />Nueva Evaluación</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>PHQ-9 - Cuestionario de Salud del Paciente</CardTitle>
                <CardDescription>Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado estos problemas?</CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1"><span>Progreso</span><span>{answeredCount}/9</span></div>
                    <Progress value={(answeredCount / 9) * 100} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-teal-100">
                                <th className="text-left p-3 font-semibold text-teal-800">Problema</th>
                                {responseOptions.map(opt => (
                                    <th key={opt.value} className="text-center p-2 font-semibold text-teal-800 w-20 text-xs">{opt.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {phq9Items.map(item => (
                                <tr key={item.id} className={`${item.isCritical ? 'border-l-4 border-red-500 bg-red-50' : ''}`}>
                                    <td className="p-3 text-sm">{item.text}{item.isCritical && ' ⚠️'}</td>
                                    {responseOptions.map(opt => (
                                        <td key={opt.value} className="text-center p-2">
                                            <input type="radio" name={`phq9-${item.id}`} value={opt.value}
                                                checked={responses[item.id] === opt.value}
                                                onChange={() => handleResponseChange(item.id, opt.value)}
                                                className="w-5 h-5 cursor-pointer accent-teal-600" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="font-semibold mb-3">10. Dificultad para hacer su trabajo, cuidar la casa o relacionarse:</p>
                    <RadioGroup value={functionality} onValueChange={setFunctionality} className="space-y-2">
                        {functionalityOptions.map(opt => (
                            <div key={opt.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt.value} id={`func-${opt.value}`} />
                                <Label htmlFor={`func-${opt.value}`} className="cursor-pointer">{opt.text}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={answeredCount < 9 || isSaving} size="lg">
                    <Save className="mr-2 h-4 w-4" />{isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
