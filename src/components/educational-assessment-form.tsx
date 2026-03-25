'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookOpen, BrainCircuit, CheckSquare, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { EducationalAssessment, ChteScores } from '@/lib/store';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export default function EducationalAssessmentForm() {
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        const formData = new FormData(event.currentTarget);
        
        const scores: ChteScores = {
            lugar: Number(formData.get('chte-lugar')),
            planificacion: Number(formData.get('chte-planificacion')),
            atencion: Number(formData.get('chte-atencion')),
            metodo: Number(formData.get('chte-metodo')),
            actitud: Number(formData.get('chte-actitud')),
        };

        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

        let interpretation: 'Bajo' | 'Medio' | 'Alto';
        if (totalScore <= 36) {
            interpretation = 'Bajo';
        } else if (totalScore <= 49) {
            interpretation = 'Medio';
        } else {
            interpretation = 'Alto';
        }
        
        const memoriaTrabajoPercentil = Number(formData.get('neuro-memoria'));
        const controlInhibitorioPercentil = Number(formData.get('neuro-inhibicion'));

        const dataToSave: Omit<EducationalAssessment, 'studentId' | 'fecha_evaluacion'> = {
            chteScores: scores,
            totalScore: totalScore,
            interpretation: interpretation,
            neuropsychScreening: {
                atencionPercentil: Number(formData.get('neuro-atencion')),
                memoriaTrabajoPercentil: memoriaTrabajoPercentil,
                controlInhibitorioPercentil: controlInhibitorioPercentil,
            }
        };

        const finalData = {
            studentId: formData.get('student-id') as string,
            fecha_evaluacion: new Date().toISOString(),
            ...dataToSave
        };
        
        // Simulación de guardado
        console.log("Guardando Evaluación Educativa en 'educational_assessments':", finalData);
        setFeedback('Evaluación Educativa guardada con éxito.');

        if (scores.planificacion < 8) { // Ejemplo de regla de triage
            const triageMsg = `TRIAGE EDUCATIVO AUTOMÁTICO: Puntaje de Planificación (${scores.planificacion}) es bajo. Se ha registrado la inscripción automática al micro-curso de 'Técnicas de Estudio'.`;
            console.log(triageMsg);
        }

        if (memoriaTrabajoPercentil < 25 || controlInhibitorioPercentil < 25) {
             const alertMsg = `ALERTA COGNITIVA: Percentiles bajos detectados (MT: ${memoriaTrabajoPercentil}, CI: ${controlInhibitorioPercentil}). Se ha enviado una notificación al Rol Clínico para una evaluación de Nivel 3.`;
            console.log(alertMsg);
        }
        
        (event.target as HTMLFormElement).reset();
        setTimeout(() => setFeedback(null), 5000);
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckSquare />
                    Registrar Puntuaciones IHE/BEC-130
                </CardTitle>
                <CardDescription>
                    Ingrese los puntajes obtenidos por el estudiante para el cálculo automático y la asignación de nivel.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                     <div className="space-y-2">
                        <Label htmlFor="student-id">ID del Estudiante (Matrícula)</Label>
                        <Input id="student-id" name="student-id" placeholder="Ej. S001, S002..." required />
                    </div>

                    <Separator />

                    <div>
                        <h3 className="text-lg font.semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Sparkles />
                            I. Cuestionario de Hábitos y Técnicas de Estudio (IHE)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="chte-lugar">Lugar</Label>
                                <Input id="chte-lugar" name="chte-lugar" type="number" placeholder="Puntaje" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="chte-planificacion">Planificación</Label>
                                <Input id="chte-planificacion" name="chte-planificacion" type="number" placeholder="Puntaje" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="chte-atencion">Atención</Label>
                                <Input id="chte-atencion" name="chte-atencion" type="number" placeholder="Puntaje" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="chte-metodo">Método</Label>
                                <Input id="chte-metodo" name="chte-metodo" type="number" placeholder="Puntaje" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="chte-actitud">Actitud</Label>
                                <Input id="chte-actitud" name="chte-actitud" type="number" placeholder="Puntaje" required />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <BrainCircuit />
                            II. Tamizaje Neuropsicológico (Percentiles)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="neuro-atencion">Atención Sostenida (Percentil)</Label>
                                <Input id="neuro-atencion" name="neuro-atencion" type="number" placeholder="Ej. 60" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="neuro-memoria">Memoria de Trabajo (Percentil)</Label>
                                <Input id="neuro-memoria" name="neuro-memoria" type="number" placeholder="Ej. 20" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="neuro-inhibicion">Control Inhibitorio (Percentil)</Label>
                                <Input id="neuro-inhibicion" name="neuro-inhibicion" type="number" placeholder="Ej. 55" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            Guardar y Calcular Resultados
                        </Button>
                    </div>

                    {feedback && (
                        <div className="mt-6">
                            <Alert className='bg-green-50 border-green-300 text-green-800'>
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Éxito</AlertTitle>
                                <AlertDescription>
                                    {feedback}
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
