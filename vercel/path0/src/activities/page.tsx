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
import type { Student, Activity, GroupedActivities } from '@/lib/placeholder-data';
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
    activities.forEach((activity: Activity) => {
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
                            disabled={(date) => date > new Date("2999-01-01") || date < new Date("1900-01-01")}
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
