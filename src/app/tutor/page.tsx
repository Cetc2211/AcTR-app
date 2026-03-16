'use client';

import { useEffect, useState } from 'react';
import { TutorService, TutorStudentView } from './tutor-service';
import { TutorReportService } from './report-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OfficialGroup } from '@/lib/placeholder-data';
import { AlertCircle, BookOpen, BrainCircuit, CalendarX, GraduationCap, Users, FileText, Download, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function TutorDashboard() {
  const [availableGroups, setAvailableGroups] = useState<OfficialGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [students, setStudents] = useState<TutorStudentView[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);

  useEffect(() => {
    async function fetchGroups() {
      if (!user?.email) return;
      
      try {
        const groups = await TutorService.getTutorGroupsForEmail(user.email);
        setAvailableGroups(groups);
        
        if (groups.length > 0) {
            setSelectedGroupId(groups[0].id);
        } else {
            setDataLoading(false);
        }
      } catch (error) {
        console.error("Error fetching tutor groups", error);
        setDataLoading(false);
      }
    }
    
    if (!authLoading) {
        fetchGroups();
    }
  }, [user, authLoading]);

  useEffect(() => {
      async function fetchStudents() {
          if (!selectedGroupId) return;
          
          setDataLoading(true);
          try {
            const studentsData = await TutorService.getStudentsWithAnalytics(selectedGroupId);
            setStudents(studentsData);
          } catch (e) {
              console.error("Error fetching students analytics", e);
              toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos del grupo." });
          } finally {
              setDataLoading(false);
          }
      }
      
      fetchStudents();
  }, [selectedGroupId, toast]);

  const activeGroup = availableGroups.find(g => g.id === selectedGroupId);

  const handleUpdateStudent = (updatedStudent: TutorStudentView) => {
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const downloadGroupReport = () => {
      if (activeGroup && students.length > 0) {
          TutorReportService.generateGroupReport(activeGroup.name, students);
          toast({
              title: "Reporte generado",
              description: "La radiografía grupal se ha descargado correctamente.",
          });
      }
  };

  if (authLoading || (dataLoading && availableGroups.length === 0)) {
    return <div className="p-8 flex justify-center items-center min-h-[50vh] flex-col gap-2">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="text-muted-foreground">Cargando Módulo de Tutoría...</span>
    </div>;
  }

  if (availableGroups.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 text-center min-h-[60vh] justify-center">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Sin asignación de tutoría</h2>
        <p className="text-muted-foreground max-w-md">
            No tienes grupos oficiales asignados a tu cuenta ({user?.email}). 
            <br/>Si eres tutor, solicita al administrador que vincule tu correo al grupo correspondiente.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Header del Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Tutoría</h1>
          <div className="flex items-center gap-3 mt-2">
             <span className="text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Viendo: 
             </span>
             {availableGroups.length > 1 ? (
                 <Select value={selectedGroupId || ''} onValueChange={setSelectedGroupId}>
                     <SelectTrigger className="w-[280px]">
                         <SelectValue placeholder="Selecciona un grupo" />
                     </SelectTrigger>
                     <SelectContent>
                         {availableGroups.map(g => (
                             <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                         ))}
                     </SelectContent>
                 </Select>
             ) : (
                <span className="font-semibold text-foreground text-lg">{activeGroup?.name}</span>
             )}
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadGroupReport} className="flex gap-2">
                <FileText className="h-4 w-4" />
                Radiografía Grupal
            </Button>
            <Badge variant="outline" className="text-sm px-3 py-1 flex items-center">
                {students.length} Alumnos
            </Badge>
        </div>
      </div>


      {/* Grid de Alumnos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {students.map((student) => (
          <StudentCard key={student.id} student={student} onUpdate={handleUpdateStudent} />
        ))}
      </div>
    </div>
  );
}

function StudentCard({ student, onUpdate }: { student: TutorStudentView; onUpdate: (s: TutorStudentView) => void }) {
  const isDropoutRisk = student.riskVariables.dropoutRisk;
  const isFailingRisk = student.riskVariables.failingRisk;
  const [actionOpen, setActionOpen] = useState(false);
  const [actionText, setActionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveAction = async () => {
      if (!actionText.trim()) return;
      setIsSaving(true);
      try {
        const newAction = await TutorService.logTutorAction(student.id, actionText);
        // Actualizar estado local
        const updatedStudent = {
            ...student,
            tutorInterventions: [newAction, ...(student.tutorInterventions || [])]
        };
        onUpdate(updatedStudent);
        toast({ title: "Acción registrada", description: "La bitácora del tutor ha sido actualizada." });
        setActionOpen(false);
        setActionText("");
      } catch (error) {
        toast({ title: "Error", description: "No se pudo guardar la acción.", variant: "destructive" });
      } finally {
        setIsSaving(false);
      }
  };
  
  return (
    <Card className={`flex flex-col h-full overflow-hidden border-t-4 ${isDropoutRisk ? 'border-t-destructive shadow-red-100/50 dark:shadow-red-900/20 shadow-md' : isFailingRisk ? 'border-t-orange-500' : 'border-t-primary'}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border">
                    {/* Placeholder para avatar */}
                    <span className="text-lg font-bold text-slate-500">{student.name.charAt(0)}</span>
                </div>
                <div>
                    <CardTitle className="text-lg font-bold leading-tight">{student.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">{student.email}</CardDescription>
                </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
                {isDropoutRisk && (
                    <Badge variant="destructive" className="animate-pulse">Riesgo Deserción</Badge>
                )}
                {isFailingRisk && !isDropoutRisk && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">Riesgo Académico</Badge>
                )}
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4 pb-3">
        {/* Métricas Clave */}
        <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center ${isDropoutRisk ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/50'}`}>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
                    <CalendarX className="h-3.5 w-3.5" />
                    Inasistencias
                </div>
                <span className={`text-2xl font-bold ${isDropoutRisk ? 'text-destructive' : 'text-foreground'}`}>
                    {student.absencePercentage.toFixed(1)}%
                </span>
                <span className="text-[10px] text-muted-foreground">Global Acumulado</span>
            </div>
             <div className="p-3 rounded-lg border bg-muted/50 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Rendimiento
                </div>
                <span className="text-2xl font-bold text-foreground">
                    -- {/* Placeholder para promedio */}
                </span>
                <span className="text-[10px] text-muted-foreground">Promedio General</span>
            </div>
        </div>

        {/* Integración PIGEC-130: Alertas Clínicas */}
        {student.riskVariables.clinicalAlerts.length > 0 && (
            <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BrainCircuit className="h-3.5 w-3.5 text-indigo-500" />
                    Alertas Clínicas (PIGEC)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                    {student.riskVariables.clinicalAlerts.map((alert, i) => (
                        <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800 text-xs py-0.5">
                            {alert}
                        </Badge>
                    ))}
                </div>
            </div>
        )}

        {/* Espejo de Bitácoras (Últimos registros) */}
        <div className="space-y-2 pt-2">
             <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                Bitácora Reciente
            </h4>
            {student.recentLogs.length > 0 ? (
                <ul className="space-y-2">
                    {student.recentLogs.slice(0, 3).map((log) => (
                        <li key={log.id} className="text-xs bg-muted/40 p-2 rounded border border-transparent hover:border-border transition-colors">
                            <div className="flex justify-between items-center mb-0.5">
                                <span className={`font-semibold ${log.type.includes('Problema') ? 'text-orange-600 dark:text-orange-400' : 'text-foreground'}`}>
                                    {log.type}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{new Date(log.date).toLocaleDateString()}</span>
                            </div>
                            <p className="line-clamp-2 text-muted-foreground leading-relaxed">{log.details}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-muted-foreground italic pl-1">Sin registros recientes.</p>
            )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex flex-col gap-3">
        {/* Propuesta de la IA */}
        {student.aiSuggestion ? (
             <Alert className="bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-100 py-3 shadow-sm">
                <div className="flex gap-3">
                    <BrainCircuit className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="space-y-1">
                        <AlertTitle className="text-sm font-bold flex items-center gap-2">
                            Sugerencia IA
                        </AlertTitle>
                        <AlertDescription className="text-xs leading-relaxed opacity-90">
                           {student.aiSuggestion}
                        </AlertDescription>
                    </div>
                </div>
            </Alert>
        ) : (
            <div className="h-4"></div> /* Spacer para alinear cards */
        )}
        
        <Separator />
        
        <div className="w-full pt-2 flex justify-between items-center text-xs gap-2">
           <Dialog open={actionOpen} onOpenChange={setActionOpen}>
               <DialogTrigger asChild>
                   <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-primary px-2">
                       <PlusCircle className="h-3.5 w-3.5 mr-1" /> Registrar Acción
                   </Button>
               </DialogTrigger>
               <DialogContent>
                   <DialogHeader>
                       <DialogTitle>Registrar Acción Tutorial</DialogTitle>
                       <DialogDescription>
                           Bitácora de seguimiento para {student.name}. Esta información aparecerá en los reportes oficiales.
                       </DialogDescription>
                   </DialogHeader>
                   <div className="space-y-4 py-2">
                       <Textarea 
                          placeholder="Describe la intervención (ej. Se realizó entrevista con padre de familia...)" 
                          value={actionText}
                          onChange={(e) => setActionText(e.target.value)}
                          className="min-h-[100px]"
                       />
                   </div>
                   <DialogFooter>
                       <Button variant="outline" onClick={() => setActionOpen(false)}>Cancelar</Button>
                       <Button onClick={handleSaveAction} disabled={isSaving || !actionText.trim()}>
                           {isSaving ? 'Guardando...' : 'Guardar en Bitácora'}
                       </Button>
                   </DialogFooter>
               </DialogContent>
           </Dialog>

           <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-primary hover:text-primary/80 px-2 font-medium"
                onClick={() => TutorReportService.generateIndividualReport(student)}
           >
               <Download className="h-3.5 w-3.5 mr-1" /> Reporte PDF
           </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
