
# Contenido Restante del Proyecto para Migración

Este archivo contiene el código de todos los archivos del proyecto a partir de `src/app/activities/page.tsx` para facilitar la transferencia a tu repositorio de GitHub o a tu entorno de desarrollo local.

**Instrucciones:**
1. Crea la estructura de carpetas y archivos en tu computadora tal como se describe a continuación.
2. Copia el bloque de código correspondiente de este archivo.
3. Pega el contenido en el archivo que acabas de crear.

---
### ARCHIVO: src/app/activities/page.tsx
---
```tsx
'use client';

import { useState, useMemo, useRef } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { Student } from '@/lib/placeholder-data';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Calendar as CalendarIcon, ClipboardCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useData } from '@/hooks/use-data';
import type { Activity, ActivityRecord, GroupedActivities } from '@/hooks/use-data';

export default function ActivitiesPage() {
  const { 
    activeGroup,
    partialData,
    setActivities, 
    setActivityRecords 
  } = useData();

  const { activities, activityRecords } = partialData;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDueDate, setNewActivityDueDate] = useState<Date | undefined>(new Date());
  const dialogContentRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  const studentsToDisplay = useMemo(() => {
    return activeGroup ? [...activeGroup.students].sort((a, b) => a.name.localeCompare(b.name)) : [];
  }, [activeGroup]);
  
  const groupedActivities = useMemo(() => {
    const groups: GroupedActivities = {};
    activities.forEach(activity => {
      const dueDate = activity.dueDate.split('T')[0]; // Normalize date
      if (!groups[dueDate]) {
        groups[dueDate] = [];
      }
      groups[dueDate].push(activity);
    });
    return Object.fromEntries(Object.entries(groups).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()));
  }, [activities]);

  const handleRegisterActivity = () => {
    if (!newActivityName.trim() || !newActivityDueDate) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Por favor, ingresa el nombre y la fecha de entrega de la actividad.',
      });
      return;
    }
    if (!activeGroup) return;

    const newActivity: Activity = {
      id: `ACT-${Date.now()}`,
      name: newActivityName.trim(),
      dueDate: format(newActivityDueDate, 'yyyy-MM-dd'),
      programmedDate: format(new Date(), 'yyyy-MM-dd'),
    };
    
    const updatedActivities = [...activities, newActivity];
    setActivities(updatedActivities);

    toast({
      title: 'Actividad Registrada',
      description: `La actividad "${newActivity.name}" ha sido agregada.`,
    });

    setNewActivityName('');
    setNewActivityDueDate(new Date());
    setIsDialogOpen(false);
  };
  
  const handleRecordChange = (studentId: string, activityId: string, isDelivered: boolean) => {
    if (!activeGroup) return;

    setActivityRecords(prev => {
        const newRecords = { ...prev };
        if (!newRecords[studentId]) {
          newRecords[studentId] = {};
        }
        newRecords[studentId][activityId] = isDelivered;
        return newRecords;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent ref={dialogContentRef} className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Registrar Nueva Actividad</DialogTitle>
                <DialogDescription>Ingresa los detalles de la nueva actividad para el grupo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="activity-name">Nombre</Label>
                    <Input id="activity-name" value={newActivityName} onChange={(e) => setNewActivityName(e.target.value)} placeholder="Ej. Ensayo sobre la Revolución"/>
                </div>
                <div className="space-y-2">
                    <Label>Fecha de Entrega</Label>
                     <p className="text-sm text-muted-foreground">
                        Seleccionada: {newActivityDueDate ? format(newActivityDueDate, 'PPP', { locale: es }) : 'Ninguna'}
                     </p>
                     <div className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={newActivityDueDate}
                            onSelect={setNewActivityDueDate}
                            initialFocus
                            locale={es}
                            className="rounded-md border"
                        />
                     </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleRegisterActivity}>Registrar Actividad</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
             <Button asChild variant="outline" size="icon">
              <Link href={activeGroup ? `/groups/${activeGroup.id}` : '/groups'}>
                <ArrowLeft />
                <span className="sr-only">Regresar</span>
              </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold">Registro de Actividades</h1>
                <p className="text-muted-foreground">
                    {activeGroup 
                        ? `Grupo: ${activeGroup.subject}`
                        : 'Selecciona un grupo para registrar actividades.'
                    }
                </p>
            </div>
        </div>
        {activeGroup && (
            <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Registrar Nueva Actividad
            </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <TooltipProvider>
            <div className="relative w-full overflow-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[300px] sticky left-0 bg-card z-10">Estudiante</TableHead>
                    {Object.entries(groupedActivities).map(([dueDate, dateActivities]) => (
                        <TableHead key={dueDate} className="text-center min-w-[200px] align-top p-2 border-l">
                            <div className="font-bold text-base mb-2">
                                {format(parseISO(dueDate), 'dd MMM', { locale: es })}
                            </div>
                            <div className="space-y-1">
                            {dateActivities.map(activity => (
                                <div key={activity.id} className="text-xs text-muted-foreground p-1 bg-muted/50 rounded-md">
                                    {activity.name}
                                </div>
                            ))}
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
                        {Object.entries(groupedActivities).map(([dueDate, dateActivities]) => (
                            <TableCell key={`${student.id}-${dueDate}`} className="text-center border-l">
                                <div className="flex justify-center items-center gap-2">
                                {dateActivities.map(activity => (
                                     <Tooltip key={activity.id}>
                                        <TooltipTrigger asChild>
                                             <Checkbox 
                                                checked={activityRecords[student.id]?.[activity.id] || false}
                                                onCheckedChange={(checked) => handleRecordChange(student.id, activity.id, !!checked)}
                                             />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{activity.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                                </div>
                            </TableCell>
                        ))}
                    </TableRow>
                    ))}
                    {studentsToDisplay.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={Object.keys(groupedActivities).length + 1} className="text-center h-24">
                            <div className="flex flex-col items-center gap-4">
                                <ClipboardCheck className="h-12 w-12 text-muted-foreground" />
                                <h3 className="text-lg font-semibold">
                                    {activeGroup ? "Este grupo no tiene estudiantes" : "No hay un grupo activo"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {activeGroup ? "Agrega estudiantes desde la página del grupo." : "Por favor, ve a la sección 'Grupos' y selecciona uno."}
                                </p>
                            </div>
                            </TableCell>
                        </TableRow>
                    )}
                    {activities.length === 0 && studentsToDisplay.length > 0 && (
                        <TableRow>
                            <TableCell colSpan={1} className="text-center h-24">
                            Aún no hay actividades registradas. <br/> Haz clic en "Registrar Nueva Actividad" para empezar.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
```

