'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
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
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useData } from '@/hooks/use-data';

export default function AttendancePage() {
  const { activeGroup, partialData, setAttendance, takeAttendanceForDate, justifications } = useData();
  const { attendance } = partialData;

  const justifiedAttendanceMap = useMemo(() => {
    const justified = new Set<string>();
    justifications.forEach((j) => {
      justified.add(`${j.studentId}__${j.date}`);
    });
    return justified;
  }, [justifications]);

  const studentsToDisplay = useMemo(() => {
    return activeGroup ? [...activeGroup.students].sort((a,b) => a.name.localeCompare(b.name)) : [];
  }, [activeGroup]);

  const attendanceDates = useMemo(() => {
    return Object.keys(attendance).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
  }, [attendance]);


  const handleRegisterToday = () => {
    if (!activeGroup) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    takeAttendanceForDate(activeGroup.id, today);
  };
  
  const handleAttendanceChange = (studentId: string, date: string, isPresent: boolean) => {
    if (!activeGroup) return;

    const isJustified = justifiedAttendanceMap.has(`${studentId}__${date}`);
    if (isJustified) {
      return;
    }

    setAttendance(prev => {
      const newAttendance = { ...prev };
      if (!newAttendance[date]) {
        newAttendance[date] = {};
      }
      newAttendance[date][studentId] = isPresent;
      return newAttendance;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
             <Button asChild variant="outline" size="icon">
              <Link href={activeGroup ? `/groups/${activeGroup.id}` : '/groups'}>
                <ArrowLeft />
                <span className="sr-only">Regresar</span>
              </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold">Registro de Asistencia</h1>
                <p className="text-muted-foreground">
                    {activeGroup 
                        ? `Grupo: ${activeGroup.subject}`
                        : 'Marca la asistencia de los estudiantes.'
                    }
                </p>
            </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-600" />
            Inasistencia justificada (bloqueada)
          </div>
          {activeGroup && <Button onClick={handleRegisterToday}>Registrar Asistencia de Hoy</Button>}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] sticky left-0 bg-card z-10">Estudiante</TableHead>
                  {attendanceDates.map(date => (
                    <TableHead key={date} className="text-center">
                      {format(parseISO(date), 'dd MMM', { locale: es })}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsToDisplay.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 flex items-center gap-3">
                       <Image
                        src={student.photo}
                        alt={student.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      {student.name}
                    </TableCell>
                    {attendanceDates.map(date => (
                      <TableCell key={`${student.id}-${date}`} className="text-center">
                        {(() => {
                          const isJustified = justifiedAttendanceMap.has(`${student.id}__${date}`);
                          const isChecked = isJustified || !!attendance[date]?.[student.id];
                          return (
                        <Checkbox 
                           checked={isChecked}
                           disabled={isJustified}
                           className={isJustified ? 'border-blue-500 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 opacity-100' : ''}
                           onCheckedChange={(checked) => handleAttendanceChange(student.id, date, !!checked)}
                        />
                          );
                        })()}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                 {studentsToDisplay.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={attendanceDates.length + 1} className="text-center h-24">
                            No hay estudiantes para mostrar. Por favor, selecciona un grupo primero.
                        </TableCell>
                    </TableRow>
                )}
                 {attendanceDates.length === 0 && studentsToDisplay.length > 0 && (
                    <TableRow>
                        <TableCell colSpan={1} className="text-center h-24">
                           Haz clic en "Registrar Asistencia de Hoy" para empezar.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
