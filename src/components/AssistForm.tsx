'use client';

import { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Save, RotateCcw, AlertTriangle, Pill, Cigarette, Wine, Droplets } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Sustancias evaluadas en ASSIST
const substances = [
    { id: 'tobacco', name: 'Tabaco', icon: Cigarette, questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] },
    { id: 'alcohol', name: 'Alcohol', icon: Wine, questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] },
    { id: 'cannabis', name: 'Cannabis', icon: Droplets, questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] },
    { id: 'cocaine', name: 'Cocaína', icon: Pill, questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] },
    { id: 'amphetamines', name: 'Anfetaminas', icon: Pill, questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] },
    { id: 'inhalants', name: 'Inhalantes', icon: Droplets, questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] },
    { id: 'sedatives', name: 'Sedantes/Tranquilizantes', icon: Pill, questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] },
    { id: 'hallucinogens', name: 'Alucinógenos', icon: Droplets, questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] },
    { id: 'opioids', name: 'Opioides', icon: Pill, questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] },
    { id: 'other', name: 'Otras sustancias', icon: Pill, questions: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7'] }
];

// Preguntas ASSIST V3.1
const questions = {
    Q1: {
        text: '¿Alguna vez en su vida ha consumido...?',
        type: 'lifetime',
        options: [
            { value: 0, text: 'Nunca' },
            { value: 2, text: 'Sí, pero no en los últimos 3 meses' },
            { value: 3, text: 'Sí, en los últimos 3 meses' }
        ]
    },
    Q2: {
        text: '¿Con qué frecuencia ha consumido... durante los últimos 3 meses?',
        type: 'frequency',
        options: [
            { value: 0, text: 'Nunca' },
            { value: 2, text: 'Una o dos veces' },
            { value: 3, text: 'Mensualmente' },
            { value: 4, text: 'Semanalmente' },
            { value: 6, text: 'Diariamente o casi diariamente' }
        ]
    },
    Q3: {
        text: '¿Con qué frecuencia ha tenido un deseo o ansia intensa de consumir... durante los últimos 3 meses?',
        type: 'craving',
        options: [
            { value: 0, text: 'Nunca' },
            { value: 3, text: 'Una o dos veces' },
            { value: 4, text: 'Mensualmente' },
            { value: 5, text: 'Semanalmente' },
            { value: 6, text: 'Diariamente o casi diariamente' }
        ]
    },
    Q4: {
        text: '¿Con qué frecuencia el consumo de... ha llevado a problemas de salud, sociales, legales o económicos durante los últimos 3 meses?',
        type: 'problems',
        options: [
            { value: 0, text: 'Nunca' },
            { value: 4, text: 'Una o dos veces' },
            { value: 5, text: 'Mensualmente' },
            { value: 6, text: 'Semanalmente' },
            { value: 7, text: 'Diariamente o casi diariamente' }
        ]
    },
    Q5: {
        text: '¿Con qué frecuencia ha dejado de hacer lo que se esperaba de usted por el consumo de... durante los últimos 3 meses?',
        type: 'neglect',
        options: [
            { value: 0, text: 'Nunca' },
            { value: 5, text: 'Una o dos veces' },
            { value: 6, text: 'Mensualmente' },
            { value: 7, text: 'Semanalmente' },
            { value: 8, text: 'Diariamente o casi diariamente' }
        ]
    },
    Q6: {
        text: '¿Alguna vez un amigo, familiar o alguien más ha mostrado preocupación por su consumo de...?',
        type: 'concern',
        options: [
            { value: 0, text: 'Nunca' },
            { value: 6, text: 'Sí, en los últimos 3 meses' },
            { value: 3, text: 'Sí, pero no en los últimos 3 meses' }
        ]
    },
    Q7: {
        text: '¿Alguna vez ha intentado sin éxito controlar, reducir o dejar de consumir...?',
        type: 'control',
        options: [
            { value: 0, text: 'Nunca' },
            { value: 6, text: 'Sí, en los últimos 3 meses' },
            { value: 3, text: 'Sí, pero no en los últimos 3 meses' }
        ]
    }
};

