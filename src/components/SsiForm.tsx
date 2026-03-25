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

// ============================================
// SSI-BECK: ESCALA DE IDEACIÓN SUICIDA
// ============================================

// Parte 1: Items 1-5 (evaluación inicial)
const itemsPart1 = [
    { id: 'item1', title: '1. Deseo de vivir', options: [
        { value: 0, text: 'Moderado a Fuerte' },
        { value: 1, text: 'Débil' },
        { value: 2, text: 'Ninguno' }
    ]},
    { id: 'item2', title: '2. Deseo de morir', options: [
        { value: 0, text: 'Ninguno' },
        { value: 1, text: 'Débil' },
        { value: 2, text: 'Moderado a Fuerte' }
    ]},
    { id: 'item3', title: '3. Razones para vivir/morir', options: [
        { value: 0, text: 'Vivir supera a Morir' },
        { value: 1, text: 'Iguales' },
        { value: 2, text: 'Morir supera a Vivir' }
    ]},
    { id: 'item4', title: '4. Deseo de intento suicida activo', options: [
        { value: 0, text: 'Ninguno' },
        { value: 1, text: 'Débil' },
        { value: 2, text: 'Moderado a Fuerte' }
    ], isCritical: true },
    { id: 'item5', title: '5. Deseo suicida pasivo', options: [
        { value: 0, text: 'Tomaría precauciones para vivir' },
        { value: 1, text: 'Dejaría al azar' },
        { value: 2, text: 'Evitaría pasos para vivir' }
    ], isCritical: true }
];

// Parte 2-4: Items 6-19 (detalles - condicional)
const itemsPart234 = [
    { id: 'item6', title: '6. Dimensión temporal', options: [
        { value: 0, text: 'Breve, pasajero' },
        { value: 1, text: 'Períodos largos' },
        { value: 2, text: 'Continuo' }
    ]},
    { id: 'item7', title: '7. Frecuencia', options: [
        { value: 0, text: 'Rara, ocasional' },
        { value: 1, text: 'Intermitente' },
        { value: 2, text: 'Persistente' }
    ]},
    { id: 'item8', title: '8. Actitud hacia la ideación', options: [
        { value: 0, text: 'Rechazo' },
        { value: 1, text: 'Ambivalente' },
        { value: 2, text: 'Aceptación' }
    ]},
    { id: 'item9', title: '9. Control sobre la acción', options: [
        { value: 0, text: 'Tiene control' },
        { value: 1, text: 'Inseguro' },
        { value: 2, text: 'No tiene control' }
    ]},
    { id: 'item10', title: '10. Factores disuasivos', options: [
        { value: 0, text: 'Familia/religión' },
        { value: 1, text: 'Cierta preocupación' },
        { value: 2, text: 'Mínima preocupación' }
    ]},
    { id: 'item11', title: '11. Razones del intento', options: [
        { value: 0, text: 'Manipular/Atención' },
        { value: 1, text: 'Combinación' },
        { value: 2, text: 'Escape/Finalizar' }
    ]},
    { id: 'item12', title: '12. Método: Planificación', options: [
        { value: 0, text: 'No considerado' },
        { value: 1, text: 'No elaborado' },
        { value: 2, text: 'Elaborado y detallado' }
    ], isCritical: true },
    { id: 'item13', title: '13. Método: Disponibilidad', options: [
        { value: 0, text: 'No disponible' },
        { value: 1, text: 'Tiempo/Esfuerzo necesario' },
        { value: 2, text: 'Disponible' }
    ], isCritical: true },
    { id: 'item14', title: '14. Sentido de capacidad', options: [
        { value: 0, text: 'Miedo/No valor' },
        { value: 1, text: 'Inseguro' },
        { value: 2, text: 'Seguro' }
    ]},
    { id: 'item15', title: '15. Expectativa de intento', options: [
        { value: 0, text: 'No' },
        { value: 1, text: 'Incierto' },
        { value: 2, text: 'Sí' }
    ], isCritical: true },
    { id: 'item16', title: '16. Preparación real', options: [
        { value: 0, text: 'Ninguna' },
        { value: 1, text: 'Parcial' },
        { value: 2, text: 'Completa' }
    ]},
    { id: 'item17', title: '17. Nota suicida', options: [
        { value: 0, text: 'No escrita' },
        { value: 1, text: 'Empezada' },
        { value: 2, text: 'Completa' }
    ]},
    { id: 'item18', title: '18. Actos finales', options: [
        { value: 0, text: 'Ninguno' },
        { value: 1, text: 'Pensamientos' },
        { value: 2, text: 'Arreglos definitivos' }
    ]},
    { id: 'item19', title: '19. Engaño/Ocultamiento', options: [
        { value: 0, text: 'Abierto' },
        { value: 1, text: 'Evitó tema' },
        { value: 2, text: 'Engañó/Ocultó' }
    ]}
];

