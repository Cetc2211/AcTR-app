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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, ClipboardList, PlusCircle, Trash2, Clock3, UserRound, CalendarClock, BookOpen, UserPlus } from 'lucide-react';

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

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

const TODAY_DAY = new Date().getDay();

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
    groupsWithoutScheduleToday,
    addLog,
    deleteLog,
    addManualTeacher,
    addScheduleBlock,
    deleteScheduleBlock,
    getSchedulesForGroup,
  } = useTeacherTracking(groups, officialGroups);
  const { toast } = useToast();
  const [user] = useAuthState(auth);

  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [incidentContextBlock, setIncidentContextBlock] = useState<TeacherScheduleBlock | null>(null);

  const [scheduleGroupId, setScheduleGroupId] = useState<string>('');
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

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

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
    () => (selectedGroupId ? getSchedulesForGroup(selectedGroupId) : []),
    [getSchedulesForGroup, selectedGroupId],
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesDate = !selectedDate || log.incidentDate === selectedDate;
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch = !normalizedSearch
        || log.teacherName.toLowerCase().includes(normalizedSearch)
        || log.teacherEmail.toLowerCase().includes(normalizedSearch)
        || log.institutionalNotes.toLowerCase().includes(normalizedSearch);

      return matchesDate && matchesSearch;
    });
  }, [logs, searchTerm, selectedDate]);

  const openIncidentDialog = (block?: TeacherScheduleBlock) => {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    setIncidentDate(currentDate);
    setStatus('puntual');
    setDelayTime('');
    setEarlyExitTime('');
    setInstitutionalNotes('');

    if (block) {
      setIncidentContextBlock(block);
      setTeacherName(block.teacherName);
      setTeacherEmail(block.teacherEmail || '');
    } else {
      setIncidentContextBlock(null);
      setTeacherName('');
      setTeacherEmail('');
    }

    setIsIncidentDialogOpen(true);
  };

  const openScheduleDialog = (groupId?: string, day?: number) => {
    setScheduleGroupId(groupId || selectedGroupId || syncedGroups[0]?.id || '');
    setScheduleDay(day ?? TODAY_DAY);
    setStartTime('07:00');
    setEndTime('08:50');
    setScheduleSubject('');
    setManualScheduleSubject('');
    setTeacherMode('directory');
    setSelectedTeacherId('');
    setScheduleTeacherName('');
    setScheduleTeacherEmail('');
    setIsScheduleDialogOpen(true);
  };

  const handleCreateScheduleBlock = () => {
    if (!scheduleGroupId) {
      toast({ variant: 'destructive', title: 'Grupo requerido', description: 'Selecciona un grupo para el horario.' });
      return;
    }

    const group = syncedGroups.find((g) => g.id === scheduleGroupId);
    if (!group) {
      toast({ variant: 'destructive', title: 'Grupo invalido', description: 'Selecciona un grupo valido.' });
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
        toast({ variant: 'destructive', title: 'Docente requerido', description: 'Selecciona un docente del catalogo.' });
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

    addScheduleBlock({
      groupId: group.id,
      groupLabel: group.label,
      dayOfWeek: scheduleDay,
      startTime,
      endTime,
      subject: finalSubject,
      teacherId: finalTeacherId || undefined,
      teacherName: finalTeacherName,
      teacherEmail: finalTeacherEmail,
    });

    toast({ title: 'Bloque agregado', description: 'El horario fue guardado de forma permanente para este semestre.' });
    setIsScheduleDialogOpen(false);
  };

  const handleManualTeacherCreate = () => {
    const group = syncedGroups.find((g) => g.id === manualTeacherGroupId);

    if (!group) {
      toast({ variant: 'destructive', title: 'Grupo requerido', description: 'Selecciona un grupo oficial.' });
      return;
    }

    if (!manualTeacherName.trim() || !manualTeacherSubject.trim()) {
      toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Ingresa docente y materia para el alta manual.' });
      return;
    }

    addManualTeacher({
      teacherName: manualTeacherName,
      teacherEmail: manualTeacherEmail,
      groupId: group.id,
      groupLabel: group.label,
      subject: manualTeacherSubject,
    });

    toast({ title: 'Docente registrado', description: 'El docente y su materia quedaron agregados al catalogo manual.' });
    setManualTeacherName('');
    setManualTeacherEmail('');
    setManualTeacherSubject('');
  };

  const handleCreateLog = () => {
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

    addLog({
      teacherName,
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
    });

    toast({ title: 'Incidencia registrada', description: 'El seguimiento docente se guardó localmente.' });

    setTeacherName('');
    setTeacherEmail('');
    setIncidentDate(format(new Date(), 'yyyy-MM-dd'));
    setStatus('puntual');
    setDelayTime('');
    setEarlyExitTime('');
    setInstitutionalNotes('');
    setIncidentContextBlock(null);
    setIsIncidentDialogOpen(false);
  };

  if (loadingAdmin) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando modulo de Seg. Docente...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-7 w-7" /> Seguimiento Docente</h1>
          <p className="text-muted-foreground">
            Módulo paralelo para registrar incidencias de asistencia docente sin afectar los datos académicos del alumnado.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openScheduleDialog()}>
            <CalendarClock className="mr-2 h-4 w-4" /> Gestion de Horarios
          </Button>
          <Button onClick={() => openIncidentDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Nueva incidencia
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Registros Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bloques Hoy ({DAY_LABELS[TODAY_DAY]})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedule.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">localStorage: academic_tracker_teacher_logs</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Pase de Lista Administrativo</CardTitle>
          <CardDescription>
            Horarios del día actual. Si un grupo no tiene bloques hoy, puedes configurarlo en caliente sin detener el registro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {todaySchedule.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              No hay bloques configurados para hoy. Usa "Gestion de Horarios" para agregar el primero.
            </div>
          ) : (
            todaySchedule.map((block) => (
              <div key={block.id} className="rounded-md border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{block.groupLabel} - {block.subject}</p>
                    <p className="text-sm text-muted-foreground">{block.startTime} - {block.endTime} · {block.teacherName}</p>
                  </div>
                  <Button size="sm" onClick={() => openIncidentDialog(block)}>Registrar incidencia</Button>
                </div>
              </div>
            ))
          )}

          {groupsWithoutScheduleToday.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm font-semibold">Grupos sin horario hoy</p>
              <div className="flex flex-wrap gap-2">
                {groupsWithoutScheduleToday.map((group) => (
                  <Button key={group.id} variant="outline" size="sm" onClick={() => openScheduleDialog(group.id, TODAY_DAY)}>
                    + Horario en caliente: {group.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Alta Manual de Docentes / Materias</CardTitle>
            <CardDescription>
              Para docentes que no usan la app. Esta sección está disponible para Subdirección / Jefatura de Departamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Docente</Label>
              <Input value={manualTeacherName} onChange={(e) => setManualTeacherName(e.target.value)} placeholder="Nombre del docente" />
            </div>
            <div className="space-y-2">
              <Label>Correo (opcional)</Label>
              <Input value={manualTeacherEmail} onChange={(e) => setManualTeacherEmail(e.target.value)} placeholder="docente@institucion.edu" />
            </div>
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={manualTeacherGroupId} onValueChange={setManualTeacherGroupId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un grupo" /></SelectTrigger>
                <SelectContent>
                  {syncedGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>{group.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Materia</Label>
              <Input value={manualTeacherSubject} onChange={(e) => setManualTeacherSubject(e.target.value)} placeholder="Ej. Algebra, Ingles, etc." />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleManualTeacherCreate}>Guardar alta manual</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Gestion de Horarios por Grupo</CardTitle>
          <CardDescription>
            Configura una vez por semestre los bloques por grupo, materia y docente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[300px_1fr]">
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
              <Button variant="outline" onClick={() => openScheduleDialog(selectedGroupId || undefined)} disabled={!selectedGroupId}>
                <PlusCircle className="mr-2 h-4 w-4" /> Agregar bloque al grupo
              </Button>
            </div>
          </div>

          {selectedGroup && (
            <div className="space-y-2">
              {schedulesForSelectedGroup.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Este grupo aun no tiene bloques configurados.
                </div>
              ) : (
                schedulesForSelectedGroup.map((block) => (
                  <div key={block.id} className="rounded-md border p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{DAY_LABELS[block.dayOfWeek]} · {block.startTime} - {block.endTime}</p>
                      <p className="text-sm text-muted-foreground">{block.subject} · {block.teacherName}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteScheduleBlock(block.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consulta de Incidencias</CardTitle>
          <CardDescription>Filtra por fecha o por nombre/correo del docente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="teacher-tracking-date">Fecha</Label>
            <Input id="teacher-tracking-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher-tracking-search">Búsqueda</Label>
            <Input
              id="teacher-tracking-search"
              placeholder="Buscar por docente, correo u observaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Bitácora Docente</CardTitle>
          <CardDescription>Registro institucional separado y paralelo al seguimiento de estudiantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Cargando registros...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No hay incidencias docentes para los filtros actuales.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">{log.teacherName}</p>
                      <Badge className={STATUS_BADGE_CLASSES[log.status]}>{STATUS_LABELS[log.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.teacherEmail || 'Sin correo registrado'}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{format(new Date(`${log.incidentDate}T12:00:00`), 'PPP', { locale: es })}</span>
                      {log.delayTime && <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> Retardo: {log.delayTime}</span>}
                      {log.earlyExitTime && <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> Salida: {log.earlyExitTime}</span>}
                    </div>
                    <p className="text-sm">{log.institutionalNotes || 'Sin observaciones institucionales.'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        deleteLog(log.id);
                        toast({ title: 'Incidencia eliminada', description: 'El registro docente fue eliminado del almacenamiento local.' });
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

      <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar Incidencia Docente</DialogTitle>
            <DialogDescription>
              Este registro se guarda de forma paralela en almacenamiento local institucional para seguimiento docente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {incidentContextBlock && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">{incidentContextBlock.groupLabel} · {incidentContextBlock.subject}</p>
                <p className="text-muted-foreground">Bloque: {incidentContextBlock.startTime} - {incidentContextBlock.endTime}</p>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="teacher-name">Docente</Label>
                <Input id="teacher-name" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="Nombre completo del docente" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-email">Correo</Label>
                <Input id="teacher-email" type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} placeholder="docente@institucion.edu" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident-date">Fecha de incidencia</Label>
              <Input id="incident-date" type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
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
                <Label htmlFor="delay-time">Hora de llegada / retardo</Label>
                <Input id="delay-time" type="time" value={delayTime} onChange={(e) => setDelayTime(e.target.value)} />
              </div>
            )}

            {status === 'salida_anticipada' && (
              <div className="space-y-2">
                <Label htmlFor="early-exit-time">Hora de salida anticipada</Label>
                <Input id="early-exit-time" type="time" value={earlyExitTime} onChange={(e) => setEarlyExitTime(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="institutional-notes">Observaciones Institucionales</Label>
              <Textarea
                id="institutional-notes"
                value={institutionalNotes}
                onChange={(e) => setInstitutionalNotes(e.target.value)}
                placeholder="Describe el contexto institucional de la incidencia..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIncidentDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateLog}>Guardar Incidencia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Agregar Bloque de Horario</DialogTitle>
            <DialogDescription>
              Define día, hora, materia y docente para el grupo seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={scheduleGroupId} onValueChange={setScheduleGroupId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un grupo" /></SelectTrigger>
                <SelectContent>
                  {syncedGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>{group.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dia</Label>
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
                <Label>Hora Inicio</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hora Fin</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Materia</Label>
              <Select value={scheduleSubject} onValueChange={setScheduleSubject}>
                <SelectTrigger><SelectValue placeholder="Selecciona una materia o usa el campo manual" /></SelectTrigger>
                <SelectContent>
                  {subjectCatalog.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={manualScheduleSubject} onChange={(e) => setManualScheduleSubject(e.target.value)} placeholder="Materia manual (si no esta en el catalogo)" />
            </div>
            <div className="space-y-2">
              <Label>Origen del docente</Label>
              <div className="flex gap-2">
                <Button type="button" variant={teacherMode === 'directory' ? 'default' : 'outline'} onClick={() => setTeacherMode('directory')}>Catalogo</Button>
                <Button type="button" variant={teacherMode === 'manual' ? 'default' : 'outline'} onClick={() => setTeacherMode('manual')}>Manual</Button>
              </div>
            </div>
            {teacherMode === 'directory' ? (
              <div className="space-y-2">
                <Label>Docente del catalogo</Label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un docente" /></SelectTrigger>
                  <SelectContent>
                    {teacherDirectory.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}{teacher.email ? ` (${teacher.email})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre docente</Label>
                  <Input value={scheduleTeacherName} onChange={(e) => setScheduleTeacherName(e.target.value)} placeholder="Nombre del docente" />
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
            <Button onClick={handleCreateScheduleBlock}>Guardar bloque</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}