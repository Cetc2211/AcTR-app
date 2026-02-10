'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/hooks/use-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Users, Bell, FileCheck, Calendar as CalendarIcon, Search, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OfficialGroup, Student, JustificationCategory } from '@/lib/placeholder-data';
import { format, addHours, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function OfficialGroupsPage() {
    const { 
        officialGroups, 
        createOfficialGroup, 
        deleteOfficialGroup,
        addStudentsToOfficialGroup, 
        getOfficialGroupStudents,
        createAnnouncement,
        deleteAnnouncement, 
        createJustification,
        announcements,
        justifications
    } = useData();
    const { toast } = useToast();

    // Group Management State
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupTutor, setNewGroupTutor] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [activeGroup, setActiveGroup] = useState<OfficialGroup | null>(null);
    const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
    
    // Student Import State
    const [bulkNames, setBulkNames] = useState('');
    const [bulkEmails, setBulkEmails] = useState('');
    const [bulkPhones, setBulkPhones] = useState('');
    const [bulkTutorNames, setBulkTutorNames] = useState('');
    const [bulkTutorPhones, setBulkTutorPhones] = useState('');
    const [isSubmittingStudents, setIsSubmittingStudents] = useState(false);

    // Announcement State
    const [annTitle, setAnnTitle] = useState('');
    const [annContent, setAnnContent] = useState('');
    const [annDuration, setAnnDuration] = useState('48');
    const [isSubmittingAnn, setIsSubmittingAnn] = useState(false);

    // Justification State
    const [justGroupId, setJustGroupId] = useState<string>('');
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [justStudentId, setJustStudentId] = useState<string>('');
    const [justDate, setJustDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [justReason, setJustReason] = useState('');
    const [justCategory, setJustCategory] = useState<JustificationCategory>('Salud');
    const [isSubmittingJust, setIsSubmittingJust] = useState(false);

    // --- Handlers ---

    // Fetch students when group selected for Justification
    useEffect(() => {
        if (!justGroupId || !getOfficialGroupStudents) {
            setAvailableStudents([]);
            return;
        } 
        
        const loadStudents = async () => {
            setIsLoadingStudents(true);
            try {
                const students = await getOfficialGroupStudents(justGroupId);
                setAvailableStudents(students.sort((a,b) => a.name.localeCompare(b.name)));
            } catch (e) {
                console.error("Error loading students", e);
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los estudiantes.' });
            } finally {
                setIsLoadingStudents(false);
            }
        };
        loadStudents();
    }, [justGroupId, getOfficialGroupStudents, toast]);


    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        setIsCreating(true);
        try {
            const newId = await createOfficialGroup(newGroupName, newGroupTutor);
            setNewGroupName('');
            setNewGroupTutor('');
            toast({ title: 'Grupo oficial creado', description: 'Ahora puedes agregar estudiantes.' });
            
            const newGroupObj: OfficialGroup = { 
                id: newId, 
                name: newGroupName,
                tutorEmail: newGroupTutor, 
                createdAt: new Date().toISOString() 
            };
            handleOpenAddStudents(newGroupObj);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el grupo' });
        } finally {
            setIsCreating(false);
        }
    };

    const handleOpenAddStudents = (group: OfficialGroup) => {
        setActiveGroup(group);
        setBulkNames('');
        setBulkEmails('');
        setBulkPhones('');
        setBulkTutorNames('');
        setBulkTutorPhones('');
        setIsAddStudentDialogOpen(true);
    };

    const handleAddStudents = async () => {
        if (!activeGroup) return;

        const names = bulkNames.trim().split('\n').filter((name: string) => name);
        const emails = bulkEmails.trim().split('\n');
        const phones = bulkPhones.trim().split('\n');
        const tutorNames = bulkTutorNames.trim().split('\n');
        const tutorPhones = bulkTutorPhones.trim().split('\n');

        if (names.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ingresa al menos un nombre.' });
            return;
        }

        setIsSubmittingStudents(true);
        try {
            const newStudents: Student[] = names.map((name: string, index: number) => ({
                id: `S${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${index}`,
                name: name.trim(),
                email: emails[index]?.trim() || '',
                phone: phones[index]?.trim() || '',
                tutorName: tutorNames[index]?.trim() || '',
                tutorPhone: tutorPhones[index]?.trim() || '',
                photo: 'https://placehold.co/100x100.png',
            }));

            await addStudentsToOfficialGroup(activeGroup.id, newStudents);
            toast({ title: 'Estudiantes agregados', description: `${newStudents.length} añadidos.` });
            setIsAddStudentDialogOpen(false);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Falló la carga de estudiantes.' });
        } finally {
            setIsSubmittingStudents(false);
        }
    };

    const handleDeleteGroup = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar el grupo "${name}"?`)) return;
        try {
            await deleteOfficialGroup(id);
            toast({ title: 'Grupo eliminado', description: `El grupo ${name} ha sido eliminado.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el grupo.' });
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('¿Eliminar este anuncio?')) return;
        try {
            await deleteAnnouncement(id);
            toast({ title: 'Anuncio eliminado', description: 'El anuncio ha sido retirado.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el anuncio.' });
        }
    };

    const handleCreateAnnouncement = async () => {
        if (!annTitle.trim() || !annContent.trim()) return;
        setIsSubmittingAnn(true);
        try {
            const now = new Date();
            const hours = parseInt(annDuration);
            const expiresAt = addHours(now, hours).toISOString();
            
            await createAnnouncement(annTitle, annContent, undefined, expiresAt);
            setAnnTitle('');
            setAnnContent('');
            setAnnDuration('48');
            toast({ title: 'Anuncio Publicado', description: 'Visible para todos los usuarios.' });
        } catch (e) { 
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el anuncio.' });
        } finally {
            setIsSubmittingAnn(false);
        }
    };

    const handleCreateJustification = async () => {
        if (!justStudentId || !justDate || !justReason.trim()) {
             toast({ variant: 'destructive', title: 'Faltan datos', description: 'Selecciona estudiante, fecha y motivo.' });
             return;
        }
        setIsSubmittingJust(true);
        try {
            await createJustification(justStudentId, justDate, justReason, justCategory);
            setJustReason('');
            toast({ title: 'Justificación Creada', description: 'Se reflejará en la asistencia.' });
        } catch (e) {
             toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la justificación.' });
        } finally {
            setIsSubmittingJust(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                 <h1 className="text-3xl font-bold">Panel de Administración</h1>
            </div>
            
            <Tabs defaultValue="groups" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="groups">Grupos Oficiales</TabsTrigger>
                    <TabsTrigger value="justifications">Justificantes</TabsTrigger>
                    <TabsTrigger value="announcements">Anuncios Generales</TabsTrigger>
                </TabsList>

                <TabsContent value="groups">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="bg-muted/50 border-dashed">
                             <CardHeader>
                                <CardTitle>Crear Nuevo Grupo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="groupName">Nombre del Grupo (ej. 1-A TSPA)</Label>
                                    <Input 
                                        id="groupName" 
                                        value={newGroupName} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroupName(e.target.value)} 
                                        placeholder="Ingresa el nombre..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="groupTutor">Correo del Tutor (Docente)</Label>
                                    <Input 
                                        id="groupTutor" 
                                        value={newGroupTutor} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGroupTutor(e.target.value)} 
                                        placeholder="correo@docente.com"
                                    />
                                </div>
                                <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isCreating} className="w-full">
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Crear Grupo
                                </Button>
                            </CardContent>
                        </Card>

                        {officialGroups.map(group => (
                            <Card key={group.id}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xl font-bold">{group.name}</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-muted-foreground my-2">ID: {group.id}</div>
                                    {group.tutorEmail && (
                                        <div className="text-sm font-medium text-blue-600 mb-2">
                                            Tutor: {group.tutorEmail}
                                        </div>
                                    )}
                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" className="flex-1" onClick={() => handleOpenAddStudents(group)}>
                                            Agregar Estudiantes
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteGroup(group.id, group.name)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="justifications">
                     <div className="grid md:grid-cols-2 gap-8">
                         <Card>
                             <CardHeader>
                                 <CardTitle>Nueva Justificación</CardTitle>
                                 <CardDescription>Registra la inasistencia justificada de un alumno.</CardDescription>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                 <div className="space-y-2">
                                     <Label>1. Seleccionar Grupo</Label>
                                     <Select onValueChange={setJustGroupId} value={justGroupId}>
                                         <SelectTrigger>
                                             <SelectValue placeholder="Selecciona un grupo..." />
                                         </SelectTrigger>
                                         <SelectContent>
                                             {officialGroups.map(g => (
                                                 <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                 </div>

                                 <div className="space-y-2">
                                     <Label>2. Seleccionar Estudiante</Label>
                                     <Select onValueChange={setJustStudentId} value={justStudentId} disabled={!justGroupId || isLoadingStudents}>
                                         <SelectTrigger>
                                              <SelectValue placeholder={isLoadingStudents ? "Cargando..." : "Selecciona un estudiante..."} />
                                         </SelectTrigger>
                                         <SelectContent>
                                             {availableStudents.map(s => (
                                                 <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                 </div>

                                 <div className="space-y-2">
                                     <Label>3. Fecha a Justificar</Label>
                                     <Input type="date" value={justDate} onChange={(e) => setJustDate(e.target.value)} />
                                 </div>

                                 <div className="space-y-2">
                                     <Label>4. Categoría del Motivo</Label>
                                     <Select onValueChange={(v) => setJustCategory(v as JustificationCategory)} value={justCategory}>
                                         <SelectTrigger>
                                             <SelectValue placeholder="Selecciona una categoría..." />
                                         </SelectTrigger>
                                         <SelectContent>
                                             <SelectItem value="Salud">Salud</SelectItem>
                                             <SelectItem value="Familiar">Familiar</SelectItem>
                                             <SelectItem value="Personal">Personal</SelectItem>
                                             <SelectItem value="Institucional">Institucional</SelectItem>
                                             <SelectItem value="Otro">Otro</SelectItem>
                                         </SelectContent>
                                     </Select>
                                 </div>

                                 <div className="space-y-2">
                                     <Label>5. Observaciones Detalladas</Label>
                                     <Textarea value={justReason} onChange={(e) => setJustReason(e.target.value)} placeholder="Detalles específicos..." />
                                 </div>

                                 <Button className="w-full" onClick={handleCreateJustification} disabled={isSubmittingJust || !justStudentId}>
                                     {isSubmittingJust && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                     Guardar Justificante
                                 </Button>
                             </CardContent>
                         </Card>

                         <Card>
                             <CardHeader>
                                 <CardTitle>Historial Reciente</CardTitle>
                             </CardHeader>
                             <CardContent>
                                 <div className="space-y-4">
                                     {justifications.length === 0 && <div className="text-muted-foreground text-center py-4">No hay justificaciones recientes.</div>}
                                     {justifications.map((just) => (
                                         <div key={just.id} className="flex items-start justify-between p-3 border rounded-lg">
                                             <div>
                                                 <p className="font-semibold text-sm">Estudiante: {just.studentId}</p>
                                                 <p className="text-xs text-muted-foreground">Fecha: {just.date}</p>
                                                 <p className="text-sm mt-1">{just.reason}</p>
                                             </div>
                                             <FileCheck className="h-4 w-4 text-green-500" />
                                         </div>
                                     ))}
                                 </div>
                             </CardContent>
                         </Card>
                     </div>
                </TabsContent>

                <TabsContent value="announcements">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Publicar Anuncio</CardTitle>
                                <CardDescription>Este mensaje aparecerá en el Dashboard principal.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Título</Label>
                                    <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Aviso Importante" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contenido</Label>
                                    <Textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="Detalles del anuncio..." rows={4} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duración de la publicación</Label>
                                    <Select value={annDuration} onValueChange={setAnnDuration}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona duración" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="24">24 Horas</SelectItem>
                                            <SelectItem value="48">48 Horas</SelectItem>
                                            <SelectItem value="72">72 Horas (3 días)</SelectItem>
                                            <SelectItem value="168">1 Semana</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button className="w-full" onClick={handleCreateAnnouncement} disabled={isSubmittingAnn || !annTitle}>
                                    {isSubmittingAnn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Publicar Anuncio
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Anuncios Activos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {announcements.length === 0 && <div className="text-muted-foreground text-center py-4">No hay anuncios activos.</div>}
                                    {announcements.map((ann) => (
                                        <div key={ann.id} className="p-4 border rounded-lg bg-accent/10 relative group">
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAnnouncement(ann.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between mb-2 pr-6">
                                                <h4 className="font-bold">{ann.title}</h4>
                                                <span className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm">{ann.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Agregar Estudiantes a {activeGroup?.name}</DialogTitle>
                        <DialogDescription>Copia y pega las columnas desde Excel.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nombres*</Label>
                                <Textarea placeholder="Lista de Nombres" rows={10} value={bulkNames} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkNames(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Correos</Label>
                                <Textarea placeholder="Lista de Correos" rows={10} value={bulkEmails} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkEmails(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Teléfonos</Label>
                                <Textarea placeholder="Lista de Teléfonos" rows={10} value={bulkPhones} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkPhones(e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label>Tutores (Nombres)</Label>
                                <Textarea placeholder="Nombres de Tutores" rows={10} value={bulkTutorNames} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkTutorNames(e.target.value)} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Tutores (Teléfonos)</Label>
                                <Textarea placeholder="Teléfonos de Tutores" rows={5} value={bulkTutorPhones} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkTutorPhones(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddStudentDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddStudents} disabled={isSubmittingStudents || !bulkNames.trim()}>
                             {isSubmittingStudents && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
