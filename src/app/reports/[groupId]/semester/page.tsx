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
import { ArrowLeft, Download, CheckCircle, XCircle, TrendingUp, BarChart, Users, Eye, AlertTriangle, Loader2, BookText, Save, FileClock } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/hooks/use-data';
import { Skeleton } from '@/components/ui/skeleton';
import type { PartialId, StudentObservation, Group, StudentWithRisk } from '@/lib/placeholder-data';
import { Textarea } from '@/components/ui/textarea';


type SemesterSummary = {
    totalStudents: number;
    approvedCount: number;
    failedCount: number;
    groupAverage: number;
    attendanceRate: number;
};

export default function SemesterReportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  
  const { 
      groups,
      settings,
      calculateDetailedFinalGrade,
      atRiskStudents,
      allObservations,
      isLoading: isDataLoading,
      fetchPartialData
  } = useData();
  
  const [summary, setSummary] = useState<SemesterSummary | null>(null);
  const [isClient, setIsClient] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [narrativeAnalysis, setNarrativeAnalysis] = useState('');
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  
  useEffect(() => { setIsClient(true) }, []);

  const group = useMemo(() => groups.find(g => g.id === groupId), [groups, groupId]);

  useEffect(() => {
    if (!group || isDataLoading) return;
    
    const calculateSemesterStats = async () => {
        const studentCount = group.students.length;
        if (studentCount === 0) {
            setSummary({ totalStudents: 0, approvedCount: 0, failedCount: 0, groupAverage: 0, attendanceRate: 100 });
            return;
        }

        const partials: PartialId[] = ['p1', 'p2', 'p3'];
        const allPartialsData = await Promise.all(
            partials.map(pId => fetchPartialData(group.id, pId))
        );

        let totalGroupGrade = 0;
        let totalPossibleAttendance = 0;
        let totalPresent = 0;
        let finalApprovedCount = 0;

        for (const student of group.students) {
            let semesterGradeSum = 0;
            let partialsCounted = 0;
            
            for (const pData of allPartialsData) {
                if (pData) {
                    const { finalGrade } = calculateDetailedFinalGrade(student.id, pData, group.criteria);
                    semesterGradeSum += finalGrade;
                    partialsCounted++;

                    Object.values(pData.attendance).forEach(dailyRecord => {
                        if (Object.prototype.hasOwnProperty.call(dailyRecord, student.id)) {
                            totalPossibleAttendance++;
                            if (dailyRecord[student.id]) totalPresent++;
                        }
                    });
                }
            }
            const semesterAverage = partialsCounted > 0 ? semesterGradeSum / partialsCounted : 0;
            totalGroupGrade += semesterAverage;
            if (semesterAverage >= 60) finalApprovedCount++;
        }
        
        setSummary({
            totalStudents: studentCount,
            approvedCount: finalApprovedCount,
            failedCount: studentCount - finalApprovedCount,
            groupAverage: studentCount > 0 ? totalGroupGrade / studentCount : 0,
            attendanceRate: totalPossibleAttendance > 0 ? (totalPresent / totalPossibleAttendance) * 100 : 100,
        });
    };

    calculateSemesterStats();

  }, [group, calculateDetailedFinalGrade, isDataLoading, fetchPartialData]);


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
        const ratio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20;
        let imgHeight = imgWidth / ratio;
        if (imgHeight > pdfHeight - 20) { imgHeight = pdfHeight - 20; imgWidth = imgHeight * ratio; }
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`informe_semestral_${group?.subject.replace(/\s+/g, '_') || 'reporte'}.pdf`);
      }).finally(() => {
        elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
         if (textarea) {
            textarea.style.display = 'block';
            analysisDiv.remove();
        }
      });
    }
  };
  
  // Removed AI generation function

  if (isDataLoading || !summary) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Generando informe semestral...</span></div>;
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
              <h1 className="text-3xl font-bold">Informe General Semestral</h1>
                <p className="text-muted-foreground">
                  Resumen de todo el semestre para &quot;{group.subject}&quot;
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
                    <p className="text-lg text-muted-foreground">Informe de Rendimiento Académico Semestral</p>
                </div>
                 {isClient && settings.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={settings.logo}
                        alt="Logo de la Institución"
                        style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                    />
                 ): <div className="w-[80px] h-[80px]" /> }
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
        </header>

        <section className="space-y-6">
            <p className="prose dark:prose-invert max-w-none text-justify">
              Durante este semestre se atendieron <strong>{summary.totalStudents}</strong> estudiantes, con los siguientes resultados e indicadores clave consolidados:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
              <Card className="text-center">
                  <CardHeader><CardTitle className="text-base">Aprobación Final</CardTitle></CardHeader>
                  <CardContent>
                      <p className="text-3xl font-bold">{summary.approvedCount} <span className="text-base font-normal text-muted-foreground">de {summary.totalStudents}</span></p>
                       <p className="text-sm text-green-600 flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4"/> Aprobados</p>
                       <p className="text-sm text-red-600 flex items-center justify-center gap-1"><XCircle className="h-4 w-4"/> Reprobados: {summary.failedCount}</p>
                  </CardContent>
              </Card>
               <Card className="text-center">
                  <CardHeader><CardTitle className="text-base">Promedio General Semestral</CardTitle></CardHeader>
                  <CardContent>
                       <p className="text-3xl font-bold">{summary.groupAverage.toFixed(1)} <span className="text-base font-normal text-muted-foreground">/ 100</span></p>
                       <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><TrendingUp className="h-4 w-4"/> Calificación media del grupo</p>
                  </CardContent>
              </Card>
               <Card className="text-center">
                  <CardHeader><CardTitle className="text-base">Asistencia General</CardTitle></CardHeader>
                   <CardContent>
                       <p className="text-3xl font-bold">{summary.attendanceRate.toFixed(1)}%</p>
                       <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><BarChart className="h-4 w-4"/> Tasa de Asistencia General</p>
                  </CardContent>
              </Card>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Análisis y Observaciones Semestrales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center mb-2" data-hide-for-pdf="true">
                        <h4 className="font-semibold text-base">Análisis Narrativo</h4>
                         {/* Removed AI generation button */}
                    </div>
                    <Textarea 
                        placeholder="Análisis cualitativo del rendimiento del grupo durante el semestre..."
                        value={narrativeAnalysis}
                        onChange={(e) => setNarrativeAnalysis(e.target.value)}
                        rows={8}
                        className="w-full text-base text-justify"
                    />
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