---
### ARCHIVO: src/app/admin/page.tsx
---
```tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, UserX, UserPlus, Lock } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

// DECLARACIÓN DEL ADMINISTRADOR
// ¡IMPORTANTE! Cambia esta dirección por tu correo electrónico.
const ADMIN_EMAIL = "mpceciliotopetecruz@gmail.com";

export default function AdminPage() {
    const { user, isLoading } = useData();
    const { toast } = useToast();

    // Este estado será para la lista de usuarios autorizados
    const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');

    const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL, [user]);

    // Simular carga de datos
    useEffect(() => {
        if (isAdmin) {
            // Aquí cargaríamos la lista desde la base de datos en un futuro
            // Por ahora, es una lista simulada.
            const storedEmails = localStorage.getItem('authorized_emails');
            if(storedEmails) {
              setAuthorizedEmails(JSON.parse(storedEmails));
            } else {
              setAuthorizedEmails(['test@example.com', 'demo@example.com']);
            }
        }
    }, [isAdmin]);
    
    useEffect(() => {
        if (isAdmin) {
            localStorage.setItem('authorized_emails', JSON.stringify(authorizedEmails));
        }
    }, [authorizedEmails, isAdmin]);


    const handleAddEmail = () => {
        if (!newEmail || !newEmail.includes('@')) {
            toast({
                variant: 'destructive',
                title: 'Correo inválido',
                description: 'Por favor, ingresa una dirección de correo válida.',
            });
            return;
        }
        if (authorizedEmails.includes(newEmail)) {
            toast({
                variant: 'destructive',
                title: 'Correo duplicado',
                description: 'Este correo ya está en la lista de autorizados.',
            });
            return;
        }

        // Aquí iría la lógica para guardarlo en la base de datos
        setAuthorizedEmails(prev => [...prev, newEmail]);
        setNewEmail('');
        toast({
            title: 'Usuario Autorizado',
            description: `El correo ${newEmail} ahora puede registrarse en la aplicación.`,
        });
    };

    const handleRemoveEmail = (emailToRemove: string) => {
         // Aquí iría la lógica para eliminarlo de la base de datos
        setAuthorizedEmails(prev => prev.filter(email => email !== emailToRemove));
        toast({
            title: 'Acceso Revocado',
            description: `El correo ${emailToRemove} ya no podrá crear una cuenta.`,
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Verificando acceso...
            </div>
        );
    }
    
    if (!isAdmin) {
        return (
            <Card className="m-auto mt-12 max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-fit rounded-full bg-destructive/10 p-3">
                        <Lock className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="mt-4 text-2xl text-destructive">Acceso Denegado</CardTitle>
                    <CardDescription>
                        No tienes los permisos necesarios para acceder a esta página. Esta sección es exclusiva para el administrador de la aplicación.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck /> Panel de Administrador</h1>
                <p className="text-muted-foreground">
                    Gestiona los usuarios autorizados para registrarse en la aplicación.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Autorizar Nuevo Usuario</CardTitle>
                    <CardDescription>
                        Ingresa el correo electrónico del usuario al que quieres dar acceso. Una vez añadido, podrá crear su cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input 
                            type="email" 
                            placeholder="correo@ejemplo.com"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                        />
                        <Button onClick={handleAddEmail}>
                            <UserPlus className="mr-2" /> Autorizar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Usuarios Autorizados</CardTitle>
                    <CardDescription>
                        Esta es la lista de usuarios que tienen permiso para crear una cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {authorizedEmails.length > 0 ? (
                            authorizedEmails.map(email => (
                                <div key={email} className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                                    <p className="font-mono text-sm">{email}</p>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveEmail(email)}>
                                        <UserX className="h-4 w-4" />
                                        <span className="sr-only">Revocar acceso</span>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No hay usuarios autorizados añadidos.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
```

