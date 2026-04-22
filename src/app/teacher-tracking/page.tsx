'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import {
  useTeacherTracking,
  type TeacherIncidentStatus,
  type TeacherScheduleBlock,
  type TeacherTrackingLog,
} from '@/hooks/use-teacher-tracking';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';
import { useAdmin } from '@/hooks/use-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  ClipboardList,
  PlusCircle,
  Trash2,
  Pencil,
  Clock3,
  UserRound,
  CalendarClock,
  BookOpen,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

const STATUS_OPTIONS: Array<{ value: TeacherIncidentStatus; label: string }> = [
  { value: 'puntual', label: 'Puntual' },
  { value: 'retardo', label: 'Retardo' },
  { value: 'falta', label: 'Falta' },
  { value: 'salida_anticipada', label: 'Salida Anticipada' },
];

const STATUS_LABELS: Record<TeacherIncidentStatus, string> = {
  puntual: 'Puntual',
  retardo: 'Retardo',
  falta: 'Falta',
  salida_anticipada: 'Salida Anticipada',
};

const STATUS_BADGE_CLASSES: Record<TeacherIncidentStatus, string> = {
  puntual: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  retardo: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  falta: 'bg-rose-100 text-rose-800 hover:bg-rose-100',
  salida_anticipada: 'bg-sky-100 text-sky-800 hover:bg-sky-100',
};

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TODAY_DAY = new Date().getDay();

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map((value) => Number(value));
  const hours = Number.isFinite(h) ? h : 0;
  const minutes = Number.isFinite(m) ? m : 0;
  return hours * 60 + minutes;
}