function calculateASSISTScore(responses: Record<string, number>): {
    substanceScores: { substance: string; score: number; risk: string; intervention: string }[];
    totalScore: number;
    highRiskSubstances: string[];
    recommendation: string;
} {
    const substanceScores: { substance: string; score: number; risk: string; intervention: string }[] = [];
    let totalScore = 0;
    const highRiskSubstances: string[] = [];

    substances.forEach(substance => {
        let score = 0;
        substance.questions.forEach(q => {
            const key = `${substance.id}_${q}`;
            score += responses[key] || 0;
        });

        // Puntuaciones específicas por sustancia (Q1 se cuenta diferente si no consumió recientemente)
        let risk = 'Bajo';
        let intervention = 'Sin intervención necesaria';

        if (score >= 27) {
            risk = 'Alto';
            intervention = 'Intervención intensiva y derivación a tratamiento especializado';
            highRiskSubstances.push(substance.name);
        } else if (score >= 4) {
            risk = 'Moderado';
            intervention = 'Intervención breve';
        }

        substanceScores.push({
            substance: substance.name,
            score,
            risk,
            intervention
        });

        totalScore += score;
    });

    let recommendation = 'No se detecta consumo problemático de sustancias.';
    if (highRiskSubstances.length > 0) {
        recommendation = `Se requiere intervención urgente para: ${highRiskSubstances.join(', ')}. Derivar a servicios especializados.`;
    } else if (totalScore > 0) {
        recommendation = 'Se detecta consumo de sustancias. Se recomienda seguimiento e intervención preventiva.';
    }

    return {
        substanceScores,
        totalScore,
        highRiskSubstances,
        recommendation
    };
}

interface AssistFormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: {
        totalScore: number;
        substanceScores: { substance: string; score: number; risk: string; intervention: string }[];
        highRiskSubstances: string[];
        recommendation: string;
    }) => void;
}

