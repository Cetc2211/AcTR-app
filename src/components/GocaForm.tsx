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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "./ui/badge";

// ============================================
// GOCA: GUÍA DE OBSERVACIÓN CONDUCTUAL DOCENTE
// ============================================

const seccionesGOCA = [
    {
        id: 'I',
        title: 'I. Atención y Concentración',
        items: [
            'Se distrae fácilmente con ruidos externos',
            'Necesita repetición de instrucciones',
            'Deja actividades incompletas',
            'Parece "soñando despierto"',
            'Pierde materiales escolares',
            'Dificultad para seguir explicaciones largas',
            'Se levanta sin permiso',
            'Juega con objetos en clase'
        ]
    },
    {
        id: 'II',
        title: 'II. Participación y Motivación',
        items: [
            'Evita participar al preguntar',
            'No trae materiales necesarios',
            'Comentarios negativos sobre escuela',
            'Apático o desinteresado',
            'No completa tareas de casa',
            'Evita esfuerzo mental sostenido',
            'No toma apuntes',
            'Llega tarde sin justificación'
        ]
    },
    {
        id: 'III',
        title: 'III. Emocionales y Conductuales',
        items: [
            'Triste o cabizbajo',
            'Irritabilidad o enojo fácil',
            'Se aísla en actividades grupales',
            'Signos de ansiedad (morder uñas, etc)',
            'Cambios bruscos de humor',
            'Quejas de dolores físicos',
            'Llora o parece a punto de llorar',
            'Conductas agresivas'
        ]
    },
    {
        id: 'IV',
        title: 'IV. Rendimiento Académico',
        items: [
            'Disminución calidad trabajos',
            'Dificultad comprender conceptos',
            'Errores por descuido',
            'Rendimiento inconsistente',
            'No termina exámenes a tiempo',
            'Evita preguntar dudas',
            'Calificaciones han bajado',
            'Copia trabajos'
        ]
    },
    {
        id: 'V',
        title: 'V. Físicos y Salud',
        items: [
            'Cansado o con sueño',
            'Aspecto descuidado/higiene',
            'No desayuna o come',
            'Signos consumo sustancias',
            'Problemas visión/audición',
            'Cambio peso significativo',
            'Lesiones visibles frecuentes',
            'Permisos baño/enfermería excesivos'
        ]
    },
    {
        id: 'VI',
        title: 'VI. Factores Protectores',
        items: [
            'Muestra interés en algún tema',
            'Tiene amigos cercanos',
            'Responde bien al elogio',
            'Muestra habilidades específicas',
            'Busca ayuda si la necesita'
        ]
    }
];

function interpretGOCA(scores: Record<string, number>): { nivel: string; color: string; action: string } {
    // Calcular riesgo total (sin protectores)
    const totalRiesgo = ['I', 'II', 'III', 'IV', 'V'].reduce((sum, id) => sum + scores[id], 0);
    const protectores = scores['VI'];
    
    let nivel, color, action;
    
    if (totalRiesgo <= 40) {
        nivel = 'Sin indicadores significativos';
        color = 'bg-green-500';
        action = 'Observación continua';
    } else if (totalRiesgo <= 80) {
        nivel = 'Alerta Moderada';
        color = 'bg-yellow-500';
        action = 'Seguimiento por tutor';
    } else if (totalRiesgo <= 120) {
        nivel = 'Riesgo Alto';
        color = 'bg-orange-500';
        action = 'Referir a Orientación';
    } else {
        nivel = 'Situación Crítica';
        color = 'bg-red-600';
        action = 'Intervención urgente';
    }
    
    return { nivel, color, action };
}

interface GocaFormProps {
    studentId?: string;
    onComplete?: (result: { scores: Record<string, number>; nivel: string }) => void;
}

