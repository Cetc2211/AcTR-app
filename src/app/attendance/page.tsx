
'use client';

import { useState, useMemo } from 'react';
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
import { ArrowLeft, Calendar as CalendarIcon, Trash2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';


export default function AttendancePage() {
  const { activeGroup, partialData, setAttendance, takeAttendanceForDate, deleteAttendanceDate, settings } = useData();
  const { attendance } = partialData;
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);
  
  const studentsToDisplay = useMemo(() => {
    return activeGroup ? [...activeGroup.students].sort((a, b) => a.name.localeCompare(b.name)) : [];
  }, [activeGroup]);
  
  const attendanceDates = useMemo(() => {
    if (!attendance) return [];
    return Object.keys(attendance).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());
  }, [attendance]);

  const handleRegisterDate = async () => {
    if (!activeGroup || !date) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Por favor, selecciona una fecha y un grupo.',
        });
        return;
    }
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    await takeAttendanceForDate(activeGroup.id, formattedDate);
    
    toast({
        title: 'Asistencia registrada',
        description: `Se ha registrado la asistencia para el día ${formattedDate}.`,
    });
  };

  const handleAttendanceChange = (studentId: string, date: string, isPresent: boolean) => {
    setAttendance(prev => {
      const newAttendance = { ...prev };
      if (!newAttendance[date]) {
          newAttendance[date] = {};
      }
      newAttendance[date][studentId] = isPresent;
      return newAttendance;
    });
  };

  const handleDeleteDate = () => {
    if (dateToDelete) {
        deleteAttendanceDate(dateToDelete);
        toast({
            title: 'Fecha eliminada',
            description: `Se ha eliminado el registro de asistencia del ${format(parseISO(dateToDelete), 'PPP', {locale: es})}.`,
        });
        setDateToDelete(null);
    }
  };

  const handleReportAbsences = () => {
    if (!activeGroup || !date) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selecciona un grupo y una fecha.' });
        return;
    }
    
    if (!settings.whatsappContactNumber) {
        toast({
            variant: 'destructive',
            title: 'Falta Configuración',
            description: 'Por favor, ve a Ajustes y define el "Teléfono de Contacto para Inasistencias".',
        });
        return;
    }

    const formattedDate = format(date, 'yyyy-MM-dd');
    const dailyRecord = partialData.attendance[formattedDate];
    
    if (!dailyRecord) {
        toast({ variant: 'destructive', title: 'Sin Registros', description: 'No hay registros de asistencia para la fecha seleccionada.' });
        return;
    }

    const absentStudents = activeGroup.students.filter(student => dailyRecord[student.id] === false);

    if (absentStudents.length === 0) {
        toast({ title: '¡Todo en orden!', description: 'No hay inasistencias para reportar en esta fecha.' });
        return;
    }

    const subjectLine = `Asignatura: ${activeGroup.subject}`;
    const semesterLine = activeGroup.semester ? `Semestre: ${activeGroup.semester}` : null;
    const groupLine = activeGroup.groupName ? `Grupo: ${activeGroup.groupName}` : null;
    
    const messageHeader = [
        `*Reporte de Inasistencias*`,
        subjectLine,
        semesterLine,
        groupLine,
        `Fecha: ${format(date, 'PPP', { locale: es })}`
    ].filter(Boolean).join('\n');

    const message = `${messageHeader}\n\nEstimado(a) responsable, se reporta la inasistencia de los siguientes estudiantes:\n${absentStudents.map(s => `- ${s.name}`).join('\n')}\n\nSaludos cordiales,\n${settings.facilitatorName || 'Docente'}`;

    navigator.clipboard.writeText(message).then(() => {
        toast({
            title: '¡Reporte Copiado!',
            description: 'Pégalo en el chat de WhatsApp que se acaba de abrir.',
        });
        
        const cleanPhone = settings.whatsappContactNumber!.replace(/\D/g, '');
        const prefillText = encodeURIComponent(`Hola, te envío el reporte de inasistencias del día de hoy.`);
        const url = `https://wa.me/${cleanPhone}?text=${prefillText}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }).catch(err => {
        console.error('Error al copiar al portapapeles:', err);
        toast({ variant: 'destructive', title: 'Error al Copiar', description: 'No se pudo copiar el reporte al portapapeles.' });
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <AlertDialog open={!!dateToDelete} onOpenChange={(open) => !open && setDateToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción eliminará permanentemente el registro de asistencia y participación del día <span className="font-bold">{dateToDelete ? format(parseISO(dateToDelete), 'PPP', {locale: es}) : ''}</span>. No se puede deshacer.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDate}>Sí, eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                : 'Selecciona un grupo para registrar asistencias.'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            {activeGroup && (
                <Button variant="outline" onClick={handleReportAbsences}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Reportar Inasistencias
                </Button>
            )}
            {activeGroup && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={'outline'}
                            className={cn(
                                'w-[280px] justify-start text-left font-normal',
                                !date && 'text-muted-foreground',
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            )}
            {activeGroup && (
                <Button onClick={handleRegisterDate}>Registrar Asistencia</Button>
            )}
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
                        <div className="flex items-center justify-center gap-2">
                          <span>{format(parseISO(date), 'dd MMM', { locale: es })}</span>
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDateToDelete(date)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                           </Button>
                        </div>
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
                        <Checkbox 
                           checked={attendance[date]?.[student.id] || false}
                           onCheckedChange={(checked) => handleAttendanceChange(student.id, date, !!checked)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                 {studentsToDisplay.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={attendanceDates.length + 1} className="text-center h-24">
                           {activeGroup 
                           ? "Este grupo no tiene estudiantes." 
                           : "No hay un grupo activo. Por favor, selecciona uno en la sección de 'Grupos'."
                           }
                        </TableCell>
                    </TableRow>
                )}
                 {attendanceDates.length === 0 && studentsToDisplay.length > 0 && (
                    <TableRow>
                        <TableCell colSpan={1} className="text-center h-24">
                           Selecciona una fecha para registrar la primera asistencia.
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
