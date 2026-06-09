'use client';

import { useEffect, useMemo, useState } from 'react';
import { TutorPartialView, TutorService, TutorStudentView } from './tutor-service';
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
import { useData } from '@/hooks/use-data';

export default function TutorDashboard() {
  const [availableGroups, setAvailableGroups] = useState<OfficialGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedPartialView, setSelectedPartialView] = useState<TutorPartialView>('p1');
  const [students, setStudents] = useState<TutorStudentView[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
    const { activePartialId, setActivePartialId } = useData();

    useEffect(() => {
        setSelectedPartialView(activePartialId as TutorPartialView);
    }, [activePartialId]);

  useEffect(() => {
        if (authLoading) return;

        if (!user?.email) {
            setAvailableGroups([]);
            setSelectedGroupId(null);
            setDataLoading(false);
            return;
        }

        setDataLoading(true);
        const unsubscribe = TutorService.subscribeTutorGroupsForEmail(
            user.email,
            (groups) => {
                setAvailableGroups(groups);
                setSelectedGroupId((prev) => {
                    if (groups.length === 0) return null;
                    if (prev && groups.some((group) => group.id === prev)) return prev;
                    return groups[0].id;
                });
                setDataLoading(false);
            },
            (error) => {
                console.error('Error subscribing tutor groups', error);
                setDataLoading(false);
            },
        );

        return () => unsubscribe();
  }, [user, authLoading]);

  useEffect(() => {
            if (!selectedGroupId) {
                    setStudents([]);
                    return;
            }

            setDataLoading(true);
            const unsubscribe = TutorService.subscribeStudentsWithAnalytics(
                selectedGroupId,
                selectedPartialView,
                (studentsData) => {
                    setStudents(studentsData);
                    setDataLoading(false);
                },
                (e) => {
                    console.error("Error fetching students analytics", e);
                    toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos del grupo." });
                    setDataLoading(false);
                },
            );

            return () => unsubscribe();
    }, [selectedGroupId, selectedPartialView, toast]);

  const activeGroup = availableGroups.find(g => g.id === selectedGroupId);

    const subjectOverview = useMemo(() => {
        const subjectMap = new Map<string, {
            subject: string;
            totalCompletion: number;
            entries: number;
            atRiskStudents: number;
            touchedStudents: Set<string>;
            criticalStudents: Array<{ id: string; name: string; completionRate: number; absencePercentage: number }>;
            lastUpdatedMs: number;
        }>();

        students.forEach((student) => {
            const snapshots = student.subjectSnapshots || [];
            snapshots.forEach((snapshot) => {
                const key = snapshot.subject.trim().toLowerCase();
                if (!key) return;

                if (!subjectMap.has(key)) {
                    subjectMap.set(key, {
                        subject: snapshot.subject,
                        totalCompletion: 0,
                        entries: 0,
                        atRiskStudents: 0,
                        touchedStudents: new Set<string>(),
                        criticalStudents: [],
                        lastUpdatedMs: 0,
                    });
                }

                const current = subjectMap.get(key)!;
                current.totalCompletion += snapshot.completionRate;
                current.entries += 1;

                if (!current.touchedStudents.has(student.id) && snapshot.failingRisk) {
                    current.atRiskStudents += 1;
                    current.touchedStudents.add(student.id);
                }

                if (snapshot.failingRisk || snapshot.completionRate < 70 || student.riskVariables.dropoutRisk) {
                    current.criticalStudents.push({
                        id: student.id,
                        name: student.name,
                        completionRate: snapshot.completionRate,
                        absencePercentage: student.absencePercentage,
                    });
                }

                const updatedMs = snapshot.lastUpdated ? new Date(snapshot.lastUpdated).getTime() : 0;
                if (updatedMs > current.lastUpdatedMs) {
                    current.lastUpdatedMs = updatedMs;
                }
            });
        });

        return Array.from(subjectMap.values())
            .map((item) => {
                const avgCompletion = item.entries > 0 ? item.totalCompletion / item.entries : 0;
                const riskRate = students.length > 0 ? (item.atRiskStudents / students.length) * 100 : 0;

                let level: 'alto' | 'medio' | 'bajo' = 'bajo';
                if (riskRate >= 40 || avgCompletion < 60) level = 'alto';
                else if (riskRate >= 20 || avgCompletion < 75) level = 'medio';

                return {
                    subject: item.subject,
                    avgCompletion,
                    atRiskStudents: item.atRiskStudents,
                    riskRate,
                    level,
                    criticalStudents: item.criticalStudents
                        .sort((a, b) => {
                            if (a.completionRate !== b.completionRate) {
                                return a.completionRate - b.completionRate;
                            }
                            return b.absencePercentage - a.absencePercentage;
                        })
                        .slice(0, 3),
                    lastUpdatedMs: item.lastUpdatedMs,
                };
            })
            .sort((a, b) => {
                const severity = { alto: 3, medio: 2, bajo: 1 };
                if (severity[b.level] !== severity[a.level]) {
                    return severity[b.level] - severity[a.level];
                }
                return b.riskRate - a.riskRate;
            });
    }, [students]);

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

             <Select
                 value={selectedPartialView}
                 onValueChange={(value) => {
                     const nextValue = value as TutorPartialView;
                     setSelectedPartialView(nextValue);
                     if (nextValue === 'p1' || nextValue === 'p2' || nextValue === 'p3') {
                         void setActivePartialId(nextValue);
                     }
                 }}
             >
                 <SelectTrigger className="w-[220px]">
                     <SelectValue placeholder="Selecciona parcial" />
                 </SelectTrigger>
                 <SelectContent>
                     <SelectItem value="p1">Primer parcial</SelectItem>
                     <SelectItem value="p2">Segundo parcial</SelectItem>
                     <SelectItem value="p3">Tercer parcial</SelectItem>
                     <SelectItem value="semester">Semestral (promedio)</SelectItem>
                 </SelectContent>
             </Select>
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Riesgo Académico por Asignatura
                    </CardTitle>
                    <CardDescription>
                        Monitoreo en tiempo real para priorizar intervención tutorial por materia.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {subjectOverview.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aún no hay métricas por asignatura para este grupo. Captura actividades o calificaciones para habilitar el análisis.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {subjectOverview.map((subject) => {
                                const badgeStyle =
                                    subject.level === 'alto'
                                        ? 'bg-red-100 text-red-800 border-red-200'
                                        : subject.level === 'medio'
                                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                                            : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                                return (
                                    <div key={subject.subject} className="rounded-lg border p-4 space-y-3 bg-card/60">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold leading-tight">{subject.subject}</p>
                                            <Badge variant="outline" className={badgeStyle}>
                                                Riesgo {subject.level}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Cumplimiento promedio</span>
                                                <span>{subject.avgCompletion.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className={`h-full ${subject.level === 'alto' ? 'bg-red-500' : subject.level === 'medio' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.max(0, Math.min(100, subject.avgCompletion))}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Alumnos en riesgo</span>
                                            <span className="font-semibold">{subject.atRiskStudents} / {students.length}</span>
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            Tasa de riesgo: {subject.riskRate.toFixed(1)}%
                                        </div>

                                        {subject.criticalStudents.length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                    Alumnos prioritarios
                                                </p>
                                                <ul className="space-y-1">
                                                    {subject.criticalStudents.map((student) => (
                                                        <li key={student.id} className="text-xs flex items-center justify-between gap-2">
                                                            <span className="truncate">{student.name}</span>
                                                            <span className="text-muted-foreground">{student.completionRate.toFixed(0)}% / {student.absencePercentage.toFixed(0)}%</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {subject.lastUpdatedMs > 0 && (
                                            <div className="text-[11px] text-muted-foreground">
                                                Actualizado: {new Date(subject.lastUpdatedMs).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

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
                    {student.completionRate.toFixed(1)}%
                </span>
                <span className="text-[10px] text-muted-foreground">Cumplimiento Académico</span>
            </div>
        </div>

        {/* Integración PIGEC-130: Removida para evitar corrupción de datos por propiedades inexistentes */}

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
