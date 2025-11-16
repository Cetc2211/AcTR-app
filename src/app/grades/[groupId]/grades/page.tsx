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
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useData } from '@/hooks/use-data';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { EvaluationCriteria } from '@/lib/placeholder-data';
import { getPartialLabel } from '@/lib/utils';

const criterionColors = [
  'bg-partial-1-bg',
  'bg-partial-2-bg',
  'bg-partial-3-bg',
  'bg-chart-4/10',
  'bg-chart-5/10',
];

export default function GroupGradesPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { 
    activeGroup,
    activePartialId,
    partialData,
    setGrades,
    calculateDetailedFinalGrade,
  } = useData();

  const { criteria = [] } = activeGroup || {};
  const { grades, participations, activities, activityRecords } = partialData;

  const { toast } = useToast();

  const handleSaveGrades = () => {
    toast({
      title: 'Calificaciones Guardadas',
      description: 'Las calificaciones han sido guardadas exitosamente.',
    });
  };

  const handleGradeChange = (studentId: string, criterionId: string, value: string) => {
    const numericValue = value === '' ? null : parseFloat(value);
    
     if (value !== '' && (isNaN(numericValue!) || numericValue! < 0 )) {
        toast({
            variant: "destructive",
            title: "Valor inválido",
            description: "El número de entregados debe ser positivo."
        })
        return;
    }
    
    setGrades(prevGrades => {
      const newGrades = JSON.parse(JSON.stringify(prevGrades));
      if (!newGrades[studentId]) {
        newGrades[studentId] = {};
      }
      newGrades[studentId][criterionId] = { delivered: numericValue };
      return newGrades;
    });
  };
  
  const finalGrades = useMemo(() => {
    const calculatedGrades: {[studentId: string]: { grade: number, isRecovery: boolean }} = {};
    if (activeGroup) {
      for (const student of activeGroup.students) {
        const { finalGrade, isRecovery } = calculateDetailedFinalGrade(
          student.id, partialData, activeGroup.criteria
        );
        calculatedGrades[student.id] = { grade: finalGrade, isRecovery };
      }
    }
    return calculatedGrades;
  }, [activeGroup, calculateDetailedFinalGrade, partialData]);

  const studentsInGroup = useMemo(() => {
      if (!activeGroup || !activeGroup.students) return [];
      return [...activeGroup.students].sort((a,b) => a.name.localeCompare(b.name));
  }, [activeGroup]);

  if (!activeGroup) {
    return notFound();
  }

  const getPerformanceDetail = (studentId: string, criterionName: string) => {
    if (criterionName === 'Actividades' || criterionName === 'Portafolio') {
        const total = activities.length;
        if (studentId === 'none') return `${total} esp.`;
        const delivered = Object.values(activityRecords[studentId] || {}).filter(Boolean).length;
        return `${delivered} de ${total}`;
    }
    if (criterionName === 'Participación') {
        const total = Object.keys(participations).length;
        if (studentId === 'none') return `${total} clases`;
        const participated = (Object.values(participations) as { [key: string]: boolean; }[]).filter(day => day[studentId]).length;
        return `${participated} de ${total}`;
    }
    return "";
  }

  const getEarnedPercentage = (studentId: string, criterion: EvaluationCriteria) => {
    let performanceRatio = 0;
    
    if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
        const totalActivities = activities.length;
        if(totalActivities > 0) {
            const deliveredActivities = Object.values(activityRecords[studentId] || {}).filter(Boolean).length;
            performanceRatio = deliveredActivities / totalActivities;
        }
    } else if (criterion.name === 'Participación') {
        const totalParticipations = Object.keys(participations).length;
        if(totalParticipations > 0) {
            const studentParticipations = (Object.values(participations) as {[key: string]: boolean}[]).filter(p => p[studentId]).length;
            performanceRatio = studentParticipations / totalParticipations;
        }
    } else {
        const delivered = grades[studentId]?.[criterion.id]?.delivered ?? 0;
        const expected = criterion.expectedValue;
        if (expected > 0) {
            performanceRatio = (delivered ?? 0) / expected;
        }
    }
    return performanceRatio * criterion.weight;
  };
  
  const getExpectedValueLabel = (criterion: EvaluationCriteria) => {
    if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
      return `${activities.length} esp.`;
    }
    if (criterion.name === 'Participación') {
      return `${Object.keys(participations).length} clases`;
    }
    return `${criterion.expectedValue} esp.`;
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
            <Link href={`/groups/${groupId}`}>
                <ArrowLeft />
                <span className="sr-only">Volver al Grupo</span>
            </Link>
            </Button>
            <div>
            <h1 className="text-3xl font-bold">Registrar Calificaciones</h1>
            <p className="text-muted-foreground">
                Grupo &quot;{activeGroup.subject}&quot; - {getPartialLabel(activePartialId)}.
            </p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
                <Link href={`/grades/${groupId}/recovery`}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Recuperación
                </Link>
            </Button>
            <Button onClick={handleSaveGrades}>
                <Save className="mr-2 h-4 w-4"/>
                Guardar Calificaciones
            </Button>
         </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px] sticky left-0 bg-card z-10">Estudiante</TableHead>
                  {criteria.map((c, index) => (
                    <TableHead key={c.id} className={cn("text-center min-w-[250px] align-top", criterionColors[index % criterionColors.length])}>
                      <div className='font-bold'>{c.name}</div>
                      <div className="font-normal text-muted-foreground">
                        ({c.weight}%, {getExpectedValueLabel(c)})
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold sticky right-0 bg-card z-10">
                      Calificación Final
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsInGroup.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={criteria.length + 2} className="text-center h-24">
                          No hay estudiantes en este grupo.
                      </TableCell>
                  </TableRow>
                )}
                {studentsInGroup.length > 0 && criteria.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={2} className="text-center h-24">
                          No has definido criterios de evaluación para este parcial. <Link href={`/grades/${groupId}/criteria`} className="text-primary underline">Defínelos aquí.</Link>
                      </TableCell>
                  </TableRow>
                )}
                {studentsInGroup.length > 0 && criteria.length > 0 && studentsInGroup.map(student => {
                  
                  return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 flex items-center gap-2">
                      <Image 
                        src={student.photo}
                        alt={student.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      {student.name}
                    </TableCell>
                    {criteria.map((criterion, index) => {
                      const isAutomated = criterion.name === 'Actividades' || criterion.name === 'Participación' || criterion.name === 'Portafolio';
                      const earnedPercentage = getEarnedPercentage(student.id, criterion);

                      return (
                      <TableCell key={criterion.id} className={cn("text-center", criterionColors[index % criterionColors.length])}>
                        {isAutomated ? (
                          <div className="flex flex-col items-center justify-center p-1">
                              <Label className='text-xs'>
                                {criterion.name === 'Participación' ? 'Participaciones' : 'Entregas'}
                              </Label>
                              <span className="font-bold">
                                {getPerformanceDetail(student.id, criterion.name)}
                              </span>
                              <Label className='text-xs mt-2'>Porcentaje Ganado</Label>
                               <span className="font-bold text-lg">
                                  {earnedPercentage.toFixed(0)}%
                              </span>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center justify-center">
                            <div className='flex-1'>
                                <Label htmlFor={`delivered-${student.id}-${criterion.id}`} className='text-xs'>Entregado/Logrado</Label>
                                <Input 
                                    id={`delivered-${student.id}-${criterion.id}`}
                                    type="number"
                                    className="h-8 text-center"
                                    placeholder="Ent."
                                    min={0}
                                    value={grades[student.id]?.[criterion.id]?.delivered ?? ''}
                                    onChange={e => handleGradeChange(student.id, criterion.id, e.target.value)}
                                />
                            </div>
                            <div className='flex-1'>
                                <Label className='text-xs'>Porcentaje Ganado</Label>
                                <div className="h-8 flex items-center justify-center font-bold text-lg">
                                  {earnedPercentage.toFixed(0)}%
                                </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      )
                    })}
                    <TableCell className="text-center font-bold text-lg sticky right-0 bg-card z-10">
                      <div className="flex items-center justify-center gap-2">
                        <span>{`${(finalGrades[student.id]?.grade || 0).toFixed(0)}%`}</span>
                        {finalGrades[student.id]?.isRecovery && <span className="ml-1 font-bold text-red-500">R</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
