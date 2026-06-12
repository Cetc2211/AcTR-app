'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, Loader2, User, Mail, Phone, Check, X, AlertTriangle, ListChecks, MessageSquare, BadgeInfo } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/hooks/use-data';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useParams, notFound } from 'next/navigation';
import type { Student, PartialId, StudentObservation, EvaluationCriteria, CalculatedRisk, StudentStats, CriteriaDetail } from '@/lib/placeholder-data';


type StudentReportData = {
    id: string;
    name: string;
    photo: string;
    email?: string;
    tutorName?: string;
    tutorPhone?: string;
    riskLevel: 'high' | 'medium';
    riskReason: string;
    finalGrade: number;
    attendance: {
        p: number;
        a: number;
        total: number;
    };
    criteriaDetails: { name: string; earned: number; weight: number; }[];
    observations: StudentObservation[];
};


const AtRiskStudentCard = ({ studentData }: { studentData: StudentReportData }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const handleDownloadPdf = () => {
        const input = reportRef.current;
        if (input) {
            toast({ title: 'Generando PDF...', description: 'Esto puede tardar un momento.' });
            
            // Timeout to prevent freezing
            const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout generador PDF')), 15000)
            );

            Promise.race([
                html2canvas(input, { scale: 1.5, useCORS: true }),
                timeoutPromise
            ])
            .then((canvas: any) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const ratio = canvas.width / canvas.height;
                let imgWidth = pdfWidth - 20;
                let imgHeight = imgWidth / ratio;
                if (imgHeight > pdfHeight - 20) {
                    imgHeight = pdfHeight - 20;
                    imgWidth = imgHeight * ratio;
                }
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                pdf.save(`informe_riesgo_${studentData.name.replace(/\s+/g, '_')}.pdf`);
            })
            .catch(err => {
                console.error("PDF Error:", err);
                toast({ variant: "destructive", title: "Error", description: "No se pudo generar el PDF." });
            });
        }
    };
    
    const attendanceRate = studentData.attendance.total > 0 ? (studentData.attendance.p / studentData.attendance.total) * 100 : 100;

    return (
        <Card className="overflow-hidden">
            <div ref={reportRef} className="bg-background">
                <CardHeader className="bg-muted/30">
                     <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                        <Image
                            src={studentData.photo}
                            alt={studentData.name}
                            width={100}
                            height={100}
                            className="rounded-full border-4"
                            style={{borderColor: studentData.riskLevel === 'high' ? 'hsl(var(--destructive))' : 'hsl(var(--chart-4))'}}
                        />
                        <div className="pt-2 flex-grow">
                            <CardTitle className="text-2xl">{studentData.name}</CardTitle>
                            <div className="flex flex-col items-start mt-1 space-y-1">
                                 <CardDescription className="flex items-center gap-2">
                                    {studentData.riskLevel === 'high' 
                                        ? <Badge variant="destructive">Riesgo Alto</Badge> 
                                        : <Badge className="bg-amber-500">Riesgo Medio</Badge>
                                    }
                                </CardDescription>
                                <span className="text-xs text-muted-foreground">{studentData.riskReason}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                <p className="flex items-center gap-2"><Mail className="h-4 w-4"/> {studentData.email || 'No registrado'}</p>
                                <p className="flex items-center gap-2"><User className="h-4 w-4"/> Tutor: {studentData.tutorName || 'No registrado'}</p>
                                <p className="flex items-center gap-2"><Phone className="h-4 w-4"/> Tel. Tutor: {studentData.tutorPhone || 'No registrado'}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       <div className="space-y-4">
                           <h4 className="font-semibold flex items-center gap-2"><ListChecks /> Desglose de Calificación</h4>
                           <div className="p-3 border rounded-md text-sm space-y-2">
                               {studentData.criteriaDetails.map(c => (
                                   <div key={c.name} className="flex justify-between items-center">
                                       <span>{c.name} <span className="text-xs text-muted-foreground">({c.weight}%)</span></span>
                                       <Badge variant="secondary">{c.earned.toFixed(1)}%</Badge>
                                   </div>
                               ))}
                                <Separator />
                                <div className="flex justify-between font-bold pt-1">
                                    <span>Calificación Final:</span>
                                    <span>{studentData.finalGrade.toFixed(1)}%</span>
                                </div>
                           </div>
                       </div>
                       <div className="space-y-4">
                           <h4 className="font-semibold flex items-center gap-2"><AlertTriangle /> Asistencia</h4>
                            <div className="p-3 border rounded-md text-sm space-y-2">
                                <div className="flex justify-between"><span>Presente:</span><span className="font-bold flex items-center gap-1 text-green-600"><Check/>{studentData.attendance.p}</span></div>
                                <div className="flex justify-between"><span>Ausente:</span><span className="font-bold flex items-center gap-1 text-red-600"><X/>{studentData.attendance.a}</span></div>
                                <Separator />
                                <div className="flex justify-between font-bold pt-1">
                                    <span>Tasa de Asistencia:</span>
                                    <span>{attendanceRate.toFixed(1)}%</span>
                                </div>
                            </div>
                       </div>
                    </div>
                     <div className="mt-6 space-y-4">
                        <h4 className="font-semibold flex items-center gap-2"><MessageSquare /> Observaciones en Bitácora</h4>
                         {studentData.observations.length > 0 ? (
                            <div className="p-3 border rounded-md text-sm space-y-2">
                                {studentData.observations.map(obs => (
                                    <div key={obs.id}>
                                        <p><span className="font-semibold">{obs.type}:</span> {obs.details}</p>
                                    </div>
                                ))}
                            </div>
                         ) : (
                            <div className="p-3 border rounded-md text-sm text-center text-muted-foreground">
                                No hay observaciones registradas.
                            </div>
                         )}
                     </div>
                </CardContent>
            </div>

            <CardFooter className="bg-muted/50 p-3 flex justify-end gap-2">
                <Button variant="outline" onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4"/> PDF
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function AtRiskReportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { 
      groups,
      calculateDetailedFinalGrade,
      getStudentRiskLevel,
      allObservations,
      isLoading: isDataLoading,
      fetchPartialData,
  } = useData();
  const [reportData, setReportData] = useState<StudentReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const group = useMemo(() => groups.find(g => g.id === groupId), [groups, groupId]);

  useEffect(() => {
    const generateReport = async () => {
        if (group) {
            setIsLoading(true);
            const partials: PartialId[] = ['p1', 'p2', 'p3'];
            const atRiskStudentMap = new Map<string, StudentReportData>();
            
            for (const partialId of partials) {
                const partialData = await fetchPartialData(group.id, partialId);
                if (partialData && (group.criteria.length > 0 || Object.keys(partialData.recoveryGrades || {}).length > 0)) {
                    for (const student of group.students) {
                        const { finalGrade, criteriaDetails } = calculateDetailedFinalGrade(student.id, partialData, group.criteria);
                        const riskLevel = getStudentRiskLevel(finalGrade, partialData.attendance, student.id);
                        
                        if (riskLevel.level === 'high' || riskLevel.level === 'medium') {
                            const existingEntry = atRiskStudentMap.get(student.id);
                            if (!existingEntry || riskLevel.level === 'high' || (riskLevel.level === 'medium' && existingEntry.riskLevel !== 'high')) {
                                const attendanceStats = { p: 0, a: 0, total: 0 };
                                Object.keys(partialData.attendance).forEach(date => {
                                    if (partialData.attendance[date]?.[student.id] !== undefined) {
                                        attendanceStats.total++;
                                        if (partialData.attendance[date][student.id]) attendanceStats.p++; else attendanceStats.a++;
                                    }
                                });
                                
                                atRiskStudentMap.set(student.id, {
                                  id: student.id,
                                  name: student.name,
                                  photo: student.photo,
                                  email: student.email,
                                  tutorName: student.tutorName,
                                  tutorPhone: student.tutorPhone,
                                  riskLevel: riskLevel.level,
                                  riskReason: riskLevel.reason,
                                  finalGrade: finalGrade,
                                  attendance: attendanceStats,
                                  criteriaDetails,
                                  observations: (allObservations[student.id] || []).filter(obs => obs.partialId === partialId),
                                });
                            }
                        }
                    }
                }
            }
            
            // Sort by Risk Level (High > Medium) -> Requirement 3
            const sortedData = Array.from(atRiskStudentMap.values()).sort((a, b) => {
                const riskScore = (r: 'high' | 'medium') => r === 'high' ? 2 : 1;
                return riskScore(b.riskLevel) - riskScore(a.riskLevel);
            });
            
            setReportData(sortedData);
        }
        setIsLoading(false);
    };
    
    if (group && !isDataLoading) {
      generateReport();
    } else if (!group) {
        setIsLoading(false);
    }
  }, [group, calculateDetailedFinalGrade, getStudentRiskLevel, allObservations, fetchPartialData, isDataLoading]);


  if (isLoading || isDataLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Cargando informe...</span></div>;
  }
  
  if (!group) {
      return notFound();
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href={`/reports`}>
                <ArrowLeft />
                <span className="sr-only">Volver a Informes</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Informe de Estudiantes en Riesgo</h1>
              <p className="text-muted-foreground">
                  Análisis detallado para el grupo &quot;{group.subject}&quot;.
              </p>
            </div>
         </div>
      </div>
      
       {reportData.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {reportData.map(student => (
                 <AccordionItem value={student.id} key={student.id}>
                    <AccordionTrigger className="p-4 bg-card rounded-lg hover:bg-muted/50 data-[state=open]:rounded-b-none">
                        <div className="flex items-center gap-4">
                            <Image src={student.photo} alt={student.name} width={40} height={40} className="rounded-full" />
                            <div className="text-left">
                                <p className="font-bold">{student.name}</p>
                                <p className="text-sm text-muted-foreground">{student.riskReason}</p>
                            </div>
                        </div>
                         {student.riskLevel === 'high' 
                            ? <Badge variant="destructive">Alto</Badge> 
                            : <Badge className="bg-amber-500">Medio</Badge>
                        }
                    </AccordionTrigger>
                    <AccordionContent className="border-x border-b rounded-b-lg p-0">
                       <AtRiskStudentCard studentData={student}/>
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        ) : (
            <Card>
                <CardContent className="p-12 text-center">
                     <Check className="h-16 w-16 mx-auto text-green-500 bg-green-100 rounded-full p-2" />
                     <h2 className="text-2xl font-bold mt-4">¡Todo en orden!</h2>
                     <p className="text-muted-foreground mt-2">No se han identificado estudiantes en riesgo en este grupo.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
