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
import { ArrowLeft, Star, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input'; // For grade
import { Textarea } from '@/components/ui/textarea'; // For reason (maybe too big for table?) Or Input
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';
import { useMemo, useCallback } from 'react';
import { getPartialLabel } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { Student, EvaluationCriteria, PartialData } from '@/lib/placeholder-data';

export default function DirectAssignmentPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { 
    activeGroup,
    activePartialId,
    partialData,
    calculateDetailedFinalGrade, 
    setMeritGrades // Changed from setRecoveryGrades
  } = useData();

  const { toast } = useToast();
  const { meritGrades = {} } = partialData;
  const { criteria = [] } = activeGroup || {};

  const studentsInGroup = useMemo(() => {
      if (!activeGroup || !activeGroup.students) return [];
      return [...activeGroup.students].sort((a,b) => a.name.localeCompare(b.name));
  }, [activeGroup]);
  
  const calculateOriginalGrade = useCallback((studentId: string, pData: PartialData, criteria: EvaluationCriteria[]) => {
      // Create version without overrides to see the "real" grade
      const originalPData = { 
          ...pData, 
          recoveryGrades: { ...pData.recoveryGrades, [studentId]: { grade: 0, applied: false } },
          meritGrades: { ...pData.meritGrades, [studentId]: { grade: 0, applied: false } }
      };
      return calculateDetailedFinalGrade(studentId, originalPData, criteria).finalGrade;
  }, [calculateDetailedFinalGrade]);

  const studentsList = useMemo(() => {
    if (!criteria || criteria.length === 0) return [];
    return studentsInGroup.map(student => ({
        student,
        originalGrade: calculateOriginalGrade(student.id, partialData, criteria)
    }));
  }, [studentsInGroup, partialData, criteria, calculateOriginalGrade]);


  const handleGradeChange = (studentId: string, value: string) => {
    const grade = value === '' ? null : parseFloat(value);
    if (grade !== null && (isNaN(grade) || grade < 0 || grade > 100)) {
      toast({ variant: 'destructive', title: 'Calificación inválida', description: 'La calificación debe ser un número entre 0 y 100.' });
      return;
    }
    setMeritGrades((prev: any) => {
        const safePrev = prev || {};
        const currentMetadata = safePrev[studentId] || { applied: false, reason: '' };
        return {
            ...safePrev,
            [studentId]: { ...currentMetadata, grade: grade }
        }
    });
  };

  const handleReasonChange = (studentId: string, value: string) => {
    setMeritGrades((prev: any) => {
        const safePrev = prev || {};
        const currentMetadata = safePrev[studentId] || { applied: false, grade: null };
        return {
            ...safePrev,
            [studentId]: { ...currentMetadata, reason: value }
        }
    });
  };

  const handleApplyChange = (studentId: string, checked: boolean) => {
    setMeritGrades((prev: any) => {
        const safePrev = prev || {};
        const currentMetadata = safePrev[studentId] || { grade: 0, reason: '' };
        return {
            ...safePrev,
            [studentId]: { ...currentMetadata, applied: checked }
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
            <h1 className="text-3xl font-bold">Asignación Directa de Calificación</h1>
            <p className="text-muted-foreground">
                Grupo &quot;{activeGroup.subject}&quot; - {getPartialLabel(activePartialId)}.
            </p>
            </div>
         </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado General de Estudiantes</CardTitle>
          <CardDescription>
            Asigne una calificación final directa por mérito académico o situaciones especiales. Esta acción sobreescribirá el promedio calculado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Estudiante</TableHead>
                <TableHead>Promedio Actual</TableHead>
                <TableHead>Nueva Calificación</TableHead>
                <TableHead className="w-[300px]">Motivo / Justificación</TableHead>
                <TableHead>Aplicar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {studentsList.map(({ student, originalGrade }) => (
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
                      <Badge variant={originalGrade < 60 ? "destructive" : "secondary"}>
                          {originalGrade.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="w-24"
                        placeholder="0-100"
                        value={meritGrades[student.id]?.grade ?? ''}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="Ej. Mérito académico..."
                        value={meritGrades[student.id]?.reason ?? ''}
                        onChange={(e) => handleReasonChange(student.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={meritGrades[student.id]?.applied ?? false}
                        onCheckedChange={(checked) => handleApplyChange(student.id, !!checked)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-yellow-800 flex gap-2 items-start">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <p>
            <strong>Nota Importante:</strong> La asignación directa tiene prioridad sobre el cálculo automático y sobre la calificación de recuperación.
            Utilice esta función con responsabilidad para casos de mérito o ajustes administrativos especiales.
        </p>
      </div>
    </div>
  );
}
