'use client';

import { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Save, RotateCcw, AlertTriangle, AlertCircle } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// ============================================
// COLUMBIA C-SSRS: ESCALA DE SEVERIDAD SUICIDA
// ============================================

interface ColumbiaResult {
    level: string;
    color: string;
    description: string;
    urgency: string;
    requiresImmediateAttention: boolean;
}

function interpretColumbia(responses: Record<string, string>): ColumbiaResult {
    const q1 = responses['q1'] === 'SI';
    const q2 = responses['q2'] === 'SI';
    const q3 = responses['q3'] === 'SI';
    const q4 = responses['q4'] === 'SI';
    const q5 = responses['q5'] === 'SI';
    const q6 = responses['q6'] === 'SI';
    const q6b = responses['q6b'] === 'SI';

    // Conducta suicida presente
    if (q6) {
        if (q6b) {
            return {
                level: 'CRÍTICO - CONDUCTA RECIENTE',
                color: 'bg-red-700',
                description: 'El paciente reporta conducta suicida en los últimos 3 meses. Requiere intervención de emergencia.',
                urgency: 'INTERVENCIÓN INMEDIATA - Posible hospitalización',
                requiresImmediateAttention: true
            };
        }
        return {
            level: 'ALTO RIESGO - CONDUCTA PREVIA',
            color: 'bg-red-500',
            description: 'Historia de conducta suicida. Factores de riesgo significativos.',
            urgency: 'Evaluación clínica urgente (24 hrs)',
            requiresImmediateAttention: true
        };
    }

    // Plan específico
    if (q5 && q4) {
        return {
            level: 'ALTO RIESGO - PLAN DEFINIDO',
            color: 'bg-red-500',
            description: 'Presencia de plan específico con intención de actuar.',
            urgency: 'Evaluación clínica urgente (24 hrs)',
            requiresImmediateAttention: true
        };
    }

    // Intención sin plan
    if (q4 && q3) {
        return {
            level: 'RIESGO MODERADO-ALTO',
            color: 'bg-orange-500',
            description: 'Pensamiento de método con intención de actuar. Sin plan específico.',
            urgency: 'Evaluación clínica en 48-72 hrs',
            requiresImmediateAttention: true
        };
    }

    // Método sin intención
    if (q3 && q2) {
        return {
            level: 'RIESGO MODERADO',
            color: 'bg-yellow-500',
            description: 'Ideación suicida con pensamiento de método, sin intención activa.',
            urgency: 'Evaluación clínica en 1 semana',
            requiresImmediateAttention: false
        };
    }

    // Solo ideación
    if (q2) {
        return {
            level: 'RIESGO BAJO-MODERADO',
            color: 'bg-yellow-400',
            description: 'Ideación suicida presente sin método ni plan.',
            urgency: 'Seguimiento en 1-2 semanas',
            requiresImmediateAttention: false
        };
    }

    // Solo deseo de estar muerto
    if (q1) {
        return {
            level: 'RIESGO BAJO',
            color: 'bg-yellow-300',
            description: 'Deseo de estar muerto sin ideación suicida activa.',
            urgency: 'Monitoreo y seguimiento',
            requiresImmediateAttention: false
        };
    }

    // Sin indicadores
    return {
        level: 'Sin indicadores',
        color: 'bg-green-500',
        description: 'No se detectan indicadores de riesgo suicida.',
        urgency: 'Sin intervención requerida',
        requiresImmediateAttention: false
    };
}

interface ColumbiaFormProps {
    studentId?: string;
    onComplete?: (result: { level: string; requiresImmediateAttention: boolean; responses: Record<string, string> }) => void;
}

