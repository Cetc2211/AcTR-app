'use client';

import React, { useState } from 'react';
import { simulatePigecInjection } from '@/lib/pigec-simulation';
import { analyzeStudentRisk } from '@/lib/risk-analysis';
import { Student, PartialData, StudentObservation } from '@/lib/placeholder-data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// --- MOCK DATA ---
const MOCK_STUDENTS: Student[] = [
    {
        id: 'user-simulation-1',
        name: 'Ana López',
        photo: '/students/ana.jpg',
        email: 'ana@example.com'
    },
    {
        id: 'user-simulation-2',
        name: 'Carlos Ruiz',
        photo: '/students/carlos.jpg',
        email: 'carlos@example.com'
    },
    {
        id: 'user-simulation-3',
        name: 'Diana Garcia',
        photo: '/students/diana.jpg',
        email: 'diana@example.com'
    }
];

// Mocking "Good" Academic Data to prove the override works
const MOCK_PARTIAL_DATA: PartialData = {
    grades: {
        'user-simulation-1': {}, 'user-simulation-2': {}, 'user-simulation-3': {}
    },
    attendance: {
        '2023-10-01': { 'user-simulation-1': true, 'user-simulation-2': true, 'user-simulation-3': true },
        '2023-10-02': { 'user-simulation-1': true, 'user-simulation-2': true, 'user-simulation-3': true },
        '2023-10-03': { 'user-simulation-1': true, 'user-simulation-2': true, 'user-simulation-3': true },
        '2023-10-04': { 'user-simulation-1': true, 'user-simulation-2': true, 'user-simulation-3': true },
        '2023-10-05': { 'user-simulation-1': true, 'user-simulation-2': true, 'user-simulation-3': true },
    },
    participations: {},
    activities: [],
    activityRecords: {},
    recoveryGrades: {},
    feedbacks: {},
    groupAnalysis: ''
};

export default function PigecSimulationPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [observations, setObservations] = useState<StudentObservation[]>([]);
    const [simulationDone, setSimulationDone] = useState(false);

    const handleRunSimulation = () => {
        setLogs(prev => [...prev, "Iniciando trigger manual..."]);
        
        const newLogs = simulatePigecInjection(MOCK_STUDENTS, (studentId, obs) => {
            setObservations(prev => [...prev, obs]);
        });

        setLogs(newLogs);
        setSimulationDone(true);
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">
                Simulación QA: Integración PIGEC-130
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CONTROL PANEL */}
                <Card>
                    <CardHeader>
                        <CardTitle>Panel de Control</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Esta herramienta simula la recepción de webhooks desde la plataforma clínica PIGEC-130.
                            Se inyectarán hallazgos clínicos convertidos a sugerencias pedagógicas.
                        </p>
                        <button 
                            onClick={handleRunSimulation}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Ejecutar Inyección Masiva
                        </button>
                    </CardContent>
                </Card>

                {/* LOGS CONSOLE */}
                <Card className="bg-gray-900 text-green-400 font-mono text-sm max-h-[300px] overflow-y-auto">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white text-base">Terminal de Ejecución</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {logs.length === 0 ? (
                            <span className="opacity-50">// Esperando comando...</span>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="mb-1 border-l-2 border-green-700 pl-2">
                                    {log}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* RESULTS VISUALIZATION */}
            {simulationDone && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800">Verificación de Análisis de Riesgo</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {MOCK_STUDENTS.map(student => {
                            // Get observations for this student
                            const studentObs = observations.filter(o => o.studentId === student.id);
                            
                            // Transform observations to simple strings for the analyzer
                            const obsStrings = studentObs.map(o => o.details || "");

                            // Run Risk Analysis
                            const risk = analyzeStudentRisk(student, MOCK_PARTIAL_DATA, obsStrings);

                            return (
                                <Card key={student.id} className={`border-t-4 ${risk.level === 'high' ? 'border-red-500' : 'border-gray-300'}`}>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-center">
                                            {student.name}
                                            <span className={`px-2 py-1 rounded text-xs text-white ${risk.level === 'high' ? 'bg-red-500' : 'bg-gray-400'}`}>
                                                {risk.level.toUpperCase()}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="bg-white p-3 rounded border">
                                            <p className="text-xs font-bold text-gray-500 mb-1">Última Observación (Inyectada):</p>
                                            <p className="text-sm italic text-gray-700">
                                                "{studentObs[studentObs.length-1]?.details || 'Ninguna'}"
                                            </p>
                                        </div>
                                        
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 mb-1">Mensaje del Algoritmo:</p>
                                            <p className={`text-sm font-semibold ${risk.level === 'high' ? 'text-red-600' : 'text-gray-600'}`}>
                                                {risk.predictionMessage}
                                            </p>
                                        </div>

                                        {risk.riskFactors.length > 0 && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 mb-1">Factores Detectados:</p>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {risk.riskFactors.map((f, idx) => (
                                                        <li key={idx} className="text-xs text-red-600">{f}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
