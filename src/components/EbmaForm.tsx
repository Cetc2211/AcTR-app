'use client';

import { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Save, RotateCcw, TrendingUp, TrendingDown, Target } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// 28 items del EBMA (Escala de Brevedad de Motivación Académica) - Vallerand
// Organizados por subescalas
const ebmaItems = [
    // Motivación Intrínseca - Conocimiento (MIK)
    { id: 'item1', text: 'Por el placer de aprender cosas nuevas.', subscale: 'MIK' },
    { id: 'item9', text: 'Por el placer de descubrir cosas nuevas.', subscale: 'MIK' },
    { id: 'item17', text: 'Por el placer de conocer más sobre el tema que me interesa.', subscale: 'MIK' },
    { id: 'item25', text: 'Por el placer que siento al aprender nuevas cosas interesantes.', subscale: 'MIK' },
    
    // Motivación Intrínseca - Logro (MIL)
    { id: 'item5', text: 'Por la satisfacción que siento al superar mis límites.', subscale: 'MIL' },
    { id: 'item13', text: 'Porque me siento bien cuando logro mis objetivos académicos.', subscale: 'MIL' },
    { id: 'item21', text: 'Por la satisfacción de sentirme competente en mis estudios.', subscale: 'MIL' },
    { id: 'item28', text: 'Porque me siento orgulloso cuando supero los desafíos académicos.', subscale: 'MIL' },
    
    // Motivación Intrínseca - Estimulación (MIE)
    { id: 'item4', text: 'Por la emoción que siento cuando estoy aprendiendo.', subscale: 'MIE' },
    { id: 'item12', text: 'Porque me apasiona lo que estudio.', subscale: 'MIE' },
    { id: 'item20', text: 'Porque disfruto intensamente aprender cosas nuevas.', subscale: 'MIE' },
    { id: 'item27', text: 'Porque el aprendizaje me estimula intelectualmente.', subscale: 'MIE' },
    
    // Motivación Extrínseca - Identificada (MEID)
    { id: 'item3', text: 'Porque creo que los estudios me ayudarán a alcanzar mis metas.', subscale: 'MEID' },
    { id: 'item11', text: 'Porque finalmente elegí esta carrera y quiero completarla.', subscale: 'MEID' },
    { id: 'item19', text: 'Porque considero que mi formación es importante para mi futuro.', subscale: 'MEID' },
    { id: 'item26', text: 'Porque valoro la importancia de educarme.', subscale: 'MEID' },
    
    // Motivación Extrínseca - Introyectada (MEIN)
    { id: 'item2', text: 'Para demostrar que soy capaz de tener éxito en mis estudios.', subscale: 'MEIN' },
    { id: 'item10', text: 'Para no sentirme culpable de no aprovechar las oportunidades.', subscale: 'MEIN' },
    { id: 'item18', text: 'Para demostrarme a mí mismo que puedo tener éxito.', subscale: 'MEIN' },
    { id: 'item24', text: 'Porque me sentiría mal conmigo mismo si no estudiara.', subscale: 'MEIN' },
    
    // Motivación Extrínseca - Regulación Externa (MER)
    { id: 'item6', text: 'Para obtener un trabajo bien remunerado después.', subscale: 'MER' },
    { id: 'item14', text: 'Porque quiero tener un buen nivel de vida.', subscale: 'MER' },
    { id: 'item22', text: 'Para que mi familia esté orgullosa de mí.', subscale: 'MER' },
    { id: 'item7', text: 'Porque es lo que mis padres esperan de mí.', subscale: 'MER' },
    
    // Amotivación (AM)
    { id: 'item8', text: 'No lo sé, realmente no veo para qué estudio.', subscale: 'AM' },
    { id: 'item15', text: 'Honestamente, no lo sé; siento que pierdo mi tiempo.', subscale: 'AM' },
    { id: 'item23', text: 'No lo sé, no encuentro sentido a lo que hago en la escuela.', subscale: 'AM' },
    { id: 'item16', text: 'Antes tenía buenas razones para estudiar, pero ahora me pregunto si debo continuar.', subscale: 'AM' }
];

