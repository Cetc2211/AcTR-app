'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { useData } from '@/hooks/use-data';
import { analyzeIRC, IRCAnalysis } from '@/lib/irc-calculation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Info, Calculator, Brain, Users, TrendingUp } from 'lucide-react';
import { getPartialLabel } from '@/lib/utils';

type RiskDiscrepancy = {
  studentId: string;
  studentName: string;
  groupName: string;
  grade: number;
  attendance: number;
  activityRate: number;
  participationRate: number;
  iraScore: number;
  iraLevel: 'bajo' | 'medio' | 'alto';
  failingRisk: number;
  dropoutRisk: number;
  simpleLevel: 'low' | 'medium' | 'high';
  hasDiscrepancy: boolean;
  iraAnalysis: IRCAnalysis;
};

export default function RiskDiagnosticPage() {
  const { isAdmin, loading: loadingAdmin } = useAdmin();
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const { 
    groups, 
    allPartialsData, 
    activePartialId,
    calculateDetailedFinalGrade,
    getStudentRiskLevel,
    isLoading: isDataLoading 
  } = useData();

  const [isLoading, setIsLoading] = useState(true);
  const [discrepancies, setDiscrepancies] = useState<RiskDiscrepancy[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    withDiscrepancy: 0,
    iraHigh: 0,
    simpleHigh: 0,
    failingRiskHigh: 0,
    dropoutRiskHigh: 0,
  });

  useEffect(() => {
    if (loadingAuth || loadingAdmin) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [user, loadingAuth, loadingAdmin, isAdmin]);

  useEffect(() => {
    if (isDataLoading || groups.length === 0) return;
    runDiagnostic();
  }, [groups, allPartialsData, activePartialId, isDataLoading]);

  const runDiagnostic = () => {
    setIsLoading(true);
    const results: RiskDiscrepancy[] = [];
    let totalStudents = 0;
    let withDiscrepancy = 0;
    let iraHigh = 0;
    let simpleHigh = 0;
    let failingRiskHigh = 0;
    let dropoutRiskHigh = 0;

    groups.forEach(group => {
      const partialData = allPartialsData[group.id]?.[activePartialId];
      if (!partialData || !group.criteria || group.criteria.length === 0) return;

      group.students.forEach(student => {
        totalStudents++;

        // Calculate grade and details
        const gradeDetails = calculateDetailedFinalGrade(student.id, partialData, group.criteria);
        const finalGrade = gradeDetails.finalGrade;

        // Calculate attendance
        const attendanceDays = Object.keys(partialData.attendance || {});
        const attendedDays = attendanceDays.filter(d => partialData.attendance[d]?.[student.id]).length;
        const attendanceRate = attendanceDays.length > 0 ? (attendedDays / attendanceDays.length) * 100 : 100;

        // Calculate activity and participation rates
        const activityCriterion = gradeDetails.criteriaDetails.find((c: any) => c.name === 'Actividades' || c.name === 'Portafolio');
        const activityRate = activityCriterion ? activityCriterion.earned / 100 : 1;
        
        const participationCriterion = gradeDetails.criteriaDetails.find((c: any) => c.name === 'Participación');
        const participationRate = participationCriterion ? participationCriterion.earned / 100 : 1;

        // System A: IRA (Solo factores académicos)
        const iraAnalysis = analyzeIRC(attendanceRate, finalGrade, 0, 0, activityRate, participationRate);
        if (iraAnalysis.riskLevel === 'alto') iraHigh++;
        if (iraAnalysis.failingRisk && iraAnalysis.failingRisk > 60) failingRiskHigh++;
        if (iraAnalysis.dropoutRisk && iraAnalysis.dropoutRisk > 60) dropoutRiskHigh++;

        // System B: Simple
        const simpleRisk = getStudentRiskLevel(finalGrade, partialData.attendance, student.id);
        if (simpleRisk.level === 'high') simpleHigh++;

        // Map IRA level to simple level for comparison
        const iraToSimple: Record<string, 'low' | 'medium' | 'high'> = {
          'bajo': 'low',
          'medio': 'medium',
          'alto': 'high'
        };
        const iraMappedLevel = iraToSimple[iraAnalysis.riskLevel];

        // Check discrepancy
        const hasDiscrepancy = iraMappedLevel !== simpleRisk.level;
        if (hasDiscrepancy) withDiscrepancy++;

        results.push({
          studentId: student.id,
          studentName: student.name,
          groupName: group.subject || group.groupName,
          grade: finalGrade,
          attendance: attendanceRate,
          activityRate,
          participationRate,
          iraScore: iraAnalysis.score,
          iraLevel: iraAnalysis.riskLevel,
          failingRisk: iraAnalysis.failingRisk || 0,
          dropoutRisk: iraAnalysis.dropoutRisk || 0,
          simpleLevel: simpleRisk.level,
          hasDiscrepancy,
          iraAnalysis,
        });
      });
    });

    // Sort by discrepancy and then by risk level
    results.sort((a, b) => {
      if (a.hasDiscrepancy !== b.hasDiscrepancy) return a.hasDiscrepancy ? -1 : 1;
      const riskScore = (r: string) => r === 'high' ? 3 : r === 'medium' ? 2 : 1;
      return riskScore(b.simpleLevel) - riskScore(a.simpleLevel);
    });

    setDiscrepancies(results);
    setStats({
      total: totalStudents,
      withDiscrepancy,
      iraHigh,
      simpleHigh,
      failingRiskHigh,
      dropoutRiskHigh,
    });
    setIsLoading(false);
  };

  if (loadingAuth || loadingAdmin || isLoading || isDataLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Ejecutando diagnóstico...</span>
      </div>
    );
  }

  const getBadgeVariant = (level: string) => {
    if (level === 'high' || level === 'alto') return 'destructive';
    if (level === 'medium' || level === 'medio') return 'default';
    return 'secondary';
  };

  const getBadgeColor = (level: string) => {
    if (level === 'high' || level === 'alto') return 'bg-red-500';
    if (level === 'medium' || level === 'medio') return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnóstico del Sistema de Riesgo Académico</h1>
          <p className="text-muted-foreground">
            Comparación entre IRA (Índice de Riesgo Académico) y el sistema simple de riesgo
          </p>
        </div>
        <Button onClick={runDiagnostic}>
          Actualizar Diagnóstico
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Estudiantes</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{stats.withDiscrepancy}</div>
            <p className="text-xs text-muted-foreground">Con Discrepancia</p>
          </CardContent>
        </Card>
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.iraHigh}</div>
            <p className="text-xs text-muted-foreground">IRA Alto</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.failingRiskHigh}</div>
            <p className="text-xs text-muted-foreground">Riesgo Reprobación</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.dropoutRiskHigh}</div>
            <p className="text-xs text-muted-foreground">Riesgo Abandono</p>
          </CardContent>
        </Card>
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.simpleHigh}</div>
            <p className="text-xs text-muted-foreground">Simple Alto</p>
          </CardContent>
        </Card>
      </div>

      {/* Explanation */}
      <Card className="border-green-500 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-green-600" />
            Sistemas de Riesgo (Solo Factores Académicos)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-green-600" />
              <span className="font-semibold">Sistema Simple (Dashboard)</span>
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Solo considera: Calificación y Asistencia</li>
              <li>• Alto: Calif ≤59% o Asist &lt;80%</li>
              <li>• Medio: Calif 60-70%</li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-semibold">IRA - Índice de Riesgo Académico</span>
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Factores: Calificación, Asistencia, Actividades, Participación</li>
              <li>• Usa regresión logística</li>
              <li>• Proporciona riesgo de reprobación y abandono</li>
              <li>• <strong>No usa factores clínicos</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Discrepancy Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Estudiantes con Discrepancia ({stats.withDiscrepancy})
          </CardTitle>
          <CardDescription>
            Estos estudiantes tienen niveles de riesgo diferentes según el sistema utilizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Estudiante</th>
                  <th className="text-left p-2">Grupo</th>
                  <th className="text-center p-2">Calif.</th>
                  <th className="text-center p-2">Asist.</th>
                  <th className="text-center p-2">Activ.</th>
                  <th className="text-center p-2">Partic.</th>
                  <th className="text-center p-2">IRA</th>
                  <th className="text-center p-2">Reprob.</th>
                  <th className="text-center p-2">Aband.</th>
                  <th className="text-center p-2">Nivel IRA</th>
                  <th className="text-center p-2">Nivel Simple</th>
                  <th className="text-center p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.filter(d => d.hasDiscrepancy).slice(0, 50).map((d) => (
                  <tr key={d.studentId} className={`border-b ${d.hasDiscrepancy ? 'bg-amber-50' : ''}`}>
                    <td className="p-2 font-medium">{d.studentName}</td>
                    <td className="p-2 text-xs">{d.groupName}</td>
                    <td className="p-2 text-center">{d.grade.toFixed(0)}%</td>
                    <td className="p-2 text-center">{d.attendance.toFixed(0)}%</td>
                    <td className="p-2 text-center">{(d.activityRate * 100).toFixed(0)}%</td>
                    <td className="p-2 text-center">{(d.participationRate * 100).toFixed(0)}%</td>
                    <td className="p-2 text-center font-mono">{d.iraScore.toFixed(1)}%</td>
                    <td className="p-2 text-center">
                      <span className={d.failingRisk > 60 ? 'text-red-600 font-bold' : d.failingRisk > 30 ? 'text-amber-600' : ''}>
                        {d.failingRisk.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={d.dropoutRisk > 60 ? 'text-red-600 font-bold' : d.dropoutRisk > 30 ? 'text-amber-600' : ''}>
                        {d.dropoutRisk.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <Badge className={getBadgeColor(d.iraLevel)}>
                        {d.iraLevel.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant={getBadgeVariant(d.simpleLevel)}>
                        {d.simpleLevel.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      {d.hasDiscrepancy ? (
                        <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {discrepancies.filter(d => d.hasDiscrepancy).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No hay discrepancias significativas entre los sistemas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Todos los Estudiantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  <th className="text-left p-2">Estudiante</th>
                  <th className="text-center p-2">IRA</th>
                  <th className="text-center p-2">Reprob.</th>
                  <th className="text-center p-2">Aband.</th>
                  <th className="text-center p-2">Simple</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map((d) => (
                  <tr key={d.studentId} className="border-b">
                    <td className="p-2">{d.studentName}</td>
                    <td className="p-2 text-center">
                      <Badge className={getBadgeColor(d.iraLevel)}>
                        {d.iraLevel.toUpperCase()} ({d.iraScore.toFixed(0)}%)
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <span className={d.failingRisk > 60 ? 'text-red-600 font-bold' : ''}>
                        {d.failingRisk.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={d.dropoutRisk > 60 ? 'text-red-600 font-bold' : ''}>
                        {d.dropoutRisk.toFixed(0)}%
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant={getBadgeVariant(d.simpleLevel)}>
                        {d.simpleLevel.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Info className="h-5 w-5" />
            Sistema de Riesgo Académico v3.0
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="font-semibold text-green-800">Factores Académicos Implementados</p>
            <p className="text-green-700">El sistema ahora calcula el riesgo basándose exclusivamente en: Asistencia, Calificación, Tasa de Actividades y Tasa de Participación.</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="font-semibold text-blue-800">Riesgos Diferenciados</p>
            <p className="text-blue-700">Se calculan dos métricas independientes: Riesgo de Reprobación (basado en calificación y actividades) y Riesgo de Abandono (basado en asistencia y participación).</p>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
            <p className="font-semibold text-purple-800">Vinculación PIGEC-130</p>
            <p className="text-purple-700">Los factores clínicos (GAD-7, Neuropsi) serán proporcionados por PIGEC-130 cuando se habilite la vinculación, manteniendo la confidencialidad de los expedientes clínicos.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