export default function ColumbiaForm({ studentId, onComplete }: ColumbiaFormProps) {
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<ColumbiaResult | null>(null);

    const handleResponseChange = useCallback((questionId: string, value: string) => {
        setResponses(prev => {
            const newResponses = { ...prev, [questionId]: value };
            
            // Si Q2 es NO, limpiar Q3-Q5
            if (questionId === 'q2' && value === 'NO') {
                delete newResponses['q3'];
                delete newResponses['q4'];
                delete newResponses['q5'];
            }
            
            // Si Q6 es NO, limpiar Q6b
            if (questionId === 'q6' && value === 'NO') {
                delete newResponses['q6b'];
            }
            
            return newResponses;
        });
    }, []);

    // Flujo condicional
    const showIdeationDetails = responses['q2'] === 'SI';
    const showRecentQuestion = responses['q6'] === 'SI';

    // Calcular progreso
    const requiredQuestions = ['q1', 'q2', 'q6'];
    if (showIdeationDetails) requiredQuestions.push('q3', 'q4', 'q5');
    if (showRecentQuestion) requiredQuestions.push('q6b');
    
    const answeredRequired = requiredQuestions.filter(q => responses[q]).length;
    const progress = (answeredRequired / requiredQuestions.length) * 100;

    const handleSubmit = async () => {
        // Validar preguntas requeridas
        const missing = requiredQuestions.filter(q => !responses[q]);
        if (missing.length > 0) {
            alert('Por favor, responda todas las preguntas requeridas.');
            return;
        }

        const interpretation = interpretColumbia(responses);
        setResult(interpretation);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({
                level: interpretation.level,
                requiresImmediateAttention: interpretation.requiresImmediateAttention,
                responses
            });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    testType: 'Columbia-CSSRS',
                    date: Timestamp.now(),
                    interpretation: interpretation.level,
                    urgency: interpretation.urgency,
                    requiresImmediateAttention: interpretation.requiresImmediateAttention,
                    responses,
                    flags: interpretation.requiresImmediateAttention ? ['ALERTA_CRÍTICA'] : []
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

    // Componente de pregunta SÍ/NO
    const YesNoQuestion = ({ id, text, critical = false, onChange }: { id: string; text: string; critical?: boolean; onChange?: (value: string) => void }) => (
        <div className={`p-4 border rounded-lg mb-4 ${critical ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-start justify-between gap-4 mb-3">
                <p className="font-semibold text-gray-800">{text}</p>
                {critical && (
                    <Badge variant="destructive" className="text-xs shrink-0">Crítico</Badge>
                )}
            </div>
            <RadioGroup
                value={responses[id] || ''}
                onValueChange={(value) => {
                    handleResponseChange(id, value);
                    onChange?.(value);
                }}
                className="flex gap-6"
            >
                <div className={`flex items-center space-x-2 p-2 px-4 rounded border-2 cursor-pointer transition-all ${responses[id] === 'SI' ? 'border-red-500 bg-red-100' : 'border-gray-200 hover:border-gray-300'}`}>
                    <RadioGroupItem value="SI" id={`${id}-si`} />
                    <Label htmlFor={`${id}-si`} className="cursor-pointer font-semibold text-red-700">SÍ</Label>
                </div>
                <div className={`flex items-center space-x-2 p-2 px-4 rounded border-2 cursor-pointer transition-all ${responses[id] === 'NO' ? 'border-green-500 bg-green-100' : 'border-gray-200 hover:border-gray-300'}`}>
                    <RadioGroupItem value="NO" id={`${id}-no`} />
                    <Label htmlFor={`${id}-no`} className="cursor-pointer font-semibold text-green-700">NO</Label>
                </div>
            </RadioGroup>
        </div>
    );

    // Render de resultado
    if (isSubmitted && result) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        Resultados Columbia C-SSRS
                    </CardTitle>
                    <CardDescription>Escala de Severidad Suicida de Columbia</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className={`p-4 rounded-lg ${result.color} text-white`}>
                        <p className="text-xl font-semibold">{result.level}</p>
                        <p className="text-sm opacity-90 mt-2">{result.description}</p>
                    </div>

                    <Alert className={result.requiresImmediateAttention ? 'border-red-500 bg-red-50' : ''}>
                        {result.requiresImmediateAttention ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                            <AlertTriangle className="h-4 w-4" />
                        )}
                        <AlertTitle className={result.requiresImmediateAttention ? 'text-red-700' : ''}>
                            Urgencia recomendada
                        </AlertTitle>
                        <AlertDescription className={result.requiresImmediateAttention ? 'text-red-600 font-semibold' : ''}>
                            {result.urgency}
                        </AlertDescription>
                    </Alert>

                    {result.requiresImmediateAttention && (
                        <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg">
                            <p className="text-red-800 font-bold flex items-center gap-2">
                                <AlertCircle className="h-6 w-6" />
                                ATENCIÓN INMEDIATA REQUERIDA
                            </p>
                            <p className="text-red-700 text-sm mt-2">
                                Este resultado indica riesgo significativo. Se recomienda notificar al personal clínico de inmediato.
                            </p>
                        </div>
                    )}

                    {/* Resumen de respuestas */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold mb-2">Resumen de respuestas:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>1. Deseo de estar muerto: <strong>{responses['q1']}</strong></div>
                            <div>2. Pensamientos de suicidio: <strong>{responses['q2']}</strong></div>
                            {showIdeationDetails && (
                                <>
                                    <div>3. Pensado método: <strong>{responses['q3']}</strong></div>
                                    <div>4. Intención de actuar: <strong>{responses['q4']}</strong></div>
                                    <div>5. Plan específico: <strong>{responses['q5']}</strong></div>
                                </>
                            )}
                            <div>6. Conducta suicida: <strong>{responses['q6']}</strong></div>
                            {showRecentQuestion && (
                                <div>Últimos 3 meses: <strong>{responses['q6b']}</strong></div>
                            )}
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
                <CardTitle className="text-red-700">Columbia C-SSRS</CardTitle>
                <CardDescription>
                    Escala de Clasificación de Severidad Suicida de Columbia
                </CardDescription>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    <strong>Instrucciones:</strong> Responda con honestidad sobre el <strong>ÚLTIMO MES</strong>.
                    Esta evaluación tiene flujo condicional.
                </div>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredRequired}/{requiredQuestions.length}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Preguntas principales */}
                <YesNoQuestion id="q1" text="1. ¿Ha deseado estar muerto?" />
                
                <YesNoQuestion 
                    id="q2" 
                    text="2. ¿Ha tenido pensamientos de suicidio?" 
                    critical
                />

                {/* Detalles de ideación (condicional) */}
                {showIdeationDetails && (
                    <div className="pl-4 border-l-4 border-red-300 space-y-2">
                        <p className="text-sm font-semibold text-red-700 mb-4">→ Detalles de la ideación:</p>
                        <YesNoQuestion id="q3" text="3. ¿Ha pensado en un método?" />
                        <YesNoQuestion id="q4" text="4. ¿Ha tenido intención de actuar?" critical />
                        <YesNoQuestion id="q5" text="5. ¿Tiene un plan específico?" critical />
                    </div>
                )}

                {/* Conducta suicida */}
                <div className="mt-6 pt-4 border-t-2 border-gray-300">
                    <p className="text-sm font-semibold text-gray-600 mb-4">CONDUCTA SUICIDA</p>
                    <YesNoQuestion 
                        id="q6" 
                        text="6. ¿Ha hecho algo alguna vez para terminar con su vida?" 
                        critical 
                    />

                    {/* Pregunta adicional si hubo conducta */}
                    {showRecentQuestion && (
                        <div className="pl-4 border-l-4 border-orange-400">
                            <p className="text-sm font-semibold text-orange-700 mb-4">→ Detalles:</p>
                            <YesNoQuestion 
                                id="q6b" 
                                text="¿Fue en los últimos 3 meses?" 
                                critical 
                            />
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleSubmit}
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={answeredRequired < requiredQuestions.length || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
