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
import { ArrowLeft, Download, User, Mail, Phone, Loader2, MessageSquare, BookText, Edit, Save, XCircle, Sparkles } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/hooks/use-data';
import { Badge } from '@/components/ui/badge';
import { getPartialLabel } from '@/lib/utils';
import type { PartialId, StudentObservation, Student, StudentStats, CriteriaDetail } from '@/lib/placeholder-data';
import { StudentObservationLogDialog } from '@/components/student-observation-log-dialog';
import { WhatsAppDialog } from '@/components/whatsapp-dialog';
import { Textarea } from '@/components/ui/textarea';
import { generateStudentFeedback } from '@/ai';

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const {
    settings,
    allStudents,
    groups,
    calculateDetailedFinalGrade,
    allObservations,
    isLoading: isDataLoading,
    fetchPartialData,
    activePartialId,
    partialData,
    setStudentFeedback,
  } = useData();

  const [studentStatsByPartial, setStudentStatsByPartial] = useState<StudentStats[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState('');
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const student = useMemo(() => allStudents.find((s) => s.id === studentId), [allStudents, studentId]);
  const studentGroups = useMemo(() => groups.filter((g) => g.students.some((s) => s.id === studentId)), [groups, studentId]);
  
  const savedFeedback = useMemo(() => {
      return partialData.feedbacks?.[studentId] || '';
  }, [partialData.feedbacks, studentId]);

  // Only update currentFeedback from savedFeedback if we are NOT editing or if the savedFeedback actually changes to a non-empty value initially
  useEffect(() => {
    if (!isEditingFeedback && !isGeneratingFeedback) {
        setCurrentFeedback(savedFeedback);
    }
  }, [savedFeedback, isEditingFeedback, isGeneratingFeedback]);


  useEffect(() => {
    const calculateStats = async () => {
        if (isDataLoading || !student || studentGroups.length === 0) {
            if (!isDataLoading) setIsPageLoading(false);
            return;
        }
        
        setIsPageLoading(true);
        const stats: StudentStats[] = [];
        const partials: PartialId[] = ['p1', 'p2', 'p3'];
        const primaryGroup = studentGroups[0];
        
        try {
            for (const pId of partials) {
                const pData = await fetchPartialData(primaryGroup.id, pId);
                
                if (pData && (Object.keys(pData.grades).length > 0 || Object.keys(pData.recoveryGrades).length > 0)) {
                    const gradeDetails = calculateDetailedFinalGrade(student.id, pData, primaryGroup.criteria);

                    let p = 0, a = 0, total = 0;
                    const safeAttendance = pData.attendance || {};
                    Object.keys(safeAttendance).forEach((date) => {
                        if (safeAttendance[date]?.[studentId] !== undefined) {
                            total++;
                            if (safeAttendance[date][studentId]) p++; else a++;
                        }
                    });
                    
                    const partialObservations = (allObservations[studentId] || []).filter(obs => obs.partialId === pId);
                    
                    stats.push({
                        ...gradeDetails,
                        partialId: pId,
                        attendance: { p, a, total, rate: total > 0 ? (p / total) * 100 : 100 },
                        observations: partialObservations,
                    });
                }
            }
            setStudentStatsByPartial(stats);
        } catch (e) {
            console.error('Error calculating stats:', e);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron calcular las estadísticas.' });
        } finally {
            setIsPageLoading(false);
        }
    };
    
    calculateStats();

  }, [isDataLoading, student, studentGroups, studentId, fetchPartialData, calculateDetailedFinalGrade, allObservations, toast]);


  const semesterAverage = useMemo(() => {
    if (studentStatsByPartial.length === 0) return 0;
    const partialsWithGrades = studentStatsByPartial.filter(s => s.finalGrade !== undefined);
    if (partialsWithGrades.length === 0) return 0;
    const total = partialsWithGrades.reduce((sum, stats) => sum + stats.finalGrade, 0);
    return total / partialsWithGrades.length;
  }, [studentStatsByPartial]);

  const finalGradeCard = useMemo(() => {
    const p3Stats = studentStatsByPartial.find(s => s.partialId === 'p3');
    
    if (p3Stats && studentStatsByPartial.length === 3) {
      return {
        title: 'Calificación Final Semestral',
        grade: semesterAverage,
      };
    }
    
    const activePartialStats = studentStatsByPartial.find(s => s.partialId === activePartialId);
    if (activePartialStats) {
      return {
        title: `Calificación del ${getPartialLabel(activePartialId)}`,
        grade: activePartialStats.finalGrade,
      };
    }
    
    // Fallback if active partial has no grade, find latest available
    const lastAvailablePartial = [...studentStatsByPartial].pop();
    if (lastAvailablePartial) {
      return {
        title: `Calificación del ${getPartialLabel(lastAvailablePartial.partialId)}`,
        grade: lastAvailablePartial.finalGrade,
      };
    }
    
    return {
      title: 'Calificación Final',
      grade: 0,
    };
  }, [studentStatsByPartial, semesterAverage, activePartialId]);

  const handleDownloadPdf = async () => {
    const reportElement = reportRef.current;
    if (!reportElement) return;

    const idsToHide = ['interactive-buttons-header', 'interactive-buttons-card', 'feedback-buttons-container'];
    const elementsToHide: HTMLElement[] = idsToHide
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    const originalDisplays = new Map<HTMLElement, string>();

    toast({ title: 'Generando PDF...', description: 'Esto puede tardar un momento.' });

    elementsToHide.forEach((el) => {
      originalDisplays.set(el, el.style.display);
      el.style.display = 'none';
    });
    
    const wasEditing = isEditingFeedback;
    if(wasEditing) setIsEditingFeedback(false);


    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
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
      pdf.save(`informe_${student?.name.replace(/\s+/g, '_') || 'estudiante'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error al generar PDF',
        description: 'No se pudo crear el archivo. Inténtalo de nuevo.',
      });
    } finally {
      elementsToHide.forEach((el) => {
        el.style.display = originalDisplays.get(el) || '';
      });
      if(wasEditing) setIsEditingFeedback(true);
    }
  };

  const handleSaveFeedback = async () => {
    if (!student) return;
    await setStudentFeedback(student.id, currentFeedback);
    setIsEditingFeedback(false);
    toast({ title: 'Retroalimentación guardada' });
  };
  
  const handleCancelFeedback = () => {
      setCurrentFeedback(savedFeedback);
      setIsEditingFeedback(false);
  }

  const handleGenerateFeedback = async () => {
    if (!student) return;

    const activePartialStats = studentStatsByPartial.find(s => s.partialId === activePartialId);
    if (!activePartialStats) {
      toast({ variant: 'destructive', title: 'Faltan Datos', description: `No hay datos de calificación para el ${getPartialLabel(activePartialId)}.` });
      return;
    }

    setIsGeneratingFeedback(true);
    toast({ title: 'Generando retroalimentación con IA...', description: 'Esto puede tomar unos segundos.' });

    try {
        const result = await generateStudentFeedback({
            studentName: student.name,
            partial: getPartialLabel(activePartialId),
            finalGrade: activePartialStats.finalGrade,
            attendanceRate: activePartialStats.attendance.rate,
            criteria: activePartialStats.criteriaDetails.map(c => ({ name: c.name, earnedPercentage: c.earned })),
            observations: activePartialStats.observations.map(o => o.details),
        });
        setCurrentFeedback(result);
        setIsEditingFeedback(true); // Open editor with generated text automatically
        toast({ title: '¡Retroalimentación generada!', description: 'Revisa y guarda el análisis.' });
    } catch (e: any) {
        console.error(e);
        toast({
            variant: 'destructive',
            title: 'Error de IA',
            description: e.message || 'No se pudo generar la retroalimentación. Verifica tu clave API y la conexión.',
        });
    } finally {
        setIsGeneratingFeedback(false);
    }
  };

  if (isDataLoading || isPageLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando datos del estudiante...</span>
      </div>
    );
  }
  
  if (!student) {
      return notFound();
  }

  const allSemesterObservations = Object.values(allObservations)
    .flat()
    .filter((obs) => obs.studentId === studentId);
  const facilitatorName = studentGroups[0]?.facilitator || 'Docente';

  return (
    <>
      <StudentObservationLogDialog student={student} open={isLogOpen} onOpenChange={setIsLogOpen} />
      <WhatsAppDialog studentName={student.name} open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen} />

      <div className="flex flex-col gap-6">
        <div id="interactive-buttons-header" className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href="/reports">
                <ArrowLeft />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Perfil del Estudiante</h1>
              <p className="text-muted-foreground">Información detallada de {student.name} para el {getPartialLabel(activePartialId)}.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        <div ref={reportRef} className="p-2">
          <Card>
            <CardHeader className="flex flex-col md:flex-row gap-6 items-start">
              <Image
                src={student.photo}
                alt={student.name}
                width={128}
                height={128}
                className="rounded-full border-4 border-primary"
                data-ai-hint="student photo"
              />
              <div className="w-full">
                <CardTitle className="text-3xl">{student.name}</CardTitle>
                <p className="text-lg text-muted-foreground font-semibold">
                  Asignatura: {studentGroups[0]?.subject || 'No asignada'}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> {student.email || 'No registrado'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> {student.phone || 'No registrado'}
                  </p>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Tutor: {student.tutorName || 'No registrado'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> Tel. Tutor: {student.tutorPhone || 'No registrado'}
                  </p>
                </div>
                <div id="interactive-buttons-card" className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsLogOpen(true)}>
                    <MessageSquare className="mr-2" /> Ver Bitácora
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setIsWhatsAppOpen(true)}>
                    Enviar informe vía WhatsApp
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {studentStatsByPartial.length > 0 ? (
                studentStatsByPartial.map(
                  (stats) => (
                      <Card key={stats.partialId}>
                        <CardHeader>
                          <CardTitle>{getPartialLabel(stats.partialId)}</CardTitle>
                          <CardDescription>
                            Calificación Final:{' '}
                            <Badge className={stats.finalGrade >= 60 ? 'bg-green-500' : 'bg-destructive'}>
                              {stats.finalGrade.toFixed(1)}%
                               {stats.isRecovery && <span className="ml-1 font-bold text-white">(R)</span>}
                            </Badge>{' '}
                            | Asistencia: <Badge variant="secondary">{stats.attendance.rate.toFixed(1)}%</Badge>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <h4 className="font-semibold mb-2 text-sm">Desglose de Criterios:</h4>
                          <div className="space-y-1 text-sm p-3 bg-muted/30 rounded-md">
                            {stats.criteriaDetails.map((c) => (
                              <div key={c.name} className="flex justify-between">
                                <span>
                                  {c.name} {c.name !== 'Recuperación' && <span className="text-xs text-muted-foreground">({c.weight}%)</span>}
                                </span>
                                <span className="font-medium">{c.earned.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                )
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <h3 className="text-lg font-semibold">Sin datos de rendimiento</h3>
                    <p className="text-muted-foreground mt-1">
                      No hay información de calificaciones registrada para este estudiante en ningún parcial.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                   <CardTitle className="text-base text-center">{finalGradeCard.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p
                    className="text-5xl font-bold"
                    style={{ color: finalGradeCard.grade >= 60 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))' }}
                  >
                    {finalGradeCard.grade.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookText className="h-5 w-5" /> Bitácora del Semestre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allSemesterObservations.length > 0 ? (
                    <div className="space-y-3 text-sm max-h-64 overflow-y-auto pr-2">
                      {allSemesterObservations.map((obs) => (
                        <div key={obs.id} className="p-2 bg-muted/50 rounded-md">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">{obs.type}</p>
                            <Badge variant="outline" className="text-xs">
                              {getPartialLabel(obs.partialId)}
                            </Badge>
                          </div>
                          <p className="text-xs mt-1">{obs.details}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay observaciones.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <div id="feedback-buttons-container" className="flex justify-between items-center w-full">
                <div>
                  <CardTitle>Recomendaciones y retroalimentación ({getPartialLabel(activePartialId)})</CardTitle>
                  <CardDescription>Análisis personalizado del docente sobre el rendimiento del estudiante.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingFeedback && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditingFeedback(true)}>
                          <Edit className="mr-2" /> Editar
                      </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleGenerateFeedback} disabled={isGeneratingFeedback || !studentStatsByPartial.some(s => s.partialId === activePartialId)}>
                      {isGeneratingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                      Generar con IA
                  </Button>
                </div>
              </div>
            </CardHeader>
             <CardContent>
                {isEditingFeedback ? (
                    <div className="space-y-2">
                        <Textarea 
                            placeholder="Escribe aquí tu retroalimentación, análisis de fortalezas, áreas de oportunidad y recomendaciones para el estudiante..."
                            value={currentFeedback}
                            onChange={(e) => setCurrentFeedback(e.target.value)}
                            rows={8}
                            className="w-full text-justify"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" onClick={handleCancelFeedback}>
                                <XCircle className="mr-2"/>
                                Cancelar
                            </Button>
                            <Button size="sm" onClick={handleSaveFeedback}>
                                <Save className="mr-2"/>
                                Guardar Retroalimentación
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert mt-2 whitespace-pre-wrap min-h-[100px] p-3 bg-muted/30 rounded-md text-justify">
                        {currentFeedback || (
                          <p className="text-muted-foreground italic">
                            No hay retroalimentación para este parcial. Haz clic en &quot;Editar&quot; para agregar una.
                          </p>
                        )}
                    </div>
                )}
              </CardContent>
            <CardFooter>
              <div className="w-full mt-12 pt-4 text-center text-sm">
                <div className="inline-block relative h-20 w-48">
                   {settings.signature && (
                        <Image 
                            src={settings.signature}
                            alt="Firma del docente"
                            fill
                            style={{ objectFit: 'contain' }}
                        />
                    )}
                </div>
                <div className="border-t border-foreground w-48 mx-auto mt-2"></div>
                <p className="font-semibold">{facilitatorName}</p>
                <p className="text-muted-foreground">Firma del Docente</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
