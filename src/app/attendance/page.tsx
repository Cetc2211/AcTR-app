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
import { ArrowLeft, Calendar as CalendarIcon, Trash2, Save, Send } from 'lucide-react';
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
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';


export default function AttendancePage() {
  const { activeGroup, partialData, setAttendance, takeAttendanceForDate, deleteAttendanceDate } = useData();
  const { attendance } = partialData;
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  
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
    
    // Prevent registering if the date already exists
    if (attendance && attendance[formattedDate]) {
        toast({
            title: 'Fecha ya registrada',
            description: `La asistencia para el ${formattedDate} ya existe. Puedes modificarla directamente.`,
        });
        return;
    }

    await takeAttendanceForDate(activeGroup.id, formattedDate);
    
    toast({
        title: 'Asistencia registrada',
        description: `Se ha creado el registro de asistencia para el día ${formattedDate}.`,
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

  const handleSaveRegistry = async () => {
    if (!activeGroup || attendanceDates.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'No hay datos de asistencia para guardar.' });
        return;
    }

    setIsSaving(true);
    try {
        // Los datos ya se guardan automáticamente en Firebase mediante useData al hacer click.
        // Esta función ahora actúa como confirmación visual y sincronización opcional con el backend de IA.
        
        const payload = {
            groupId: activeGroup.id,
            attendanceData: partialData.attendance,
        };
        
        // Intentamos notificar al backend, pero no bloqueamos el éxito si falla (ya que Firebase ya guardó)
        try {
            await fetch('/api/record-attendance', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (backendError) {
            console.warn("No se pudo sincronizar con el servicio de IA (no crítico):", backendError);
        }

        // Simulamos un pequeño delay para feedback visual
        await new Promise(resolve => setTimeout(resolve, 300));

        toast({
            title: '¡Registro Guardado!',
            description: 'Los cambios en la asistencia han sido confirmados correctamente.',
        });

    } catch (error) {
        console.error('Error general al guardar:', error);
        // Solo mostramos error si falla algo crítico local, lo cual es raro aquí
        toast({ 
            variant: 'destructive', 
            title: 'Advertencia', 
            description: 'Hubo un problema de conexión, pero tus datos deberían estar guardados localmente.' 
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleReportAbsences = async () => {
      if (!activeGroup || !date) return;
      
      const formattedDate = format(date, 'yyyy-MM-dd');
      const attendanceForDate = attendance?.[formattedDate];

      if (!attendanceForDate) {
          toast({ variant: 'destructive', title: 'Error', description: `No hay asistencia registrada para el ${format(date, 'dd/MM/yyyy')}.` });
          return;
      }

      setIsReporting(true);
      try {
          const user = auth.currentUser;
          
          // Si no hay usuario autenticado (ej: desarrollo local sin auth), usamos un placeholder para evitar crash
          const teacherId = user?.uid || 'guest_teacher';
          const teacherEmail = user?.email || 'profesor@escuela.edu';

          const absentStudents = activeGroup.students
              .filter(s => attendanceForDate[s.id] === false) // Solo los explícitamente marcados como falta
              .map(s => ({ id: s.id, name: s.name }));

          if (absentStudents.length === 0) {
              toast({ title: 'Sin inasistencias', description: 'Todos los alumnos asistieron en esta fecha.' });
              return;
          }

          const reportData = {
              groupId: activeGroup.id,
              groupName: activeGroup.subject || activeGroup.groupName || 'Grupo sin nombre',
              date: format(date, 'dd/MM/yyyy'),
              teacherId: teacherId,
              teacherEmail: teacherEmail,
              absentStudents: absentStudents,
              whatsappLink: activeGroup.whatsappLink || '',
              timestamp: new Date().toISOString()
          };

          await addDoc(collection(db, 'absences'), reportData);

          toast({
              title: 'Reporte Enviado',
              description: `Se notificaron ${absentStudents.length} inasistencias a la administración.`,
          });

      } catch (e) {
          console.error("Error reporting absences:", e);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el reporte a la base de datos.' });
      } finally {
          setIsReporting(false);
      }
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

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
        
        <div className="flex flex-wrap items-center gap-2">
            {activeGroup && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={'outline'}
                            className={cn(
                                'w-[240px] justify-start text-left font-normal',
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
                <Button onClick={handleRegisterDate} variant="secondary">
                    Registrar Fecha
                </Button>
            )}

            {activeGroup && attendanceDates.length > 0 && (
                <>
                    <Button variant="outline" onClick={handleSaveRegistry} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button 
                        variant="default" 
                        onClick={handleReportAbsences} 
                        disabled={isReporting || !date || !attendance?.[format(date, 'yyyy-MM-dd')]}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        {isReporting ? 'Enviando...' : 'Reportar Faltas'}
                    </Button>
                </>
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
                           Usa el botón &quot;Registrar Fecha&quot; para crear la primera lista de asistencia.
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
