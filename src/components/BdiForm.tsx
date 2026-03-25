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

// 21 ítems del BDI-II con opciones 0-3
const bdiItems = [
    { id: 'item1', title: '1. Tristeza', options: [
        { value: 0, text: 'No me siento triste.' },
        { value: 1, text: 'Me siento triste gran parte del tiempo.' },
        { value: 2, text: 'Estoy triste todo el tiempo.' },
        { value: 3, text: 'Estoy tan triste o infeliz que no puedo soportarlo.' }
    ]},
    { id: 'item2', title: '2. Pesimismo', options: [
        { value: 0, text: 'No estoy desanimado respecto a mi futuro.' },
        { value: 1, text: 'Me siento más desanimado respecto a mi futuro que lo que solía estarlo.' },
        { value: 2, text: 'No espero que las cosas funcionen para mí.' },
        { value: 3, text: 'Siento que mi futuro es desesperanzador y que solo empeorará.' }
    ]},
    { id: 'item3', title: '3. Sentimientos de Fracaso', options: [
        { value: 0, text: 'No me siento como un fracasado.' },
        { value: 1, text: 'He fracasado más de lo que debería.' },
        { value: 2, text: 'Cuando miro hacia atrás, veo muchos fracasos.' },
        { value: 3, text: 'Siento que como persona soy un completo fracaso.' }
    ]},
    { id: 'item4', title: '4. Pérdida de Placer', options: [
        { value: 0, text: 'Obtengo tanto placer como siempre por las cosas que disfruto.' },
        { value: 1, text: 'No disfruto de las cosas tanto como solía hacerlo.' },
        { value: 2, text: 'Obtengo muy poco placer de las cosas que solía disfrutar.' },
        { value: 3, text: 'No obtengo ningún placer de las cosas que solía disfrutar.' }
    ]},
    { id: 'item5', title: '5. Sentimientos de Culpa', options: [
        { value: 0, text: 'No me siento particularmente culpable.' },
        { value: 1, text: 'Me siento culpable por muchas cosas que he hecho o debería haber hecho.' },
        { value: 2, text: 'Me siento bastante culpable la mayor parte del tiempo.' },
        { value: 3, text: 'Me siento culpable todo el tiempo.' }
    ]},
    { id: 'item6', title: '6. Sentimientos de Castigo', options: [
        { value: 0, text: 'No siento que esté siendo castigado.' },
        { value: 1, text: 'Siento que puedo ser castigado.' },
        { value: 2, text: 'Espero ser castigado.' },
        { value: 3, text: 'Siento que estoy siendo castigado.' }
    ]},
    { id: 'item7', title: '7. Disconformidad con uno mismo', options: [
        { value: 0, text: 'Me siento acerca de mí mismo igual que siempre.' },
        { value: 1, text: 'He perdido la confianza en mí mismo.' },
        { value: 2, text: 'Estoy decepcionado conmigo mismo.' },
        { value: 3, text: 'No me gusto a mí mismo.' }
    ]},
    { id: 'item8', title: '8. Autocrítica', options: [
        { value: 0, text: 'No me critico ni me culpo más de lo habitual.' },
        { value: 1, text: 'Soy más crítico conmigo mismo de lo que solía ser.' },
        { value: 2, text: 'Critico todos mis defectos.' },
        { value: 3, text: 'Me culpo por todo lo malo que sucede.' }
    ]},
    { id: 'item9', title: '9. Pensamientos o Deseos Suicidas', options: [
        { value: 0, text: 'No tengo ningún pensamiento de suicidio.' },
        { value: 1, text: 'Tengo pensamientos de suicidio, pero no los llevaría a cabo.' },
        { value: 2, text: 'Me gustaría suicidarme.' },
        { value: 3, text: 'Me suicidaría si tuviera la oportunidad.' }
    ], isCritical: true },
    { id: 'item10', title: '10. Llanto', options: [
        { value: 0, text: 'No lloro más de lo que solía hacerlo.' },
        { value: 1, text: 'Lloro más de lo que solía hacerlo.' },
        { value: 2, text: 'Lloro por cualquier pequeña cosa.' },
        { value: 3, text: 'Siento ganas de llorar, pero no puedo.' }
    ]},
    { id: 'item11', title: '11. Agitación', options: [
        { value: 0, text: 'No estoy más inquieto o tenso de lo habitual.' },
        { value: 1, text: 'Me siento más inquieto o tenso de lo habitual.' },
        { value: 2, text: 'Estoy tan inquieto o agitado que me es difícil quedarme quieto.' },
        { value: 3, text: 'Estoy tan inquieto o agitado que tengo que estar siempre en movimiento o haciendo algo.' }
    ]},
    { id: 'item12', title: '12. Pérdida de Interés', options: [
        { value: 0, text: 'No he perdido el interés en otras personas o actividades.' },
        { value: 1, text: 'Estoy menos interesado en otras personas o cosas que antes.' },
        { value: 2, text: 'He perdido la mayor parte de mi interés en otras personas y tengo poco interés en otras cosas.' },
        { value: 3, text: 'He perdido todo interés en otras personas y no me importa nada de ellas.' }
    ]},
    { id: 'item13', title: '13. Indecisión', options: [
        { value: 0, text: 'Tomo decisiones tan bien como siempre.' },
        { value: 1, text: 'Encuentro más difícil tomar decisiones que de costumbre.' },
        { value: 2, text: 'Tengo mucha más dificultad para tomar decisiones que antes.' },
        { value: 3, text: 'Tengo problemas para tomar cualquier decisión.' }
    ]},
    { id: 'item14', title: '14. Devaluación', options: [
        { value: 0, text: 'No siento que no valga nada.' },
        { value: 1, text: 'No me considero tan valioso y útil como solía serlo.' },
        { value: 2, text: 'Me siento mucho menos valioso en comparación con otras personas.' },
        { value: 3, text: 'Me siento completamente inútil.' }
    ]},
    { id: 'item15', title: '15. Pérdida de Energía', options: [
        { value: 0, text: 'Tengo tanta energía como siempre.' },
        { value: 1, text: 'Tengo menos energía de la que solía tener.' },
        { value: 2, text: 'No tengo suficiente energía para hacer mucho.' },
        { value: 3, text: 'No tengo energía suficiente para hacer nada.' }
    ]},
    { id: 'item16', title: '16. Cambios en los Hábitos de Sueño', options: [
        { value: 0, text: 'No he experimentado ningún cambio en mis hábitos de sueño.' },
        { value: 1, text: 'Duermo un poco más/menos de lo habitual.' },
        { value: 2, text: 'Duermo mucho más/menos de lo habitual.' },
        { value: 3, text: 'Duermo la mayor parte del día / Me despierto muy temprano y no puedo volver a dormirme.' }
    ]},
    { id: 'item17', title: '17. Irritabilidad', options: [
        { value: 0, text: 'No estoy más irritable de lo habitual.' },
        { value: 1, text: 'Estoy más irritable de lo habitual.' },
        { value: 2, text: 'Estoy mucho más irritable de lo habitual.' },
        { value: 3, text: 'Estoy irritable todo el tiempo.' }
    ]},
    { id: 'item18', title: '18. Cambios en el Apetito', options: [
        { value: 0, text: 'No he experimentado ningún cambio en mi apetito.' },
        { value: 1, text: 'Mi apetito es un poco menor/mayor que lo habitual.' },
        { value: 2, text: 'Mi apetito es mucho menor/mayor que lo habitual.' },
        { value: 3, text: 'No tengo apetito en absoluto / Quiero comer todo el tiempo.' }
    ]},
    { id: 'item19', title: '19. Dificultad de Concentración', options: [
        { value: 0, text: 'Puedo concentrarme tan bien como siempre.' },
        { value: 1, text: 'No puedo concentrarme tan bien como de costumbre.' },
        { value: 2, text: 'Me es difícil mantener la mente en algo por mucho tiempo.' },
        { value: 3, text: 'No puedo concentrarme en nada.' }
    ]},
    { id: 'item20', title: '20. Cansancio o Fatiga', options: [
        { value: 0, text: 'No estoy más cansado o fatigado de lo habitual.' },
        { value: 1, text: 'Me canso o me fatigo más fácilmente de lo habitual.' },
        { value: 2, text: 'Estoy demasiado cansado o fatigado para hacer muchas de las cosas que solía hacer.' },
        { value: 3, text: 'Estoy demasiado cansado o fatigado para hacer la mayoría de las cosas que solía hacer.' }
    ]},
    { id: 'item21', title: '21. Pérdida de Interés en el Sexo', options: [
        { value: 0, text: 'No he notado ningún cambio reciente en mi interés por el sexo.' },
        { value: 1, text: 'Estoy menos interesado en el sexo de lo que solía estarlo.' },
        { value: 2, text: 'Estoy mucho menos interesado en el sexo ahora.' },
        { value: 3, text: 'He perdido por completo el interés en el sexo.' }
    ]}
];

