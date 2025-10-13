
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowUpRight, BookCopy, Users, AlertTriangle, Search, Megaphone, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from '@/components/ui/input';
import { useData } from '@/hooks/use-data';
import type { StudentWithRisk } from '@/lib/placeholder-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DashboardPage() {
  const { activeStudentsInGroups, groups, atRiskStudents, overallAverageAttendance, groupAverages, activePartialId, specialNotes, settings } = useData();
  
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

  const activeSpecialNote = useMemo(() => {
    const today = new Date();
    return specialNotes.find(note => 
      isWithinInterval(today, { start: startOfDay(parseISO(note.startDate)), end: endOfDay(parseISO(note.endDate)) })
    );
  }, [specialNotes]);


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
              Asistencia Media ({activePartialId.toUpperCase()})
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallAverageAttendance)}%</div>
            <p className="text-xs text-muted-foreground">
              Promedio en el grupo activo
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

       {settings.scheduleImageUrl && (
          <Collapsible className="w-full">
              <Card>
                  <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-2">
                        <CalendarClock/>
                        <h4 className="font-semibold">Mi Horario y Consideraciones</h4>
                      </div>
                      <CollapsibleTrigger asChild>
                          <Button variant="ghost">Mostrar/Ocultar</Button>
                      </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                      <CardContent>
                          <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden border">
                              <Image 
                                  src={settings.scheduleImageUrl}
                                  alt="Horario de clases"
                                  fill
                                  className="object-contain"
                              />
                          </div>
                          {activeSpecialNote && (
                              <Alert variant="destructive" className="mt-4">
                                  <Megaphone className="h-4 w-4" />
                                  <AlertTitle>Aviso Importante</AlertTitle>
                                  <AlertDescription>
                                      {activeSpecialNote.text}
                                  </AlertDescription>
                              </Alert>
                          )}
                      </CardContent>
                  </CollapsibleContent>
              </Card>
          </Collapsible>
      )}

    </div>
  );
}
