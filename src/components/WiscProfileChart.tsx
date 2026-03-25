
'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WiscProfileChartProps {
    indices: { name: string; pc: number; classification: string }[];
    subtests: { name: string; score: number }[];
}

export const WiscProfileChart = ({ indices, subtests }: WiscProfileChartProps) => {
    
    // Custom Dot para marcar valores críticos (< 80 en índices)
    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        if (payload.pc < 80) {
            return (
                <circle cx={cx} cy={cy} r={6} stroke="red" strokeWidth={2} fill="white" />
            );
        }
        return <circle cx={cx} cy={cy} r={4} stroke="#2563eb" strokeWidth={2} fill="white" />;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de Índices (40-160) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Perfil de Índices Compuestos</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={indices} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                            <YAxis domain={[40, 160]} />
                            <Tooltip />
                            <ReferenceLine y={100} label="Media" stroke="green" strokeDasharray="3 3" />
                            <ReferenceLine y={70} label="Crítico" stroke="red" strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="pc" stroke="#2563eb" strokeWidth={2} dot={<CustomDot />} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Gráfico de Subpruebas (1-19) */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Perfil de Puntuaciones Escala</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subtests} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                            <YAxis domain={[0, 19]} ticks={[1, 4, 7, 10, 13, 16, 19]} />
                            <Tooltip />
                            <ReferenceLine y={10} label="Media" stroke="green" strokeDasharray="3 3" />
                            <Bar dataKey="score" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};
