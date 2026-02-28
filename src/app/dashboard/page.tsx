
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
import { useData, type GroupRiskStats } from '@/hooks/use-data';
import type { StudentWithRisk } from '@/lib/placeholder-data';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { activeStudentsInGroups, groups, allStudents, atRiskStudents, overallAverageAttendance, groupAverages, activePartialId, specialNotes, settings, groupRisks, announcements, unreadAnnouncementsCount } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [selectedRiskGroup, setSelectedRiskGroup] = useState('all');
  const [selectedGroupRisk, setSelectedGroupRisk] = useState<GroupRiskStats | null>(null);

  // Filter Active Groups (Exclude Archived)
  const activeGroups = useMemo(() => groups.filter(g => g.status !== 'archived'), [groups]);

  // Students in Active Groups Only
  const studentsInActiveGroups = useMemo(() => {
      const uniqueIds = new Set();
      const students: typeof activeStudentsInGroups = [];
      activeGroups.forEach(g => {
          g.students.forEach(s => {
              if(!uniqueIds.has(s.id)) {
                  uniqueIds.add(s.id);
                  students.push(s);
              }
          });
      });
      return students;
  }, [activeGroups]);

  // Recalculate risks for active groups only
  const activeAtRiskStudents = useMemo(() => {
      return atRiskStudents.filter(s => 
          activeGroups.some(g => g.students.some(gs => gs.id === s.id))
      );
  }, [atRiskStudents, activeGroups]);

  const activeGroupRisks = useMemo(() => {
    return Object.values(groupRisks).filter(gr => 
      activeGroups.some(ag => ag.id === gr.groupId)
    );
  }, [groupRisks, activeGroups]);

  // Recalculate average attendance for active groups only (simplified approximation)
  // Since overallAverageAttendance comes from hook, we might just use it or rely on groupAverages
  
  // Welcome Dialog State
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenV2Welcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenV2Welcome', 'true');
  };

  const filteredAtRiskStudents = useMemo(() => {
    const students = selectedRiskGroup === 'all'
      ? activeAtRiskStudents
      : activeAtRiskStudents.filter(student => 
          activeGroups.find(g => g.id === selectedRiskGroup)?.students.some(s => s.id === student.id)
        );

    if (!searchQuery) return students;

    return students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeAtRiskStudents, searchQuery, selectedRiskGroup, activeGroups]);


  const filteredStudentsForSearch = useMemo(() => {
    if (!studentSearchQuery) return [];
    // Search in ALL students (including archived) as requested
    // Ensure we handle potential duplicates if allStudents has raw list
    const uniqueAllStudents = Array.from(new Map(allStudents.map(s => [s.id, s])).values())
        .concat(Array.from(new Map(activeStudentsInGroups.map(s => [s.id, s])).values())) // Fallback to ensure we have everyone
        .filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);

    return uniqueAllStudents.filter(student =>
      student.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
    ).slice(0, 5);
  }, [allStudents, activeStudentsInGroups, studentSearchQuery]);

  const activeSpecialNote = useMemo(() => {
    const today = new Date();
    return specialNotes.find(note => 
      isWithinInterval(today, { start: startOfDay(parseISO(note.startDate)), end: endOfDay(parseISO(note.endDate)) })
    );
  }, [specialNotes]);


  return (
    <div className="flex flex-col gap-6">
      
      {/* DEV: Simulation Access */}
      <div className="w-full bg-yellow-100 border border-yellow-300 p-2 rounded flex justify-between items-center px-4">
        <span className="text-yellow-800 text-xs font-bold font-mono">MODO DESARROLLO: PRUEBAS DE INTEGRACIÓN ACTIVAS</span>
        <Link href="/pigec-simulation">
            <Button variant="outline" size="sm" className="bg-white hover:bg-yellow-50 text-yellow-800 border-yellow-300 h-8 text-xs gap-2">
                <AlertTriangle className="h-3 w-3" />
                Simular Inyección PIGEC-130
            </Button>
        </Link>
      </div>

      {/* Announcements Button */}
      {announcements && announcements.length > 0 && (
         <div className="w-full">
            <Link href="/announcements">
              <Button 
                variant={unreadAnnouncementsCount > 0 ? "destructive" : "outline"}
                className={`w-full justify-between h-auto py-4 px-6 relative group border border-l-4 ${unreadAnnouncementsCount > 0 ? 'border-l-red-600 bg-red-50 text-red-900 hover:bg-red-100 hover:text-red-950 dark:bg-red-950/20 dark:text-red-300' : 'border-l-blue-500 hover:bg-slate-50'}`}
              >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${unreadAnnouncementsCount > 0 ? 'bg-red-200 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                        <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-lg">
                           {unreadAnnouncementsCount > 0 ? '¡Nuevos Anuncios Disponibles!' : 'Sala de Anuncios'}
                        </span>
                        <span className="text-xs opacity-80 font-normal">
                           {unreadAnnouncementsCount > 0 
                             ? `${unreadAnnouncementsCount} mensaje${unreadAnnouncementsCount > 1 ? 's' : ''} nuevo${unreadAnnouncementsCount > 1 ? 's' : ''} sin leer. Haz clic para verlos.` 
                             : 'Consulta el historial de mensajes institucionales.'}
                        </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                      {unreadAnnouncementsCount > 0 && (
                          <span className="flex h-3 w-3 mr-4">
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                      )}
                      <ArrowUpRight className="h-5 w-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </div>
              </Button>
            </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estudiantes Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsInActiveGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de estudiantes registrados (Activos)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos Creados</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de asignaturas activas
            </p>
          </CardContent>
        </Card>
        <Card className="row-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estudiantes en Riesgo ({activePartialId.toUpperCase()})
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive mb-4">
              {activeAtRiskStudents.length}
            </div>
             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {activeGroupRisks.filter(g => g.totalRisk > 0).map(riskGroup => (
                    <div 
                        key={riskGroup.groupId} 
                        className="p-2 border rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => setSelectedGroupRisk(riskGroup)}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold truncate max-w-[120px]" title={riskGroup.groupName}>{riskGroup.groupName}</span>
                            <span className="text-xs font-bold text-destructive">{riskGroup.totalRisk}</span>
                        </div>
                        <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                             <div style={{ width: `${(riskGroup.high / riskGroup.totalRisk) * 100}%` }} className="bg-red-600" title={`Alto: ${riskGroup.high}`} />
                             <div style={{ width: `${(riskGroup.medium / riskGroup.totalRisk) * 100}%` }} className="bg-yellow-500" title={`Medio: ${riskGroup.medium}`} />
                        </div>
                         <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>Alto: {riskGroup.high}</span>
                            <span>Medio: {riskGroup.medium}</span>
                        </div>
                    </div>
                ))}
            </div>
             {activeGroupRisks.every(g => g.totalRisk === 0) && (
                 <p className="text-xs text-muted-foreground mt-2">
                    No hay estudiantes en riesgo calculado.
                </p>
            )}
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
                {activeGroups.slice(0, 5).map((group) => {
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
                    <SelectItem value="all">Todos los grupos activos</SelectItem>
                    {activeGroups.map(group => (
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
      
      <Dialog open={!!selectedGroupRisk} onOpenChange={(open) => !open && setSelectedGroupRisk(null)}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Detalle de Riesgo: {selectedGroupRisk?.groupName}</DialogTitle>
                 <DialogDescription>
                    Desglose de estudiantes en riesgo para el parcial {activePartialId.toUpperCase()}.
                </DialogDescription>
            </DialogHeader>
            
            {selectedGroupRisk && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <h4 className="font-semibold mb-2">Estudiantes</h4>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {selectedGroupRisk.studentsByRisk.high.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-600"></div> ALTO RIESGO
                                    </h5>
                                    {selectedGroupRisk.studentsByRisk.high.map(s => (
                                         <Link href={`/students/${s.id}`} key={s.id} className="block text-sm p-2 border rounded mb-1 hover:bg-slate-50 flex items-center gap-2">
                                            <Image src={s.photo} width={24} height={24} className="rounded-full object-cover aspect-square" alt={s.name} />
                                            <div>
                                                <p className="font-medium">{s.name}</p>
                                                <p className="text-xs text-muted-foreground">{s.calculatedRisk.reason}</p>
                                            </div>
                                         </Link>
                                    ))}
                                </div>
                            )}
                             {selectedGroupRisk.studentsByRisk.medium.length > 0 && (
                                <div>
                                    <h5 className="text-xs font-bold text-yellow-600 mb-1 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div> RIESGO MEDIO
                                    </h5>
                                    {selectedGroupRisk.studentsByRisk.medium.map(s => (
                                         <Link href={`/students/${s.id}`} key={s.id} className="block text-sm p-2 border rounded mb-1 hover:bg-slate-50 flex items-center gap-2">
                                            <Image src={s.photo} width={24} height={24} className="rounded-full object-cover aspect-square" alt={s.name} />
                                            <div>
                                                <p className="font-medium">{s.name}</p>
                                                <p className="text-xs text-muted-foreground">{s.calculatedRisk.reason}</p>
                                            </div>
                                         </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                     </div>

                     <div className="flex flex-col items-center justify-center border-l pl-4 h-[300px]">
                        <h4 className="font-semibold mb-4">Distribución</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Alto', value: selectedGroupRisk.high, fill: '#dc2626' },
                                        { name: 'Medio', value: selectedGroupRisk.medium, fill: '#eab308' },
                                        { name: 'Bajo/Sin Riesgo', value: Math.max(0, (groups.find(g => g.id === selectedGroupRisk.groupId)?.students.length || 0) - selectedGroupRisk.totalRisk), fill: '#22c55e' }
                                    ]}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {[
                                        { name: 'Alto', value: selectedGroupRisk.high, fill: '#dc2626' },
                                        { name: 'Medio', value: selectedGroupRisk.medium, fill: '#eab308' },
                                        { name: 'Bajo/Sin Riesgo', value: Math.max(0, (groups.find(g => g.id === selectedGroupRisk.groupId)?.students.length || 0) - selectedGroupRisk.totalRisk), fill: '#22c55e' }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            )}
        </DialogContent>
      </Dialog>

      {/* Welcome Dialog Update v2.1.0 */}
      <Dialog open={showWelcome} onOpenChange={handleCloseWelcome}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
           <div className='flex items-center gap-3 mb-2'>
              <div className='p-3 bg-primary/10 rounded-full'><Megaphone className='h-6 w-6 text-primary'/></div>
              <DialogTitle className='text-2xl'>¡Bienvenidos a la versión optimizada de su Centro de Mando Pedagógico!</DialogTitle>
           </div>
            <DialogDescription className="text-base text-foreground">
               Hemos escuchado sus necesidades y actualizado la plataforma para que sea más intuitiva, segura y enfocada en lo que realmente importa: el éxito académico y el bienestar de sus estudiantes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
             <div className="space-y-4">
                <div className='flex gap-3'>
                    <div className='mt-1'><BookCopy className='h-5 w-5 text-indigo-600'/></div>
                     <div>
                        <h4 className='font-bold text-sm'>Bitácora Inteligente</h4>
                        <p className='text-sm text-muted-foreground text-pretty'>Ahora, las recomendaciones de apoyo pedagógico llegarán directamente a su bitácora, ofreciendo estrategias concretas según el perfil de cada alumno.</p>
                     </div>
                </div>
                 <div className='flex gap-3'>
                    <div className='mt-1'><Users className='h-5 w-5 text-green-600'/></div>
                     <div>
                        <h4 className='font-bold text-sm'>Gestión de Prefectura Mejorada</h4>
                        <p className='text-sm text-muted-foreground text-pretty'>Registro centralizado de visitas domiciliarias y acuerdos con tutores, enfocando esfuerzos en el rescate estudiantil.</p>
                     </div>
                </div>
             </div>

              <div className="space-y-4">
                 <div className='flex gap-3'>
                    <div className='mt-1'><AlertTriangle className='h-5 w-5 text-amber-600'/></div>
                     <div>
                        <h4 className='font-bold text-sm'>Alertas de Riesgo con Propósito</h4>
                        <p className='text-sm text-muted-foreground text-pretty'>Refinado para identificar riesgo de manera humana, sugiriendo intervenciones de apoyo en lugar de solo reportar inasistencias.</p>
                     </div>
                </div>
                 <div className='flex gap-3'>
                    <div className='mt-1'><div className="h-5 w-5 rounded-full border-2 border-slate-600 flex items-center justify-center font-serif font-bold text-xs ">P</div></div>
                     <div>
                        <h4 className='font-bold text-sm'>Privacidad y Personalización</h4>
                        <p className='text-sm text-muted-foreground text-pretty'>Seguridad de datos reforzada (info clínica encapsulada) y reportes oficiales firmados automáticamente.</p>
                     </div>
                </div>
             </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">Versión: 2.1.0-Antigravity</span>
              <Button onClick={handleCloseWelcome} className='w-full md:w-auto'>
                Entendido, ir al Dashboard
              </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