const subscaleInfo = {
    'MIK': { name: 'Motivación Intrínseca - Conocimiento', description: 'Placer de aprender y conocer', type: 'intrinsic', color: 'bg-blue-500' },
    'MIL': { name: 'Motivación Intrínseca - Logro', description: 'Satisfacción de superar desafíos', type: 'intrinsic', color: 'bg-blue-600' },
    'MIE': { name: 'Motivación Intrínseca - Estimulación', description: 'Emoción y pasión por aprender', type: 'intrinsic', color: 'bg-blue-400' },
    'MEID': { name: 'Motivación Extrínseca - Identificada', description: 'Valoración personal de los estudios', type: 'extrinsic', color: 'bg-green-500' },
    'MEIN': { name: 'Motivación Extrínseca - Introyectada', description: 'Presión interna y culpa', type: 'extrinsic', color: 'bg-yellow-500' },
    'MER': { name: 'Motivación Extrínseca - Regulación Externa', description: 'Recompensas externas y presión social', type: 'extrinsic', color: 'bg-orange-500' },
    'AM': { name: 'Amotivación', description: 'Falta de motivación', type: 'amotivation', color: 'bg-red-500' }
};

const responseOptions = [
    { value: 1, text: 'No corresponde en absoluto' },
    { value: 2, text: 'Corresponde un poco' },
    { value: 3, text: 'Corresponde moderadamente' },
    { value: 4, text: 'Corresponde mucho' },
    { value: 5, text: 'Corresponde completamente' }
];

function calculateEBMAResults(responses: Record<string, number>): {
    subscaleScores: { code: string; name: string; score: number; avg: number; description: string }[];
    intrinsicTotal: number;
    extrinsicTotal: number;
    amotivationScore: number;
    motivationProfile: string;
    recommendation: string;
} {
    // Calcular puntuaciones por subescala
    const subscaleTotals: Record<string, { total: number; count: number }> = {};
    
    ebmaItems.forEach(item => {
        if (!subscaleTotals[item.subscale]) {
            subscaleTotals[item.subscale] = { total: 0, count: 0 };
        }
        if (responses[item.id] !== undefined) {
            subscaleTotals[item.subscale].total += responses[item.id];
            subscaleTotals[item.subscale].count += 1;
        }
    });

    const subscaleScores = Object.entries(subscaleTotals).map(([code, data]) => ({
        code,
        name: subscaleInfo[code as keyof typeof subscaleInfo].name,
        score: data.total,
        avg: data.count > 0 ? data.total / data.count : 0,
        description: subscaleInfo[code as keyof typeof subscaleInfo].description
    }));

    // Calcular totales por tipo de motivación
    const intrinsicTotal = subscaleScores
        .filter(s => ['MIK', 'MIL', 'MIE'].includes(s.code))
        .reduce((acc, s) => acc + s.avg, 0) / 3;
    
    const extrinsicTotal = subscaleScores
        .filter(s => ['MEID', 'MEIN', 'MER'].includes(s.code))
        .reduce((acc, s) => acc + s.avg, 0) / 3;
    
    const amotivationScore = subscaleScores.find(s => s.code === 'AM')?.avg || 0;

    // Determinar perfil motivacional
    let motivationProfile = 'Perfil Equilibrado';
    let recommendation = 'Mantiene un balance adecuado entre motivación intrínseca y extrínseca.';

    if (amotivationScore >= 3.5) {
        motivationProfile = 'Perfil de Alto Riesgo';
        recommendation = 'Se detecta amotivación significativa. Se requiere intervención para identificar barreras y reconstruir el sentido de los estudios.';
    } else if (intrinsicTotal >= 3.5 && extrinsicTotal < 2.5) {
        motivationProfile = 'Autónomo';
        recommendation = 'Alta motivación intrínseca. El estudiante aprende por placer y curiosidad. Fomentar la autonomía y los desafíos.';
    } else if (extrinsicTotal >= 3.5 && intrinsicTotal < 2.5) {
        motivationProfile = 'Controlado Externamente';
        recommendation = 'Predominan motivaciones externas. Trabajar en el desarrollo de intereses intrínsecos y autonomía académica.';
    } else if (intrinsicTotal >= 3.5 && extrinsicTotal >= 3.5) {
        motivationProfile = 'Altamente Motivado';
        recommendation = 'Excelente perfil motivacional. Combinación saludable de motivaciones intrínsecas y extrínsecas identificadas.';
    }

    return {
        subscaleScores,
        intrinsicTotal,
        extrinsicTotal,
        amotivationScore,
        motivationProfile,
        recommendation
    };
}

interface EbmaFormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: {
        intrinsicTotal: number;
        extrinsicTotal: number;
        amotivationScore: number;
        motivationProfile: string;
        recommendation: string;
    }) => void;
}

