'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useData } from '@/hooks/use-data';
import { useState, useEffect } from 'react';
import type { PartialId, Student, PartialData, EvaluationCriteria } from '@/lib/placeholder-data';
import Image from 'next/image';
import Link from 'next/link';
import { Presentation, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';


interface PartialGradeInfo {
    grade: number;
    isRecovery: boolean;
}

interface SemesterGrade {
    student: Student;
    p1?: PartialGradeInfo;
    p2?: PartialGradeInfo;
    p3?: PartialGradeInfo;
    average?: number;
}

export default function SemesterEvaluationPage() {
    const { activeGroup, calculateDetailedFinalGrade, isLoading: isDataLoading, fetchPartialData, updateGroup } = useData();
    const [semesterGrades, setSemesterGrades] = useState<SemesterGrade[]>([]);
    const [isCalculating, setIsCalculating] = useState(true);
    const [availablePartials, setAvailablePartials] = useState<PartialId[]>([]);

    const handleToggleIntegration = async (checked: boolean) => {
        if (activeGroup) {
            await updateGroup(activeGroup.id, { isSemesterIntegrated: checked });
        }
    };

    useEffect(() => {
        const calculateGrades = async () => {
            if (!activeGroup) {
                setIsCalculating(false);
                return;
            };

            setIsCalculating(true);
            const partials: PartialId[] = ['p1', 'p2', 'p3'];
            const gradedPartials: PartialId[] = [];
            
            const allPartialsData = await Promise.all(
                partials.map(pId => fetchPartialData(activeGroup.id, pId))
            );

            // Determine which partials have ANY data globally (for table headers)
            allPartialsData.forEach((pData: (PartialData & { criteria: EvaluationCriteria[] }) | null, index: number) => {
                if (pData && (Object.keys(pData.grades).length > 0 || Object.keys(pData.recoveryGrades || {}).length > 0 || Object.keys(pData.attendance || {}).length > 0)) {
                    gradedPartials.push(partials[index]);
                }
            });
            setAvailablePartials(gradedPartials);

            const studentPromises = activeGroup.students.map(async (student) => {
                const grades: {[key in PartialId]?: PartialGradeInfo} = {};
                let gradeSum = 0;
                let partialsWithGrades = 0;
                
                partials.forEach((partialId, index) => {
                    const partialData = allPartialsData[index];
                    const groupCriteria = activeGroup.criteria || [];
                     if (partialData && (groupCriteria.length > 0 || Object.keys(partialData.recoveryGrades || {}).length > 0)) {
                        const { finalGrade, isRecovery } = calculateDetailedFinalGrade(student.id, partialData, groupCriteria);
                        
                        // Check if student has specific data for this partial to count it in average
                        // We consider "data" as having attendance, grades, or activity records.
                        // If finalGrade is > 0, we definitely count it.
                        // If finalGrade is 0, we check if there's evidence of participation (attendance/activities)
                        // to distinguish between "0 because failed" and "0 because not started".
                        
                        let hasData = false;
                        if (finalGrade > 0) hasData = true;
                        else {
                            const hasAttendance = partialData.attendance && Object.values(partialData.attendance).some(d => d[student.id] !== undefined);
                            const hasActivities = partialData.activityRecords && partialData.activityRecords[student.id] && Object.keys(partialData.activityRecords[student.id]).length > 0;
                            const hasGrades = partialData.grades && partialData.grades[student.id] && Object.keys(partialData.grades[student.id]).length > 0;
                            const hasRecovery = partialData.recoveryGrades && partialData.recoveryGrades[student.id];
                            
                            if (hasAttendance || hasActivities || hasGrades || hasRecovery) hasData = true;
                        }

                        if (hasData) {
                            grades[partialId] = { grade: finalGrade, isRecovery };
                            gradeSum += finalGrade;
                            partialsWithGrades++;
                        }
                    }
                });
                
                // Calculate progressive average
                const semesterAverage = partialsWithGrades > 0 ? gradeSum / partialsWithGrades : undefined;
                
                return {
                    student,
                    p1: grades['p1'],
                    p2: grades['p2'],
                    p3: grades['p3'],
                    average: semesterAverage,
                };
            });

            const results = await Promise.all(studentPromises);
            setSemesterGrades(results.sort((a,b) => a.student.name.localeCompare(b.student.name)));
            setIsCalculating(false);
        };

        if(!isDataLoading) {
          calculateGrades();
        }
    }, [activeGroup, calculateDetailedFinalGrade, fetchPartialData, isDataLoading]);


    if (isDataLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (isCalculating) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Calculando calificaciones semestrales...</span></div>;
    }

    if (!activeGroup) {
        return (
            <Card>
                <CardHeader className="text-center">
                     <Presentation className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>Evaluación Semestral</CardTitle>
                    <CardDescription>
                       Para ver esta sección, por favor <Link href="/groups" className="text-primary underline">selecciona un grupo</Link> primero.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    if (!activeGroup.criteria || activeGroup.criteria.length === 0) {
        return (
             <Card>
                <CardHeader className="text-center">
                     <Presentation className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>Faltan Criterios de Evaluación</CardTitle>
                    <CardDescription>
                       Para calcular la evaluación semestral, primero debes <Link href={`/grades/${activeGroup.id}/criteria`} className="text-primary underline">definir los criterios de evaluación</Link> para el grupo &quot;{activeGroup.subject}&quot;.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }
    
    const GradeCell = ({ data }: { data?: PartialGradeInfo }) => {
      if (data === undefined) return <span className="text-muted-foreground">N/A</span>;
      return (
        <div className="flex items-center justify-center gap-2">
            <span>{data.grade.toFixed(1)}%</span>
            {data.isRecovery && <span className="text-red-500 font-bold">R</span>}
        </div>
      );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Evaluación Semestral</h1>
                    <p className="text-muted-foreground">
                        Resumen de calificaciones de los parciales y promedio final para el grupo: {activeGroup.subject}
                    </p>
                </div>
                <div className="flex items-center space-x-2 bg-card p-4 rounded-lg border shadow-sm">
                    <Switch 
                        id="integrate-semester" 
                        checked={activeGroup.isSemesterIntegrated || false}
                        onCheckedChange={handleToggleIntegration}
                    />
                    <Label htmlFor="integrate-semester" className="cursor-pointer">
                        Integrar Promedio Semestral al Riesgo
                    </Label>
                </div>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Estudiante</TableHead>
                                {availablePartials.includes('p1') && <TableHead className="text-center bg-partial-1-bg text-partial-1-foreground-alt">Primer Parcial</TableHead>}
                                {availablePartials.includes('p2') && <TableHead className="text-center bg-partial-2-bg text-partial-2-foreground-alt">Segundo Parcial</TableHead>}
                                {availablePartials.includes('p3') && <TableHead className="text-center bg-partial-3-bg text-partial-3-foreground-alt">Tercer Parcial</TableHead>}
                                <TableHead className="text-center font-bold">Promedio Semestral</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {semesterGrades.map(({ student, p1, p2, p3, average }) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Image src={student.photo} alt={student.name} width={40} height={40} className="rounded-full"/>
                                        {student.name}
                                    </TableCell>
                                    {availablePartials.includes('p1') && <TableCell className="text-center font-semibold"><GradeCell data={p1} /></TableCell>}
                                    {availablePartials.includes('p2') && <TableCell className="text-center font-semibold"><GradeCell data={p2} /></TableCell>}
                                    {availablePartials.includes('p3') && <TableCell className="text-center font-semibold"><GradeCell data={p3} /></TableCell>}
                                    <TableCell className="text-center">
                                        {average !== undefined ? (
                                            <Badge className={cn("text-base", average >= 60 ? 'bg-primary' : 'bg-destructive')}>{average.toFixed(1)}%</Badge>
                                        ) : (
                                            <Badge variant="outline">Pendiente</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {activeGroup.students.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        Este grupo no tiene estudiantes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