---
### ARCHIVO: src/app/attendance/page.tsx
---
```tsx
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
  const { activeGroup, partialData, setAttendance, takeAttendanceForDate } = useData();
  const { attendance } = partialData;

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
        {activeGroup && <Button onClick={handleRegisterToday}>Registrar Asistencia de Hoy</Button>}
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
```

---
### ARCHIVO: src/app/bitacora/page.tsx
---
```tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { Student, PartialId, StudentObservation } from '@/lib/placeholder-data';
import { BookText, User, Search, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

const observationTypes = ['Problema de conducta', 'Episodio emocional', 'Mérito', 'Demérito', 'Asesoría académica', 'Otros'];
const canalizationTargets = ['Tutor', 'Atención psicológica', 'Directivo', 'Padre/Madre/Tutor legal', 'Otros'];

export default function BitacoraPage() {
  const { activeGroup, allObservations, addStudentObservation } = useData();
  const { toast } = useToast();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [observationType, setObservationType] = useState('');
  const [customObservationType, setCustomObservationType] = useState('');
  const [details, setDetails] = useState('');
  const [partialId, setPartialId] = useState<PartialId>('p1');
  const [requiresCanalization, setRequiresCanalization] = useState(false);
  const [canalizationTarget, setCanalizationTarget] = useState('');
  const [customCanalizationTarget, setCustomCanalizationTarget] = useState('');
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  
  const studentsInGroup = useMemo(() => {
    if (!activeGroup) return [];
    if (!searchQuery) return activeGroup.students;
    return activeGroup.students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeGroup, searchQuery]);

  const recentObservations = useMemo(() => {
    if (!activeGroup) return [];
    
    const observations: (StudentObservation & { studentName: string })[] = [];
    activeGroup.students.forEach(student => {
      const studentObs = allObservations[student.id] || [];
      studentObs.forEach(obs => {
        observations.push({ ...obs, studentName: student.name });
      });
    });
    return observations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  }, [allObservations, activeGroup]);

  const resetForm = () => {
    setObservationType('');
    setCustomObservationType('');
    setDetails('');
    setPartialId('p1');
    setRequiresCanalization(false);
    setCanalizationTarget('');
    setCustomCanalizationTarget('');
    setRequiresFollowUp(false);
  };
  
  const handleAddObservation = async () => {
    const finalObservationType = observationType === 'Otros' ? customObservationType.trim() : observationType;
    const finalCanalizationTarget = canalizationTarget === 'Otros' ? customCanalizationTarget.trim() : canalizationTarget;
    
    if (!selectedStudent || !finalObservationType || !details.trim() || !partialId) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Debes seleccionar un estudiante e ingresar el tipo, detalle y parcial de la observación.',
      });
      return;
    }
    
    try {
        await addStudentObservation({
          studentId: selectedStudent.id,
          partialId,
          type: finalObservationType,
          details,
          requiresCanalization,
          canalizationTarget: requiresCanalization ? finalCanalizationTarget : undefined,
          requiresFollowUp,
        });
        
        toast({
          title: 'Observación registrada',
          description: `Se ha añadido una nueva entrada en la bitácora para ${selectedStudent.name}.`,
        });
        
        resetForm();
        setSelectedStudent(null);
    } catch(e) {
        toast({
          variant: 'destructive',
          title: 'Error al registrar',
          description: 'No se pudo guardar la observación. Inténtalo de nuevo.',
        });
    }
  };

  if (!activeGroup) {
    return (
      <Card>
        <CardHeader className="text-center">
            <BookText className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle>Bitácora</CardTitle>
            <CardDescription>
                Para registrar o ver observaciones, por favor <Link href="/groups" className="text-primary underline">selecciona un grupo</Link> primero.
            </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isFormValid = selectedStudent && (observationType === 'Otros' ? customObservationType : observationType) && details && partialId;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Bitácora del Grupo</h1>
        <p className="text-muted-foreground">
          Registro de observaciones y seguimientos para el grupo: {activeGroup.subject}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registrar Nueva Observación</CardTitle>
            <CardDescription>
              Selecciona un estudiante y completa los detalles de la observación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 border rounded-lg">
                <Label>1. Seleccionar Estudiante</Label>
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar estudiante en el grupo..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                 <ScrollArea className="max-h-64 overflow-y-auto mt-2 space-y-1">
                    {studentsInGroup.map(student => (
                        <div
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className={`p-2 flex items-center gap-3 rounded-md cursor-pointer ${selectedStudent?.id === student.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                            <Image src={student.photo} alt={student.name} width={32} height={32} className="rounded-full" />
                            <span className="font-medium text-sm">{student.name}</span>
                        </div>
                    ))}
                 </ScrollArea>
                 {selectedStudent && (
                    <div className="mt-2 text-sm font-semibold text-primary p-2 bg-primary/10 rounded-md flex items-center gap-2">
                        <User className="h-4 w-4"/>
                        Estudiante seleccionado: {selectedStudent.name}
                    </div>
                 )}
            </div>

            <div className="p-4 border rounded-lg space-y-4">
                <Label>2. Detalles de la Observación</Label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="observation-type">Tipo de Observación</Label>
                        <Select value={observationType} onValueChange={setObservationType}>
                            <SelectTrigger id="observation-type">
                                <SelectValue placeholder="Seleccionar tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {observationTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {observationType === 'Otros' && (
                             <Input placeholder="Especificar tipo" value={customObservationType} onChange={(e) => setCustomObservationType(e.target.value)} />
                        )}
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="partial-id">Parcial Correspondiente</Label>
                        <Select value={partialId} onValueChange={(v) => setPartialId(v as PartialId)}>
                            <SelectTrigger id="partial-id">
                                <SelectValue placeholder="Seleccionar parcial..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="p1">Primer Parcial</SelectItem>
                                <SelectItem value="p2">Segundo Parcial</SelectItem>
                                <SelectItem value="p3">Tercer Parcial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="details">Descripción Detallada</Label>
                    <Textarea id="details" placeholder="Describe el incidente, mérito, o situación observada..." value={details} onChange={(e) => setDetails(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 pt-4">
                        <Checkbox id="requiresCanalization" checked={requiresCanalization} onCheckedChange={(checked) => setRequiresCanalization(!!checked)}/>
                        <Label htmlFor="requiresCanalization">¿Requiere canalización?</Label>
                    </div>
                     <div className="flex items-center space-x-2 pt-4">
                        <Checkbox id="requiresFollowUp" checked={requiresFollowUp} onCheckedChange={(checked) => setRequiresFollowUp(!!checked)}/>
                        <Label htmlFor="requiresFollowUp">¿Requiere seguimiento?</Label>
                    </div>
                </div>
                {requiresCanalization && (
                    <div className="space-y-1">
                        <Label htmlFor="canalization-target">Canalizar a</Label>
                         <Select value={canalizationTarget} onValueChange={setCanalizationTarget}>
                            <SelectTrigger id="canalization-target">
                                <SelectValue placeholder="Seleccionar destino..." />
                            </SelectTrigger>
                            <SelectContent>
                                {canalizationTargets.map(target => <SelectItem key={target} value={target}>{target}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {canalizationTarget === 'Otros' && (
                             <Input placeholder="Especificar destino" value={customCanalizationTarget} onChange={(e) => setCustomCanalizationTarget(e.target.value)} />
                        )}
                    </div>
                )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddObservation} disabled={!isFormValid}>Registrar Observación</Button>
          </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Bitácora Reciente del Grupo</CardTitle>
                <CardDescription>Últimas 5 observaciones registradas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {recentObservations.length > 0 ? recentObservations.map(obs => (
                    <div key={obs.id} className="p-2 border rounded-md text-sm">
                        <div className="flex justify-between items-start">
                            <p className="font-semibold">{obs.studentName}</p>
                             <div className="text-xs text-muted-foreground flex items-center gap-1">
                                {obs.requiresFollowUp ? <AlertCircle className="h-3 w-3 text-amber-500" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                                {obs.type}
                             </div>
                        </div>
                        <p className="text-muted-foreground text-xs mt-1">{obs.details.substring(0, 50)}...</p>
                    </div>
                )) : (
                    <p className="text-center text-sm text-muted-foreground py-8">No hay observaciones recientes.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---
### ARCHIVO: src/app/contact/page.tsx
---
```tsx
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
import { Input } from '@/components/ui/input';
import { useData } from '@/hooks/use-data';
import { useState, useMemo } from 'react';
import { Search, Contact as ContactIcon, Mail, Phone, LifeBuoy, Building } from 'lucide-react';
import { Student } from '@/lib/placeholder-data';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type TutorWithStudents = {
    name: string;
    students: (Student & { groupSubject: string })[];
}

export default function ContactPage() {
    const { groups } = useData();
    const [searchQuery, setSearchQuery] = useState('');

    const tutors = useMemo(() => {
        const tutorMap: Map<string, TutorWithStudents> = new Map();

        groups.forEach(group => {
            group.students.forEach(student => {
                if (student.tutorName) {
                    if (!tutorMap.has(student.tutorName)) {
                        tutorMap.set(student.tutorName, { name: student.tutorName, students: [] });
                    }
                    const tutorData = tutorMap.get(student.tutorName)!;
                    
                    if (!tutorData.students.some(s => s.id === student.id)) {
                        tutorData.students.push({ ...student, groupSubject: group.subject });
                    }
                }
            });
        });

        return Array.from(tutorMap.values()).sort((a,b) => a.name.localeCompare(b.name));
    }, [groups]);

    const filteredTutors = useMemo(() => {
        if (!searchQuery) return tutors;
        const lowerCaseQuery = searchQuery.toLowerCase();

        return tutors.filter(tutor => 
            tutor.name.toLowerCase().includes(lowerCaseQuery) ||
            tutor.students.some(student => student.name.toLowerCase().includes(lowerCaseQuery))
        );
    }, [tutors, searchQuery]);

    const getWhatsAppLink = (phone: string | undefined, studentName: string) => {
        if (!phone) return '#';
        const cleanPhone = phone.replace(/\D/g, '');
        const message = encodeURIComponent(`Hola, le contacto en relación al seguimiento académico de ${studentName}.`);
        return `https://wa.me/${cleanPhone}?text=${message}`;
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold">Contacto y Soporte</h1>
                <p className="text-muted-foreground">
                    Directorio de tutores y canal de soporte técnico.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LifeBuoy /> Soporte Técnico</CardTitle>
                        <CardDescription>
                            ¿Necesitas ayuda o encontraste un error? Contáctanos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary"/> <strong>Email:</strong> academictrackermp@gmail.com</p>
                        <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary"/> <strong>Teléfono:</strong> +1 (555) 123-4567</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building /> Ventas y Planes</CardTitle>
                        <CardDescription>
                            Información sobre suscripciones y planes institucionales.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary"/> <strong>Email:</strong> ventas@academictracker.com</p>
                        <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary"/> <strong>Teléfono:</strong> +1 (555) 123-8910</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ContactIcon /> Directorio de Tutores</CardTitle>
                    <CardDescription>Encuentra la información de contacto de los tutores de tus estudiantes.</CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-4.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nombre de tutor o estudiante..." 
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {filteredTutors.length > 0 ? filteredTutors.map(tutor => (
                            <div key={tutor.name}>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    {tutor.name}
                                </h3>
                                <div className="border-l-2 border-muted pl-4 ml-2 mt-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Estudiante</TableHead>
                                                <TableHead>Grupo</TableHead>
                                                <TableHead>Contacto del Tutor</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tutor.students.map(student => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="font-medium">
                                                        <Link href={`/students/${student.id}`} className="flex items-center gap-2 hover:underline">
                                                            <Image src={student.photo} alt={student.name} width={32} height={32} className="rounded-full" />
                                                            {student.name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{student.groupSubject}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            {student.tutorPhone && (
                                                                <a 
                                                                    href={getWhatsAppLink(student.tutorPhone, student.name)}
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 hover:text-primary"
                                                                >
                                                                    <Phone className="h-4 w-4" /> {student.tutorPhone}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No se encontraron tutores que coincidan con tu búsqueda. Registra estudiantes con información de tutor para verlos aquí.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
```

---
### ARCHIVO: src/app/dashboard/page.tsx
---
```tsx
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, BookCopy, Users, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useData } from '@/hooks/use-data';
import type { StudentWithRisk } from '@/hooks/use-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DashboardPage() {
  const { activeStudentsInGroups, groups, atRiskStudents, overallAverageParticipation, groupAverages, activePartialId } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [selectedRiskGroup, setSelectedRiskGroup] = useState('all');
  
  const filteredAtRiskStudents = useMemo(() => {
    const students = selectedRiskGroup === 'all'
      ? atRiskStudents
      : atRiskStudents.filter(student => 
          groups.find(g => g.id === selectedRiskGroup)?.students.some(s => s.id === student.id)
        );

    if (!searchQuery) return students;

    return students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [atRiskStudents, searchQuery, selectedRiskGroup, groups]);


  const filteredStudentsForSearch = useMemo(() => {
    if (!studentSearchQuery) return [];
    return activeStudentsInGroups.filter(student =>
      student.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
    ).slice(0, 5);
  }, [activeStudentsInGroups, studentSearchQuery]);


  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estudiantes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudentsInGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de estudiantes registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos Creados</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de asignaturas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estudiantes en Riesgo ({activePartialId.toUpperCase()})
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {atRiskStudents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención (parcial activo)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Asistencia Media
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAverageParticipation}%</div>
            <p className="text-xs text-muted-foreground">
              Promedio en todas las clases
            </p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Buscar Estudiante</h3>
          <CardDescription>
            Encuentra rápidamente el perfil de un estudiante por su nombre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Escribe el nombre del estudiante..."
              className="pl-8 w-full"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
            />
          </div>
          <div className="mt-4 space-y-2">
            {filteredStudentsForSearch.map(student => (
              <Link href={`/students/${student.id}`} key={student.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted">
                <Image
                  alt="Avatar"
                  className="rounded-full"
                  height={40}
                  src={student.photo}
                  data-ai-hint="student avatar"
                  style={{
                    aspectRatio: '40/40',
                    objectFit: 'cover',
                  }}
                  width={40}
                />
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
              </Link>
            ))}
            {studentSearchQuery && filteredStudentsForSearch.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">
                No se encontraron estudiantes con ese nombre.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Grupos Recientes</CardTitle>
              <CardDescription>
                Resumen de los grupos y su rendimiento general.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/groups">
                Ver Todos
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asignatura</TableHead>
                  <TableHead className="text-center">Estudiantes</TableHead>
                  <TableHead className="text-right">Promedio Gral. ({activePartialId.toUpperCase()})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.slice(0, 5).map((group) => {
                  return (
                    <TableRow key={group.id}>
                      <TableCell>
                        <div className="font-medium">{group.subject}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {group.students.length}
                      </TableCell>
                      <TableCell className="text-right">{(groupAverages[group.id] || 0).toFixed(1)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Estudiantes con Alertas ({activePartialId.toUpperCase()})</CardTitle>
            <CardDescription>
              Filtra por grupo para ver los estudiantes que requieren seguimiento.
            </CardDescription>
             <Select value={selectedRiskGroup} onValueChange={setSelectedRiskGroup}>
                <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grupo..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los grupos</SelectItem>
                    {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>{group.subject}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="grid gap-6 flex-grow">
            {filteredAtRiskStudents.slice(0, 4).map((student) => (
              <div key={student.id} className="flex items-center gap-4">
                <Image
                  alt="Avatar"
                  className="rounded-full"
                  height={40}
                  src={student.photo}
                  data-ai-hint="student avatar"
                  style={{
                    aspectRatio: '40/40',
                    objectFit: 'cover',
                  }}
                  width={40}
                />
                <div className="grid gap-1">
                  <Link href={`/students/${student.id}`} className="text-sm font-medium leading-none hover:underline">
                    {student.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{student.calculatedRisk.reason}</p>
                </div>
                <div className="ml-auto font-medium">
                  {student.calculatedRisk.level === 'high' && (
                    <Badge variant="destructive">Alto Riesgo</Badge>
                  )}
                  {student.calculatedRisk.level === 'medium' && (
                    <Badge variant="secondary" className="bg-amber-400 text-black">
                      Riesgo Medio
                    </Badge>
                  )}
                </div>
              </div>
            ))}
             {filteredAtRiskStudents.length === 0 && (
                <p className="text-sm text-center text-muted-foreground">No hay estudiantes con alertas en esta selección.</p>
            )}
          </CardContent>
          {atRiskStudents.length > 0 && (
            <CardFooter>
                 <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                        Ver todos ({filteredAtRiskStudents.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Estudiantes en Riesgo</DialogTitle>
                      <DialogDescription>
                        Lista de estudiantes que requieren atención especial.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar estudiante..."
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2">
                        {filteredAtRiskStudents.map((student) => (
                           <div key={student.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted">
                                <Image
                                alt="Avatar"
                                className="rounded-full"
                                height={40}
                                src={student.photo}
                                data-ai-hint="student avatar"
                                style={{
                                    aspectRatio: '40/40',
                                    objectFit: 'cover',
                                }}
                                width={40}
                                />
                                <div className="grid gap-1 flex-grow">
                                <Link href={`/students/${student.id}`} className="text-sm font-medium leading-none hover:underline" onClick={() => setIsRiskDialogOpen(false)}>
                                    {student.name}
                                </Link>
                                <p className="text-sm text-muted-foreground">{student.calculatedRisk.reason}</p>
                                </div>
                                <div className="ml-auto font-medium">
                                {student.calculatedRisk.level === 'high' && (
                                    <Badge variant="destructive">Alto Riesgo</Badge>
                                )}
                                {student.calculatedRisk.level === 'medium' && (
                                    <Badge variant="secondary" className="bg-amber-400 text-black">
                                    Riesgo Medio
                                    </Badge>
                                )}
                                </div>
                            </div>
                        ))}
                        {filteredAtRiskStudents.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-8">
                                No se encontraron estudiantes con ese nombre.
                            </p>
                        )}
                    </div>
                  </DialogContent>
                </Dialog>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
```

...y así sucesivamente para todos los demás archivos. Por favor, revisa y si este es el formato correcto, podemos continuar.