export default function EbmaForm({ studentId, grupoId, matricula, onComplete }: EbmaFormProps) {
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<ReturnType<typeof calculateEBMAResults> | null>(null);

    const handleResponseChange = useCallback((itemId: string, value: number) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const answeredCount = Object.keys(responses).length;
    const progress = (answeredCount / 28) * 100;

    const handleSubmit = async () => {
        if (answeredCount < 28) {
            alert('Por favor, responda todas las preguntas.');
            return;
        }

        const calculatedResult = calculateEBMAResults(responses);
        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({
                intrinsicTotal: calculatedResult.intrinsicTotal,
                extrinsicTotal: calculatedResult.extrinsicTotal,
                amotivationScore: calculatedResult.amotivationScore,
                motivationProfile: calculatedResult.motivationProfile,
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
                    testType: 'EBMA',
                    date: Timestamp.now(),
                    score: calculatedResult.intrinsicTotal,
                    intrinsicTotal: calculatedResult.intrinsicTotal,
                    extrinsicTotal: calculatedResult.extrinsicTotal,
                    amotivationScore: calculatedResult.amotivationScore,
                    motivationProfile: calculatedResult.motivationProfile,
                    interpretation: calculatedResult.motivationProfile,
                    level: calculatedResult.motivationProfile,
                    recommendation: calculatedResult.recommendation,
                    subscaleScores: calculatedResult.subscaleScores,
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
                        Resultados EBMA
                    </CardTitle>
                    <CardDescription>Escala de Brevedad de Motivación Académica (Vallerand)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Perfil motivacional */}
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <Target className="h-10 w-10 mx-auto mb-2 text-blue-600" />
                        <p className="text-2xl font-bold text-gray-800">{result.motivationProfile}</p>
                        <p className="text-sm text-gray-500">Perfil Motivacional</p>
                    </div>

                    {/* Gráfico de barras por subescala */}
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">Puntuaciones por Subescala</h3>
                        <div className="space-y-3">
                            {result.subscaleScores.map(subscale => (
                                <div key={subscale.code} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">{subscale.name}</span>
                                        <span className="text-gray-600">{subscale.avg.toFixed(2)}/5</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${subscaleInfo[subscale.code as keyof typeof subscaleInfo].color}`}
                                            style={{ width: `${(subscale.avg / 5) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">{subscale.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resumen por tipo */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                            <p className="text-2xl font-bold text-blue-700">{result.intrinsicTotal.toFixed(2)}</p>
                            <p className="text-xs text-blue-600">Motivación Intrínseca</p>
                        </div>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                            <Target className="h-6 w-6 mx-auto mb-1 text-green-600" />
                            <p className="text-2xl font-bold text-green-700">{result.extrinsicTotal.toFixed(2)}</p>
                            <p className="text-xs text-green-600">Motivación Extrínseca</p>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                            <TrendingDown className="h-6 w-6 mx-auto mb-1 text-red-600" />
                            <p className="text-2xl font-bold text-red-700">{result.amotivationScore.toFixed(2)}</p>
                            <p className="text-xs text-red-600">Amotivación</p>
                        </div>
                    </div>

                    {/* Recomendación */}
                    <div className={`p-4 rounded-lg ${
                        result.amotivationScore >= 3.5 ? 'bg-red-100 border border-red-300' :
                        result.intrinsicTotal >= 3.5 ? 'bg-blue-100 border border-blue-300' :
                        result.extrinsicTotal >= 3.5 ? 'bg-orange-100 border border-orange-300' :
                        'bg-green-100 border border-green-300'
                    }`}>
                        <h4 className="font-semibold mb-1">Interpretación</h4>
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
                <CardTitle>EBMA - Escala de Brevedad de Motivación Académica</CardTitle>
                <CardDescription>
                    ¿Por qué asiste a la escuela o universidad? Indique en qué medida cada razón corresponde a su caso.
                </CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredCount}/28</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 font-medium mb-4">
                    Razones por las que va a la escuela:
                </p>
                
                {ebmaItems.map((item, idx) => (
                    <div key={item.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-start gap-2 mb-3">
                            <span className="text-xs px-2 py-1 bg-gray-200 rounded font-mono">
                                {item.subscale}
                            </span>
                            <p className="font-medium text-sm">{idx + 1}. {item.text}</p>
                        </div>
                        <RadioGroup
                            value={responses[item.id]?.toString() || ''}
                            onValueChange={(value) => handleResponseChange(item.id, parseInt(value))}
                            className="grid grid-cols-5 gap-2"
                        >
                            {responseOptions.map(opt => (
                                <div key={opt.value} className="flex flex-col items-center p-2 rounded hover:bg-white cursor-pointer">
                                    <RadioGroupItem value={opt.value.toString()} id={`${item.id}-${opt.value}`} />
                                    <Label htmlFor={`${item.id}-${opt.value}`} className="cursor-pointer text-xs text-center mt-1">
                                        {opt.value}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                ))}

                <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={answeredCount < 28 || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
