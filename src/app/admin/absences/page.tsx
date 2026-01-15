'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore'; // Added updateDoc
import { db, auth } from '@/lib/firebase';
import { useData } from '@/hooks/use-data';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Phone, CheckCircle, XCircle, UserX, MoreHorizontal, MessageCircle, AlertTriangle, Trash2, Edit, Contact, Settings, ClipboardList, FileBarChart, Download, PieChart } from 'lucide-react'; // Added icons
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; 
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrackingSettingsDialog, DEFAULT_TUTOR_MESSAGE, TrackingSettings } from '@/components/tracking-settings-dialog';
import { StudentTrackingDialog } from '@/components/student-tracking-dialog';
import jsPDF from 'jspdf';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ADMIN_EMAIL = "mpceciliotopetecruz@gmail.com";

type AbsenceRecord = {
  id: string;
  groupId: string;
  groupName: string;
  date: string;
  teacherId: string;
  teacherEmail: string;
  absentStudents: { 
      id: string; 
      name: string;
      tutorName?: string;
      tutorPhone?: string;
      studentPhone?: string; // New field
  }[];
  whatsappLink?: string;
  timestamp: string;
};

export default function AbsencesPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const { settings } = useData(); // Get Global Settings and User Identity
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const [date, setDate] = useState<Date>(new Date());
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Report Generation State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState<Date | undefined>(new Date());
  const [reportEndDate, setReportEndDate] = useState<Date | undefined>(new Date());
  const [generatingReport, setGeneratingReport] = useState(false);

  // Dialog State for Contact Info
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<{ 
      recordId: string, 
      studentId: string, 
      name: string, 
      currentTutorName: string, 
      currentTutorPhone: string,
      currentStudentPhone: string 
  } | null>(null);
  const [newTutorName, setNewTutorName] = useState('');
  const [newTutorPhone, setNewTutorPhone] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState(''); // New state
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);

  // Tracking / Bitacora State
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [selectedTrackingStudent, setSelectedTrackingStudent] = useState<{
    id: string;
    name: string;
    tutorName?: string;
    tutorPhone?: string;
    studentPhone?: string;
  } | null>(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings>({
    contactPhones: '',
    tutorMessageTemplate: DEFAULT_TUTOR_MESSAGE
  });

  // Verify access
  useEffect(() => {
    const verifyAccess = async () => {
        if (loadingAuth) return;
        
        if (!user) {
            router.push('/login');
            return;
        }

        if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            setHasAccess(true);
            return;
        }

        try {
            const docRef = doc(db, 'app_config', 'roles');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const managers = data.tracking_managers || [];
                if (managers.some((email: string) => email.toLowerCase() === user.email?.toLowerCase())) {
                    setHasAccess(true);
                } else {
                    setHasAccess(false);
                }
            } else {
                setHasAccess(false);
            }

            // Load settings if access is granted (or just load them anyway, access check handles visibility)
            const settingsRef = doc(db, 'app_config', 'tracking_settings');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
                setTrackingSettings(settingsSnap.data() as TrackingSettings);
            }

        } catch (e) {
            console.error("Error checking permissions:", e);
            setHasAccess(false);
        }
    };
    verifyAccess();
  }, [user, loadingAuth, router]);

  const fetchAbsences = async (selectedDate: Date) => {
    if (!hasAccess) return; // Don't fetch if no access

    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'dd/MM/yyyy');
      console.log("Fetching absences for:", formattedDate);
      
      const q = query(
        collection(db, 'absences'),
        where('date', '==', formattedDate)
      );

      const querySnapshot = await getDocs(q);
      const fetchedRecords: AbsenceRecord[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRecords.push({ id: doc.id, ...doc.data() } as AbsenceRecord);
      });

      setRecords(fetchedRecords);
    } catch (error) {
      console.error("Error fetching absences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecord = async (recordId: string) => {
      if (!confirm('¿Estás seguro de querer eliminar este reporte de inasistencias?')) return;
      
      try {
          await deleteDoc(doc(db, 'absences', recordId));
          setRecords(prev => prev.filter(r => r.id !== recordId));
          toast({ title: 'Reporte eliminado', description: 'El reporte de inasistencias ha sido eliminado.' });
      } catch (error) {
          console.error("Error deleting record:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el reporte.' });
      }
  };

  const generateTutorMessage = (studentName: string, tutorName?: string) => {
    let message = trackingSettings.tutorMessageTemplate || DEFAULT_TUTOR_MESSAGE;
    const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
    
    // Replace placeholders
    message = message.replace(/{studentName}/g, studentName);
    message = message.replace(/{tutorName}/g, tutorName || 'Tutor');
    message = message.replace(/{date}/g, today);
    message = message.replace(/{contactPhones}/g, trackingSettings.contactPhones || '[Teléfonos no configurados]');
    
    return message;
  };

  const openContactDialog = (recordId: string, student: { id: string, name: string, tutorName?: string, tutorPhone?: string, studentPhone?: string }) => {
      setEditingStudent({
          recordId,
          studentId: student.id,
          name: student.name,
          currentTutorName: student.tutorName || '',
          currentTutorPhone: student.tutorPhone || '',
          currentStudentPhone: student.studentPhone || ''
      });
      setNewTutorName(student.tutorName || '');
      setNewTutorPhone(student.tutorPhone || '');
      setNewStudentPhone(student.studentPhone || '');
      setIsContactDialogOpen(true);
  };

  const openTrackingDialog = (student: { id: string, name: string, tutorName?: string, tutorPhone?: string, studentPhone?: string }) => {
    setSelectedTrackingStudent(student);
    setIsTrackingDialogOpen(true);
  };

  const handleUpdateContact = async () => {
      if (!editingStudent) return;
      setIsUpdatingContact(true);

      try {
          // Update local state first to be responsive
          const updatedRecords = records.map(record => {
              if (record.id === editingStudent.recordId) {
                  return {
                      ...record,
                      absentStudents: record.absentStudents.map(s => {
                          if (s.id === editingStudent.studentId) {
                              return { 
                                  ...s, 
                                  tutorName: newTutorName, 
                                  tutorPhone: newTutorPhone,
                                  studentPhone: newStudentPhone 
                              };
                          }
                          return s;
                      })
                  };
              }
              return record;
          });
          setRecords(updatedRecords);

          // Update Firestore
          const recordToUpdate = records.find(r => r.id === editingStudent.recordId);
          if (recordToUpdate) {
               const newAbsentStudents = recordToUpdate.absentStudents.map(s => {
                  if (s.id === editingStudent.studentId) {
                      return { 
                          ...s, 
                          tutorName: newTutorName, 
                          tutorPhone: newTutorPhone,
                          studentPhone: newStudentPhone 
                      };
                  }
                  return s;
               });
               
               const docRef = doc(db, 'absences', editingStudent.recordId);
               await updateDoc(docRef, { absentStudents: newAbsentStudents });
               toast({ title: 'Contacto actualizado', description: 'La información de contacto ha sido guardada.' });
          }

          setIsContactDialogOpen(false);
      } catch (e) {
          console.error("Error updating contact:", e);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el contacto.' });
      } finally {
          setIsUpdatingContact(false);
      }
  };

  const generateExecutiveReport = async () => {
    if (!reportStartDate || !reportEndDate) {
        toast({ variant: 'destructive', title: 'Fechas requeridas', description: 'Selecciona un rango de fechas.' });
        return;
    }

    setGeneratingReport(true);
    try {
        const start = new Date(reportStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(reportEndDate);
        end.setHours(23, 59, 59, 999);

        // 1. Fetch Tracking Logs (Interventions)
        const logsRef = collection(db, 'tracking_logs');
        const qLogs = query(logsRef, where('date', '>=', Timestamp.fromDate(start)), where('date', '<=', Timestamp.fromDate(end)));
        const logsSnap = await getDocs(qLogs);
        
        let calls = 0;
        let visits = 0;
        let agreements = 0;
        let located = 0;
        let pending = 0;
        let totalInterventions = logsSnap.size;

        logsSnap.forEach(doc => {
            const data = doc.data();
            const action = data.actionType || '';
            const result = data.result || '';
            const notes = (data.notes || '').toLowerCase();

            if (action.includes('call') || action.includes('whatsapp')) calls++;
            if (action.includes('home_visit')) visits++;
            
            if (result === 'agreement' || notes.includes('acuerdo') || notes.includes('compromiso')) agreements++;
            if (result === 'student_found' || result === 'justified') located++;
            if (result === 'no_answer' || result === 'continuing_monitor') pending++;
        });

        // 2. Fetch Absences (Incidences)
        // Note: Absences store 'date' string dd/MM/yyyy. Timestamp field is better.
        // We will fallback to approximate query if needed or just use timestamp
        const absencesRef = collection(db, 'absences');
        // Warning: This query might require index. If fails, we might need to filter client side for small datasets
        const qAbsences = query(absencesRef, where('timestamp', '>=', start.toISOString()), where('timestamp', '<=', end.toISOString()));
        const absencesSnap = await getDocs(qAbsences); 
        
        let totalIncidences = 0;
        absencesSnap.forEach(doc => {
            const data = doc.data();
            if (Array.isArray(data.absentStudents)) {
                totalIncidences += data.absentStudents.length;
            }
        });

        // 3. Generate Information
        const effectiveness = totalInterventions > 0 ? ((located + agreements) / totalInterventions) * 100 : 0;

        // 4. Generate PDF
        const docPDF = new jsPDF();
        const pageWidth = docPDF.internal.pageSize.getWidth();
        let y = 20;

        const centerText = (text: string, yPos: number, size = 12, isBold = false) => {
            docPDF.setFontSize(size);
            docPDF.setFont("helvetica", isBold ? "bold" : "normal");
            const textWidth = docPDF.getTextWidth(text);
            docPDF.text(text, (pageWidth - textWidth) / 2, yPos);
        };

        // Header
        if (settings?.logo) {
            try { docPDF.addImage(settings.logo, 'PNG', 15, 10, 20, 20); } catch(e) {}
        }
        centerText(settings?.institutionName || "CBTa 130", y, 16, true);
        y += 10;
        centerText("REPORTE EJECUTIVO DE GESTIÓN Y SEGUIMIENTO", y, 14, true);
        y += 8;
        centerText(`Periodo: ${format(start, 'dd/MM/yyyy')} al ${format(end, 'dd/MM/yyyy')}`, y, 11);
        y += 15;

        // Executive Summary
        docPDF.setFontSize(10);
        docPDF.setFont("helvetica", "bold");
        docPDF.text("1. Resumen Ejecutivo:", 20, y);
        y += 6;
        docPDF.setFont("helvetica", "normal");
        const summaryText = `Durante el periodo seleccionado, el departamento de servicios escolares detectó un total de ${totalIncidences} inasistencias reportadas en plataforma. ` +
                            `En respuesta, se ejecutaron ${totalInterventions} acciones de intervención directa, logrando contactar o localizar exitosamente al ${effectiveness.toFixed(0)}% de los casos gestionados. ` +
                            `Se formalizaron ${agreements} acuerdos de compromiso entre la institución y los tutores legales.`;
        const splitSummary = docPDF.splitTextToSize(summaryText, pageWidth - 40);
        docPDF.text(splitSummary, 20, y);
        y += splitSummary.length * 5 + 10;

        // Indicators Table
        docPDF.setFont("helvetica", "bold");
        docPDF.text("2. Indicadores Estadalisticos:", 20, y);
        y += 10;
        
        const col1 = 30; const col2 = 80; const col3 = 130;
        
        // Row 1 Heading
        docPDF.setFontSize(9);
        docPDF.text("INCIDENCIAS", col1, y);
        docPDF.text("INTERVENCIONES", col2, y);
        docPDF.text("RESULTADOS", col3, y);
        y += 5;
        // Data
        docPDF.setFontSize(14);
        docPDF.text(`${totalIncidences}`, col1, y);
        docPDF.text(`${totalInterventions}`, col2, y);
        docPDF.text(`${agreements}`, col3, y);
        y += 5;
        docPDF.setFontSize(8);
        docPDF.text("Alumnos reportados", col1, y);
        docPDF.text("Llamadas / Visitas", col2, y);
        docPDF.text("Acuerdos firmados", col3, y);
        
        y += 15;

        // Charts Area
        docPDF.setFontSize(10);
        docPDF.setFont("helvetica", "bold");
        docPDF.text("3. Análisis de Efectividad:", 20, y);
        y += 10;
        
        // Bar Chart (Casos vs Atendidos)
        docPDF.setFontSize(8);
        docPDF.text("Cobertura de Atención", 40, y - 2);
        
        const chartHeight = 40;
        const maxBar = Math.max(totalIncidences, totalInterventions, 10);
        
        // Bar 1: Incidences
        const h1 = (totalIncidences / maxBar) * chartHeight;
        docPDF.setFillColor(200, 200, 200); // Gray
        docPDF.rect(40, y + chartHeight - h1, 20, h1, 'F');
        docPDF.text(`${totalIncidences}`, 45, y + chartHeight + 4);
        docPDF.text("Detectados", 35, y + chartHeight + 8);

        // Bar 2: Interventions
        const h2 = (totalInterventions / maxBar) * chartHeight;
        docPDF.setFillColor(79, 70, 229); // Indigo
        docPDF.rect(70, y + chartHeight - h2, 20, h2, 'F');
        docPDF.text(`${totalInterventions}`, 75, y + chartHeight + 4);
        docPDF.text("Atendidos", 70, y + chartHeight + 8);

        // Bar 3: Agreements
        const h3 = (agreements / maxBar) * chartHeight;
        docPDF.setFillColor(34, 197, 94); // Green
        docPDF.rect(100, y + chartHeight - h3, 20, h3, 'F');
        docPDF.text(`${agreements}`, 105, y + chartHeight + 4);
        docPDF.text("Acuerdos", 100, y + chartHeight + 8);
        
        y += chartHeight + 25;

        // Signature
        if (y > 230) { docPDF.addPage(); y = 40; }
        else { y = Math.max(y, 230); }

        if (settings?.prefectSignature) {
            try {
                const imgWidth = 50; const imgHeight = 25;
                docPDF.addImage(settings.prefectSignature, 'PNG', (pageWidth/2) - (imgWidth/2), y - imgHeight + 5, imgWidth, imgHeight); 
            } catch (e) { console.error(e); }
        }
        
        docPDF.setDrawColor(0);
        docPDF.line((pageWidth/2) - 40, y + 5, (pageWidth/2) + 40, y + 5);
        
        docPDF.setFontSize(10);
        docPDF.setFont("helvetica", "bold");
        centerText(settings?.prefectName || "Responsable de Prefectura", y + 10);
        
        docPDF.setFont("helvetica", "normal");
        if (settings?.prefectTitle) centerText(settings.prefectTitle, y + 15);

        docPDF.save(`reporte_gestion_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
        setIsReportOpen(false);
        toast({ title: 'Reporte generado', description: 'El reporte ejecutivo se ha descargado correctamente.' });

    } catch (e: any) {
        console.error("Error generating report:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el reporte. Verifica tu conexión.' });
    } finally {
        setGeneratingReport(false);
    }
  };


  useEffect(() => {
    if (hasAccess) {
        fetchAbsences(date);
    }
  }, [date, hasAccess]);

  if (loadingAuth || hasAccess === null) {
      return <div className="flex h-full w-full items-center justify-center p-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }
  
  if (!hasAccess) {
      return (
        <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[80vh] gap-4">
            <div className="bg-yellow-100 p-4 rounded-full">
                 <AlertTriangle className="h-12 w-12 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-center">Acceso Restringido</h1>
            <p className="text-muted-foreground text-center max-w-md">
                No tienes permisos para ver el monitor de seguimiento. Esta sección es exclusiva para el personal responsable del seguimiento académico.
            </p>
            <Button onClick={() => router.push('/dashboard')}>Volver al Panel Principal</Button>
        </div>
      );
  }

  const totalAbsences = records.reduce((acc, record) => acc + record.absentStudents.length, 0);

  const filteredRecords = records.filter(record => 
    record.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.teacherEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.absentStudents.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Monitor de Asistencias</h1>
          <p className="text-muted-foreground">
            Seguimiento de inasistencias reportadas por los docentes.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={() => fetchAbsences(date)}>
            Actualizar
          </Button>

          <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsReportOpen(true)}>
             <FileBarChart className="mr-2 h-4 w-4" /> Reporte de Gestión
          </Button>

          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)} title="Ajustes de Seguimiento">
             <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ausencias</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAbsences}</div>
            <p className="text-xs text-muted-foreground">
              Alumnos reportados hoy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos Reportados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">
              Clases con inasistencias
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por alumno, grupo o profesor..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">Cargando reportes...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/10">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium">Todo en orden</h3>
          <p className="text-muted-foreground">No hay reportes de inasistencias para esta fecha.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{record.groupName}</CardTitle>
                    <CardDescription>Prof. {record.teacherEmail}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-background">
                        {format(new Date(record.timestamp), 'HH:mm')} hrs
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteRecord(record.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar reporte</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {record.absentStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            onClick={() => openTrackingDialog(student)}
                            title="Abrir Bitácora y Expediente"
                        >
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Expediente
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                <Phone className="h-4 w-4 mr-2" />
                                Contactar
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Opciones de Contacto</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => openContactDialog(record.id, student)}
                          >
                            <Contact className="mr-2 h-4 w-4" />
                            Editar Información
                          </DropdownMenuItem>

                          {/* Opciones del Estudiante */}
                          {student.studentPhone && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Alumno: {student.name}</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => window.open(`tel:${student.studentPhone}`, '_self')}
                              >
                                <Phone className="mr-2 h-4 w-4" />
                                Llamar ({student.studentPhone})
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                    const message = `Hola ${student.name}, te contactamos para informarte sobre tu inasistencia el día de hoy. Nos preocupa saber si te encuentras bien, así como informarnos sobre la causa de tu inasistencia.`;
                                    const url = `https://wa.me/${student.studentPhone?.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`;
                                    window.open(url, '_blank');
                                }}
                              >
                                <MessageCircle className="mr-2 h-4 w-4" />
                                WhatsApp Alumno
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuSeparator />
                          {/* Opciones del Grupo */}
                          <DropdownMenuItem
                            onClick={() => {
                              if (record.whatsappLink) {
                                const message = `Hola, le informamos que el alumno ${student.name} no asistió a la clase de ${record.groupName} el día de hoy.`;
                                const url = `${record.whatsappLink}?text=${encodeURIComponent(message)}`;
                                window.open(url, '_blank');
                              } else {
                                alert("Este grupo no tiene un enlace de WhatsApp configurado.");
                              }
                            }}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            WhatsApp Grupo
                          </DropdownMenuItem>
                          
                          {student.tutorPhone && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Tutor: {student.tutorName || 'Sin nombre'}</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => window.open(`tel:${student.tutorPhone}`, '_self')}
                              >
                                <Phone className="mr-2 h-4 w-4" />
                                Llamar ({student.tutorPhone})
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                    const message = generateTutorMessage(student.name, student.tutorName);
                                    const url = `https://wa.me/${student.tutorPhone?.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`;
                                    window.open(url, '_blank');
                                }}
                              >
                                <MessageCircle className="mr-2 h-4 w-4" />
                                WhatsApp Tutor
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                   </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        </div>
      )}

      {/* Dialogo de Reporte Ejecutivo */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Generar Reporte de Gestión</DialogTitle>
                <DialogDescription>
                    Selecciona el periodo para generar el informe ejecutivo de actividades y resultados de prefectura.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Fecha Inicio</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !reportStartDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {reportStartDate ? format(reportStartDate, "P", { locale: es }) : <span>Seleccionar</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={reportStartDate} onSelect={setReportStartDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha Fin</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !reportEndDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {reportEndDate ? format(reportEndDate, "P", { locale: es }) : <span>Seleccionar</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={reportEndDate} onSelect={setReportEndDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Este informe incluirá:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Total de inasistencias reportadas en el periodo.</li>
                        <li>Estadísticas de intervenciones (llamadas, visitas).</li>
                        <li>Efectividad de localización y acuerdos.</li>
                        <li>Firma digital del responsable actual.</li>
                    </ul>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsReportOpen(false)}>Cancelar</Button>
                <Button onClick={generateExecutiveReport} disabled={generatingReport}>
                    {generatingReport ? <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" /> : <Download className="mr-2 h-4 w-4" />}
                    Generar PDF
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

       <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Gestionar Contacto</DialogTitle>
            <DialogDescription>
                Actualiza o agrega el número de teléfono del tutor para {editingStudent?.name}.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tutorName" className="text-right">
                Nombre Tutor
                </Label>
                <Input
                id="tutorName"
                value={newTutorName}
                onChange={(e) => setNewTutorName(e.target.value)}
                className="col-span-3"
                placeholder="Ej. Juan Pérez"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tutorPhone" className="text-right">
                Tel. Tutor
                </Label>
                <Input
                id="tutorPhone"
                value={newTutorPhone}
                onChange={(e) => setNewTutorPhone(e.target.value)}
                className="col-span-3"
                placeholder="Ej. 521234567890"
                type="tel"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="studentPhone" className="text-right">
                Tel. Alumno
                </Label>
                <Input
                id="studentPhone"
                value={newStudentPhone}
                onChange={(e) => setNewStudentPhone(e.target.value)}
                className="col-span-3"
                placeholder="Ej. 521234567890"
                type="tel"
                />
            </div>
            </div>
             <div className="flex flex-col gap-2 bg-muted/50 p-2 rounded text-xs text-muted-foreground mb-4">
                <p>💡 Tip: Si ingresas un número, podrás enviar WhatsApp directamente.</p>
                <div className="flex gap-2">
                    {newTutorPhone && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                const message = generateTutorMessage(editingStudent?.name || '', editingStudent?.currentTutorName);
                                const url = `https://wa.me/${newTutorPhone.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`;
                                window.open(url, '_blank');
                            }}
                        >
                            <MessageCircle className="h-3 w-3 mr-1" /> Probar Tutor
                        </Button>
                    )}
                    {newStudentPhone && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                const message = `Hola ${editingStudent?.name}, te contactamos para informarte sobre tu inasistencia. Nos preocupa saber si te encuentras bien, así como informarnos sobre la causa de tu inasistencia.`;
                                const url = `https://wa.me/${newStudentPhone.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`;
                                window.open(url, '_blank');
                            }}
                        >
                            <MessageCircle className="h-3 w-3 mr-1" /> Probar Alumno
                        </Button>
                    )}
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpdateContact} disabled={isUpdatingContact}>
                    {isUpdatingContact ? 'Guardando...' : 'Guardar y Actualizar'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Settings Dialog */}
      <TrackingSettingsDialog 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen}
        onSettingsUpdated={setTrackingSettings}
      />

      {/* Bitacora / Tracking Dialog */}
      {selectedTrackingStudent && (
        <StudentTrackingDialog
            open={isTrackingDialogOpen}
            onOpenChange={setIsTrackingDialogOpen}
            studentId={selectedTrackingStudent.id}
            studentName={selectedTrackingStudent.name}
            tutorName={selectedTrackingStudent.tutorName}
            tutorPhone={selectedTrackingStudent.tutorPhone}
            studentPhone={selectedTrackingStudent.studentPhone}
        />
      )}
    </div>
  );
}
