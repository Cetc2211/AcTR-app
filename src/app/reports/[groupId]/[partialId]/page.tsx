'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, CheckCircle, XCircle, TrendingUp, BarChart, Users, Eye, AlertTriangle, Loader2, BookText, Save, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';
import type { PartialId, StudentObservation, Group, StudentWithRisk, RecoveryGrade } from '@/lib/placeholder-data';
import { getPartialLabel } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { generateGroupReportAnalysis } from '@/ai';
import { testApiKeyAction } from '@/app/settings/actions';
import { normalizeModel, describeModel } from '@/lib/ai-models';


type ReportSummary = {
    totalStudents: number;
    approvedCount: number;
    failedCount: number;
    groupAverage: number;
    attendanceRate: number;
    participationRate: number;
}

type RecoverySummary = {
    recoveryStudentsCount: number;
    approvedOnRecovery: number;
    failedOnRecovery: number;
}

export default function GroupReportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const partialId = params.partialId as PartialId;
  
  const { 
      groups,
      settings,
      calculateDetailedFinalGrade,
      atRiskStudents,
      allObservations,
      partialData,
      isLoading: isDataLoading,
      setGroupAnalysis,
      activeGroup,
  } = useData();
  const { attendance, participations, recoveryGrades, groupAnalysis } = partialData;
  const { criteria = [] } = activeGroup || {};
  
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [recoverySummary, setRecoverySummary] = useState<RecoverySummary | null>(null);
  const [isClient, setIsClient] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [narrativeAnalysis, setNarrativeAnalysis] = useState('');
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUsedModel, setLastUsedModel] = useState<string | null>(null);
  const friendlyModelName = useMemo(() => lastUsedModel ? describeModel(lastUsedModel) : null, [lastUsedModel]);

  useEffect(() => {
    setNarrativeAnalysis(groupAnalysis || '');
  }, [groupAnalysis]);

  useEffect(() => {
    // reset validation flag if the API key changes
    setIsApiKeyValid(false);
  }, [settings.apiKey]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const group = useMemo(() => groups.find(g => g.id === groupId), [groups, groupId]);

  const atRiskStudentsForGroup = useMemo(() => {
    if (!group) return [];
    const studentIdsInGroup = new Set(group.students.map(s => s.id));
    return atRiskStudents.filter(s => studentIdsInGroup.has(s.id));
  }, [atRiskStudents, group]);

  const recentObservations = useMemo(() => {
    if (!group) return [];
    
    const observations: (StudentObservation & { studentName: string })[] = [];
    group.students.forEach(student => {
      const studentObs = (allObservations[student.id] || []).filter(obs => obs.partialId === partialId);
      studentObs.forEach(obs => {
        observations.push({ ...obs, studentName: student.name });
      });
    });
    return observations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  }, [allObservations, group, partialId]);


  useEffect(() => {
    if (!group || isDataLoading) {
        return;
    }

    try {
      const studentCount = group.students.length;
      if (studentCount === 0) {
          setSummary({
              totalStudents: 0,
              approvedCount: 0,
              failedCount: 0,
              groupAverage: 0,
              attendanceRate: 100,
              participationRate: 100,
          });
          setRecoverySummary({
              recoveryStudentsCount: 0,
              approvedOnRecovery: 0,
              failedOnRecovery: 0,
          });
          return;
      }
      
      let approved = 0;
      let totalGroupGrade = 0;
      let totalPossibleAttendance = 0;
      let totalPresent = 0;
      
      const studentGrades = group.students.map(student => {
        const { finalGrade } = calculateDetailedFinalGrade(student.id, partialData, criteria);
        return finalGrade;
      });

      studentGrades.forEach(grade => {
          totalGroupGrade += grade;
          if (grade >= 60) approved++;
      });
      
      let totalParticipations = 0;
      let totalParticipationOpportunities = 0;
      const participationDates = Object.keys(participations);
      if (participationDates.length > 0 && studentCount > 0) {
          totalParticipations = group.students.reduce((sum, student) => {
              return sum + participationDates.reduce((studentSum, date) => {
                  return studentSum + (participations[date]?.[student.id] ? 1 : 0);
              }, 0);
          }, 0);
           totalParticipationOpportunities = group.students.reduce((sum, student) => {
                return sum + participationDates.filter(date => Object.prototype.hasOwnProperty.call(participations[date], student.id)).length;
            }, 0);
      }
      
      Object.keys(attendance).forEach(date => {
          group.students.forEach(student => {
              if (attendance[date]?.[student.id] !== undefined) {
                  totalPossibleAttendance++;
                  if (attendance[date][student.id]) totalPresent++;
              }
          });
      });
      
      const reportSummary = {
          totalStudents: studentCount,
          approvedCount: approved,
          failedCount: studentCount - approved,
          groupAverage: studentCount > 0 ? totalGroupGrade / studentCount : 0,
          attendanceRate: totalPossibleAttendance > 0 ? (totalPresent / totalPossibleAttendance) * 100 : 100,
          participationRate: totalParticipationOpportunities > 0 ? (totalParticipations / totalParticipationOpportunities) * 100 : 100,
      };

      setSummary(reportSummary);

      const studentsWithRecovery = (Object.values(recoveryGrades || {}) as RecoveryGrade[]).filter(rg => rg.applied);
      const recoveryStats = {
          recoveryStudentsCount: Object.keys(recoveryGrades || {}).length,
          approvedOnRecovery: studentsWithRecovery.filter(rg => (rg.grade ?? 0) >= 60).length,
          failedOnRecovery: studentsWithRecovery.filter(rg => (rg.grade ?? 0) < 60).length,
      };
      setRecoverySummary(recoveryStats);


    } catch (e) {
      console.error("Failed to generate report data", e);
    }
  }, [group, partialId, calculateDetailedFinalGrade, isDataLoading, attendance, participations, recoveryGrades, partialData, criteria]);

  const handleDownloadPdf = () => {
    const input = reportRef.current;
    if (input) {
      toast({ title: 'Generando PDF...', description: 'Esto puede tardar un momento.' });
      
      const elementsToHide = input.querySelectorAll('[data-hide-for-pdf="true"]');
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
      
      const textarea = input.querySelector('textarea');
      const analysisDiv = document.createElement('div');
      if (textarea) {
        analysisDiv.innerHTML = textarea.value.replace(/\\n/g, '<br>');
        analysisDiv.className = textarea.className;
        analysisDiv.style.whiteSpace = 'pre-wrap';
        analysisDiv.style.minHeight = textarea.style.minHeight || '100px';
        analysisDiv.style.fontFamily = 'inherit';
        analysisDiv.style.fontSize = 'inherit';
        analysisDiv.style.lineHeight = 'inherit';
        analysisDiv.style.color = 'inherit';
        textarea.style.display = 'none';
        textarea.parentNode?.insertBefore(analysisDiv, textarea);
      }


      html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        
        if (imgHeight > pdfHeight - 20) {
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`informe_grupal_${group?.subject.replace(/\s+/g, '_') || 'reporte'}.pdf`);
      }).finally(() => {
        elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
         if (textarea) {
            textarea.style.display = 'block';
            analysisDiv.remove();
        }
      });
    }
  };
  
  const handleGenerateAnalysis = async () => {
    if (!group || !summary) {
        toast({variant: 'destructive', title: 'Faltan datos', description: 'No se pueden generar análisis sin datos del grupo.'})
        return;
    }

    if (!settings.apiKey) {
      toast({
        variant: 'destructive',
        title: 'Falta Clave de API',
        description: 'Por favor, configura tu clave de API de Google AI en la página de Ajustes.',
      });
      return;
    }

  setIsGeneratingAnalysis(true);
  toast({ title: 'Generando análisis con IA...', description: 'Esto puede tomar unos segundos.' });

  try {
    // First, ensure the API key works (verify once per session or until it changes)
    if (!isApiKeyValid) {
      setIsGeneratingAnalysis(true);
      const testResult = await testApiKeyAction(settings.apiKey);
      setIsGeneratingAnalysis(false);
      if (!testResult.success) {
        toast({ variant: 'destructive', title: 'Clave inválida', description: testResult.error || 'La clave API no es válida.' });
        return;
      }
      setIsApiKeyValid(true);
    }

    // Call the server action which now uses the Cloud Run service
    const analysisText = await generateGroupReportAnalysis({
      groupName: group.subject,
      partial: getPartialLabel(partialId),
      totalStudents: summary.totalStudents,
      approvedCount: summary.approvedCount,
      failedCount: summary.failedCount,
      groupAverage: summary.groupAverage,
      attendanceRate: summary.attendanceRate,
      atRiskStudentCount: atRiskStudentsForGroup.length,
      apiKey: settings.apiKey,
      aiModel: settings.aiModel
    });

    setNarrativeAnalysis(analysisText || '');
    // Note: The server action returns just the text string, so we don't get the model name back directly 
    // unless we change the return type. For now, we assume the requested model was used.
    setLastUsedModel(settings.aiModel || null);
    
    toast({ title: '¡Análisis generado!', description: `La IA ha completado el análisis del grupo.` });
  } catch(e: any) {
    console.error(e);
    toast({
      variant: 'destructive',
      title: 'Error de IA',
      description: e.message || 'No se pudo generar el análisis. Verifica tu clave API y la conexión.',
    });
  } finally {
    setIsGeneratingAnalysis(false);
  }
  };
  
  const handleSaveAnalysis = async () => {
    setIsSaving(true);
    try {
      await setGroupAnalysis(narrativeAnalysis);
      toast({
        title: 'Análisis Guardado',
        description: 'Tu análisis narrativo ha sido guardado para este parcial.',
      });
    } catch(e: any) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo guardar el análisis.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isDataLoading || !summary) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Generando informe...</span></div>;
  }

  if (!group) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between flex-wrap gap-4">
         <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href="/reports">
                <ArrowLeft />
                <span className="sr-only">Volver a Informes</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Informe General del Grupo</h1>
                <p className="text-muted-foreground">
                  Resumen global de &quot;{group.subject}&quot; para el {getPartialLabel(partialId)}
                </p>
            </div>
         </div>
         <div className='flex items-center gap-2 flex-wrap' data-hide-for-pdf="true">
            <Button onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4"/>
                Descargar Informe
            </Button>
         </div>
      </div>
      
      <Card ref={reportRef} id="report-content" className="p-4 sm:p-6 md:p-8">
        <header className="border-b pb-6 mb-6">
           <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">{settings.institutionName}</h1>
                    <p className="text-lg text-muted-foreground">Informe de Rendimiento Académico Grupal</p>
                </div>
                 {isClient && settings.logo ? (
                    <Image
                        src={settings.logo}
                        alt="Logo de la Institución"
                        width={80}
                        height={80}
                        className="object-contain"
                    />
                 ): <Skeleton className="w-[80px] h-[80px]" /> }
           </div>
           <div className="pt-4 flex justify-between text-sm text-muted-foreground">
                <div>
                    <span className="font-semibold text-foreground">Asignatura: </span>
                    <span>{group.subject}</span>
                </div>
                <div>
                    <span className="font-semibold text-foreground">Fecha del Informe: </span>
                    <span>{format(new Date(), 'PPP', {locale: es})}</span>
                </div>
           </div>
           {lastUsedModel && friendlyModelName && (
             <div className="pt-2 text-sm text-muted-foreground">
               <span className="font-semibold">Modelo IA usado: </span>
               <span>{friendlyModelName}</span>
               {friendlyModelName !== lastUsedModel && (
                 <span className="ml-1 text-xs">({lastUsedModel})</span>
               )}
             </div>
           )}
        </header>

        <section className="space-y-6">
            <p className="prose dark:prose-invert max-w-none text-justify">
              Durante este periodo se atendieron <strong>{summary.totalStudents}</strong> estudiantes, con los siguientes resultados e indicadores clave:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
              <Card className="text-center">
                  <CardHeader><CardTitle className="text-base">Aprobación</CardTitle></CardHeader>
                  <CardContent>
                      <p className="text-3xl font-bold">{summary.approvedCount} <span className="text-base font-normal text-muted-foreground">de {summary.totalStudents}</span></p>
                       <p className="text-sm text-green-600 flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4"/> Aprobados</p>
                       <p className="text-sm text-red-600 flex items-center justify-center gap-1"><XCircle className="h-4 w-4"/> Reprobados: {summary.failedCount}</p>
                  </CardContent>
              </Card>
               <Card className="text-center">
                  <CardHeader><CardTitle className="text-base">Promedio General</CardTitle></CardHeader>
                  <CardContent>
                       <p className="text-3xl font-bold">{summary.groupAverage.toFixed(1)} <span className="text-base font-normal text-muted-foreground">/ 100</span></p>
                       <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><TrendingUp className="h-4 w-4"/> Calificación media del grupo</p>
                  </CardContent>
              </Card>
               <Card className="text-center">
                  <CardHeader><CardTitle className="text-base">Asistencia y Participación</CardTitle></CardHeader>
                   <CardContent>
                       <p className="text-3xl font-bold">{summary.attendanceRate.toFixed(1)}%</p>
                       <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><BarChart className="h-4 w-4"/> Tasa de Asistencia General</p>
                       <p className="text-xl font-bold mt-2">{summary.participationRate.toFixed(1)}%</p>
                       <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><BarChart className="h-4 w-4"/> Tasa de Participación</p>
                  </CardContent>
              </Card>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Análisis y Observaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center mb-2" data-hide-for-pdf="true">
                        <h4 className="font-semibold text-base">Análisis Narrativo</h4>
                        <div className='flex items-center gap-2'>
                           <Button size="sm" onClick={handleSaveAnalysis} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                Guardar Análisis
                            </Button>
                             <Button size="sm" onClick={handleGenerateAnalysis} disabled={isGeneratingAnalysis}>
                                {isGeneratingAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generar con IA
                            </Button>
                        </div>
                    </div>
                    <Textarea 
                        placeholder="Análisis cualitativo del rendimiento general del grupo..."
                        value={narrativeAnalysis}
                        onChange={(e) => setNarrativeAnalysis(e.target.value)}
                        rows={8}
                        className="w-full text-base text-justify"
                    />
                    {recentObservations.length > 0 && (
                        <div className="space-y-2 pt-4">
                            <h4 className="font-semibold text-base flex items-center gap-2"><BookText/> Observaciones Recientes de la Bitácora</h4>
                            <div className="p-3 border rounded-md text-sm space-y-2 bg-muted/30">
                                {recentObservations.map(obs => (
                                    <p key={obs.id}>
                                        <span className="font-semibold">{obs.studentName} ({obs.type}):</span> {obs.details.substring(0, 100)}{obs.details.length > 100 ? '...' : ''}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>

        <footer className="border-t mt-8 pt-6 text-sm">
            <p className="prose dark:prose-invert max-w-none text-justify">
              Sin más por el momento, quedo a sus órdenes para cualquier aclaración.
            </p>
            <div className="mt-16 pt-4 text-center">
                <div className="inline-block relative h-20 w-64">
                    {settings.signature && (
                        <Image 
                            src={settings.signature}
                            alt="Firma del docente"
                            fill
                            style={{ objectFit: 'contain' }}
                            sizes="(max-width: 768px) 100vw, 256px"
                        />
                    )}
                </div>
                <div className="border-t border-foreground w-64 mx-auto mt-2"></div>
                <p className="font-semibold mt-2">{group.facilitator || 'Docente'}</p>
            </div>
        </footer>
      </Card>
    </div>
  );
}
