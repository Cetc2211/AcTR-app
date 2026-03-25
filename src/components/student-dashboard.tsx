'use client';

import React from 'react';
import Link from 'next/link';
import { calculateRisk } from '../lib/risk-analysis';
import RiskIndicator from './RiskIndicator';
import { getStudents, Student } from '@/lib/store';
import { useSession } from '@/context/SessionContext';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileSearch } from "lucide-react";


const StudentDashboard: React.FC = () => {
    const { role } = useSession();
    const students = getStudents();

    const studentsWithRisk = students.map(student => {
        const ausentismo_norm = student.academicData.absences / 100;
        const bajo_rendimiento_bin = student.academicData.gpa < 7.0 ? 1 : 0;
        const ansiedad_norm = (student.ansiedadScore || 0) / 21;

        const riskResult = calculateRisk({ ausentismo_norm, bajo_rendimiento_bin, ansiedad_norm });

        return { ...student, ...riskResult };
    });

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Dashboard de Detección Universal (SDTBE)
            </h1>
            <p className="mb-4 text-sm text-gray-600">
                El Índice de Riesgo Compuesto (IRC) combina factores académicos y clínicos para categorizar el riesgo de abandono. 
                {role === 'Orientador' && <span className='font-bold text-purple-700'> (Vista de Orientador: Puntajes detallados ocultos).</span>}
            </p>

            <div className="border rounded-xl overflow-hidden shadow-lg bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="w-[300px]">Estudiante</TableHead>
                             {role === 'Clinico' && (
                                <>
                                    <TableHead>GPA</TableHead>
                                    <TableHead>Faltas (%)</TableHead>
                                </>
                            )}
                            <TableHead>Nivel de Riesgo (IRC)</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {studentsWithRisk.map((student) => {
                             const isHighRisk = student.suicideRiskLevel === 'Alto' || student.suicideRiskLevel === 'Crítico';
                             const linkHref = role === 'Clinico' 
                                ? `/clinica/expediente/${student.id}` 
                                : `/educativa/estudiante/${student.id}`;
                            const buttonText = role === 'Clinico' ? 'Abrir Expediente' : 'Ver PIEI';

                            return (
                                <TableRow key={student.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-medium text-slate-900">{student.name}</TableCell>
                                     {role === 'Clinico' && (
                                        <>
                                            <TableCell className="text-sm text-gray-500">{student.academicData.gpa.toFixed(1)}</TableCell>
                                            <TableCell className="text-sm text-gray-500">{student.academicData.absences.toFixed(0)}%</TableCell>
                                        </>
                                    )}
                                    <TableCell>
                                         <RiskIndicator
                                            irc={student.IRC}
                                            nivel={student.nivelRiesgo}
                                            color={student.color}
                                        />
                                    </TableCell>
                                    <TableCell className="text-center">
                                       <Button asChild variant="outline" size="sm" className={cn("font-semibold", isHighRisk && role === 'Clinico' ? "text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" : "")}>
                                            <Link href={linkHref}>
                                                {isHighRisk && role === 'Clinico' && <AlertTriangle className="mr-2 h-4 w-4" />}
                                                {buttonText}
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default StudentDashboard;
