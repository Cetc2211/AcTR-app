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
import { Loader2, AlertTriangle, CheckCircle, XCircle, Info, Calculator, Brain, Users } from 'lucide-react';
import { getPartialLabel } from '@/lib/utils';

type RiskDiscrepancy = {
  studentId: string;
  studentName: string;
  groupName: string;
  grade: number;
  attendance: number;
  gad7Score: number;
  neuropsiScore: number;
  ircScore: number;
  ircLevel: 'bajo' | 'medio' | 'alto';
  simpleLevel: 'low' | 'medium' | 'high';
  hasDiscrepancy: boolean;
  hasClinicalData: boolean;
  ircAnalysis: IRCAnalysis;
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
    withoutClinicalData: 0,
    ircHigh: 0,
    simpleHigh: 0,
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
    let withoutClinicalData = 0;
    let ircHigh = 0;
    let simpleHigh = 0;

    groups.forEach(group => {
      const partialData = allPartialsData[group.id]?.[activePartialId];
      if (!partialData || !group.criteria || group.criteria.length === 0) return;

      group.students.forEach(student => {
        totalStudents++;

        // Calculate grade
        const { finalGrade } = calculateDetailedFinalGrade(student.id, partialData, group.criteria);

        // Calculate attendance
        const attendanceDays = Object.keys(partialData.attendance || {});
        const attendedDays = attendanceDays.filter(d => partialData.attendance[d]?.[student.id]).length;
        const attendanceRate = attendanceDays.length > 0 ? (attendedDays / attendanceDays.length) * 100 : 100;

        // Clinical data
        const gad7Score = student.gad7Score || 0;
        const neuropsiScore = student.neuropsiTotal || student.neuropsiScore || 0;
        const hasClinicalData = gad7Score > 0 || neuropsiScore > 0;
        if (!hasClinicalData) withoutClinicalData++;

        // System A: IRC
        const ircAnalysis = analyzeIRC(attendanceRate, finalGrade, gad7Score, neuropsiScore);
        if (ircAnalysis.riskLevel === 'alto') ircHigh++;

        // System B: Simple
        const simpleRisk = getStudentRiskLevel(finalGrade, partialData.attendance, student.id);
        if (simpleRisk.level === 'high') simpleHigh++;

        // Map IRC level to simple level for comparison
        const ircToSimple: Record<string, 'low' | 'medium' | 'high'> = {
          'bajo': 'low',
          'medio': 'medium',
          'alto': 'high'
        };
        const ircMappedLevel = ircToSimple[ircAnalysis.riskLevel];

        // Check discrepancy
        const hasDiscrepancy = ircMappedLevel !== simpleRisk.level;
        if (hasDiscrepancy) withDiscrepancy++;

        results.push({
          studentId: student.id,
          studentName: student.name,
          groupName: group.subject || group.groupName,
          grade: finalGrade,
          attendance: attendanceRate,
          gad7Score,
          neuropsiScore,
          ircScore: ircAnalysis.score,
          ircLevel: ircAnalysis.riskLevel,
          simpleLevel: simpleRisk.level,
          hasDiscrepancy,
          hasClinicalData,
          ircAnalysis,
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
      withoutClinicalData,
      ircHigh,
      simpleHigh,
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
          <h1 className="text-3xl font-bold">Diagnóstico del Sistema de Riesgo</h1>
          <p className="text-muted-foreground">
            Comparación entre IRC (Índice Compuesto) y el sistema simple de riesgo
          </p>
        </div>
        <Button onClick={runDiagnostic}>
          Actualizar Diagnóstico
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card className="border-blue-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.withoutClinicalData}</div>
            <p className="text-xs text-muted-foreground">Sin Datos Clínicos</p>
          </CardContent>
        </Card>
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.ircHigh}</div>
            <p className="text-xs text-muted-foreground">IRC Alto</p>
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
      <Card className="border-purple-500 bg-purple-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-purple-600" />
            Diferencia entre Sistemas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-purple-600" />
              <span className="font-semibold">Sistema Simple (Dashboard)</span>
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Solo considera: Calificación y Asistencia</li>
              <li>• Alto: Calif ≤59% o Asist &lt;80%</li>
              <li>• Medio: Calif 60-70%</li>
              <li>• <strong>No usa datos clínicos</strong></li>
            </ul>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="font-semibold">IRC (Perfil Estudiante)</span>
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Considera: Calificación, Asistencia, GAD-7, Neuropsi</li>
              <li>• Usa regresión logística</li>
              <li>• Alto: IRC ≥25%</li>
              <li>• Medio: IRC 15-24%</li>
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
                  <th className="text-center p-2">GAD-7</th>
                  <th className="text-center p-2">Neuropsi</th>
                  <th className="text-center p-2">IRC</th>
                  <th className="text-center p-2">Nivel IRC</th>
                  <th className="text-center p-2">Nivel Simple</th>
                  <th className="text-center p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.filter(d => d.hasDiscrepancy || !d.hasClinicalData).slice(0, 50).map((d) => (
                  <tr key={d.studentId} className={`border-b ${d.hasDiscrepancy ? 'bg-amber-50' : ''}`}>
                    <td className="p-2 font-medium">{d.studentName}</td>
                    <td className="p-2 text-xs">{d.groupName}</td>
                    <td className="p-2 text-center">{d.grade.toFixed(0)}%</td>
                    <td className="p-2 text-center">{d.attendance.toFixed(0)}%</td>
                    <td className="p-2 text-center">
                      {d.gad7Score > 0 ? (
                        <span className={d.gad7Score >= 10 ? 'text-red-600 font-bold' : ''}>
                          {d.gad7Score}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-2 text-center">
                      {d.neuropsiScore > 0 ? (
                        <span className={d.neuropsiScore < 70 ? 'text-red-600 font-bold' : ''}>
                          {d.neuropsiScore}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-2 text-center font-mono">{d.ircScore.toFixed(1)}%</td>
                    <td className="p-2 text-center">
                      <Badge className={getBadgeColor(d.ircLevel)}>
                        {d.ircLevel.toUpperCase()}
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
                      ) : !d.hasClinicalData ? (
                        <Info className="h-5 w-5 text-blue-500 mx-auto" />
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
                  <th className="text-center p-2">IRC</th>
                  <th className="text-center p-2">Simple</th>
                  <th className="text-center p-2">Datos Clínicos</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map((d) => (
                  <tr key={d.studentId} className="border-b">
                    <td className="p-2">{d.studentName}</td>
                    <td className="p-2 text-center">
                      <Badge className={getBadgeColor(d.ircLevel)}>
                        {d.ircLevel.toUpperCase()} ({d.ircScore.toFixed(0)}%)
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant={getBadgeVariant(d.simpleLevel)}>
                        {d.simpleLevel.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      {d.hasClinicalData ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Recomendaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="font-semibold text-red-800">1. Unificar Sistemas</p>
            <p className="text-red-700">Los dos sistemas deberían mostrar resultados consistentes. Considera usar IRC en el dashboard también.</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="font-semibold text-blue-800">2. Capturar Datos Clínicos</p>
            <p className="text-blue-700">Hay {stats.withoutClinicalData} estudiantes sin datos de tamizaje. El IRC asume 0 (sin riesgo) cuando faltan datos.</p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="font-semibold text-amber-800">3. Ajustar Intercepto IRC</p>
            <p className="text-amber-700">El intercepto actual (-3.0) es muy conservador. Considerar -2.0 para mayor sensibilidad.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