// Parte 5: Items 20-21 (antecedentes)
const itemsPart5 = [
    { id: 'item20', title: '20. Intentos previos', options: [
        { value: 0, text: 'Ninguno' },
        { value: 1, text: 'Uno' },
        { value: 2, text: 'Más de uno' }
    ], isCritical: true },
    { id: 'item21', title: '21. Intención en último intento', options: [
        { value: 0, text: 'Baja' },
        { value: 1, text: 'Moderada' },
        { value: 2, text: 'Alta' }
    ]}
];

// Interpretación del SSI
function interpretSSI(score: number, hasFlags: boolean): { level: string; color: string; description: string; urgency: string } {
    if (score === 0 && !hasFlags) {
        return { 
            level: 'Sin indicadores', 
            color: 'bg-green-500', 
            description: 'No se detectan indicadores de ideación suicida activa.',
            urgency: 'Seguimiento rutinario'
        };
    }
    if (score <= 5) {
        return { 
            level: 'Bajo riesgo', 
            color: 'bg-yellow-500', 
            description: 'Ideación suicida mínima. Se recomienda monitoreo periódico.',
            urgency: 'Seguimiento en 2-4 semanas'
        };
    }
    if (score <= 12) {
        return { 
            level: 'Riesgo moderado', 
            color: 'bg-orange-500', 
            description: 'Presencia de ideación suicida significativa. Se requiere evaluación clínica.',
            urgency: 'Cita de seguimiento en 1 semana'
        };
    }
    if (score <= 20) {
        return { 
            level: 'Alto riesgo', 
            color: 'bg-red-500', 
            description: 'Ideación suicida grave con posibles factores de planificación.',
            urgency: 'Evaluación clínica urgente (24-48 hrs)'
        };
    }
    return { 
        level: 'RIESGO CRÍTICO', 
        color: 'bg-red-700', 
        description: 'Ideación suicida severa con indicadores de planificación y/o intentos previos.',
        urgency: 'INTERVENCIÓN INMEDIATA'
    };
}

interface SsiFormProps {
    studentId?: string;
    onComplete?: (result: { total: number; interpretation: string; flags: string[]; skipDetails: boolean }) => void;
}

