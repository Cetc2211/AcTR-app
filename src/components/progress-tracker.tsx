'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ProgressData, ProgressRecord } from '@/lib/store';

const chartConfig = {
    suicidalIdeation: {
      label: "Ideación Suicida (0-10)",
      color: "hsl(var(--destructive))",
    },
    suds: {
      label: "Malestar (SUDS 0-100)",
      color: "hsl(var(--primary))",
    },
    taskAchievement: {
        label: "Logro de Tarea (0-10)",
        color: "hsl(var(--foreground))",
    }
};

interface ProgressTrackerProps {
    initialData?: ProgressData[];
}

export default function ProgressTracker({ initialData = [] }: ProgressTrackerProps) {
    const [progress, setProgress] = useState(initialData);
    const [newIdeation, setNewIdeation] = useState([5]);
    const [newSuds, setNewSuds] = useState([50]);
    const [newAchievement, setNewAchievement] = useState([5]);

    const handleAddProgress = () => {
        const newWeekNumber = progress.length + 1;
        const newWeekData: ProgressData = {
            week: newWeekNumber,
            suicidalIdeation: newIdeation[0],
            suds: newSuds[0],
            taskAchievement: newAchievement[0],
        };

        const progressDataToSave: ProgressRecord = {
            studentId: 'S001', // ID de estudiante (debe ser dinámico)
            semana_numero: newWeekNumber,
            fecha_registro: new Date().toISOString(),
            ideacion_suicida_score: newIdeation[0],
            suds_score: newSuds[0],
            logro_tarea_score: newAchievement[0],
        };

        // Simulación de llamada a saveProgressTracking(progressDataToSave)
        console.log("Guardando en 'progress_tracking':", progressDataToSave);
        setProgress([...progress, newWeekData]);
        alert("Progreso semanal guardado con éxito (simulación).");
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Módulo 4: Seguimiento y Trazabilidad del Progreso</CardTitle>
                <CardDescription>
                    Registro semanal y visualización de la eficacia de la intervención.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Sección de Registro Semanal */}
                <div className="p-6 border rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-700 mb-6">Registrar Progreso Semanal</h3>
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="ideation-slider">Ideación Suicida (0-10): {newIdeation[0]}</Label>
                            <Slider id="ideation-slider" value={newIdeation} onValueChange={setNewIdeation} max={10} step={1} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="suds-slider">SUDS (Unidades Subjetivas de Malestar 0-100): {newSuds[0]}</Label>
                            <Slider id="suds-slider" value={newSuds} onValueChange={setNewSuds} max={100} step={5} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="achievement-slider">Logro Real de la Tarea (0-10): {newAchievement[0]}</Label>
                            <Slider id="achievement-slider" value={newAchievement} onValueChange={setNewAchievement} max={10} step={1} />
                        </div>
                    </div>
                    <div className="flex justify-end pt-6">
                        <Button onClick={handleAddProgress} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                            Guardar Semana {progress.length + 1}
                        </Button>
                    </div>
                </div>

                {/* Sección de Visualización de Gráficos */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Tendencia del Riesgo y Malestar</h3>
                         <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <LineChart data={progress} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="week" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => `Sem ${value}`} />
                                <YAxis />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line type="monotone" dataKey="suicidalIdeation" stroke={chartConfig.suicidalIdeation.color} strokeWidth={2} name="Ideación" />
                                <Line type="monotone" dataKey="suds" stroke={chartConfig.suds.color} strokeWidth={2} name="Malestar (SUDS)" />
                            </LineChart>
                        </ChartContainer>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Tasa de Refuerzo (Logro de Tareas)</h3>
                         <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                             <BarChart data={progress} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="week" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => `Sem ${value}`} />
                                <YAxis domain={[0, 10]} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Bar dataKey="taskAchievement" fill={chartConfig.taskAchievement.color} radius={4} name="Logro" />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
