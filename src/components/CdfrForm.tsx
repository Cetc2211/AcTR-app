'use client';

import { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Save, RotateCcw, AlertTriangle, Shield, AlertCircle } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Factores de Riesgo Psicosocial organizados por dominios
const cdfrDomains = {
    familiar: {
        title: 'Factores Familiares',
        icon: '👨‍👩‍👧‍👦',
        items: [
            { id: 'fam1', text: 'Conflictos frecuentes entre miembros de la familia', weight: 2 },
            { id: 'fam2', text: 'Falta de comunicación abierta en casa', weight: 1 },
            { id: 'fam3', text: 'Violencia o agresión en el hogar', weight: 3, isCritical: true },
            { id: 'fam4', text: 'Separación o divorcio reciente de los padres', weight: 2 },
            { id: 'fam5', text: 'Enfermedad grave de un familiar cercano', weight: 2 },
            { id: 'fam6', text: 'Problemas económicos severos en la familia', weight: 2 },
            { id: 'fam7', text: 'Falta de apoyo emocional de la familia', weight: 2 },
            { id: 'fam8', text: 'Expectativas poco realistas de los padres', weight: 1 }
        ]
    },
    escolar: {
        title: 'Factores Escolares',
        icon: '🏫',
        items: [
            { id: 'esc1', text: 'Bajo rendimiento académico persistente', weight: 2 },
            { id: 'esc2', text: 'Acoso escolar (bullying) experimentado o presenciado', weight: 3, isCritical: true },
            { id: 'esc3', text: 'Problemas de relación con compañeros', weight: 1 },
            { id: 'esc4', text: 'Dificultades con profesores o autoridades', weight: 1 },
            { id: 'esc5', text: 'Sobrecarga académica y estrés escolar', weight: 2 },
            { id: 'esc6', text: 'Falta de motivación o interés por los estudios', weight: 1 },
            { id: 'esc7', text: 'Riesgo de reprobar o abandonar estudios', weight: 2 },
            { id: 'esc8', text: 'Cambios frecuentes de escuela', weight: 1 }
        ]
    },
    social: {
        title: 'Factores Sociales',
        icon: '👥',
        items: [
            { id: 'soc1', text: 'Aislamiento social o falta de amigos cercanos', weight: 2 },
            { id: 'soc2', text: 'Presión de grupo para conductas de riesgo', weight: 2 },
            { id: 'soc3', text: 'Pertenencia a grupos con conductas antisociales', weight: 3, isCritical: true },
            { id: 'soc4', text: 'Discriminación o rechazo social', weight: 2 },
            { id: 'soc5', text: 'Dificultad para establecer relaciones íntimas', weight: 1 },
            { id: 'soc6', text: 'Pérdida reciente de relaciones significativas', weight: 2 },
            { id: 'soc7', text: 'Uso problemático de redes sociales', weight: 1 },
            { id: 'soc8', text: 'Exposición a violencia en la comunidad', weight: 2 }
        ]
    },
    personal: {
        title: 'Factores Personales',
        icon: '🧑',
        items: [
            { id: 'per1', text: 'Problemas de salud mental (ansiedad, depresión)', weight: 3, isCritical: true },
            { id: 'per2', text: 'Baja autoestima persistente', weight: 2 },
            { id: 'per3', text: 'Ideación suicida o autolesiones', weight: 3, isCritical: true },
            { id: 'per4', text: 'Problemas de sueño crónicos', weight: 1 },
            { id: 'per5', text: 'Consumo de alcohol o sustancias', weight: 2 },
            { id: 'per6', text: 'Conductas alimentarias problemáticas', weight: 2 },
            { id: 'per7', text: 'Dificultades para manejar el estrés', weight: 1 },
            { id: 'per8', text: 'Experiencias traumáticas no procesadas', weight: 3 }
        ]
    }
};

const responseOptions = [
    { value: 0, text: 'No aplica / No ha ocurrido' },
    { value: 1, text: 'Ocurrió en el pasado (más de 6 meses)' },
    { value: 2, text: 'Ocurrió recientemente (últimos 6 meses)' },
    { value: 3, text: 'Está ocurriendo actualmente' }
];

function calculateRisk(responses: Record<string, number>): {
    totalRisk: number;
    domainScores: { domain: string; score: number; level: string }[];
    criticalFactors: string[];
    riskLevel: string;
    recommendation: string;
} {
    const domainScores: { domain: string; score: number; level: string }[] = [];
    let totalRisk = 0;
    const criticalFactors: string[] = [];

    Object.entries(cdfrDomains).forEach(([domainKey, domain]) => {
        let domainScore = 0;
        domain.items.forEach(item => {
            const response = responses[item.id] || 0;
            const weightedScore = response * item.weight;
            domainScore += weightedScore;
            
            // Detectar factores críticos
            if (item.isCritical && response >= 2) {
                criticalFactors.push(item.text);
            }
        });
        
        // Normalizar puntuación del dominio (0-100)
        const maxDomainScore = domain.items.reduce((acc, item) => acc + (3 * item.weight), 0);
        const normalizedScore = (domainScore / maxDomainScore) * 100;
        
        let level = 'Bajo';
        if (normalizedScore >= 60) level = 'Alto';
        else if (normalizedScore >= 35) level = 'Moderado';
        
        domainScores.push({
            domain: domain.title,
            score: Math.round(normalizedScore),
            level
        });
        
        totalRisk += normalizedScore;
    });

    // Promedio de riesgo total
    totalRisk = Math.round(totalRisk / 4);
    
    let riskLevel = 'Bajo';
    let recommendation = 'No se identifican factores de riesgo significativos. Continúe con el seguimiento rutinario.';
    
    if (totalRisk >= 60 || criticalFactors.length > 0) {
        riskLevel = 'Alto';
        recommendation = 'Se requieren intervenciones inmediatas. Canalización urgente a servicios especializados.';
    } else if (totalRisk >= 35) {
        riskLevel = 'Moderado';
        recommendation = 'Se recomienda intervención focalizada y seguimiento cercano.';
    }

    return {
        totalRisk,
        domainScores,
        criticalFactors,
        riskLevel,
        recommendation
    };
}

