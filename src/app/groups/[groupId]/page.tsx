'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Button } from '@/components/ui/button';
import type { Student, Group, PartialId, CalculatedRisk, EvaluationCriteria } from '@/lib/placeholder-data';
import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, UserPlus, Trash2, CalendarCheck, FilePen, Edit, Loader2, PenSquare, X, ImagePlus, Lock, Unlock, UserCog, Camera, Upload, RotateCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/hooks/use-data';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { 
    isLoading: isDataLoading,
    groups, 
    allStudents, 
    setActiveGroupId,
    setAllStudents, 
    activeGroup, 
    partialData,
    deleteGroup,
    activePartialId,
    setActivePartialId,
    calculateFinalGrade,
    getStudentRiskLevel,
    addStudentsToGroup,
    removeStudentFromGroup,
    updateGroup,
    updateStudent,
  } = useData();
  
  const { attendance } = partialData;
  const { criteria = [] } = activeGroup || {};

  const router = useRouter();
  const { toast } = useToast();
  
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);


  const [bulkNames, setBulkNames] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkTutorNames, setBulkTutorNames] = useState('');
  const [bulkTutorPhones, setBulkTutorPhones] = useState('');


  const [isSubmittingStudents, setIsSubmittingStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Estados para la cámara
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (groupId) {
      setActiveGroupId(groupId);
    }
  }, [groupId, setActiveGroupId]);

  // Efecto para solicitar permiso de cámara cuando se activa
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const getCameraPermission = async () => {
      if(isPhotoDialogOpen && isCameraMode) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setVideoDevices(videoInputs);

          const constraints = {
            video: {
              deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined
            }
          };

          stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }

          if (!currentDeviceId && videoInputs.length > 0) {
            setCurrentDeviceId(videoInputs[0].deviceId);
          }

        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Acceso a la cámara denegado',
            description: 'Por favor, habilita los permisos de la cámara en tu navegador.',
          });
          setIsCameraMode(false); 
        }
      }
    };
    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
          videoRef.current.srcObject = null;
      }
    };
  }, [isPhotoDialogOpen, isCameraMode, toast, currentDeviceId]);

  const studentRiskLevels = useMemo(() => {
    if (!activeGroup) return {};
    const riskMap: {[studentId: string]: CalculatedRisk} = {};
    activeGroup.students.forEach(s => {
      const finalGrade = calculateFinalGrade(s.id);
      riskMap[s.id] = getStudentRiskLevel(finalGrade, attendance, s.id);
    });
    return riskMap;
  }, [activeGroup, calculateFinalGrade, getStudentRiskLevel, partialData, attendance]);

  const handleRemoveStudents = (studentIds: string[]) => {
    if (!activeGroup) return;
    studentIds.forEach(id => {
      removeStudentFromGroup(activeGroup.id, id);
    });
    toast({
        title: "Estudiante(s) eliminado(s)",
        description: "El/los estudiante(s) ha(n) sido quitado(s) del grupo.",
    });
    if (isSelectionMode) {
      handleCancelSelectionMode();
    }
  };

  const handleDeleteGroup = () => {
    if (!activeGroup) return;
    deleteGroup(activeGroup.id);
    toast({
        title: 'Grupo Eliminado',
        description: `El grupo "${activeGroup.subject}" ha sido eliminado.`,
    });
    router.push('/groups');
  };
  
  const handleAddStudents = async () => {
    if (!activeGroup || isSubmittingStudents) return;

    const names = bulkNames.trim().split('\n').filter(name => name);
    const emails = bulkEmails.trim().split('\n');
    const phones = bulkPhones.trim().split('\n');
    const tutorNames = bulkTutorNames.trim().split('\n');
    const tutorPhones = bulkTutorPhones.trim().split('\n');
    
    if (names.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, ingresa al menos un nombre de estudiante.',
      });
      return;
    }
    
    setIsSubmittingStudents(true);
    try {
        const newStudents: Student[] = names.map((name, index) => ({
        id: `S${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${index}`,
        name: name.trim(),
        email: emails[index]?.trim() || '',
        phone: phones[index]?.trim() || '',
        tutorName: tutorNames[index]?.trim() || '',
        tutorPhone: tutorPhones[index]?.trim() || '',
        photo: 'https://placehold.co/100x100.png',
        }));

        await addStudentsToGroup(activeGroup.id, newStudents);
        
        setBulkNames('');
        setBulkEmails('');
        setBulkPhones('');
        setBulkTutorNames('');
        setBulkTutorPhones('');
        toast({
            title: "Estudiantes agregados",
            description: `${newStudents.length} estudiante(s) han sido añadidos al grupo.`
        });
        setIsAddStudentDialogOpen(false);
    } catch (e) {
        console.error("Failed to add students:", e);
        toast({
            variant: "destructive",
            title: "Error al agregar",
            description: "No se pudieron agregar los estudiantes. Inténtalo de nuevo."
        })
    } finally {
        setIsSubmittingStudents(false);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prevSelected => {
        if (prevSelected.includes(studentId)) {
            return prevSelected.filter(id => id !== studentId);
        } else {
            return [...prevSelected, studentId];
        }
    });
  };
  
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
      if(checked && activeGroup) {
          setSelectedStudents(activeGroup.students.map(s => s.id));
      } else {
          setSelectedStudents([]);
      }
  };
  
  const handleDeleteSelectedStudents = () => {
    handleRemoveStudents(selectedStudents);
  };

  const handleCancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedStudents([]);
  };
  
  const handleOpenPhotoDialog = (student: Student) => {
    setEditingStudent(student);
    setPhotoPreview(student.photo);
    setIsCameraMode(false); // Reset to file upload mode by default
    setCurrentDeviceId(undefined); // Reset camera device
    setVideoDevices([]);
    setIsPhotoDialogOpen(true);
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            setPhotoPreview(dataUrl);
            setIsCameraMode(false); // Switch back to preview mode
        }
    }
  };

  const handleSwitchCamera = () => {
    if (videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      setCurrentDeviceId(videoDevices[nextIndex].deviceId);
    }
  };

  const handleSavePhoto = async () => {
    if (!editingStudent || !photoPreview) return;
    
    await updateStudent(editingStudent.id, { photo: photoPreview });
    
    toast({
        title: "Foto actualizada",
        description: `Se ha cambiado la foto de ${editingStudent.name}.`,
    });
    setIsPhotoDialogOpen(false);
    setEditingStudent(null);
    setPhotoPreview(null);
  };

  const handleOpenEditGroupDialog = () => {
    if(activeGroup) {
      setEditingGroup({...activeGroup});
      setIsEditGroupDialogOpen(true);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    
    await updateGroup(editingGroup.id, {
      subject: editingGroup.subject,
      semester: editingGroup.semester,
      groupName: editingGroup.groupName,
      facilitator: editingGroup.facilitator,
    });
    
    toast({
        title: 'Grupo Actualizado',
        description: 'La información del grupo ha sido guardada.',
    });
    setIsEditGroupDialogOpen(false);
  };
  
  const handleOpenEditStudentDialog = (student: Student) => {
    setEditingStudent({ ...student });
    setIsEditStudentDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
      if (!editingStudent) return;
      await updateStudent(editingStudent.id, {
          name: editingStudent.name,
          email: editingStudent.email,
          phone: editingStudent.phone,
          tutorName: editingStudent.tutorName,
          tutorPhone: editingStudent.tutorPhone,
      });
      toast({
          title: 'Estudiante Actualizado',
          description: `La información de ${editingStudent.name} ha sido guardada.`,
      });
      setIsEditStudentDialogOpen(false);
  };

    
  const totalWeight = useMemo(() => {
    return criteria.reduce((sum, c) => sum + c.weight, 0);
  }, [criteria]);

  const numSelected = selectedStudents.length;

  if (isDataLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!activeGroup) {
    return (
      <div className="flex justify-center items-center h-full text-center">
        <div>
          <h2 className="text-xl font-semibold">No hay un grupo activo.</h2>
          <p className="text-muted-foreground">Por favor, crea o selecciona un grupo para continuar.</p>
          <Button asChild className="mt-4"><Link href="/groups">Ir a Grupos</Link></Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
    {editingStudent && (
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Foto de {editingStudent.name}</DialogTitle>
            <DialogDescription>
              Usa tu cámara para tomar una foto o sube un archivo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
            <div className="relative w-32 h-32">
                {isCameraMode ? (
                     <video ref={videoRef} className="rounded-full aspect-square object-cover w-32 h-32" autoPlay playsInline muted />
                ) : (
                    <Image
                      alt="Vista previa"
                      className="rounded-full aspect-square object-cover w-32 h-32"
                      height={128}
                      src={photoPreview || editingStudent.photo}
                      width={128}
                    />
                )}
            </div>
             <canvas ref={canvasRef} className="hidden"></canvas>
            
            <div className="flex gap-2">
              {isCameraMode ? (
                  <>
                    <Button onClick={handleCapturePhoto}>
                        <Camera className="mr-2" /> Capturar Foto
                    </Button>
                    {videoDevices.length > 1 && (
                      <Button variant="outline" onClick={handleSwitchCamera}>
                        <RotateCw className="mr-2" /> Girar Cámara
                      </Button>
                    )}
                  </>
              ) : (
                  <Button variant="outline" onClick={() => setIsCameraMode(true)}>
                      <Camera className="mr-2" /> Usar Cámara
                  </Button>
              )}
              {!isCameraMode && (
                <div className="relative">
                    <Button asChild variant="outline">
                       <Label htmlFor="photo-upload">
                           <Upload className="mr-2" /> Subir Archivo
                       </Label>
                    </Button>
                    <Input id="photo-upload" type="file" accept="image/*" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" onChange={handlePhotoChange} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhotoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePhoto} disabled={photoPreview === editingStudent.photo}>Guardar Foto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    {editingGroup && (
        <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Grupo</DialogTitle>
                    <DialogDescription>
                        Actualiza la información de tu grupo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-subject">Nombre de la Asignatura</Label>
                        <Input id="edit-subject" value={editingGroup.subject} onChange={(e) => setEditingGroup({...editingGroup, subject: e.target.value})} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-semester">Semestre</Label>
                        <Input id="edit-semester" value={editingGroup.semester || ''} onChange={(e) => setEditingGroup({...editingGroup, semester: e.target.value})} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-groupName">Grupo</Label>
                        <Input id="edit-groupName" value={editingGroup.groupName || ''} onChange={(e) => setEditingGroup({...editingGroup, groupName: e.target.value})} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-facilitator">Facilitador</Label>
                        <Input id="edit-facilitator" value={editingGroup.facilitator || ''} onChange={(e) => setEditingGroup({...editingGroup, facilitator: e.target.value})} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditGroupDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleUpdateGroup}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}
    {editingStudent && (
        <Dialog open={isEditStudentDialogOpen} onOpenChange={setIsEditStudentDialogOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Editar Estudiante</DialogTitle>
                    <DialogDescription>
                        Actualiza la información de {editingStudent.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-student-name">Nombre</Label>
                        <Input id="edit-student-name" value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-student-email">Email</Label>
                        <Input id="edit-student-email" type="email" value={editingStudent.email || ''} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-student-phone">Teléfono</Label>
                        <Input id="edit-student-phone" type="tel" value={editingStudent.phone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-student-tutorName">Nombre del Tutor</Label>
                        <Input id="edit-student-tutorName" value={editingStudent.tutorName || ''} onChange={(e) => setEditingStudent({ ...editingStudent, tutorName: e.target.value })} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="edit-student-tutorPhone">Teléfono del Tutor</Label>
                        <Input id="edit-student-tutorPhone" type="tel" value={editingStudent.tutorPhone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, tutorPhone: e.target.value })} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditStudentDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleUpdateStudent}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
            <Link href="/groups">
                <ArrowLeft />
                <span className="sr-only">Volver a grupos</span>
            </Link>
            </Button>
            <div>
            <h1 className="text-3xl font-bold">{activeGroup.subject}</h1>
            <p className="text-muted-foreground">
                {activeGroup.semester && `Semestre: ${activeGroup.semester} | `} 
                {activeGroup.groupName && `Grupo: ${activeGroup.groupName} | `}
                {activeGroup.facilitator && `Facilitador: ${activeGroup.facilitator}`}
            </p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Opciones del Grupo</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem onSelect={handleOpenEditGroupDialog}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Editar Grupo</span>
                  </DropdownMenuItem>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar Grupo</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el grupo y todos sus datos asociados (criterios, calificaciones, etc.).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteGroup}>Sí, eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
         </div>
      </div>
      
      <Tabs defaultValue={activePartialId} onValueChange={(value) => setActivePartialId(value as PartialId)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="p1">Primer Parcial</TabsTrigger>
            <TabsTrigger value="p2">Segundo Parcial</TabsTrigger>
            <TabsTrigger value="p3">Tercer Parcial</TabsTrigger>
        </TabsList>
        <TabsContent value={activePartialId} className="mt-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2">
                <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                    <CardTitle>Estudiantes en el Grupo</CardTitle>
                    <CardDescription>
                        Actualmente hay {activeGroup.students.length} estudiantes en este
                        grupo.
                    </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSelectionMode ? (
                            <>
                                <Button variant="outline" size="sm" onClick={handleCancelSelectionMode} className="gap-1">
                                    <X className="h-3.5 w-3.5" />
                                    Cancelar
                                </Button>
                                {numSelected > 0 && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" className="gap-1">
                                                <Trash2 className="h-3.5 w-3.5" />
                                                <span>Eliminar ({numSelected})</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Eliminar {numSelected} estudiante(s)?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Se quitarán los estudiantes seleccionados de este grupo, pero no se eliminarán de la lista general de estudiantes.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteSelectedStudents}>Sí, eliminar del grupo</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </>
                        ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsSelectionMode(true)}>
                                Seleccionar Estudiantes
                            </Button>
                        )}
                        <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1">
                            <UserPlus className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Agregar Estudiantes
                            </span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                            <DialogTitle>Agregar Nuevos Estudiantes al Grupo</DialogTitle>
                            <DialogDescription>
                                Añade nuevos estudiantes a "{activeGroup.subject}". Pega columnas de datos para agregarlos en masa.
                            </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                                <p className="text-sm text-muted-foreground">
                                    Pega una columna de datos en cada campo. Asegúrate de que cada línea corresponda al mismo estudiante.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bulkNames">Nombres*</Label>
                                        <Textarea id="bulkNames" placeholder="Laura Jimenez\nCarlos Sanchez" rows={5} value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bulkEmails">Emails</Label>
                                        <Textarea id="bulkEmails" placeholder="laura.j@example.com\ncarlos.s@example.com" rows={5} value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bulkPhones">Teléfonos</Label>
                                        <Textarea id="bulkPhones" placeholder="555-3344\n555-6677" rows={5} value={bulkPhones} onChange={(e) => setBulkPhones(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bulkTutorNames">Nombres de Tutores</Label>
                                        <Textarea id="bulkTutorNames" placeholder="Ricardo Jimenez\nMaria Sanchez" rows={5} value={bulkTutorNames} onChange={(e) => setBulkTutorNames(e.target.value)} />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="bulkTutorPhones">Teléfonos de Tutores</Label>
                                        <Textarea id="bulkTutorPhones" placeholder="555-3355\n555-6688" rows={5} value={bulkTutorPhones} onChange={(e) => setBulkTutorPhones(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)} disabled={isSubmittingStudents}>Cancelar</Button>
                            <Button onClick={handleAddStudents} disabled={isSubmittingStudents || !bulkNames.trim()}>
                                {isSubmittingStudents && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Agregar Estudiantes
                            </Button>
                            </DialogFooter>
                        </DialogContent>
                        </Dialog>
                    </div>
                </div>
                </CardHeader>
                <CardContent className="p-0">
                <Table>
                    <TableHeader>
                    <TableRow>
                        {isSelectionMode && (
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={activeGroup.students.length > 0 && numSelected === activeGroup.students.length ? true : (numSelected > 0 ? 'indeterminate' : false)}
                                    onCheckedChange={(checked) => handleSelectAll(checked)}
                                    aria-label="Seleccionar todo"
                                />
                            </TableCell>
                        )}
                        <TableHead>#</TableHead>
                        <TableHead className="hidden w-[100px] sm:table-cell">
                        <span className="sr-only">Foto</span>
                        </TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Nivel de Riesgo</TableHead>
                        <TableHead>
                        <span className="sr-only">Acciones</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {activeGroup.students.map((student, index) => {
                        const risk = studentRiskLevels[student.id] || {level: 'low', reason: ''};
                        return (
                            <TableRow key={student.id} data-state={selectedStudents.includes(student.id) && "selected"}>
                            {isSelectionMode && (
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedStudents.includes(student.id)}
                                        onCheckedChange={() => handleSelectStudent(student.id)}
                                        aria-label="Seleccionar fila"
                                    />
                                </TableCell>
                            )}
                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Image
                                alt="Foto del estudiante"
                                className="aspect-square rounded-md object-cover"
                                height="64"
                                src={student.photo}
                                data-ai-hint="student photo"
                                width="64"
                                />
                            </TableCell>
                            <TableCell className="font-medium">
                                {student.name}
                            </TableCell>
                            <TableCell>
                                {risk.level === 'high' && (
                                <Badge variant="destructive">Alto</Badge>
                                )}
                                {risk.level === 'medium' && (
                                <Badge
                                    variant="secondary"
                                    className="bg-amber-400 text-black"
                                >
                                    Medio
                                </Badge>
                                )}
                                {risk.level === 'low' && (
                                <Badge variant="secondary">Bajo</Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                    aria-haspopup="true"
                                    size="icon"
                                    variant="ghost"
                                    >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => router.push(`/students/${student.id}`)}>Ver Perfil Completo</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenEditStudentDialog(student)}>
                                        <UserCog className="mr-2 h-4 w-4" />
                                        Editar Información
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleOpenPhotoDialog(student)}>
                                        <ImagePlus className="mr-2 h-4 w-4" />
                                        Cambiar Foto
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleRemoveStudents([student.id])} className="text-destructive">
                                    Quitar del Grupo
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            </TableRow>
                        )
                    })}
                    {activeGroup.students.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground p-8">
                                No hay estudiantes en este grupo.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Acciones del Grupo</CardTitle>
                    <CardDescription>
                        Gestiona la asistencia, criterios de evaluación y calificaciones del grupo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Button asChild variant="outline">
                        <Link href={`/attendance`}>
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Tomar Asistencia
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/participations`}>
                            <PenSquare className="mr-2 h-4 w-4" />
                            Registrar Participaciones
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/grades/${activeGroup.id}/criteria`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Gestionar Criterios
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/grades/${activeGroup.id}/grades`}>
                            <FilePen className="mr-2 h-4 w-4" />
                            Registrar Calificaciones
                        </Link>
                    </Button>
                </CardContent>
                <CardHeader className="pt-0">
                    <CardTitle className="text-lg">Resumen de Criterios</CardTitle>
                    <CardDescription>Peso total: {totalWeight}%</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {criteria.map(criterion => (
                            <div key={criterion.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <div>
                                    <span className="font-medium">{criterion.name}</span>
                                    <p className="text-xs text-muted-foreground">
                                    {criterion.name === 'Portafolio' || criterion.name === 'Actividades' || criterion.name === 'Participación'
                                        ? 'Cálculo Automático'
                                        : `${criterion.expectedValue} es el valor esperado`
                                    }
                                    </p>
                                </div>
                                <Badge variant="secondary">{criterion.weight}%</Badge>
                            </div>
                        ))}
                        {criteria.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4">No has definido criterios.</p>
                        )}
                        {totalWeight > 100 && (
                            <div className="text-center text-sm font-bold text-destructive pt-2">
                                Total: {totalWeight}% (Sobrepasa el 100%)
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
