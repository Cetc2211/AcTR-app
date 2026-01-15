
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, isAfter, startOfWeek, startOfMonth, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, where, getDocs, addDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Ensure this matches your firebase export
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Mail, MessageCircle, User, Calendar, ClipboardList, AlertTriangle, TrendingUp, History, CheckCircle2, MapPin, FileText, FileDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import jsPDF from 'jspdf';
import { Separator } from "@/components/ui/separator";
import { analyzeIRC, IRCAnalysis } from '@/lib/irc-calculation';
import { Label } from "@/components/ui/label";
// Removed Slider import as per Requirement 1.1 and 1.2


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
  const { triggerPedagogicalCheck, settings, allObservations } = useData();
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

  // Clinical Data State (Local Intelligence)
  const [neuropsiTotal, setNeuropsiTotal] = useState<string>('');
  const [gad7Score, setGad7Score] = useState<number>(0); 
  const [currentGrade, setCurrentGrade] = useState<string>('85'); // Default/Estimated
  
  // Computed Risk
  const [ircAnalysis, setIrcAnalysis] = useState<IRCAnalysis | null>(null);

  // Recalculate IRC when inputs change
  useEffect(() => {
     // Estimate attendance based on absences (assuming ~50 sessions per partial/semester)
     const estimatedAttendance = Math.max(0, 100 - (stats.total * 2));
     
     const analysis = analyzeIRC(
        estimatedAttendance, 
        parseFloat(currentGrade) || 0, 
        gad7Score, // 0-21 (Internal)
        parseFloat(neuropsiTotal) || 0 // 0-100 (Internal)
     );
     setIrcAnalysis(analysis);
  }, [stats.total, currentGrade, gad7Score, neuropsiTotal]);

  useEffect(() => {
    // Pedagogical Observer (Technical Spec 2.0)
    // Automatically checks for pending recommendations when student profile loads
    if (open && studentId) {
        triggerPedagogicalCheck(studentId);
    }
  }, [open, studentId, triggerPedagogicalCheck]);

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
      
      // REMOVED orderBy from Firestore query to avoid "Index Required" error or type mismatch issues.
      const qAbsences = query(absencesRef);
      const absencesSnap = await getDocs(qAbsences);
      
      const studentAbsences: AbsenceRecord[] = [];
      absencesSnap.forEach(doc => {
        const data = doc.data();
        
        // Safety check: ensure absentStudents is an array
        if (!Array.isArray(data.absentStudents)) return;

        // Check if student is in the array
        const isAbsent = data.absentStudents.some((s: any) => s && s.id === studentId);
        
        if (isAbsent) {
          // Robust timestamp handling
          let ts = data.timestamp;
          // Setup a safe fallback date string if timestamp is missing or weird
          let safeDateStr = new Date().toISOString(); 
          
          if (typeof ts === 'string') {
              safeDateStr = ts;
          } else if (ts && typeof ts.toDate === 'function') {
              safeDateStr = ts.toDate().toISOString();
          }

          studentAbsences.push({
            id: doc.id,
            date: data.date || '',
            groupName: data.groupName || 'Sin grupo',
            teacherEmail: data.teacherEmail || '',
            timestamp: safeDateStr
          });
        }
      });
      
      // Sort client-side by timestamp descending
      studentAbsences.sort((a, b) => {
          const dateA = new Date(a.timestamp);
          const dateB = new Date(b.timestamp);
          return dateB.getTime() - dateA.getTime();
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
      // REMOVED orderBy from Firestore query to avoid "Index Required" error. Sorting client-side.
      const qLogs = query(logsRef, where('studentId', '==', studentId));
      const logsSnap = await getDocs(qLogs);
      
      const fetchedLogs: TrackingLog[] = [];
      logsSnap.forEach(doc => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as TrackingLog);
      });
      
      // Sort in memory by date descending
      fetchedLogs.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
      });

      setLogs(fetchedLogs);

    } catch (error: any) {
      console.error("Error loading student data:", error);
      toast({ 
          variant: 'destructive', 
          title: 'Error de carga', 
          description: `No se pudieron cargar los datos: ${error.message || 'Error desconocido'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFollowUpPDF = () => {
    // 1. Setup
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Helper for centering text
    const centerText = (text: string, yPos: number, size = 12, isBold = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, yPos);
    };

    // 2. Header
    if (settings?.logo) {
         try {
             doc.addImage(settings.logo, 'PNG', 15, 10, 20, 20);
         } catch(e) {/* ignore */}
    }
    
    centerText(settings?.institutionName || "CBTa 130", y, 16, true);
    y += 10;
    centerText("INFORME DE SEGUIMIENTO ADMINISTRATIVO", y, 14, true);
    y += 15;

    // 3. Student Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Estudiante: ${studentName}`, 20, y);
    doc.text(`Fecha de Informe: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - 70, y);
    y += 7;
    if (studentId) doc.text(`Matrícula: ${studentId}`, 20, y);
    y += 10;

    // 4. Attendance Chart (Simulated)
    const chartY = y;
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, y, pageWidth - 40, 45); // Container
    doc.setFontSize(11);
    doc.text("Resumen de Inasistencias", 25, y + 8);
    
    // Draw bars
    const maxVal = Math.max(stats.total, 10); 
    const barHeight = 25;
    const barWidth = 30;
    const startX = 40;
    const barsY = y + 38; 
    
    doc.setFontSize(9);
    // Total
    const hTotal = (stats.total / maxVal) * barHeight;
    doc.setFillColor(60, 130, 246); // Blue
    doc.rect(startX, barsY - hTotal, barWidth, hTotal, 'F');
    doc.text(`Total: ${stats.total}`, startX + 5, barsY + 4);

    // Month
    const hMonth = (stats.month / maxVal) * barHeight;
    doc.setFillColor(248, 113, 113); // Red
    doc.rect(startX + 50, barsY - hMonth, barWidth, hMonth, 'F');
    doc.text(`Mes: ${stats.month}`, startX + 55, barsY + 4);

    // Week
    const hWeek = (stats.week / maxVal) * barHeight;
    doc.setFillColor(74, 222, 128); // Green
    doc.rect(startX + 100, barsY - hWeek, barWidth, hWeek, 'F');
    doc.text(`Semana: ${stats.week}`, startX + 105, barsY + 4);

    y += 55;

    // 5. Automatic Summary & Status
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen Ejecutivo:", 20, y);
    y += 5;
    
    doc.setFont("helvetica", "normal");
    const summary = `Se han registrado un total de ${logs.length} intervenciones de seguimiento y ${stats.total} faltas acumuladas hasta la fecha. ` + 
                    `El nivel de riesgo de deserción calculado por el sistema es: ${stats.riskLevel === 'high' ? 'ALTO' : stats.riskLevel === 'medium' ? 'MODERADO' : 'BAJO'}.`;
    
    const splitSummary = doc.splitTextToSize(summary, pageWidth - 40);
    doc.text(splitSummary, 20, y);
    y += splitSummary.length * 5 + 10;

    // Ethical/Status Label
    doc.setFont("helvetica", "bold");
    doc.text("Estatus de Protocolo:", 20, y);
    doc.setFont("helvetica", "normal");
    if (stats.riskLevel === 'high') {
         doc.text("Estudiante bajo protocolo de apoyo institucional.", 60, y);
    } else {
         doc.text("Seguimiento ordinario administrativo.", 60, y);
    }
    y += 15;
    
    // 6. Logs Table
    doc.setFont("helvetica", "bold");
    doc.text("Historial de Intervenciones:", 20, y);
    y += 8;

    logs.forEach((log) => {
        if (y > 250) {
            doc.addPage();
            y = 20;
        }
        
        let dateStr = 'Fecha desconocida';
        if (log.date) {
            if (log.date.seconds) {
                 dateStr = format(new Date(log.date.seconds * 1000), 'dd/MM/yyyy');
            } else if (log.date instanceof Date) {
                 dateStr = format(log.date, 'dd/MM/yyyy');
            } else if (log.date.toDate) {
                 dateStr = format(log.date.toDate(), 'dd/MM/yyyy');
            }
        }

        const action = ACTION_LABELS[log.actionType as keyof typeof ACTION_LABELS] || log.actionType;
        const result = RESULT_LABELS[log.result as keyof typeof RESULT_LABELS] || log.result;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`[${dateStr}] ${action}`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(`Respuesta: ${result}`, 90, y);
        y += 5;
        
        if (log.notes) {
            doc.setFontSize(8);
            doc.setTextColor(80);
            const notes = doc.splitTextToSize(log.notes, pageWidth - 50);
            doc.text(notes, 25, y);
            y += notes.length * 4 + 3;
            doc.setTextColor(0);
        } else {
            y += 2;
        }
    });

    // 7. Signature (Dynamic)
    if (y > 220) {
        doc.addPage();
        y = 40;
    } else {
        y = Math.max(y + 20, 230); // Move to bottom area
    }

    if (settings?.prefectSignature) {
        try {
            // Center signature image
            const imgWidth = 50;
            const imgHeight = 25;
            doc.addImage(settings.prefectSignature, 'PNG', (pageWidth/2) - (imgWidth/2), y - imgHeight + 5, imgWidth, imgHeight); 
        } catch (e) { console.error("Sig error", e); }
    }
    
    doc.setDrawColor(0);
    doc.line((pageWidth/2) - 40, y + 5, (pageWidth/2) + 40, y + 5);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    centerText(settings?.prefectName || "Responsable de Seguimiento", y + 10);
    
    doc.setFont("helvetica", "normal");
    if (settings?.prefectTitle) centerText(settings.prefectTitle, y + 15);

    // Save
    const safeName = (studentName || 'reporte').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`informe_seguimiento_${safeName}.pdf`);
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
              
              <Button size="sm" variant="outline" onClick={generateFollowUpPDF} className="gap-2 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                   <FileDown className="h-4 w-4" /> Informe PDF
              </Button>

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
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Motor de Inteligencia Local (IRC)</CardTitle>
                    <CardDescription>Cálculo de riesgo basado en Regresión Logística (Local First)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm">Datos Clínicos y Académicos</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Promedio Actual</Label>
                                    <Input 
                                        type="number" 
                                        value={currentGrade} 
                                        onChange={(e) => setCurrentGrade(e.target.value)} 
                                        placeholder="0-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                   {/* Replaces Anxiety/Clinical Inputs with Administrative Fields (Requirement 3) */}
                                    <Label>Estado de Localización</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="located">Ubicado por teléfono</SelectItem>
                                            <SelectItem value="pending">Visita pendiente</SelectItem>
                                            <SelectItem value="notified">Padres notificados</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="pt-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Gestión del Rescate</Label>
                                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('bitacora')}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Abrir Bitácora de Acuerdos
                                </Button>
                            </div>
                        </div>

                        {/* Pedagogical Injection Trigger (Requirement 2) - Handled via useEffect */}
                        
                        <div className="space-y-4">
                            <h4 className="font-semibold text-sm">Resultado del Modelo</h4>
                            {ircAnalysis && (
                                <div className={`p-4 rounded-lg border-2 ${
                                    ircAnalysis.riskLevel === 'alto' ? 'border-red-500 bg-red-50' : 
                                    ircAnalysis.riskLevel === 'medio' ? 'border-yellow-500 bg-yellow-50' : 
                                    'border-green-500 bg-green-50'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-lg">IRC: {ircAnalysis.score.toFixed(1)}%</p>
                                            <Badge variant={ircAnalysis.riskLevel === 'alto' ? 'destructive' : 'secondary'}>
                                                RIESGO {ircAnalysis.riskLevel.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="font-semibold">Justificación Multivariada:</span>
                                            <p className="text-muted-foreground">{ircAnalysis.justification}</p>
                                        </div>
                                        {ircAnalysis.riskLevel !== 'bajo' && (
                                            <div className="mt-2 pt-2 border-t border-dashed border-gray-300">
                                                <span className="font-semibold text-primary">Recomendación:</span>
                                                <p>{ircAnalysis.recommendation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
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
