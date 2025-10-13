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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Loader2, BookOpenCheck, ClipboardSignature } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useData } from '@/hooks/use-data';
import { getPartialLabel } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsAppDialog } from '@/components/whatsapp-dialog';
import type { PartialData, PartialId, EvaluationCriteria } from '@/lib/placeholder-data';


type StudentGradeInfo = {
  id: string;
  name: string;
  attendance: number;
  absences: number;
  finalGrade: number;
  isRecovery: boolean;
};

const RecordsPage = () => {
  const {
    groups,
    settings,
    isLoading: isDataLoading,
    fetchPartialData,
    calculateDetailedFinalGrade,
    activeGroup,
    activeGroupId,
    setActiveGroupId,
  } = useData();

  const [recordData, setRecordData] = useState<StudentGradeInfo[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PartialId | 'semester'>('p1');


  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleGenerateRecord = async () => {
    if (!activeGroup) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Por favor, selecciona un grupo y un periodo.',
      });
      return;
    }

    setIsCalculating(true);
    setRecordData([]);

    try {
        if (selectedPeriod === 'semester') {
            const partials: PartialId[] = ['p1', 'p2', 'p3'];
            const allPartialsData = await Promise.all(
                partials.map(pId => fetchPartialData(activeGroup.id, pId))
            );

            const studentsData = activeGroup.students.map(student => {
                let totalGrade = 0;
                let partialsWithGrades = 0;
                let totalAttendance = 0;
                let totalAbsences = 0;
                let hadRecovery = false;

                allPartialsData.forEach((pData: (PartialData & { criteria: EvaluationCriteria[] }) | null) => {
                    if (pData) {
                        const { finalGrade, isRecovery } = calculateDetailedFinalGrade(student.id, pData, activeGroup.criteria);
                        totalGrade += finalGrade;
                        partialsWithGrades++;
                        if(isRecovery) hadRecovery = true;
                        
                        Object.values(pData.attendance).forEach((dailyRecord: { [studentId: string]: boolean; }) => {
                            if (Object.prototype.hasOwnProperty.call(dailyRecord, student.id)) {
                                if (dailyRecord[student.id]) totalAttendance++;
                                else totalAbsences++;
                            }
                        });
                    }
                });

                const semesterAverage = partialsWithGrades > 0 ? totalGrade / partialsWithGrades : 0;
                
                return {
                    id: student.id,
                    name: student.name,
                    attendance: totalAttendance,
                    absences: totalAbsences,
                    finalGrade: semesterAverage,
                    isRecovery: hadRecovery,
                };
            });
             setRecordData(studentsData.sort((a,b) => a.name.localeCompare(b.name)));

        } else {
             const partialData = await fetchPartialData(activeGroup.id, selectedPeriod);
            if (!partialData) {
                toast({
                variant: 'destructive',
                title: 'Sin datos',
                description: `No hay datos de calificaciones o asistencia para ${getPartialLabel(selectedPeriod)} en este grupo.`,
                });
                setIsCalculating(false);
                return;
            }

            const studentsData = activeGroup.students.map((student) => {
                const { finalGrade, isRecovery } = calculateDetailedFinalGrade(
                student.id,
                partialData,
                activeGroup.criteria
                );

                let attendance = 0;
                let absences = 0;
                for (const dailyRecord of Object.values(partialData.attendance) as { [studentId: string]: boolean }[]) {
                    if (Object.prototype.hasOwnProperty.call(dailyRecord, student.id)) {
                        if (dailyRecord[student.id]) {
                            attendance++;
                        } else {
                            absences++;
                        }
                    }
                }

                return {
                id: student.id,
                name: student.name,
                attendance,
                absences,
                finalGrade,
                isRecovery,
                };
            });
             setRecordData(studentsData.sort((a,b) => a.name.localeCompare(b.name)));
        }

     
    } catch (e) {
      console.error('Error generando el acta:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar el acta de calificaciones.',
      });
    } finally {
      setIsCalculating(false);
    }
  };
  
  const handleDownloadPdf = () => {
    const input = reportRef.current;
    if (input) {
      toast({ title: 'Generando PDF...', description: 'Esto puede tardar un momento.' });
      
      const elementsToHide = input.querySelectorAll('[data-hide-for-pdf="true"]');
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
      
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
        pdf.save(`Acta_Calificaciones_${activeGroup?.subject.replace(/\s+/g, '_')}_${selectedPeriod}.pdf`);
      }).finally(() => {
        elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
      });
    }
  };
  
  const getPeriodo = () => {
    if (!activeGroup) return '';
    // This is a simplification. A real implementation would need to find the min/max dates
    // from attendance records for the selected partial.
    return 'Marzo - Julio 2024';
  }
  
  const handleGroupChange = (groupId: string) => {
    setActiveGroupId(groupId);
    setRecordData([]); // Clear previous group's data
  }
  
  const getPeriodLabel = () => {
      if (selectedPeriod === 'semester') return 'Semestral';
      return getPartialLabel(selectedPeriod);
  }

  return (
     <>
      <WhatsAppDialog studentName={`Acta de ${activeGroup?.subject}`} open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen} />
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Actas de Calificaciones</h1>
            <p className="text-muted-foreground">
              Genera y descarga el acta de calificaciones para un grupo y periodo específicos.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selección de Grupo y Periodo</CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 pt-4">
              <div className="space-y-2 flex-1">
                <label htmlFor="group-select" className="text-sm font-medium">Grupo</label>
                <Select onValueChange={handleGroupChange} value={activeGroupId || ''}>
                  <SelectTrigger id="group-select">
                    <SelectValue placeholder="Selecciona un grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2 flex-1">
                <label htmlFor="partial-select" className="text-sm font-medium">Parcial o Periodo</label>
                 <Select onValueChange={(v) => setSelectedPeriod(v as any)} value={selectedPeriod}>
                  <SelectTrigger id="partial-select">
                    <SelectValue placeholder="Selecciona un periodo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p1">Primer Parcial</SelectItem>
                    <SelectItem value="p2">Segundo Parcial</SelectItem>
                    <SelectItem value="p3">Tercer Parcial</SelectItem>
                    <SelectItem value="semester">Semestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerateRecord} disabled={isCalculating || !activeGroup}>
                 {isCalculating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Generar Acta
              </Button>
            </div>
          </CardHeader>

          {isCalculating && (
             <CardContent className="text-center p-12">
                 <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                 <p className="mt-2 text-muted-foreground">Generando datos...</p>
             </CardContent>
          )}

          {recordData.length > 0 && !isCalculating && (
            <>
            <div ref={reportRef} className="p-4 sm:p-6 md:p-8">
              <header className="border-b pb-6 mb-6">
                <div className="relative flex justify-center text-center mb-4">
                    <div className="flex-grow">
                        <h1 className="text-2xl font-bold">{settings.institutionName}</h1>
                        <p className="text-lg text-muted-foreground">Acta de Calificaciones</p>
                    </div>
                    {settings.logo && (
                        <div className="absolute right-0 top-0">
                            <Image
                                src={settings.logo}
                                alt="Logo de la Institución"
                                width={80}
                                height={80}
                                className="object-contain"
                            />
                        </div>
                    )}
                </div>
                <div className="pt-4 grid grid-cols-2 gap-x-4 text-sm">
                  <div><span className="font-semibold text-foreground">Docente: </span> <span className="text-muted-foreground">{activeGroup?.facilitator}</span></div>
                  <div><span className="font-semibold text-foreground">Semestre: </span> <span className="text-muted-foreground">{activeGroup?.semester}</span></div>
                  <div><span className="font-semibold text-foreground">Grupo: </span> <span className="text-muted-foreground">{activeGroup?.groupName}</span></div>
                  <div><span className="font-semibold text-foreground">Periodo Evaluado: </span> <span className="text-muted-foreground">{getPeriodLabel()}</span></div>
                  <div><span className="font-semibold text-foreground">Asignatura: </span> <span className="text-muted-foreground">{activeGroup?.subject}</span></div>
                  <div><span className="font-semibold text-foreground">Ciclo Escolar: </span> <span className="text-muted-foreground">{getPeriodo()}</span></div>
                </div>
              </header>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No.</TableHead>
                    <TableHead>Nombre del Estudiante</TableHead>
                    <TableHead className="text-center">Asistencias</TableHead>
                    <TableHead className="text-center">Faltas</TableHead>
                    <TableHead className="text-center">Calificación Final (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordData.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-center">{student.attendance}</TableCell>
                      <TableCell className="text-center">{student.absences}</TableCell>
                      <TableCell className="text-center font-bold">{student.finalGrade.toFixed(1)} {student.isRecovery && '(R)'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
               <footer className="mt-16 pt-4 text-center text-sm">
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
                    <p className="font-semibold mt-2">{activeGroup?.facilitator || 'Docente'}</p>
                </footer>
            </div>
             <CardFooter className="justify-end gap-2 border-t pt-4" data-hide-for-pdf="true">
                 <Button variant="secondary" onClick={() => setIsWhatsAppOpen(true)}>
                     Enviar por WhatsApp
                 </Button>
                <Button onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4"/>
                    Descargar PDF
                </Button>
              </CardFooter>
            </>
          )}

          {!activeGroup && !isCalculating && (
            <CardContent className="text-center p-12">
                 <ClipboardSignature className="h-12 w-12 mx-auto text-muted-foreground" />
                 <h3 className="mt-4 text-lg font-semibold">Selecciona un grupo</h3>
                 <p className="mt-1 text-muted-foreground">Para empezar, elige un grupo y un periodo para generar el acta.</p>
            </CardContent>
          )}
          
          {recordData.length === 0 && activeGroup && !isCalculating && (
            <CardContent className="text-center p-12">
                 <BookOpenCheck className="h-12 w-12 mx-auto text-muted-foreground" />
                 <h3 className="mt-4 text-lg font-semibold">Genera un acta</h3>
                 <p className="mt-1 text-muted-foreground">Haz clic en "Generar Acta" para ver los resultados.</p>
            </CardContent>
          )}

        </Card>
      </div>
    </>
  );
};

export default RecordsPage;
