'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen, CheckCircle } from 'lucide-react';

// --- DATOS SIMULADOS (Esto vendría de Firestore en una app real) ---
const approvedInstructions = [
    { id: 'met_1', text: 'Entregar instrucciones de forma segmentada (un paso a la vez).' },
    { id: 'met_2', text: 'Utilizar apoyos visuales (diagramas, mapas conceptuales) para las tareas.' },
    { id: 'act_1', text: 'Aplicar la "técnica de los 5 minutos" para iniciar tareas académicas.' },
    { id: 'act_2', text: 'Establecer metas de tarea muy pequeñas y concretas (ej. "leer 2 párrafos").' },
];

export default function PIEIFeedback() {
    const [feedback, setFeedback] = useState<{ [key: string]: { applied: boolean; effectiveness?: string } }>({});

    const handleAppliedChange = (instructionId: string, applied: boolean) => {
        setFeedback(prev => ({
            ...prev,
            [instructionId]: { ...prev[instructionId], applied }
        }));
    };

    const handleEffectivenessChange = (instructionId: string, effectiveness: string) => {
        setFeedback(prev => ({
            ...prev,
            [instructionId]: { ...prev[instructionId], effectiveness }
        }));
    };

    const handleSubmitFeedback = () => {
        console.log("--- Feedback del PIEI Registrado (Rol Orientador) ---");
        console.log("Datos enviados para trazabilidad (simulación):", {
            studentId: 'S001', // ID dinámico
            feedback_data: feedback,
            submitted_at: new Date().toISOString()
        });
        alert("Feedback del PIEI guardado con éxito (simulación).");
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen />
                    Plan de Intervención Educativa (PIEI)
                </CardTitle>
                <CardDescription>
                    Instrucciones pedagógicas para apoyar al estudiante. Por favor, registre la aplicación y efectividad de cada medida.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {approvedInstructions.map(instr => (
                        <div key={instr.id} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id={`applied-${instr.id}`}
                                    onCheckedChange={(checked) => handleAppliedChange(instr.id, !!checked)}
                                />
                                <Label htmlFor={`applied-${instr.id}`} className="font-semibold text-gray-800">
                                    {instr.text}
                                </Label>
                            </div>
                            
                            {feedback[instr.id]?.applied && (
                                <div className="pl-7 space-y-2">
                                    <Label className="text-sm text-gray-600">¿Cuál fue la efectividad de esta medida?</Label>
                                    <RadioGroup
                                        onValueChange={(value) => handleEffectivenessChange(instr.id, value)}
                                        className="flex space-x-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="alta" id={`eff-alta-${instr.id}`} />
                                            <Label htmlFor={`eff-alta-${instr.id}`}>Alta</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="media" id={`eff-media-${instr.id}`} />
                                            <Label htmlFor={`eff-media-${instr.id}`}>Media</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="baja" id={`eff-baja-${instr.id}`} />
                                            <Label htmlFor={`eff-baja-${instr.id}`}>Baja</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            )}
                        </div>
                    ))}

                     <div className="flex justify-end pt-4">
                        <Button onClick={handleSubmitFeedback}>
                            <CheckCircle className="mr-2" />
                           Registrar Efectividad del PIEI
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

    