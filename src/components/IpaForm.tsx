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

// 30 items del IPA con escala 1-5 (1=No ocurrió, 5=Todo el tiempo)
const ipaItems = [
    { id: 'item1', title: '1. Me siento como si fuera un fracaso.', category: 'Fracaso' },
    { id: 'item2', title: '2. Soy responsable de los problemas de otros.', category: 'Culpa' },
    { id: 'item3', title: '3. Si cometo un error, significa que soy un inútil.', category: 'Perfeccionismo' },
    { id: 'item4', title: '4. Nada de lo que haga está bien.', category: 'Autocrítica' },
    { id: 'item5', title: '5. Debería ser feliz todo el tiempo.', category: 'Expectativas' },
    { id: 'item6', title: '6. Si algo puede salir mal, saldrá mal.', category: 'Catastrofización' },
    { id: 'item7', title: '7. No merezco que me pasen cosas buenas.', category: 'Autovaloración' },
    { id: 'item8', title: '8. Las personas cercanas a mí me decepcionarán.', category: 'Desconfianza' },
    { id: 'item9', title: '9. Siempre digo lo incorrecto.', category: 'Autocrítica' },
    { id: 'item10', title: '10. Debería poder manejar todo sin ayuda.', category: 'Expectativas' },
    { id: 'item11', title: '11. Mi pasado determina mi futuro.', category: 'Determinismo' },
    { id: 'item12', title: '12. No puedo cambiar mis problemas.', category: 'Desesperanza' },
    { id: 'item13', title: '13. Los demás me juzgan constantemente.', category: 'Aprobación Social' },
    { id: 'item14', title: '14. Si no soy perfecto, no valgo nada.', category: 'Perfeccionismo' },
    { id: 'item15', title: '15. Nadie me comprende realmente.', category: 'Aislamiento' },
    { id: 'item16', title: '16. Siempre arruino las cosas buenas.', category: 'Autoculpa' },
    { id: 'item17', title: '17. No soy tan inteligente/capaz como los demás.', category: 'Comparación' },
    { id: 'item18', title: '18. Debería sentirme culpable por mis errores.', category: 'Culpa' },
    { id: 'item19', title: '19. Las cosas nunca me saldrán bien.', category: 'Desesperanza' },
    { id: 'item20', title: '20. Soy una carga para los demás.', category: 'Autovaloración' },
    { id: 'item21', title: '21. No debería mostrar mis emociones negativas.', category: 'Control Emocional' },
    { id: 'item22', title: '22. Si alguien me rechaza, significa que hay algo mal en mí.', category: 'Aprobación Social' },
    { id: 'item23', title: '23. Debería poder resolver mis problemas yo solo.', category: 'Independencia' },
    { id: 'item24', title: '24. Si las cosas no salen como planeé, es un desastre total.', category: 'Polarización' },
    { id: 'item25', title: '25. Mi valor depende de lo que los demás piensen de mí.', category: 'Autovaloración' },
    { id: 'item26', title: '26. No puedo confiar en nadie.', category: 'Desconfianza' },
    { id: 'item27', title: '27. Siempre cometo los mismos errores.', category: 'Determinismo' },
    { id: 'item28', title: '28. No tengo control sobre mi vida.', category: 'Control' },
    { id: 'item29', title: '29. Mis problemas son más grandes que los de otros.', category: 'Catastrofización' },
    { id: 'item30', title: '30. Nunca lograré mis metas.', category: 'Desesperanza' }
];

const responseOptions = [
    { value: 1, text: '1 - No ocurrió' },
    { value: 2, text: '2 - Casi nunca' },
    { value: 3, text: '3 - A veces' },
    { value: 4, text: '4 - Frecuentemente' },
    { value: 5, text: '5 - Todo el tiempo' }
];

// Categorías de distorsiones cognitivas
const distortionCategories = {
    'Autocrítica': 'Tendencia a criticarse excesivamente a sí mismo',
    'Perfeccionismo': 'Estándares poco realistas e inflexibles',
    'Catastrofización': 'Tendencia a anticipar el peor escenario posible',
    'Desesperanza': 'Creencia de que las cosas no mejorarán',
    'Aprobación Social': 'Necesidad excesiva de validación externa',
    'Comparación': 'Compararse negativamente con otros',
    'Culpa': 'Asumir responsabilidad excesiva por eventos negativos',
    'Autovaloración': 'Baja autoestima y sentimiento de inutilidad',
    'Desconfianza': 'Dificultad para confiar en otros',
    'Expectativas': 'Expectativas poco realistas sobre uno mismo',
    'Aislamiento': 'Sentimiento de soledad y falta de comprensión',
    'Determinismo': 'Creencia de que el pasado define el futuro',
    'Control': 'Sentimiento de falta de control sobre la vida',
    'Polarización': 'Visión de las situaciones en términos extremos',
    'Independencia': 'Necesidad excesiva de autosuficiencia',
    'Control Emocional': 'Creencia de que no se deben mostrar emociones negativas',
    'Autoculpa': 'Atribuirse la culpa por eventos negativos'
};

