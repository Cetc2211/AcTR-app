
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, isAfter, startOfWeek, startOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, where, getDocs, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this matches your firebase export
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Mail, MessageCircle, User, Calendar, ClipboardList, AlertTriangle, TrendingUp, History, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface StudentTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  tutorName?: string;
  tutorPhone?: string;
  studentPhone?: string;
}

interface AbsenceRecord {
  id: string;
  date: string; // stored as string dd/MM/yyyy usually
  groupName: string;
  teacherEmail: string;
  timestamp: string;
}

interface TrackingLog {
  id: string;
  date: any; // Timestamp
  actionType: 'call_tutor' | 'call_student' | 'whatsapp_tutor' | 'whatsapp_student' | 'home_visit' | 'citatorio' | 'other';
  result: 'no_answer' | 'justified' | 'agreement' | 'continuing_monitor' | 'student_found' | 'other';
  notes: string;
  author: string;
}

const ACTION_LABELS = {
  call_tutor: 'Llamada a Tutor',
  call_student: 'Llamada a Estudiante',
  whatsapp_tutor: 'WhatsApp Tutor',
  whatsapp_student: 'WhatsApp Estudiante',
  home_visit: 'Visita Domiciliaria',
  citatorio: 'Citatorio',
  other: 'Otro'
};

const RESULT_LABELS = {
  no_answer: 'Sin respuesta',
  justified: 'Justificado',
  agreement: 'Acuerdo / Compromiso',
  continuing_monitor: 'En seguimiento',
  student_found: 'Estudiante contactado',
  other: 'Otro'
};

