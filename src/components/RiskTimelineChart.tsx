'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

// Datos simulados del progreso del riesgo (P de Abandono)
const riskData = [
  { week: 1, risk: 75 },
  { week: 2, risk: 72 },
  { week: 3, risk: 68 },
  { week: 4, risk: 60 },
  { week: 5, risk: 62 }, // Aumenta
  { week: 6, risk: 61 }, // Disminuye, pero no lo suficiente
  { week: 7, risk: 63 }, // Aumenta
  { week: 8, risk: 65 }, // Aumenta
];

const chartConfig = {
    risk: {
      label: "P(Abandono)",
      color: "hsl(var(--destructive))",
    },
};

function useStagnationCheck(data: {week: number; risk: number}[]) {
    return useMemo(() => {
        if (data.length < 4) {
            return false;
        }
        
        const lastFour = data.slice(-4);
        
        // La regla se activa si el riesgo no ha disminuido en 3 transiciones consecutivas (4 puntos de datos)
        // risk_i >= risk_{i-1}
        const isStagnant = 
            lastFour[1].risk >= lastFour[0].risk &&
            lastFour[2].risk >= lastFour[1].risk &&
            lastFour[3].risk >= lastFour[2].risk;
            
        return isStagnant;
    }, [data]);
}


export default function RiskTimelineChart() {

    const isStagnant = useStagnationCheck(riskData);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp />
                    Línea de Tiempo de Riesgo
                </CardTitle>
                <CardDescription>
                    Evolución de la Probabilidad de Abandono (P) por semana.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isStagnant && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Alerta de Estancamiento Terapéutico</AlertTitle>
                        <AlertDescription>
                            No se ha observado una disminución del riesgo en las últimas 4 semanas. Re-evaluar estrategia según Cap. 10.3.2.
                        </AlertDescription>
                    </Alert>
                )}
                <ChartContainer config={chartConfig} className="h-48 w-full">
                    <ResponsiveContainer>
                        <LineChart data={riskData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="week" tickFormatter={(value) => `Sem ${value}`} />
                            <YAxis domain={[0, 100]} unit="%" />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Line type="monotone" dataKey="risk" stroke={chartConfig.risk.color} strokeWidth={2} name="P(Abandono)" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
