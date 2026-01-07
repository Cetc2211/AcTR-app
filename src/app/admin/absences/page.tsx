'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore'; // Added updateDoc
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Phone, CheckCircle, XCircle, UserX, MoreHorizontal, MessageCircle, AlertTriangle, Trash2, Edit, Contact } from 'lucide-react'; // Added Edit, Contact
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; 
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Added Dialog components

const ADMIN_EMAIL = "mpceciliotopetecruz@gmail.com";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const router = useRouter();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const [date, setDate] = useState<Date>(new Date());
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
                                    const message = `Hola ${student.name}, te contactamos para informarte sobre tu inasistencia el día de hoy.`;
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
                                    const message = `Estimado tutor de ${student.name}, le informamos que su hijo(a) no asistió a la clase de ${record.groupName} el día de hoy.`;
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
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                                const message = `Estimado tutor de ${editingStudent?.name}, le informamos sobre la inasistencia.`;
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
                                const message = `Hola ${editingStudent?.name}, le informamos sobre la inasistencia.`;
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
    </div>
  );
}