export default function TeacherTrackingPage() {
  const { groups, officialGroups } = useData();
  const { isAdmin, loading: loadingAdmin } = useAdmin();
  const {
    logs,
    isLoading,
    syncedGroups,
    teacherDirectory,
    subjectCatalog,
    todaySchedule,
    addLog,
    deleteLog,
    updateLog,
    addManualTeacher,
    addManualTeachersBatch,
    addScheduleBlock,
    deleteScheduleBlock,
    updateScheduleBlock,
    getSchedulesForGroup,
  } = useTeacherTracking(groups, officialGroups);
  const { toast } = useToast();
  const [user] = useAuthState(auth);

  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  const [editingBlock, setEditingBlock] = useState<TeacherScheduleBlock | null>(null);
  const [editingLog, setEditingLog] = useState<TeacherTrackingLog | null>(null);
  const [incidentContextBlock, setIncidentContextBlock] = useState<TeacherScheduleBlock | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedPaseGroupId, setSelectedPaseGroupId] = useState<string>('all');
  const [selectedLogGroupId, setSelectedLogGroupId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  const [scheduleGroupId, setScheduleGroupId] = useState('');
  const [scheduleDay, setScheduleDay] = useState<number>(TODAY_DAY);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:50');
  const [scheduleSubject, setScheduleSubject] = useState('');
  const [manualScheduleSubject, setManualScheduleSubject] = useState('');
  const [teacherMode, setTeacherMode] = useState<'directory' | 'manual'>('directory');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [scheduleTeacherName, setScheduleTeacherName] = useState('');
  const [scheduleTeacherEmail, setScheduleTeacherEmail] = useState('');

  const [manualTeacherName, setManualTeacherName] = useState('');
  const [manualTeacherEmail, setManualTeacherEmail] = useState('');
  const [manualTeacherGroupId, setManualTeacherGroupId] = useState('');
  const [manualTeacherSubject, setManualTeacherSubject] = useState('');
  const [bulkTeacherLines, setBulkTeacherLines] = useState('');
  const [bulkSubjectLines, setBulkSubjectLines] = useState('');

  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [incidentDate, setIncidentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<TeacherIncidentStatus>('puntual');
  const [delayTime, setDelayTime] = useState('');
  const [earlyExitTime, setEarlyExitTime] = useState('');
  const [institutionalNotes, setInstitutionalNotes] = useState('');

  const selectedGroup = useMemo(
    () => syncedGroups.find((group) => group.id === selectedGroupId) || null,
    [selectedGroupId, syncedGroups],
  );

  const schedulesForSelectedGroup = useMemo(
    () => (selectedGroupId ? getSchedulesForGroup(selectedGroupId).sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || (timeToMinutes(a.startTime) - timeToMinutes(b.startTime))) : []),
    [getSchedulesForGroup, selectedGroupId],
  );

  const todayScheduleByGroup = useMemo(() => {
    const scoped = selectedPaseGroupId === 'all'
      ? todaySchedule
      : todaySchedule.filter((block) => block.groupId === selectedPaseGroupId);

    return [...scoped].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [todaySchedule, selectedPaseGroupId]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesDate = !selectedDate || log.incidentDate === selectedDate;
      const matchesGroup = selectedLogGroupId === 'all' || log.groupId === selectedLogGroupId;
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch = !normalizedSearch
        || log.teacherName.toLowerCase().includes(normalizedSearch)
        || log.teacherEmail.toLowerCase().includes(normalizedSearch)
        || log.institutionalNotes.toLowerCase().includes(normalizedSearch);
      return matchesDate && matchesGroup && matchesSearch;
    });
  }, [logs, searchTerm, selectedDate, selectedLogGroupId]);

  const teacherSubjectSuggestions = useMemo(() => {
    if (!selectedTeacherId || teacherMode !== 'directory') {
      return [] as string[];
    }

    const selectedTeacher = teacherDirectory.find((teacher) => teacher.id === selectedTeacherId);
    if (!selectedTeacher) {
      return [] as string[];
    }

    const subjects = selectedTeacher.assignments
      .filter((assignment) => !scheduleGroupId || assignment.groupId === scheduleGroupId)
      .map((assignment) => assignment.subject.trim())
      .filter(Boolean);

    return Array.from(new Set(subjects)).sort((a, b) => a.localeCompare(b));
  }, [selectedTeacherId, teacherMode, teacherDirectory, scheduleGroupId]);

  const openScheduleDialog = (block?: TeacherScheduleBlock, presetGroupId?: string) => {
    if (block) {
      setEditingBlock(block);
      setScheduleGroupId(block.groupId);
      setScheduleDay(block.dayOfWeek);
      setStartTime(block.startTime);
      setEndTime(block.endTime);
      setScheduleSubject('');
      setManualScheduleSubject(block.subject);
      setTeacherMode('manual');
      setSelectedTeacherId(block.teacherId || '');
      setScheduleTeacherName(block.teacherName);
      setScheduleTeacherEmail(block.teacherEmail || '');
    } else {
      setEditingBlock(null);
      setScheduleGroupId(presetGroupId || selectedGroupId || syncedGroups[0]?.id || '');
      setScheduleDay(TODAY_DAY);
      setStartTime('07:00');
      setEndTime('08:50');
      setScheduleSubject('');
      setManualScheduleSubject('');
      setTeacherMode('directory');
      setSelectedTeacherId('');
      setScheduleTeacherName('');
      setScheduleTeacherEmail('');
    }
    setIsScheduleDialogOpen(true);
  };

  const handleSaveScheduleBlock = () => {
    const group = syncedGroups.find((g) => g.id === scheduleGroupId);
    if (!group) {
      toast({ variant: 'destructive', title: 'Grupo requerido', description: 'Selecciona un grupo.' });
      return;
    }

    const finalSubject = (scheduleSubject || manualScheduleSubject).trim();
    if (!finalSubject) {
      toast({ variant: 'destructive', title: 'Materia requerida', description: 'Selecciona o escribe una materia.' });
      return;
    }

    let finalTeacherId = '';
    let finalTeacherName = scheduleTeacherName.trim();
    let finalTeacherEmail = scheduleTeacherEmail.trim().toLowerCase();

    if (teacherMode === 'directory') {
      const selectedTeacher = teacherDirectory.find((teacher) => teacher.id === selectedTeacherId);
      if (!selectedTeacher) {
        toast({ variant: 'destructive', title: 'Docente requerido', description: 'Selecciona un docente del catálogo.' });
        return;
      }
      finalTeacherId = selectedTeacher.id;
      finalTeacherName = selectedTeacher.name;
      finalTeacherEmail = selectedTeacher.email;
    }

    if (!finalTeacherName) {
      toast({ variant: 'destructive', title: 'Docente requerido', description: 'Ingresa el nombre del docente.' });
      return;
    }

    const payload = {
      groupId: group.id,
      groupLabel: group.label,
      dayOfWeek: scheduleDay,
      startTime,
      endTime,
      subject: finalSubject,
      teacherId: finalTeacherId || undefined,
      teacherName: finalTeacherName,
      teacherEmail: finalTeacherEmail,
    };

    if (editingBlock) {
      updateScheduleBlock(editingBlock.id, payload);
      toast({ title: 'Bloque actualizado', description: 'El horario oficial fue corregido.' });
    } else {
      addScheduleBlock(payload);
      toast({ title: 'Bloque agregado', description: 'Horario oficial guardado para el semestre.' });
    }

    setIsScheduleDialogOpen(false);
  };

  const openIncidentDialog = (source?: TeacherScheduleBlock | TeacherTrackingLog) => {
    setEditingLog(null);
    setIncidentContextBlock(null);
    setTeacherName('');
    setTeacherEmail('');
    setIncidentDate(format(new Date(), 'yyyy-MM-dd'));
    setStatus('puntual');
    setDelayTime('');
    setEarlyExitTime('');
    setInstitutionalNotes('');

    if (source && 'dayOfWeek' in source) {
      setIncidentContextBlock(source);
      setTeacherName(source.teacherName);
      setTeacherEmail(source.teacherEmail || '');
    } else if (source && 'status' in source) {
      setEditingLog(source);
      setTeacherName(source.teacherName);
      setTeacherEmail(source.teacherEmail);
      setIncidentDate(source.incidentDate);
      setStatus(source.status);
      setDelayTime(source.delayTime || '');
      setEarlyExitTime(source.earlyExitTime || '');
      setInstitutionalNotes(source.institutionalNotes);
    }

    setIsIncidentDialogOpen(true);
  };

  const handleSaveLog = () => {
    if (!teacherName.trim()) {
      toast({ variant: 'destructive', title: 'Docente requerido', description: 'Ingresa el nombre del docente.' });
      return;
    }

    if (status === 'retardo' && !delayTime) {
      toast({ variant: 'destructive', title: 'Hora requerida', description: 'Ingresa la hora del retardo.' });
      return;
    }

    if (status === 'salida_anticipada' && !earlyExitTime) {
      toast({ variant: 'destructive', title: 'Hora requerida', description: 'Ingresa la hora de salida anticipada.' });
      return;
    }

    const payload = {
      teacherName: teacherName.trim(),
      teacherEmail,
      incidentDate,
      status,
      delayTime,
      earlyExitTime,
      institutionalNotes,
      reportedBy: user?.email || '',
      groupId: incidentContextBlock?.groupId,
      groupLabel: incidentContextBlock?.groupLabel,
      subject: incidentContextBlock?.subject,
      scheduleBlockId: incidentContextBlock?.id,
    };

    if (editingLog) {
      updateLog(editingLog.id, payload);
      toast({ title: 'Incidencia actualizada', description: 'Registro corregido exitosamente.' });
    } else {
      addLog(payload);
      toast({ title: 'Incidencia registrada', description: 'Seguimiento docente guardado.' });
    }

    setIsIncidentDialogOpen(false);
  };

  const handleManualTeacherCreate = () => {
    const group = syncedGroups.find((g) => g.id === manualTeacherGroupId);
    if (!group) {
      toast({ variant: 'destructive', title: 'Grupo requerido', description: 'Selecciona un grupo.' });
      return;
    }

    if (!manualTeacherName.trim() || !manualTeacherSubject.trim()) {
      toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Ingresa docente y materia.' });
      return;
    }

    addManualTeacher({
      teacherName: manualTeacherName,
      teacherEmail: manualTeacherEmail,
      groupId: group.id,
      groupLabel: group.label,
      subject: manualTeacherSubject,
    });

    toast({ title: 'Docente registrado', description: 'Agregado al catálogo manual.' });
    setManualTeacherName('');
    setManualTeacherEmail('');
    setManualTeacherGroupId('');
    setManualTeacherSubject('');
  };

  const handleManualTeacherBulkCreate = () => {
    const group = syncedGroups.find((g) => g.id === manualTeacherGroupId);
    if (!group) {
      toast({ variant: 'destructive', title: 'Grupo requerido', description: 'Selecciona un grupo para la carga masiva.' });
      return;
    }

    const teachers = bulkTeacherLines
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const subjects = bulkSubjectLines
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (teachers.length === 0 || subjects.length === 0) {
      toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Pega al menos una fila de docentes y asignaturas.' });
      return;
    }

    if (teachers.length !== subjects.length) {
      toast({
        variant: 'destructive',
        title: 'Filas no coinciden',
        description: `Docentes: ${teachers.length} / Asignaturas: ${subjects.length}. Deben tener el mismo número de líneas.`,
      });
      return;
    }

    const rows = teachers.map((teacherName, index) => ({
      teacherName,
      groupId: group.id,
      groupLabel: group.label,
      subject: subjects[index],
    }));

    const savedCount = addManualTeachersBatch(rows);
    toast({ title: 'Carga masiva completada', description: `Se procesaron ${savedCount} registros.` });

    setBulkTeacherLines('');
    setBulkSubjectLines('');
  };

  if (loadingAdmin) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando módulo de Seg. Docente...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-7 w-7" /> Seguimiento Docente
        </h1>
        <p className="text-muted-foreground mt-1">
          Registro institucional paralelo para asistencia docente, basado en planeación semestral oficial.
        </p>
      </div>

      <Tabs defaultValue="horario">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="horario"><CalendarClock className="mr-2 h-4 w-4" /> Horario Escolar</TabsTrigger>
          <TabsTrigger value="pase"><UserRound className="mr-2 h-4 w-4" /> Pase de Lista</TabsTrigger>
          <TabsTrigger value="bitacora"><ClipboardList className="mr-2 h-4 w-4" /> Bitácora</TabsTrigger>
        </TabsList>

        <TabsContent value="horario" className="space-y-6 mt-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Alta Manual de Docentes</CardTitle>
                <CardDescription>Para docentes que no aparecen en plataforma. Incluye carga individual y carga masiva por pegado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Grupo</Label>
                    <Select value={manualTeacherGroupId} onValueChange={setManualTeacherGroupId}>
                      <SelectTrigger><SelectValue placeholder="Selecciona grupo" /></SelectTrigger>
                      <SelectContent>
                        {syncedGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>{group.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Docente</Label>
                  <Input value={manualTeacherName} onChange={(e) => setManualTeacherName(e.target.value)} placeholder="Nombre completo" />
                </div>
                <div className="space-y-2">
                  <Label>Correo (opcional)</Label>
                  <Input value={manualTeacherEmail} onChange={(e) => setManualTeacherEmail(e.target.value)} placeholder="docente@institucion.edu" />
                </div>
                <div className="space-y-2">
                  <Label>Materia</Label>
                  <Input value={manualTeacherSubject} onChange={(e) => setManualTeacherSubject(e.target.value)} placeholder="Ej. Álgebra" />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleManualTeacherCreate}>Guardar docente</Button>
                </div>
                </div>

                <div className="rounded-md border p-4 space-y-4">
                  <p className="text-sm font-medium">Carga masiva secuencial</p>
                  <p className="text-xs text-muted-foreground">
                    Pega una lista de docentes y otra de asignaturas, una por línea, en el mismo orden. Ejemplo: línea 1 docente ↔ línea 1 asignatura.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Lista de docentes</Label>
                      <Textarea
                        value={bulkTeacherLines}
                        onChange={(e) => setBulkTeacherLines(e.target.value)}
                        rows={8}
                        placeholder={'Docente 1\nDocente 2\nDocente 3'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lista de asignaturas</Label>
                      <Textarea
                        value={bulkSubjectLines}
                        onChange={(e) => setBulkSubjectLines(e.target.value)}
                        rows={8}
                        placeholder={'Asignatura 1\nAsignatura 2\nAsignatura 3'}
                      />
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleManualTeacherBulkCreate}>Guardar carga masiva</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Horario Oficial por Grupo</CardTitle>
              <CardDescription>
                Planeación semestral oficial. Desde aquí se agregan, corrigen y eliminan bloques.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label>Grupo</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un grupo" /></SelectTrigger>
                    <SelectContent>
                      {syncedGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>{group.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={() => openScheduleDialog(undefined, selectedGroupId)} disabled={!selectedGroupId}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar bloque
                  </Button>
                </div>
              </div>

              {selectedGroup && (
                schedulesForSelectedGroup.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                    Este grupo aún no tiene bloques configurados.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schedulesForSelectedGroup.map((block) => (
                      <div key={block.id} className="rounded-md border p-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{DAY_LABELS[block.dayOfWeek]} · {block.startTime} - {block.endTime}</p>
                          <p className="text-sm text-muted-foreground">{block.subject} · {block.teacherName}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openScheduleDialog(block)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              deleteScheduleBlock(block.id);
                              toast({ title: 'Bloque eliminado' });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pase" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bloques hoy ({DAY_LABELS[TODAY_DAY]})</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{todayScheduleByGroup.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Incidencias hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logs.filter((l) => l.incidentDate === format(new Date(), 'yyyy-MM-dd')).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total incidencias</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{logs.length}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Pase de Lista ({DAY_LABELS[TODAY_DAY]})</CardTitle>
                  <CardDescription>
                    Selecciona grupo para ver únicamente sus bloques del día, ordenados por horario.
                  </CardDescription>
                </div>
                <Button onClick={() => openIncidentDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Nueva incidencia
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 md:max-w-sm">
                <Label>Grupo</Label>
                <Select value={selectedPaseGroupId} onValueChange={setSelectedPaseGroupId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los grupos</SelectItem>
                    {syncedGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>{group.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Cargando horarios...</div>
              ) : todayScheduleByGroup.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">No hay bloques configurados para el filtro actual.</p>
                  <p className="text-xs text-muted-foreground">Selecciona otro grupo o corrige horarios en Horario Escolar.</p>
                </div>
              ) : (
                todayScheduleByGroup.map((block) => (
                  <div key={block.id} className="rounded-md border p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{block.groupLabel} · {block.subject}</p>
                      <p className="text-sm text-muted-foreground">{block.startTime} - {block.endTime} · {block.teacherName}</p>
                    </div>
                    <Button size="sm" onClick={() => openIncidentDialog(block)}>Registrar incidencia</Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bitacora" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtra por grupo, fecha o texto libre.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[220px_220px_1fr]">
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={selectedLogGroupId} onValueChange={setSelectedLogGroupId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los grupos</SelectItem>
                    {syncedGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>{group.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Búsqueda</Label>
                <Input
                  placeholder="Docente, correo u observaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Bitácora Docente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Cargando registros...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground text-center">
                  No hay incidencias para los filtros actuales.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="rounded-md border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <UserRound className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold">{log.teacherName}</p>
                          <Badge className={STATUS_BADGE_CLASSES[log.status]}>{STATUS_LABELS[log.status]}</Badge>
                          {log.groupLabel && <Badge variant="outline">{log.groupLabel}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{log.teacherEmail || 'Sin correo registrado'}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{format(new Date(`${log.incidentDate}T12:00:00`), 'PPP', { locale: es })}</span>
                          {log.delayTime && <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> Retardo: {log.delayTime}</span>}
                          {log.earlyExitTime && <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> Salida: {log.earlyExitTime}</span>}
                        </div>
                        {log.institutionalNotes && <p className="text-sm">{log.institutionalNotes}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openIncidentDialog(log)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            deleteLog(log.id);
                            toast({ title: 'Incidencia eliminada' });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingBlock ? 'Editar bloque de horario' : 'Agregar bloque de horario'}</DialogTitle>
            <DialogDescription>
              {editingBlock ? 'Corrige el horario oficial.' : 'Define día, hora, materia y docente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={scheduleGroupId} onValueChange={setScheduleGroupId} disabled={!!editingBlock}>
                <SelectTrigger><SelectValue placeholder="Selecciona un grupo" /></SelectTrigger>
                <SelectContent>
                  {syncedGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>{group.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Día</Label>
              <Select value={String(scheduleDay)} onValueChange={(value) => setScheduleDay(Number(value))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAY_LABELS.map((day, idx) => (
                    <SelectItem key={day} value={String(idx)}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hora inicio</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hora fin</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Materia</Label>
              <Select value={scheduleSubject} onValueChange={setScheduleSubject}>
                <SelectTrigger><SelectValue placeholder="Selecciona del catálogo..." /></SelectTrigger>
                <SelectContent>
                  {subjectCatalog.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={manualScheduleSubject}
                onChange={(e) => setManualScheduleSubject(e.target.value)}
                placeholder="Materia manual"
              />
            </div>
            <div className="space-y-2">
              <Label>Origen docente</Label>
              <div className="flex gap-2">
                <Button type="button" variant={teacherMode === 'directory' ? 'default' : 'outline'} onClick={() => setTeacherMode('directory')}>
                  Catálogo
                </Button>
                <Button type="button" variant={teacherMode === 'manual' ? 'default' : 'outline'} onClick={() => setTeacherMode('manual')}>
                  Manual
                </Button>
              </div>
            </div>
            {teacherMode === 'directory' ? (
              <div className="space-y-2">
                <Label>Docente</Label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un docente" /></SelectTrigger>
                  <SelectContent>
                    {teacherDirectory.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}{teacher.email ? ` (${teacher.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {teacherSubjectSuggestions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-muted-foreground">Asignaturas sugeridas para este docente en el grupo seleccionado:</p>
                    <div className="flex flex-wrap gap-2">
                      {teacherSubjectSuggestions.map((subject) => (
                        <Button
                          key={subject}
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setScheduleSubject('');
                            setManualScheduleSubject(subject);
                          }}
                        >
                          {subject}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre docente</Label>
                  <Input value={scheduleTeacherName} onChange={(e) => setScheduleTeacherName(e.target.value)} placeholder="Nombre completo" />
                </div>
                <div className="space-y-2">
                  <Label>Correo (opcional)</Label>
                  <Input value={scheduleTeacherEmail} onChange={(e) => setScheduleTeacherEmail(e.target.value)} placeholder="docente@institucion.edu" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveScheduleBlock}>{editingBlock ? 'Guardar cambios' : 'Guardar bloque'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingLog ? 'Editar incidencia docente' : 'Registrar incidencia docente'}</DialogTitle>
            <DialogDescription>
              {editingLog ? 'Corrige los datos del registro.' : 'Registro institucional paralelo al seguimiento de estudiantes.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {incidentContextBlock && !editingLog && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{incidentContextBlock.groupLabel} · {incidentContextBlock.subject}</p>
                <p className="text-muted-foreground">Bloque: {incidentContextBlock.startTime} - {incidentContextBlock.endTime}</p>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Docente</Label>
                <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Nombre completo" />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} placeholder="docente@institucion.edu" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
            </div>
            <div className="space-y-3">
              <Label>Estatus</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {STATUS_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
                    <Checkbox checked={status === option.value} onCheckedChange={() => setStatus(option.value)} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {status === 'retardo' && (
              <div className="space-y-2">
                <Label>Hora de retardo</Label>
                <Input type="time" value={delayTime} onChange={(e) => setDelayTime(e.target.value)} />
              </div>
            )}
            {status === 'salida_anticipada' && (
              <div className="space-y-2">
                <Label>Hora de salida anticipada</Label>
                <Input type="time" value={earlyExitTime} onChange={(e) => setEarlyExitTime(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Observaciones institucionales</Label>
              <Textarea
                value={institutionalNotes}
                onChange={(e) => setInstitutionalNotes(e.target.value)}
                placeholder="Describe el contexto..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIncidentDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveLog}>{editingLog ? 'Guardar cambios' : 'Guardar incidencia'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