export function StudentTrackingDialog({ 
  open, 
  onOpenChange, 
  studentId, 
  studentName,
  tutorName,
  tutorPhone,
  studentPhone 
}: StudentTrackingDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  
  // Data
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [logs, setLogs] = useState<TrackingLog[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    week: 0,
    month: 0,
    riskLevel: 'low' as 'low' | 'medium' | 'high'
  });

  // New Log State
  const [newLogType, setNewLogType] = useState<string>('');
  const [newLogResult, setNewLogResult] = useState<string>('');
  const [newLogNotes, setNewLogNotes] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

  useEffect(() => {
    if (open && studentId) {
      loadStudentData();
    }
  }, [open, studentId]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Absences (Need to filter manually on client or complex query)
      // Since 'absentStudents' is an array of objects in 'absences' collection, we can't easily query
      // unless we save 'studentIds' array in the record. 
      // Assumption: The system might not have 'studentIds' array. I'll read all absences (cached?) or try to query specific dates?
      // BETTER: Query ALL absences (might be heavy eventually) -> Filter client side. 
      // OPTIMIZATION: Created a composite index or just fetch last 30 days? 
      // FOR NOW: Fetch all absences collection and filter. (Warning: scalability)
      
      const absencesRef = collection(db, 'absences');
      // Ideally we should have: where('studentIds', 'array-contains', studentId)
      // But based on previous file read, it's an array of objects: absentStudents: {id, name...}[]
      // We CANNOT query array of objects easily. 
      // Fallback: Fetch all documents (limited by date maybe?) 
      // Let's assume for this version we fetch all. In prod, update schema to include `studentIds` array.
      
      const qAbsences = query(absencesRef, orderBy('timestamp', 'desc'));
      const absencesSnap = await getDocs(qAbsences);
      
      const studentAbsences: AbsenceRecord[] = [];
      absencesSnap.forEach(doc => {
        const data = doc.data();
        // Check if student is in the array
        const isAbsent = data.absentStudents?.some((s: any) => s.id === studentId);
        if (isAbsent) {
          studentAbsences.push({
            id: doc.id,
            date: data.date,
            groupName: data.groupName,
            teacherEmail: data.teacherEmail,
            timestamp: data.timestamp
          });
        }
      });
      
      setAbsences(studentAbsences);

      // 2. Calculate Stats
      const now = new Date();
      const oneWeekAgo = subDays(now, 7);
      const oneMonthAgo = startOfMonth(now);
      
      const weekCount = studentAbsences.filter(a => isAfter(parseISO(a.timestamp), oneWeekAgo)).length;
      const monthCount = studentAbsences.filter(a => isAfter(parseISO(a.timestamp), oneMonthAgo)).length;
      const totalCount = studentAbsences.length;
      
      let risk = 'low';
      if (totalCount >= 10 || weekCount >= 3) risk = 'high';
      else if (totalCount >= 5 || weekCount >= 2) risk = 'medium';
      
      setStats({
        total: totalCount,
        week: weekCount,
        month: monthCount,
        riskLevel: risk as any
      });

      // 3. Fetch Logs
      const logsRef = collection(db, 'tracking_logs');
      const qLogs = query(logsRef, where('studentId', '==', studentId), orderBy('date', 'desc'));
      const logsSnap = await getDocs(qLogs);
      
      const fetchedLogs: TrackingLog[] = [];
      logsSnap.forEach(doc => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as TrackingLog);
      });
      setLogs(fetchedLogs);

    } catch (error) {
      console.error("Error loading student data:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Error al cargar datos del estudiante.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async () => {
    if (!newLogType || !newLogResult) {
      toast({ variant: 'destructive', title: 'Campos requeridos', description: 'Selecciona una acción y un resultado.' });
      return;
    }

    setSubmittingLog(true);
    try {
      const logData = {
        studentId,
        date: Timestamp.now(),
        actionType: newLogType,
        result: newLogResult,
        notes: newLogNotes,
        author: 'Responsable Seguimiento' // Ideally get from Auth context
      };
      
      const docRef = await addDoc(collection(db, 'tracking_logs'), logData);
      
      setLogs(prev => [{ id: docRef.id, ...logData } as TrackingLog, ...prev]);
      setNewLogType('');
      setNewLogResult('');
      setNewLogNotes('');
      toast({ title: 'Bitácora actualizada', description: 'Se ha registrado la acción de seguimiento.' });
      
    } catch (error) {
       console.error("Error adding log:", error);
       toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el registro.' });
    } finally {
      setSubmittingLog(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'high': return 'text-red-500 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-green-600 bg-green-100 border-green-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
           <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                  <AvatarFallback>{studentName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                  <DialogTitle className="text-xl">{studentName}</DialogTitle>
                  <DialogDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {studentId}</span>
                      {tutorPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Tutor: {tutorPhone}</span>}
                  </DialogDescription>
              </div>
              <div className={`px-4 py-2 rounded-lg border flex flex-col items-center ${getRiskColor(stats.riskLevel)}`}>
                  <span className="text-xs font-bold uppercase">Riesgo</span>
                  <span className="font-bold">{stats.riskLevel === 'high' ? 'ALTO' : stats.riskLevel === 'medium' ? 'MEDIO' : 'BAJO'}</span>
              </div>
           </div>
        </DialogHeader>

        {loading ? (
             <div className="flex-1 flex items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList>
                <TabsTrigger value="overview">Resumen & Estadísticas</TabsTrigger>
                <TabsTrigger value="bitacora">Bitácora de Acciones</TabsTrigger>
                <TabsTrigger value="history">Historial de Faltas</TabsTrigger>
            </TabsList>
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="flex-1 overflow-auto p-6 space-y-6">
             <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Faltas Totales</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Faltas este Mes</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{stats.month}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Faltas esta Semana</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{stats.week}</div></CardContent>
                </Card>
             </div>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Análisis de Riesgo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Basado en los reportes de inasistencias acumulados. Un número alto de reportes indica un riesgo crítico de abandono o reprobación por inasistencia.
                        </p>
                        <div className="flex gap-4">
                            <div className="flex-1 p-4 rounded-lg bg-muted/40 border">
                                <h4 className="font-semibold mb-2">Estado Actual</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        {stats.riskLevel === 'high' ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        <span>Frecuencia de inasistencias: <strong>{stats.riskLevel === 'high' ? 'Crítica' : 'Normal'}</strong></span>
                                    </li>
                                    <li>Última falta: <strong>{absences.length > 0 ? absences[0].date : 'N/A'}</strong></li>
                                </ul>
                            </div>
                            <div className="flex-1 p-4 rounded-lg bg-muted/40 border">
                                <h4 className="font-semibold mb-2">Recomendaciones</h4>
                                <ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground">
                                    {stats.riskLevel === 'high' 
                                        ? <li>Contactar urgentemente al tutor.</li>
                                        : <li>Continuar monitoreo regular.</li>
                                    }
                                    {stats.riskLevel === 'high' && <li>Programar visita domiciliaria si no hay respuesta.</li>}
                                    <li>Verificar justificaciones pendientes en bitácora.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
             </Card>
          </TabsContent>

          {/* BITACORA TAB */}
          <TabsContent value="bitacora" className="flex-1 overflow-hidden flex flex-col p-0">
             <div className="flex-1 flex flex-col md:flex-row h-full">
                {/* Form Side */}
                <div className="w-full md:w-1/3 border-r p-6 bg-muted/10 overflow-auto">
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Registrar Acción</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo de Acción</label>
                            <Select value={newLogType} onValueChange={setNewLogType}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Resultado / Respuesta</label>
                            <Select value={newLogResult} onValueChange={setNewLogResult}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(RESULT_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notas Adicionales</label>
                            <Textarea 
                                placeholder="Detalles de la conversación, acuerdos, etc." 
                                value={newLogNotes}
                                onChange={e => setNewLogNotes(e.target.value)}
                                rows={4}
                            />
                        </div>
                        <Button className="w-full" onClick={handleAddLog} disabled={submittingLog}>
                            {submittingLog ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Guardar Registro
                        </Button>
                    </div>
                </div>

                {/* List Side */}
                <div className="flex-1 p-6 overflow-auto bg-background">
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><History className="h-4 w-4" /> Historial de Acciones</h3>
                    {logs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                            No hay acciones registradas en la bitácora.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map(log => (
                                <div key={log.id} className="border rounded-lg p-4 bg-card shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="font-bold">
                                            {ACTION_LABELS[log.actionType as keyof typeof ACTION_LABELS] || log.actionType}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {log.date?.seconds ? format(new Date(log.date.seconds * 1000), "PPP p", { locale: es }) : 'Fecha desconocida'}
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-sm font-medium">Resultado: </span>
                                        <span className="text-sm text-muted-foreground">
                                            {RESULT_LABELS[log.result as keyof typeof RESULT_LABELS] || log.result}
                                        </span>
                                    </div>
                                    {log.notes && (
                                        <div className="text-sm bg-muted/50 p-2 rounded mt-2">
                                            {log.notes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="flex-1 overflow-auto p-6">
             <div className="space-y-4">
                <h3 className="font-semibold">Historial Detallado de Faltas</h3>
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground">
                            <tr>
                                <th className="p-3 font-medium">Fecha</th>
                                <th className="p-3 font-medium">Materia / Grupo</th>
                                <th className="p-3 font-medium">Reportado por</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {absences.map(absence => (
                                <tr key={absence.id} className="hover:bg-muted/50">
                                    <td className="p-3">{absence.date}</td>
                                    <td className="p-3 font-medium">{absence.groupName}</td>
                                    <td className="p-3 text-muted-foreground">{absence.teacherEmail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
