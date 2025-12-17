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
import { Button } from '@/components/ui/button';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Save, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';
import { useMemo, useState } from 'react';
import { getPartialLabel } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Student, EvaluationCriteria, PartialData } from '@/lib/placeholder-data';

type FailedStudent = {
  student: Student;
  originalGrade: number;
};

export default function RecoveryPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { 
    activeGroup,
    activePartialId,
    partialData,
    calculateDetailedFinalGrade, // This will be used for the original grade
    setRecoveryGrades
  } = useData();

  const { toast } = useToast();
  const { recoveryGrades = {} } = partialData;
  const { criteria = [] } = activeGroup || {};

  const studentsInGroup = useMemo(() => {
      if (!activeGroup || !activeGroup.students) return [];
      return [...activeGroup.students].sort((a,b) => a.name.localeCompare(b.name));
  }, [activeGroup]);
  
  const calculateOriginalGrade = (studentId: string, pData: PartialData, criteria: EvaluationCriteria[]) => {
      // Temporarily create a version of partial data without recovery info to get original grade
      const originalPData = { ...pData, recoveryGrades: { ...pData.recoveryGrades, [studentId]: { grade: 0, applied: false } } };
      return calculateDetailedFinalGrade(studentId, originalPData, criteria).finalGrade;
  };

  const failedStudents = useMemo(() => {
    if (!criteria || criteria.length === 0) return [];
    return studentsInGroup
      .map(student => ({
        student,
        originalGrade: calculateOriginalGrade(student.id, partialData, criteria)
      }))
      .filter(s => s.originalGrade < 60);
  }, [studentsInGroup, partialData, criteria, calculateOriginalGrade]);


  const handleGradeChange = (studentId: string, value: string) => {
    const grade = value === '' ? null : parseFloat(value);
    if (grade !== null && (isNaN(grade) || grade < 0 || grade > 100)) {
      toast({ variant: 'destructive', title: 'Calificación inválida', description: 'La calificación debe ser un número entre 0 y 100.' });
      return;
    }
    setRecoveryGrades(prev => {
        const safePrev = prev || {};
        return {
            ...safePrev,
            [studentId]: { ...(safePrev[studentId] || { applied: false }), grade: grade }
        }
    });
  };

  const handleApplyChange = (studentId: string, checked: boolean) => {
    setRecoveryGrades(prev => {
        const safePrev = prev || {};
        return {
            ...safePrev,
            [studentId]: { ...(safePrev[studentId] || { grade: 0 }), applied: checked }
        }
    });
  };

  if (!activeGroup) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
            <Link href={`/grades/${groupId}/grades`}>
                <ArrowLeft />
                <span className="sr-only">Volver a Calificaciones</span>
            </Link>
            </Button>
            <div>
            <h1 className="text-3xl font-bold">Calificación de Recuperación</h1>
            <p className="text-muted-foreground">
                Grupo &quot;{activeGroup.subject}&quot; - {getPartialLabel(activePartialId)}.
            </p>
            </div>
         </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estudiantes en Recuperación</CardTitle>
          <CardDescription>
            Lista de estudiantes con calificación reprobatoria en este parcial. Ingresa la nueva calificación y marca la casilla para aplicarla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Estudiante</TableHead>
                <TableHead>Calificación Original</TableHead>
                <TableHead>Calificación Recuperación</TableHead>
                <TableHead>Aplicar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failedStudents.length > 0 ? (
                failedStudents.map(({ student, originalGrade }) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Image 
                        src={student.photo}
                        alt={student.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      {student.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{originalGrade.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="w-28"
                        placeholder="0-100"
                        value={recoveryGrades[student.id]?.grade ?? ''}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={recoveryGrades[student.id]?.applied ?? false}
                        onCheckedChange={(checked) => handleApplyChange(student.id, !!checked)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                        <p className="font-semibold">¡Felicidades!</p>
                        <p className="text-muted-foreground">No hay estudiantes reprobados en este parcial.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
