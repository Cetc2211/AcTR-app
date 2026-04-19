'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useTeacherTracking, type TeacherIncidentStatus } from '@/hooks/use-teacher-tracking';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, ClipboardList, PlusCircle, Trash2, Clock3, UserRound } from 'lucide-react';

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

export default function TeacherTrackingPage() {
  const { logs, isLoading, addLog, deleteLog } = useTeacherTracking();
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [incidentDate, setIncidentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<TeacherIncidentStatus>('puntual');
  const [delayTime, setDelayTime] = useState('');
  const [earlyExitTime, setEarlyExitTime] = useState('');
  const [institutionalNotes, setInstitutionalNotes] = useState('');

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
    });

    toast({ title: 'Incidencia registrada', description: 'El seguimiento docente se guardó localmente.' });

    setTeacherName('');
    setTeacherEmail('');
    setIncidentDate(format(new Date(), 'yyyy-MM-dd'));
    setStatus('puntual');
    setDelayTime('');
    setEarlyExitTime('');
    setInstitutionalNotes('');
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-7 w-7" /> Seguimiento Docente</h1>
          <p className="text-muted-foreground">
            Módulo paralelo para registrar incidencias de asistencia docente sin afectar los datos académicos del alumnado.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nueva incidencia
        </Button>
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
            <CardTitle className="text-sm font-medium">Filtrados por Fecha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar Incidencia Docente</DialogTitle>
            <DialogDescription>
              Este registro se guarda de forma paralela en almacenamiento local institucional para seguimiento docente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateLog}>Guardar Incidencia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}