export default function GocaForm({ studentId, onComplete }: GocaFormProps) {
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        scores: Record<string, number>;
        totalRiesgo: number;
        protectores: number;
        interpretacion: { nivel: string; color: string; action: string };
    } | null>(null);

    const handleResponse = useCallback((itemId: string, value: number) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const calculateScores = useCallback(() => {
        const scores: Record<string, number> = {};
        
        seccionesGOCA.forEach(sec => {
            let subtotal = 0;
            sec.items.forEach((_, idx) => {
                const key = `${sec.id}-${idx}`;
                subtotal += responses[key] || 0;
            });
            scores[sec.id] = subtotal;
        });
        
        return scores;
    }, [responses]);

    const totalItems = seccionesGOCA.reduce((sum, sec) => sum + sec.items.length, 0);
    const answeredItems = Object.keys(responses).length;
    const progress = (answeredItems / totalItems) * 100;

    const handleSubmit = async () => {
        if (answeredItems < totalItems) {
            alert(`Por favor, responda todos los items (${answeredItems}/${totalItems})`);
            return;
        }

        const scores = calculateScores();
        const totalRiesgo = ['I', 'II', 'III', 'IV', 'V'].reduce((sum, id) => sum + scores[id], 0);
        const protectores = scores['VI'];
        const interpretacion = interpretGOCA(scores);

        setResult({ scores, totalRiesgo, protectores, interpretacion });
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({ scores, nivel: interpretacion.nivel });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    testType: 'GOCA',
                    date: Timestamp.now(),
                    scores,
                    totalRiesgo,
                    protectores,
                    interpretacion: interpretacion.nivel,
                    action: interpretacion.action,
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

    // Resultado
    if (isSubmitted && result) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        Resultados GOCA
                    </CardTitle>
                    <CardDescription>Guía de Observación Conductual</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        {Object.entries(result.scores).map(([key, value]) => (
                            <div key={key} className="p-2 bg-gray-50 rounded text-center">
                                <p className="text-xs text-gray-500">{key}</p>
                                <p className="font-bold">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-red-50 rounded-lg text-center">
                            <p className="text-sm text-red-600">Total Riesgo</p>
                            <p className="text-3xl font-bold text-red-700">{result.totalRiesgo}</p>
                            <p className="text-xs text-red-500">/ 160 máx</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg text-center">
                            <p className="text-sm text-green-600">Factores Protectores</p>
                            <p className="text-3xl font-bold text-green-700">{result.protectores}</p>
                            <p className="text-xs text-green-500">/ 20 máx</p>
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg ${result.interpretacion.color} text-white text-center`}>
                        <p className="text-xl font-semibold">{result.interpretacion.nivel}</p>
                        <p className="text-sm opacity-90 mt-1">{result.interpretacion.action}</p>
                    </div>

                    <Button onClick={handleReset} variant="outline" className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Nueva Observación
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>GOCA - Guía de Observación Conductual</CardTitle>
                <CardDescription>
                    Marque la frecuencia observada: 0=Nunca, 1=A veces, 2=Frecuente, 3=Mucho, 4=Siempre
                </CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredItems}/{totalItems}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="I" className="w-full">
                    <TabsList className="grid w-full grid-cols-6 mb-4">
                        {seccionesGOCA.map(sec => (
                            <TabsTrigger key={sec.id} value={sec.id} className="text-xs">
                                {sec.id}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {seccionesGOCA.map(sec => (
                        <TabsContent key={sec.id} value={sec.id} className="space-y-3">
                            <h3 className={`font-semibold p-2 rounded ${sec.id === 'VI' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                {sec.title}
                            </h3>
                            {sec.items.map((item, idx) => {
                                const key = `${sec.id}-${idx}`;
                                return (
                                    <div key={key} className="p-3 border rounded-lg bg-gray-50">
                                        <p className="font-medium text-sm mb-2">{item}</p>
                                        <RadioGroup
                                            value={responses[key]?.toString() || ''}
                                            onValueChange={(v) => handleResponse(key, parseInt(v))}
                                            className="flex gap-2"
                                        >
                                            {[0, 1, 2, 3, 4].map(val => (
                                                <div key={val} className="flex items-center space-x-1">
                                                    <RadioGroupItem value={val.toString()} id={`${key}-${val}`} />
                                                    <Label htmlFor={`${key}-${val}`} className="text-xs cursor-pointer">{val}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                );
                            })}
                        </TabsContent>
                    ))}
                </Tabs>

                <Button
                    onClick={handleSubmit}
                    className="w-full mt-6"
                    disabled={answeredItems < totalItems || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Calcular Resultados'}
                </Button>
            </CardContent>
        </Card>
    );
}