export default function SsiForm({ studentId, onComplete }: SsiFormProps) {
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        total: number;
        interpretation: { level: string; color: string; description: string; urgency: string };
        flags: string[];
        skipDetails: boolean;
    } | null>(null);

    const handleResponseChange = useCallback((itemId: string, value: number) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
    }, []);

    // Determinar si mostrar items 6-19 (flujo condicional)
    const item4 = responses['item4'];
    const item5 = responses['item5'];
    const skipDetails = item4 === 0 && item5 === 0;

    // Calcular progreso
    const requiredItems = skipDetails 
        ? [...itemsPart1, ...itemsPart5] 
        : [...itemsPart1, ...itemsPart234, ...itemsPart5];
    
    const answeredCount = requiredItems.filter(item => responses[item.id] !== undefined).length;
    const progress = (answeredCount / requiredItems.length) * 100;

    const calculateResult = useCallback(() => {
        let total = 0;
        const flags: string[] = [];

        // Sumar Parte 1
        itemsPart1.forEach(item => {
            const val = responses[item.id];
            if (val !== undefined) {
                total += val;
                if (item.isCritical && val >= 1) {
                    flags.push(`Ítem ${item.id.replace('item', '')}`);
                }
            }
        });

        // Sumar Parte 2-4 si no se salta
        if (!skipDetails) {
            itemsPart234.forEach(item => {
                const val = responses[item.id];
                if (val !== undefined) {
                    total += val;
                    if (item.isCritical && val === 2) {
                        flags.push(`Ítem ${item.id.replace('item', '')}`);
                    }
                }
            });
        }

        // Sumar Parte 5
        itemsPart5.forEach(item => {
            const val = responses[item.id];
            if (val !== undefined) {
                total += val;
                if (item.isCritical && val >= 1) {
                    flags.push(`Intento previo`);
                }
            }
        });

        return {
            total,
            interpretation: interpretSSI(total, flags.length > 0),
            flags,
            skipDetails
        };
    }, [responses, skipDetails]);

    const handleSubmit = async () => {
        // Validar respuestas requeridas
        const missingPart1 = itemsPart1.filter(item => responses[item.id] === undefined);
        if (missingPart1.length > 0) {
            alert('Por favor, responda todas las preguntas de la Parte 1.');
            return;
        }

        if (!skipDetails) {
            const missingPart234 = itemsPart234.filter(item => responses[item.id] === undefined);
            if (missingPart234.length > 0) {
                alert('Por favor, responda todas las preguntas de la sección de Detalles.');
                return;
            }
        }

        const missingPart5 = itemsPart5.filter(item => responses[item.id] === undefined);
        if (missingPart5.length > 0) {
            alert('Por favor, responda las preguntas de Antecedentes.');
            return;
        }

        const calculatedResult = calculateResult();
        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({
                total: calculatedResult.total,
                interpretation: calculatedResult.interpretation.level,
                flags: calculatedResult.flags,
                skipDetails: calculatedResult.skipDetails
            });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    testType: 'SSI-Beck',
                    date: Timestamp.now(),
                    score: calculatedResult.total,
                    interpretation: calculatedResult.interpretation.level,
                    flags: calculatedResult.flags,
                    urgency: calculatedResult.interpretation.urgency,
                    skipDetails: calculatedResult.skipDetails,
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
                        Resultados SSI - Beck
                    </CardTitle>
                    <CardDescription>Escala de Ideación Suicida</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-5xl font-bold text-gray-800">{result.total}</p>
                        <p className="text-sm text-gray-500 mt-1">Puntuación total</p>
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

                    {result.flags.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                            <p className="text-red-800 font-semibold">⚠️ Alertas detectadas</p>
                            <ul className="text-red-600 text-sm mt-2 list-disc list-inside">
                                {result.flags.map((flag, i) => (
                                    <li key={i}>{flag}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {result.skipDetails && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 text-sm">
                                Se omitieron los items 6-19 por ausencia de deseo suicida activo (items 4 y 5 = 0).
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
                <CardTitle>SSI - Escala de Ideación Suicida de Beck</CardTitle>
                <CardDescription>
                    Elija la opción que mejor describa su actitud actual o más reciente.
                </CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredCount}/{requiredItems.length}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* PARTE 1: Evaluación Inicial */}
                <div>
                    <h3 className="text-lg font-semibold text-purple-700 mb-4">PARTE 1: Evaluación Inicial</h3>
                    {itemsPart1.map(item => (
                        <div key={item.id} className={`p-4 border rounded-lg mb-4 ${item.isCritical ? 'border-red-200 bg-red-50' : 'bg-gray-50'}`}>
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
                </div>

                {/* PARTE 2-4: Detalles (Condicional) */}
                {!skipDetails && (
                    <div>
                        <h3 className="text-lg font-semibold text-purple-700 mb-4">PARTE 2-4: Detalles de la Ideación</h3>
                        {itemsPart234.map(item => (
                            <div key={item.id} className={`p-4 border rounded-lg mb-4 ${item.isCritical ? 'border-red-200 bg-red-50' : 'bg-gray-50'}`}>
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
                    </div>
                )}

                {/* Indicador de salto */}
                {skipDetails && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm">
                            ✓ Por ausencia de deseo suicida activo, se omitirán los items 6-19.
                        </p>
                    </div>
                )}

                {/* PARTE 5: Antecedentes */}
                <div>
                    <h3 className="text-lg font-semibold text-purple-700 mb-4">PARTE 5: Antecedentes</h3>
                    {itemsPart5.map(item => (
                        <div key={item.id} className={`p-4 border rounded-lg mb-4 ${item.isCritical ? 'border-red-200 bg-red-50' : 'bg-gray-50'}`}>
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
                </div>

                <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
