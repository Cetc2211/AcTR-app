
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ScatterChart, Scatter, ZAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/hooks/use-data';
import type { Student, PartialId, CalculatedRisk, AttendanceRecord, ParticipationRecord, EvaluationCriteria, RecoveryGrade, RecoveryGrades } from '@/lib/placeholder-data';
import { getPartialLabel } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


type GroupStats = {
  id: string;
  subject: string;
  studentCount: number;
  averageGrade: number;
  attendanceRate: number;
  riskLevels: { low: number; medium: number; high: number; };
};

type ActiveGroupStats = {
  approvalRate: { approved: number; failed: number; };
  attendanceTotals: { present: number; absent: number; };
  riskDistribution: { low: number, medium: number, high: number };
  topStudents: { name: string, grade: number }[];
  participationDistribution: { name: string, students: number }[];
}

const PIE_CHART_COLORS = {
    low: "hsl(var(--chart-2))",
    medium: "hsl(var(--chart-4))",
    high: "hsl(var(--destructive))",
    approved: "hsl(var(--chart-2))",
    failed: "hsl(var(--destructive))",
    present: "hsl(var(--chart-2))",
    absent: "hsl(var(--destructive))",
    late: "hsl(var(--chart-4))",
};


export default function StatisticsPage() {
    const { 
        isLoading,
        groups,
        activeGroup,
        calculateFinalGrade,
        calculateDetailedFinalGrade,
        getStudentRiskLevel,
        partialData,
        activePartialId,
        setActivePartialId,
    } = useData();
    const { attendance, participations } = partialData;

    const riskAnalysis = useMemo(() => {
      if (!activeGroup) return [];
      return activeGroup.students.map(student => {
          const { finalGrade } = calculateDetailedFinalGrade(student.id, partialData, activeGroup.criteria || []);
          
          // Calculate attendance percentage
          let p = 0, total = 0;
          Object.keys(attendance).forEach((date) => {
              if (attendance[date]?.[student.id] !== undefined) {
                  total++;
                  if (attendance[date][student.id]) p++;
              }
          });
          const currentAttendance = total > 0 ? (p / total) * 100 : 100;

          const risk = getStudentRiskLevel(finalGrade, attendance, student.id);
          
          let failingRisk = 0;
          let dropoutRisk = 0;
          if (risk.level === 'high') { failingRisk = 90; dropoutRisk = 80; }
          if (risk.level === 'medium') { failingRisk = 50; dropoutRisk = 30; }
          
          return {
              studentName: student.name,
              currentAttendance,
              projectedGrade: finalGrade, 
              riskLevel: risk.level,
              failingRisk,
              dropoutRisk
          };
      });
  }, [activeGroup, calculateDetailedFinalGrade, getStudentRiskLevel, partialData, attendance]);

    const activeGroupStats = useMemo(() => {
        if (!activeGroup) return null;

        let approved = 0, failed = 0;
        let present = 0, absent = 0;
        const studentGrades: {student: Student, grade: number}[] = [];
        const riskDistribution: Record<'low' | 'medium' | 'high', number> = { low: 0, medium: 0, high: 0 };
        const participationDistribution = [
            { name: '0-20%', students: 0 }, { name: '21-40%', students: 0 }, { name: '41-60%', students: 0 }, { name: '61-80%', students: 0 }, { name: '81-100%', students: 0 }
        ];

        for(const student of activeGroup.students) {
            const { finalGrade } = calculateDetailedFinalGrade(student.id, partialData, activeGroup.criteria || []);
            studentGrades.push({student, grade: finalGrade});
            if(finalGrade >= 60) approved++; else failed++;
            
            const risk = getStudentRiskLevel(finalGrade, attendance, student.id);
            riskDistribution[risk.level]++;

            const totalParticipationClasses = Object.keys(participations).length;
            if(totalParticipationClasses > 0) {
                const studentParticipations = (Object.values(participations) as { [studentId: string]: boolean; }[]).filter((day: { [studentId: string]: boolean; }) => day[student.id]).length;
                const participationRate = (studentParticipations / totalParticipationClasses) * 100;
                if (participationRate <= 20) participationDistribution[0].students++;
                else if (participationRate <= 40) participationDistribution[1].students++;
                else if (participationRate <= 60) participationDistribution[2].students++;
                else if (participationRate <= 80) participationDistribution[3].students++;
                else participationDistribution[4].students++;
            } else if(activeGroup.students.length > 0) {
                 participationDistribution[4].students = activeGroup.students.length;
            }
        }
        
        for (const dailyRecord of (Object.values(attendance) as { [studentId: string]: boolean }[])) {
            for (const studentId of activeGroup.students.map(s => s.id)) {
                if (Object.prototype.hasOwnProperty.call(dailyRecord, studentId)) {
                    if (dailyRecord[studentId]) present++; else absent++;
                }
            }
        };

        studentGrades.sort((a,b) => b.grade - a.grade);

        return {
            approvalRate: { approved, failed },
            attendanceTotals: { present, absent },
            riskDistribution,
            topStudents: studentGrades.slice(0,5).map(s => ({name: s.student.name, grade: parseFloat(s.grade.toFixed(1))})),
            participationDistribution,
        };
    }, [activeGroup, calculateDetailedFinalGrade, getStudentRiskLevel, attendance, participations, partialData]);

    const approvalData = useMemo(() => {
        if (!activeGroupStats) return [];
        return [
            { name: 'Aprobados', value: activeGroupStats.approvalRate.approved, fill: PIE_CHART_COLORS.approved },
            { name: 'Reprobados', value: activeGroupStats.approvalRate.failed, fill: PIE_CHART_COLORS.failed },
        ].filter(item => item.value > 0);
    }, [activeGroupStats]);

    const attendanceData = useMemo(() => {
        if (!activeGroupStats) return [];
        return [
            { name: 'Asistencias', value: activeGroupStats.attendanceTotals.present, fill: PIE_CHART_COLORS.present },
            { name: 'Inasistencias', value: activeGroupStats.attendanceTotals.absent, fill: PIE_CHART_COLORS.absent },
        ].filter(item => item.value > 0);
    }, [activeGroupStats]);
    
    const riskData = useMemo(() => {
        if (!activeGroupStats) return [];
        return [
             { name: 'Riesgo Bajo', value: activeGroupStats.riskDistribution.low, fill: PIE_CHART_COLORS.low },
            { name: 'Riesgo Medio', value: activeGroupStats.riskDistribution.medium, fill: PIE_CHART_COLORS.medium },
            { name: 'Riesgo Alto', value: activeGroupStats.riskDistribution.high, fill: PIE_CHART_COLORS.high },
        ].filter(item => item.value > 0);
    }, [activeGroupStats]);

    const riskScatterData = useMemo(() => {
        return riskAnalysis.map(r => ({
            name: r.studentName,
            attendance: parseFloat(r.currentAttendance.toFixed(1)),
            grade: parseFloat(r.projectedGrade.toFixed(1)),
            risk: r.riskLevel,
            fill: r.riskLevel === 'high' ? 'hsl(var(--destructive))' : r.riskLevel === 'medium' ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-2))'
        }));
    }, [riskAnalysis]);

    const riskPredictionData = useMemo(() => {
        const failing = riskAnalysis.filter(r => r.failingRisk > 50).length;
        const dropout = riskAnalysis.filter(r => r.dropoutRisk > 50).length;
        return [
            { name: 'Riesgo Reprobación', count: failing, fill: 'hsl(var(--destructive))' },
            { name: 'Riesgo Abandono', count: dropout, fill: '#f97316' } // Orange-500
        ];
    }, [riskAnalysis]);
    
  

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Calculando estadísticas...</span>
            </div>
        );
    }
    
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tus grupos y estudiantes.
          </p>
        </div>
      </div>
       <Tabs defaultValue={activePartialId} onValueChange={(value) => setActivePartialId(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="p1">Primer Parcial</TabsTrigger>
            <TabsTrigger value="p2">Segundo Parcial</TabsTrigger>
            <TabsTrigger value="p3">Tercer Parcial</TabsTrigger>
        </TabsList>
       </Tabs>

      <Tabs defaultValue="activeGroup">
        <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="activeGroup" disabled={!activeGroupStats}>Grupo Activo: {activeGroup?.subject || ''}</TabsTrigger>
        </TabsList>
        <TabsContent value="activeGroup" className="mt-6">
             {activeGroupStats ? (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Riesgo del Grupo ({getPartialLabel(activePartialId)})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[250px] w-full">
                                     <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                        <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={5}>
                                            {riskData.map((entry) => ( <Cell key={entry.name} fill={entry.fill} /> ))}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Índice de Aprobación ({getPartialLabel(activePartialId)})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[250px] w-full">
                                     <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                        <Pie data={approvalData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={5}>
                                            {approvalData.map((entry) => ( <Cell key={entry.name} fill={entry.fill} /> ))}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Índice de Asistencia ({getPartialLabel(activePartialId)})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <ChartContainer config={{}} className="min-h-[250px] w-full">
                                     <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                        <Pie data={attendanceData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} paddingAngle={5}>
                                            {attendanceData.map((entry) => ( <Cell key={entry.name} fill={entry.fill} /> ))}
                                        </Pie>
                                        <ChartLegend content={<ChartLegendContent />} />
                                    </PieChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Mejores Calificaciones ({getPartialLabel(activePartialId)})</CardTitle>
                                <CardDescription>Calificación final de los 5 estudiantes con mejor desempeño.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <ChartContainer config={{}} className="min-h-[300px] w-full">
                                    <BarChart data={activeGroupStats.topStudents} accessibilityLayer>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis dataKey="grade" domain={[0,100]} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="grade" name="Calificación" fill="hsl(var(--chart-2))" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Distribución de Participación en Clase ({getPartialLabel(activePartialId)})</CardTitle>
                                <CardDescription>Número de estudiantes por rango de porcentaje de participación.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[300px] w-full">
                                    <BarChart data={activeGroupStats.participationDistribution} accessibilityLayer>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis dataKey="students" allowDecimals={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="students" name="Estudiantes" fill="hsl(var(--primary))" radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Análisis de Riesgo: Asistencia vs Calificación</CardTitle>
                                <CardDescription>Correlación entre asistencia y desempeño académico proyectado.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <CartesianGrid />
                                            <XAxis type="number" dataKey="attendance" name="Asistencia" unit="%" domain={[0, 100]} />
                                            <YAxis type="number" dataKey="grade" name="Calificación" unit="%" domain={[0, 100]} />
                                            <ZAxis type="category" dataKey="name" name="Estudiante" />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                            <Legend />
                                            <Scatter name="Estudiantes" data={riskScatterData} fill="#8884d8">
                                                {riskScatterData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Scatter>
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Predicción de Riesgo</CardTitle>
                                <CardDescription>Estudiantes proyectados en riesgo de reprobación vs abandono.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="min-h-[300px] w-full">
                                    <BarChart data={riskPredictionData} accessibilityLayer>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis dataKey="count" allowDecimals={false} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="count" name="Estudiantes" radius={4}>
                                            {riskPredictionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
             ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                        <CardTitle>No hay un grupo activo</CardTitle>
                        <CardDescription>
                            Para ver las estadísticas detalladas, por favor <Link href="/groups" className="text-primary underline">selecciona un grupo</Link> primero.
                        </CardDescription>
                    </CardContent>
                </Card>
             )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