function interpretIPA(score: number): { level: string; color: string; description: string } {
    if (score <= 60) return { 
        level: 'Bajo', 
        color: 'bg-green-500', 
        description: 'Frecuencia baja de pensamientos automáticos negativos. Patrones cognitivos adaptativos.' 
    };
    if (score <= 90) return { 
        level: 'Leve', 
        color: 'bg-yellow-500', 
        description: 'Presencia leve de distorsiones cognitivas. Se beneficiaria de técnicas de reestructuración cognitiva.' 
    };
    if (score <= 120) return { 
        level: 'Moderado', 
        color: 'bg-orange-500', 
        description: 'Distorsiones cognitivas moderadas. Se recomienda intervención terapéutica focalizada.' 
    };
    return { 
        level: 'Alto', 
        color: 'bg-red-500', 
        description: 'Alta frecuencia de pensamientos automáticos negativos. Requiere intervención terapéutica prioritaria.' 
    };
}

function analyzeDistortions(responses: Record<string, number>): { category: string; avgScore: number; count: number }[] {
    const categoryScores: Record<string, { total: number; count: number }> = {};
    
    ipaItems.forEach(item => {
        if (responses[item.id] !== undefined) {
            if (!categoryScores[item.category]) {
                categoryScores[item.category] = { total: 0, count: 0 };
            }
            categoryScores[item.category].total += responses[item.id];
            categoryScores[item.category].count += 1;
        }
    });

    return Object.entries(categoryScores)
        .map(([category, data]) => ({
            category,
            avgScore: data.total / data.count,
            count: data.count
        }))
        .sort((a, b) => b.avgScore - a.avgScore);
}

interface IpaFormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: { 
        total: number; 
        interpretation: string; 
        distortionAnalysis: { category: string; avgScore: number }[];
        alerts: string[] 
    }) => void;
}

export default function IpaForm({ studentId, grupoId, matricula, onComplete }: IpaFormProps) {
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        total: number;
        interpretation: { level: string; color: string; description: string };
        distortionAnalysis: { category: string; avgScore: number; count: number }[];
        alerts: string[];
    } | null>(null);

    const handleResponseChange = useCallback((itemId: string, value: number) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const answeredCount = Object.keys(responses).length;
    const progress = (answeredCount / 30) * 100;

    const calculateResult = useCallback(() => {
        if (answeredCount < 30) return null;
        
        let total = 0;
        const alerts: string[] = [];

        Object.entries(responses).forEach(([key, value]) => {
            total += value;
            // Alertas para items críticos con puntuación alta
            if (value >= 4) {
                const item = ipaItems.find(i => i.id === key);
                if (item) {
                    // Items de desesperanza o autocrítica severa
                    if (['item12', 'item19', 'item20', 'item30'].includes(key)) {
                        alerts.push(`${item.title} - Puntuación crítica: ${value}/5`);
                    }
                }
            }
        });

        const distortionAnalysis = analyzeDistortions(responses);

        return {
            total,
            interpretation: interpretIPA(total),
            distortionAnalysis,
            alerts
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
                interpretation: calculatedResult.interpretation.level,
                distortionAnalysis: calculatedResult.distortionAnalysis.map(d => ({ category: d.category, avgScore: d.avgScore })),
                alerts: calculatedResult.alerts
            });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    grupoId: grupoId || null,
                    matricula: matricula || null,
                    testType: 'IPA',
                    date: Timestamp.now(),
                    score: calculatedResult.total,
                    interpretation: calculatedResult.interpretation.level,
                    level: calculatedResult.interpretation.level,
                    distortionAnalysis: calculatedResult.distortionAnalysis,
                    alerts: calculatedResult.alerts,
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
                        Resultados IPA
                    </CardTitle>
                    <CardDescription>Inventario de Pensamientos Automáticos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-5xl font-bold text-gray-800">{result.total}</p>
                        <p className="text-sm text-gray-500 mt-1">Puntuación total (30-150)</p>
                    </div>

                    <div className={`p-4 rounded-lg ${result.interpretation.color} text-white`}>
                        <p className="text-xl font-semibold">{result.interpretation.level}</p>
                        <p className="text-sm opacity-90">{result.interpretation.description}</p>
                    </div>

                    {/* Análisis de distorsiones cognitivas */}
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Distorsiones Cognitivas Predominantes</h3>
                        <div className="space-y-2">
                            {result.distortionAnalysis.slice(0, 5).map((dist, idx) => (
                                <div key={dist.category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div>
                                        <span className="font-medium">{dist.category}</span>
                                        <p className="text-xs text-gray-500">
                                            {distortionCategories[dist.category as keyof typeof distortionCategories]}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${dist.avgScore >= 3.5 ? 'bg-red-500' : dist.avgScore >= 2.5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                style={{ width: `${(dist.avgScore / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium">{dist.avgScore.toFixed(1)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {result.alerts.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <p className="text-red-800 font-semibold">Alertas Detectadas ({result.alerts.length})</p>
                            </div>
                            <ul className="text-red-600 text-sm space-y-1">
                                {result.alerts.map((alert, idx) => (
                                    <li key={idx}>• {alert}</li>
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
                <CardTitle>IPA - Inventario de Pensamientos Automáticos</CardTitle>
                <CardDescription>
                    Indique con qué frecuencia ocurrió cada pensamiento durante la última semana.
                </CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredCount}/30</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {ipaItems.map(item => (
                    <div key={item.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                            <p className="font-semibold">{item.title}</p>
                            <span className="text-xs px-2 py-1 bg-gray-200 rounded">{item.category}</span>
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
                    disabled={answeredCount < 30 || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
