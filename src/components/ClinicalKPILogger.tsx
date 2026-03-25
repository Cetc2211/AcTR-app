'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, Percent } from 'lucide-react';

export default function ClinicalKPILogger() {
    const [symptomScore, setSymptomScore] = useState('');
    const [attendance, setAttendance] = useState('');

    const handleSaveLog = () => {
        const kpiData = {
            studentId: 'S001', // Dinámico en una app real
            logDate: new Date().toISOString(),
            symptomScore: Number(symptomScore),
            weeklyAttendance: Number(attendance),
        };

        // Simulación de guardado
        console.log("--- Registro de KPI de Sesión (Cap. 10.3) ---");
        console.log("Guardando en 'kpi_logs':", kpiData);
        alert("KPIs de la sesión guardados con éxito (simulación).");

        // Limpiar campos
        setSymptomScore('');
        setAttendance('');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity />
                    Registro Rápido de KPIs
                </CardTitle>
                <CardDescription>
                    Monitoreo semanal para la Regla de las 4 Semanas (Cap. 10.3.2).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="symptom-score">Puntaje Rápido de Síntoma (1-10)</Label>
                    <Input 
                        id="symptom-score"
                        type="number"
                        min="1"
                        max="10"
                        value={symptomScore}
                        onChange={(e) => setSymptomScore(e.target.value)}
                        placeholder="Ej. Termómetro de Ansiedad"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="attendance-score">% de Asistencia Semanal</Label>
                    <div className="relative">
                         <Input 
                            id="attendance-score"
                            type="number"
                            min="0"
                            max="100"
                            value={attendance}
                            onChange={(e) => setAttendance(e.target.value)}
                            placeholder="Ej. 80"
                            className="pr-8"
                        />
                        <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                </div>
                <Button onClick={handleSaveLog} className="w-full">
                    Registrar KPIs de la Semana
                </Button>
            </CardContent>
        </Card>
    );
}