export default function AssistForm({ studentId, grupoId, matricula, onComplete }: AssistFormProps) {
    const [selectedSubstances, setSelectedSubstances] = useState<string[]>([]);
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<ReturnType<typeof calculateASSISTScore> | null>(null);

    const toggleSubstance = (substanceId: string) => {
        setSelectedSubstances(prev => 
            prev.includes(substanceId) 
                ? prev.filter(id => id !== substanceId)
                : [...prev, substanceId]
        );
    };

    const handleResponseChange = useCallback((key: string, value: number) => {
        setResponses(prev => ({ ...prev, [key]: value }));
    }, []);

    const totalRequiredQuestions = selectedSubstances.reduce((acc, subId) => {
        const substance = substances.find(s => s.id === subId);
        return acc + (substance ? substance.questions.length : 0);
    }, 0);

    const answeredCount = Object.keys(responses).filter(key => 
        selectedSubstances.some(sub => key.startsWith(sub + '_'))
    ).length;

    const progress = totalRequiredQuestions > 0 ? (answeredCount / totalRequiredQuestions) * 100 : 0;

    const handleSubmit = async () => {
        if (answeredCount < totalRequiredQuestions) {
            alert('Por favor, responda todas las preguntas de las sustancias seleccionadas.');
            return;
        }

        const calculatedResult = calculateASSISTScore(responses);
        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({
                totalScore: calculatedResult.totalScore,
                substanceScores: calculatedResult.substanceScores,
                highRiskSubstances: calculatedResult.highRiskSubstances,
                recommendation: calculatedResult.recommendation
            });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    grupoId: grupoId || null,
                    matricula: matricula || null,
                    testType: 'ASSIST',
                    date: Timestamp.now(),
                    score: calculatedResult.totalScore,
                    totalScore: calculatedResult.totalScore,
                    substanceScores: calculatedResult.substanceScores,
                    highRiskSubstances: calculatedResult.highRiskSubstances,
                    recommendation: calculatedResult.recommendation,
                    selectedSubstances,
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
        setSelectedSubstances([]);
        setResponses({});
        setIsSubmitted(false);
        setResult(null);
    };

    if (isSubmitted && result) {
        const getRiskColor = (risk: string) => {
            switch (risk) {
                case 'Alto': return 'bg-red-500';
                case 'Moderado': return 'bg-orange-500';
                default: return 'bg-green-500';
            }
        };

        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        Resultados ASSIST v3.1
                    </CardTitle>
                    <CardDescription>Alcohol, Smoking and Substance Involvement Screening Test</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Puntuación total */}
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-5xl font-bold text-gray-800">{result.totalScore}</p>
                        <p className="text-sm text-gray-500 mt-1">Puntuación total</p>
                    </div>

                    {/* Resultados por sustancia */}
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">Puntuación por Sustancia</h3>
                        <div className="space-y-3">
                            {result.substanceScores.filter(s => s.score > 0).map((substance) => (
                                <div key={substance.substance} className={`p-3 rounded-lg ${
                                    substance.risk === 'Alto' ? 'bg-red-50 border border-red-200' :
                                    substance.risk === 'Moderado' ? 'bg-orange-50 border border-orange-200' :
                                    'bg-gray-50'
                                }`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{substance.substance}</span>
                                        <span className={`px-2 py-1 rounded text-white text-sm ${getRiskColor(substance.risk)}`}>
                                            {substance.score} - {substance.risk}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600">{substance.intervention}</p>
                                </div>
                            ))}
                            {result.substanceScores.filter(s => s.score > 0).length === 0 && (
                                <p className="text-gray-500 text-center py-4">No se detectó consumo de sustancias.</p>
                            )}
                        </div>
                    </div>

                    {/* Alertas */}
                    {result.highRiskSubstances.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <p className="text-red-800 font-semibold">
                                    Consumo de Alto Riesgo Detectado
                                </p>
                            </div>
                            <p className="text-red-600 text-sm">
                                Las siguientes sustancias requieren intervención urgente: {result.highRiskSubstances.join(', ')}
                            </p>
                        </div>
                    )}

                    {/* Recomendación */}
                    <div className={`p-4 rounded-lg ${
                        result.highRiskSubstances.length > 0 ? 'bg-red-100 border border-red-300' :
                        result.totalScore > 0 ? 'bg-orange-100 border border-orange-300' :
                        'bg-green-100 border border-green-300'
                    }`}>
                        <h4 className="font-semibold mb-1">Recomendación</h4>
                        <p className="text-sm">{result.recommendation}</p>
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
                <CardTitle>ASSIST v3.1 - Cribado de Consumo de Sustancias</CardTitle>
                <CardDescription>
                    Cuestionario de la OMS para identificar consumo problemático de alcohol, tabaco y otras sustancias.
                </CardDescription>
                {selectedSubstances.length > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progreso</span>
                            <span>{answeredCount}/{totalRequiredQuestions}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Paso 1: Selección de sustancias */}
                <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Paso 1: Seleccione las sustancias que ha consumido alguna vez en su vida</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {substances.map(substance => {
                            const Icon = substance.icon;
                            return (
                                <div
                                    key={substance.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                        selectedSubstances.includes(substance.id)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => toggleSubstance(substance.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            checked={selectedSubstances.includes(substance.id)}
                                            onCheckedChange={() => toggleSubstance(substance.id)}
                                        />
                                        <Icon className="h-4 w-4 text-gray-600" />
                                        <span className="text-sm">{substance.name}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Paso 2: Preguntas por sustancia seleccionada */}
                {selectedSubstances.length > 0 && (
                    <div className="space-y-6">
                        <h3 className="font-semibold">Paso 2: Responda las preguntas para cada sustancia seleccionada</h3>
                        
                        {selectedSubstances.map(substanceId => {
                            const substance = substances.find(s => s.id === substanceId);
                            if (!substance) return null;
                            const Icon = substance.icon;

                            return (
                                <div key={substanceId} className="border rounded-lg p-4">
                                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <Icon className="h-5 w-5" />
                                        {substance.name}
                                    </h4>
                                    <div className="space-y-4">
                                        {substance.questions.map((qKey, idx) => {
                                            const question = questions[qKey as keyof typeof questions];
                                            return (
                                                <div key={`${substanceId}_${qKey}`} className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="font-medium text-sm mb-3">
                                                        {idx + 1}. {question.text.replace('...', substance.name.toLowerCase())}
                                                    </p>
                                                    <RadioGroup
                                                        value={responses[`${substanceId}_${qKey}`]?.toString() || ''}
                                                        onValueChange={(value) => handleResponseChange(`${substanceId}_${qKey}`, parseInt(value))}
                                                        className="space-y-2"
                                                    >
                                                        {question.options.map(opt => (
                                                            <div key={opt.value} className="flex items-center space-x-3 p-2 rounded hover:bg-white cursor-pointer">
                                                                <RadioGroupItem value={opt.value.toString()} id={`${substanceId}_${qKey}_${opt.value}`} />
                                                                <Label htmlFor={`${substanceId}_${qKey}_${opt.value}`} className="cursor-pointer text-sm">
                                                                    {opt.text}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={selectedSubstances.length === 0 || answeredCount < totalRequiredQuestions || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
