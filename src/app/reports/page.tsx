

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Users,
  Download,
  Percent,
  TrendingUp,
  CheckCircle,
  BarChart,
  Eye,
  BookOpenCheck,
  User,
  Printer,
  Loader2,
  AlertTriangle,
  FileClock,
} from 'lucide-react';
import { Student } from '@/lib/placeholder-data';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


export default function ReportsPage() {
  const { 
    activeGroup, 
    calculateFinalGrade,
    groupAverages,
    partialData,
    activePartialId,
    isLoading,
  } = useData();
  const { participations, activities, activityRecords, grades, attendance } = partialData;

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const { toast } = useToast();

  const quickStats = useMemo(() => {
    if (!activeGroup || isLoading || !activeGroup.criteria || activeGroup.criteria.length === 0) return null;

    const studentCount = activeGroup.students.length;
    
    let presentCount = 0;
    let totalAttendancePossible = 0;
    
    activeGroup.students.forEach(student => {
        Object.keys(attendance).forEach(date => {
            if (attendance[date]?.[student.id] !== undefined) {
                totalAttendancePossible++;
                if(attendance[date][student.id]) presentCount++;
            }
        });
    });

    const attendanceRate = totalAttendancePossible > 0 ? (presentCount / totalAttendancePossible) * 100 : 100;

    let approvedCount = 0;
    activeGroup.students.forEach(student => {
        const finalGrade = calculateFinalGrade(student.id);
        if (finalGrade >= 60) approvedCount++;
    });

    const groupAverage = groupAverages[activeGroup.id] || 0;
    
    return {
        studentCount: studentCount,
        groupAverage: parseFloat(groupAverage.toFixed(1)),
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        approvedCount,
        totalAttendanceRecords: presentCount,
        criteriaCount: activeGroup.criteria.length,
    };
    }, [activeGroup, calculateFinalGrade, groupAverages, isLoading, attendance]);
  
  if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  if (!activeGroup) {
      return (
        <div className="flex flex-col gap-6">
            <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                    <div className="bg-muted rounded-full p-4">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle>No hay un grupo activo</CardTitle>
                    <CardDescription>
                        Para ver esta sección, por favor <Link href="/groups" className="text-primary underline">selecciona un grupo</Link> primero.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
      )
  }

  if (!activeGroup.criteria || activeGroup.criteria.length === 0) {
      return (
        <div className="flex flex-col gap-6">
            <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                    <div className="bg-muted rounded-full p-4">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <CardTitle>Faltan Criterios de Evaluación</CardTitle>
                    <CardDescription>
                        Para generar informes y estadísticas, primero debes <Link href={`/grades/${activeGroup.id}/criteria`} className="text-primary underline">definir los criterios de evaluación</Link> para este grupo.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Reportes e Informes</h1>
        <p className="text-muted-foreground">
          Genera reportes académicos personalizados para tu grupo activo.
        </p>
      </div>

       <Card className="bg-muted/30">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-primary flex items-center gap-2"><BookOpenCheck /> Grupo Activo</p>
                <CardTitle className="text-2xl mt-1">{activeGroup.subject}</CardTitle>
                <CardDescription>{quickStats?.studentCount} estudiantes • {quickStats?.criteriaCount} criterios de evaluación ({activePartialId})</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total de asistencias del grupo:</p>
                <p className="text-3xl font-bold text-primary">{quickStats?.totalAttendanceRecords}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> Reporte General del Grupo</CardTitle>
                    <CardDescription>Reporte integral con calificaciones, asistencia y estadísticas del grupo para el parcial activo.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button className="w-full" asChild>
                        <Link href={`/reports/${activeGroup.id}/${activePartialId}`}>
                            <Eye className="mr-2 h-4 w-4" /> Vista Previa y Descarga
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" /> Reporte de Riesgo</CardTitle>
                    <CardDescription>Análisis detallado de estudiantes en riesgo a lo largo del semestre.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button className="w-full" variant="destructive" asChild>
                        <Link href={`/reports/${activeGroup.id}/at-risk`}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Informe de Riesgo
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileClock /> Informe General Semestral</CardTitle>
                    <CardDescription>Análisis consolidado del semestre con recomendaciones y áreas de oportunidad.</CardDescription>
                </CardHeader>
                 <CardFooter>
                    <Button className="w-full" asChild>
                        <Link href={`/semester-evaluation`}>
                            <Eye className="mr-2 h-4 w-4" /> Generar Informe Semestral
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
             <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> Informe Individual por Estudiante</CardTitle>
                    <CardDescription>Genera un informe detallado para un estudiante específico del grupo activo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="student-select">Selecciona un Estudiante</Label>
                        <Select onValueChange={setSelectedStudentId} value={selectedStudentId || ''}>
                            <SelectTrigger id="student-select">
                                <SelectValue placeholder="Elige un estudiante..." />
                            </SelectTrigger>
                            <SelectContent>
                                {activeGroup.students.map(student => (
                                    <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" asChild disabled={!selectedStudentId}>
                        <Link href={`/students/${selectedStudentId}`}>
                           <Printer className="mr-2 h-4 w-4" /> Generar Informe Individual
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
         <Card>
            <CardHeader>
                <CardTitle>Estadísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="flex flex-col items-center gap-1">
                    <p className="text-3xl font-bold text-green-600">{quickStats?.studentCount}</p>
                    <p className="text-sm text-muted-foreground">Estudiantes</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-3xl font-bold text-blue-600">{quickStats?.groupAverage}</p>
                    <p className="text-sm text-muted-foreground">Promedio del Grupo</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-3xl font-bold text-yellow-500">{quickStats?.attendanceRate}%</p>
                    <p className="text-sm text-muted-foreground">Asistencia</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-3xl font-bold text-purple-600">{quickStats?.approvedCount}</p>
                    <p className="text-sm text-muted-foreground">Aprobados (≥60)</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