interface CdfrFormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: {
        totalRisk: number;
        riskLevel: string;
        domainScores: { domain: string; score: number; level: string }[];
        criticalFactors: string[];
        recommendation: string;
    }) => void;
}

export default function CdfrForm({ studentId, grupoId, matricula, onComplete }: CdfrFormProps) {
    const [responses, setResponses] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<ReturnType<typeof calculateRisk> | null>(null);

    const totalItems = Object.values(cdfrDomains).reduce((acc, domain) => acc + domain.items.length, 0);
    
    const handleResponseChange = useCallback((itemId: string, value: number) => {
        setResponses(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const answeredCount = Object.keys(responses).length;
    const progress = (answeredCount / totalItems) * 100;

    const handleSubmit = async () => {
        if (answeredCount < totalItems) {
            alert('Por favor, responda todas las preguntas.');
            return;
        }

        const calculatedResult = calculateRisk(responses);
        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({
                totalRisk: calculatedResult.totalRisk,
                riskLevel: calculatedResult.riskLevel,
                domainScores: calculatedResult.domainScores,
                criticalFactors: calculatedResult.criticalFactors,
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
                    testType: 'CDFR',
                    date: Timestamp.now(),
                    score: calculatedResult.totalRisk,
                    totalRisk: calculatedResult.totalRisk,
                    riskLevel: calculatedResult.riskLevel,
                    interpretation: calculatedResult.riskLevel,
                    level: calculatedResult.riskLevel,
                    domainScores: calculatedResult.domainScores,
                    criticalFactors: calculatedResult.criticalFactors,
                    recommendation: calculatedResult.recommendation,
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
        const getRiskColor = (level: string) => {
            switch (level) {
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
                        Resultados CDFR
                    </CardTitle>
                    <CardDescription>Cuestionario de Factores de Riesgo Psicosocial</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Nivel de riesgo general */}
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            {result.riskLevel === 'Alto' ? (
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            ) : result.riskLevel === 'Moderado' ? (
                                <AlertCircle className="h-8 w-8 text-orange-600" />
                            ) : (
                                <Shield className="h-8 w-8 text-green-600" />
                            )}
                            <p className="text-3xl font-bold">{result.riskLevel}</p>
                        </div>
                        <p className="text-sm text-gray-500">Nivel de Riesgo General</p>
                        <p className="text-4xl font-bold text-gray-800 mt-2">{result.totalRisk}%</p>
                    </div>

                    {/* Puntuación por dominio */}
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">Puntuación por Área</h3>
                        <div className="space-y-4">
                            {result.domainScores.map((domain) => (
                                <div key={domain.domain} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>{domain.domain}</span>
                                        <span className={`font-medium ${
                                            domain.level === 'Alto' ? 'text-red-600' : 
                                            domain.level === 'Moderado' ? 'text-orange-600' : 'text-green-600'
                                        }`}>
                                            {domain.score}% - {domain.level}
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${getRiskColor(domain.level)}`}
                                            style={{ width: `${domain.score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Factores críticos */}
                    {result.criticalFactors.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <p className="text-red-800 font-semibold">
                                    Factores Críticos Detectados ({result.criticalFactors.length})
                                </p>
                            </div>
                            <ul className="text-red-600 text-sm space-y-1">
                                {result.criticalFactors.map((factor, idx) => (
                                    <li key={idx}>• {factor}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recomendación */}
                    <div className={`p-4 rounded-lg ${
                        result.riskLevel === 'Alto' ? 'bg-red-100 border border-red-300' :
                        result.riskLevel === 'Moderado' ? 'bg-orange-100 border border-orange-300' :
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
                <CardTitle>CDFR - Cuestionario de Factores de Riesgo Psicosocial</CardTitle>
                <CardDescription>
                    Identificación de factores de riesgo en diferentes áreas de la vida del estudiante.
                </CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso</span>
                        <span>{answeredCount}/{totalItems}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {Object.entries(cdfrDomains).map(([domainKey, domain]) => (
                    <div key={domainKey} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <span>{domain.icon}</span>
                            {domain.title}
                        </h3>
                        <div className="space-y-4">
                            {domain.items.map(item => (
                                <div key={item.id} className={`p-3 rounded-lg ${
                                    item.isCritical ? 'border-2 border-red-200 bg-red-50' : 'bg-gray-50'
                                }`}>
                                    <div className="flex items-start gap-2 mb-2">
                                        {item.isCritical && (
                                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        )}
                                        <p className={`text-sm ${item.isCritical ? 'font-medium' : ''}`}>
                                            {item.text}
                                        </p>
                                    </div>
                                    <RadioGroup
                                        value={responses[item.id]?.toString() || ''}
                                        onValueChange={(value) => handleResponseChange(item.id, parseInt(value))}
                                        className="grid grid-cols-2 md:grid-cols-4 gap-2"
                                    >
                                        {responseOptions.map(opt => (
                                            <div key={opt.value} className="flex items-center space-x-2">
                                                <RadioGroupItem value={opt.value.toString()} id={`${item.id}-${opt.value}`} />
                                                <Label htmlFor={`${item.id}-${opt.value}`} className="text-xs cursor-pointer">
                                                    {opt.text.split(' ')[0]}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={answeredCount < totalItems || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