function interpretBDI(score: number): { level: string; color: string; description: string } {
    if (score <= 13) return { level: 'Mínima', color: 'bg-green-500', description: 'Sintomatología depresiva mínima o ausente.' };
    if (score <= 19) return { level: 'Leve', color: 'bg-yellow-500', description: 'Sintomatología depresiva leve. Se recomienda monitoreo.' };
    if (score <= 28) return { level: 'Moderada', color: 'bg-orange-500', description: 'Sintomatología depresiva moderada. Se recomienda intervención.' };
    return { level: 'Grave', color: 'bg-red-500', description: 'Sintomatología depresiva grave. Requiere intervención urgente.' };
}

interface BdiFormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: { total: number; interpretation: string; item9Alert: boolean; alerts: string[] }) => void;
}

export default function BdiForm({ studentId, grupoId, matricula, onComplete }: BdiFormProps) {
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        total: number;
        interpretation: { level: string; color: string; description: string };
        item9Alert: boolean;
        alerts: string[];
    } | null>(null);

    const handleResponseChange = useCallback((itemId: string, value: number) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const answeredCount = Object.keys(responses).length;
    const progress = (answeredCount / 21) * 100;

    const calculateResult = useCallback(() => {
        if (answeredCount < 21) return null;
        
        let total = 0;
        const alerts: string[] = [];
        let item9Value = 0;

        Object.entries(responses).forEach(([key, value]) => {
            total += value;
            if (key === 'item9') {
                item9Value = value;
                if (value >= 1) alerts.push('A9 - Ideación suicida detectada');
            }
        });

        return {
            total,
            interpretation: interpretBDI(total),
            item9Alert: item9Value >= 1,
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
                item9Alert: calculatedResult.item9Alert,
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
                    testType: 'BDI-II',
                    date: Timestamp.now(),
                    score: calculatedResult.total,
                    interpretation: calculatedResult.interpretation.level,
                    level: calculatedResult.interpretation.level,
                    alerts: calculatedResult.alerts,
                    details: { item9Alert: calculatedResult.item9Alert },
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
                        Resultados BDI-II
                    </CardTitle>
                    <CardDescription>Inventario de Depresión de Beck</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-5xl font-bold text-gray-800">{result.total}</p>
                        <p className="text-sm text-gray-500 mt-1">Puntuación total (0-63)</p>
                    </div>

                    <div className={`p-4 rounded-lg ${result.interpretation.color} text-white`}>
                        <p className="text-xl font-semibold">{result.interpretation.level}</p>
                        <p className="text-sm opacity-90">{result.interpretation.description}</p>
                    </div>

                    {result.item9Alert && (
                        <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                            <p className="text-red-800 font-semibold">⚠️ Alerta: Ítem 9 (Pensamientos Suicidas)</p>
                            <p className="text-red-600 text-sm">Se requiere evaluación clínica inmediata.</p>
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
                <CardTitle>BDI-II - Inventario de Depresión de Beck</CardTitle>
                <CardDescription>Seleccione la opción que mejor describe cómo se ha sentido durante las últimas dos semanas.</CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredCount}/21</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {bdiItems.map(item => (
                    <div key={item.id} className={`p-4 border rounded-lg ${item.isCritical ? 'border-red-200 bg-red-50' : 'bg-gray-50'}`}>
                        <p className="font-semibold mb-3">{item.title}</p>
                        <RadioGroup
                            value={responses[item.id]?.toString() || ''}
                            onValueChange={(value) => handleResponseChange(item.id, parseInt(value))}
                            className="space-y-2"
                        >
                            {item.options.map(opt => (
                                <div key={opt.value} className="flex items-center space-x-3 p-2 rounded hover:bg-white cursor-pointer">
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
                    disabled={answeredCount < 21 || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
