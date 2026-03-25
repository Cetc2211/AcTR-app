'use client';

import { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "./ui/input";

// ============================================
// LIRA: LISTA DE INDICADORES DE RIESGO ACADÉMICO
// ============================================

const indicadores = {
    academicos: [
        { id: 'a1', text: 'No entrega 3+ tareas consecutivas' },
        { id: 'a2', text: 'Reprobó 2+ exámenes recientes' },
        { id: 'a3', text: 'Solicita salir frecuentemente (3+)' },
        { id: 'a4', text: 'Sin materiales básicos' },
        { id: 'a5', text: 'Se niega a trabajar/participar' },
        { id: 'a6', text: 'Bajó 2+ puntos promedio' },
        { id: 'a7', text: 'Falta 2+ veces por semana' },
        { id: 'a8', text: 'No entregó proyecto importante' }
    ],
    conductuales: [
        { id: 'b1', text: 'Se duerme en clase' },
        { id: 'b2', text: 'Aislamiento social repentino' },
        { id: 'b3', text: 'Agresividad verbal' },
        { id: 'b4', text: 'Agresividad física/amenazas' },
        { id: 'b5', text: 'Llanto o crisis emocional' },
        { id: 'b6', text: 'Verbaliza deserción' },
        { id: 'b7', text: 'Conducta desafiante' },
        { id: 'b8', text: 'Cambios bruscos comportamiento' }
    ],
    fisicos: [
        { id: 'c1', text: 'Cambio de peso notorio' },
        { id: 'c2', text: 'Lesiones/moretones visibles' },
        { id: 'c3', text: 'Higiene descuidada' },
        { id: 'c4', text: 'Agotamiento extremo/ojeras' },
        { id: 'c5', text: 'Signos consumo sustancias' },
        { id: 'c6', text: 'Quejas de malestares físicos' },
        { id: 'c7', text: 'Desmayos o mareos' },
        { id: 'c8', text: 'Temblores/tics/sudoración' }
    ],
    contextuales: [
        { id: 'd1', text: 'Problemas familiares graves' },
        { id: 'd2', text: 'Crisis económica' },
        { id: 'd3', text: 'Enfermedad grave (propia/familiar)' },
        { id: 'd4', text: 'Muerte reciente de cercano' },
        { id: 'd5', text: 'Ruptura sentimental' },
        { id: 'd6', text: 'Víctima de bullying' },
        { id: 'd7', text: 'Víctima de violencia/abuso' },
        { id: 'd8', text: 'Trabaja o cuida hermanos' }
    ],
    emergencia: [
        { id: 'e1', text: 'Ideación suicida/autolesiones', critical: true },
        { id: 'e2', text: 'Evidencia de autolesiones (cortes)', critical: true },
        { id: 'e3', text: 'Amenazas a terceros', critical: true },
        { id: 'e4', text: 'Intoxicación evidente', critical: true },
        { id: 'e5', text: 'Sospecha de abuso sexual', critical: true },
        { id: 'e6', text: 'Descompensación severa', critical: true },
        { id: 'e7', text: 'Fuga de hogar', critical: true },
        { id: 'e8', text: 'Pérdida de contacto con realidad', critical: true }
    ]
};

function interpretLIRA(total: number, hasEmergency: boolean): { level: string; action: string; color: string } {
    if (hasEmergency) {
        return { 
            level: 'CRISIS / EMERGENCIA', 
            action: 'ACTIVAR PROTOCOLO DE CRISIS INMEDIATO (No dejar solo)',
            color: 'bg-red-700'
        };
    }
    if (total >= 8) {
        return { level: 'Riesgo Alto', action: 'INTERVENCIÓN URGENTE (Orientación + Padres)', color: 'bg-red-500' };
    }
    if (total >= 5) {
        return { level: 'Riesgo Medio', action: 'REFERENCIA A ORIENTACIÓN (Hoy)', color: 'bg-orange-500' };
    }
    if (total >= 3) {
        return { level: 'Riesgo Bajo', action: 'NOTIFICAR TUTOR GRUPAL', color: 'bg-yellow-500' };
    }
    return { level: 'Sin Riesgo Aparente', action: 'OBSERVACIÓN CONTINUA', color: 'bg-green-500' };
}

interface LiraFormProps {
    studentId?: string;
    grupoId?: string;
    matricula?: string;
    onComplete?: (result: { total: number; level: string; hasEmergency: boolean }) => void;
}

export default function LiraForm({ studentId, grupoId, matricula, onComplete }: LiraFormProps) {
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        total: number;
        sA: number; sB: number; sC: number; sD: number; sE: number;
        interpretation: { level: string; action: string; color: string };
        hasEmergency: boolean;
    } | null>(null);

    const toggleCheck = useCallback((id: string) => {
        setChecked(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const countChecked = (ids: string[]) => ids.filter(id => checked[id]).length;
    
    const sA = countChecked(indicadores.academicos.map(i => i.id));
    const sB = countChecked(indicadores.conductuales.map(i => i.id));
    const sC = countChecked(indicadores.fisicos.map(i => i.id));
    const sD = countChecked(indicadores.contextuales.map(i => i.id));
    const sE = countChecked(indicadores.emergencia.map(i => i.id));
    const total = sA + sB + sC + sD;
    const hasEmergency = sE > 0;

    const handleSubmit = async () => {
        const interpretation = interpretLIRA(total, hasEmergency);
        
        setResult({
            total, sA, sB, sC, sD, sE,
            interpretation,
            hasEmergency
        });
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({ total, level: interpretation.level, hasEmergency });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    grupoId: grupoId || null,
                    matricula: matricula || null,
                    testType: 'LIRA',
                    date: Timestamp.now(),
                    score: total,
                    interpretation: interpretation.level,
                    level: interpretation.level,
                    action: interpretation.action,
                    hasEmergency,
                    sections: { academicos: sA, conductuales: sB, fisicos: sC, contextuales: sD, emergencia: sE },
                    checked
                });
            } catch (error) {
                console.error('Error guardando:', error);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleReset = () => {
        setChecked({});
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
                        Resultados LIRA
                    </CardTitle>
                    <CardDescription>Lista de Indicadores de Riesgo Académico</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {result.hasEmergency && (
                        <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg animate-pulse">
                            <p className="text-red-800 font-bold text-center text-lg">
                                🚨 ¡ALERTA DE CRISIS DETECTADA!
                            </p>
                            <p className="text-red-700 text-center text-sm">
                                Activar protocolo inmediatamente. No dejar solo al estudiante.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                            <p className="text-xs text-blue-600">Académicos</p>
                            <p className="text-2xl font-bold">{result.sA}/8</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg text-center">
                            <p className="text-xs text-orange-600">Conductuales</p>
                            <p className="text-2xl font-bold">{result.sB}/8</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                            <p className="text-xs text-green-600">Físicos</p>
                            <p className="text-2xl font-bold">{result.sC}/8</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                            <p className="text-xs text-purple-600">Contextuales</p>
                            <p className="text-2xl font-bold">{result.sD}/8</p>
                        </div>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg text-center">
                        <p className="text-xs text-red-600">🚨 Señales Críticas (Emergencia)</p>
                        <p className="text-2xl font-bold text-red-700">{result.sE}</p>
                    </div>

                    <div className={`p-4 rounded-lg ${result.interpretation.color} text-white text-center`}>
                        <p className="text-xl font-semibold">{result.interpretation.level}</p>
                        <p className="text-sm opacity-90 mt-1">Total: {result.total}/32</p>
                    </div>

                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Acción Requerida</AlertTitle>
                        <AlertDescription className="font-semibold">{result.interpretation.action}</AlertDescription>
                    </Alert>

                    <Button onClick={handleReset} variant="outline" className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Nueva Evaluación
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const renderSection = (title: string, items: typeof indicadores.academicos, colorClass: string) => (
        <div className="mb-6">
            <h3 className={`p-2 font-semibold text-white rounded-t ${colorClass}`}>{title}</h3>
            <div className="border border-t-0 rounded-b p-2 space-y-2">
                {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                            id={item.id}
                            checked={checked[item.id] || false}
                            onCheckedChange={() => toggleCheck(item.id)}
                        />
                        <Label htmlFor={item.id} className="cursor-pointer text-sm">
                            {item.text}
                            {item.critical && <Badge variant="destructive" className="ml-2 text-xs">CRÍTICO</Badge>}
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>LIRA - Lista de Riesgo Académico</CardTitle>
                <CardDescription>
                    Marque las señales que observe actualmente. Si marca 3 o más en total, se requiere acción.
                </CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Indicadores seleccionados</span>
                        <span>{Object.values(checked).filter(Boolean).length}/40</span>
                    </div>
                    <Progress value={(Object.values(checked).filter(Boolean).length / 40) * 100} className="h-2" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {renderSection('A. Indicadores Académicos', indicadores.academicos, 'bg-blue-600')}
                {renderSection('B. Indicadores Conductuales', indicadores.conductuales, 'bg-orange-600')}
                {renderSection('C. Físicos y de Salud', indicadores.fisicos, 'bg-green-600')}
                {renderSection('D. Contextuales', indicadores.contextuales, 'bg-purple-600')}
                {renderSection('⚠️ E. Señales Críticas de Emergencia', indicadores.emergencia, 'bg-red-600')}

                <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Calcular Riesgo'}
                </Button>
            </CardContent>
        </Card>
    );
}
