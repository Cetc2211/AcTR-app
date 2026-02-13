
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from '@/hooks/use-data';
import { Group } from '@/lib/placeholder-data';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Users, ArrowRight, Loader2, MoreVertical, Archive, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';


const cardColors = [
  'bg-card-1', 'bg-card-2', 'bg-card-3', 'bg-card-4', 'bg-card-5'
];


export default function GroupsPage() {
  const { groups, setActiveGroupId, isLoading, setGroups, settings, officialGroups, getOfficialGroupStudents } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [newGroupSemester, setNewGroupSemester] = useState('');
  const [newGroupGroupName, setNewGroupGroupName] = useState('');
  const [newGroupFacilitator, setNewGroupFacilitator] = useState('');
  const [newGroupWhatsapp, setNewGroupWhatsapp] = useState('');
  const [newGroupOfficialId, setNewGroupOfficialId] = useState<string>('manual');
  
  // Archive/Delete State
  const [groupToArchive, setGroupToArchive] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if(settings.facilitatorName) {
        setNewGroupFacilitator(settings.facilitatorName);
    }
  }, [settings.facilitatorName, isDialogOpen]);

  const handleArchive = async () => {
    if (!groupToArchive) return;
    try {
        const updatedGroups = groups.map(g => 
            g.id === groupToArchive.id 
                ? { ...g, status: 'archived' as const, archivedAt: new Date().toISOString() } 
                : g
        );
        await setGroups(updatedGroups);
        toast({ title: "Grupo Archivado", description: "El grupo se ha movido a la sección de resguardo." });
    } catch(e) {
        console.error(e);
        toast({ variant: "destructive", title: "Error", description: "No se pudo archivar el grupo." });
    } finally {
        setGroupToArchive(null);
    }
  };

  const handleRestore = async (groupId: string) => {
     try {
        const updatedGroups = groups.map(g => 
            g.id === groupId 
                ? { ...g, status: 'active' as const, archivedAt: undefined } 
                : g
        );
        await setGroups(updatedGroups);
        toast({ title: "Grupo Restaurado", description: "El grupo está activo nuevamente." });
    } catch(e) {
        console.error(e);
        toast({ variant: "destructive", title: "Error", description: "No se pudo restaurar el grupo." });
    }
  };
  
  const handleDelete = async () => {
     if (!groupToDelete) return;
     try {
         const updatedGroups = groups.filter(g => g.id !== groupToDelete.id);
         await setGroups(updatedGroups);
         toast({ title: "Grupo Eliminado", description: "El grupo ha sido eliminado permanentemente." });
     } catch(e) {
         console.error(e);
         toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el grupo." });
     } finally {
         setGroupToDelete(null);
     }
  };

  // NEW: Sync Official Group Data
  useEffect(() => {
    if (newGroupOfficialId !== 'manual') {
        const selectedGroup = officialGroups.find(g => g.id === newGroupOfficialId);
        if (selectedGroup) {
             // Regex to extract Semester (digits) and Group (letters) from "1A-TSPA" or "3B" or "1-A"
             const match = selectedGroup.name.match(/^(\d+)[^A-Za-z0-9]*([A-Za-z]+)/);
             if (match) {
                 setNewGroupSemester(match[1]);
                 setNewGroupGroupName(match[2]);
             }
        }
    } else {
        // If switching back to manual, we can optionally clear or leave as is. 
        // Leaving as is but editable is usually better UX, but the prompt said "vacíos como hasta ahora".
        // I will clear them to avoid confusion that these are "official" values.
        setNewGroupSemester('');
        setNewGroupGroupName('');
    }
  }, [newGroupOfficialId, officialGroups]);

  const handleCreateGroup = async () => {
    if (!newGroupSubject.trim()) {
      toast({
        variant: 'destructive',
        title: 'Falta información',
        description: 'El nombre de la asignatura es obligatorio.',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Fetch students if official group selected
    let initialStudents: any[] = [];
    if (newGroupOfficialId && newGroupOfficialId !== 'manual') {
        try {
            initialStudents = await getOfficialGroupStudents(newGroupOfficialId);
            toast({
                title: "Vinculando Grupo",
                description: `Se han cargado ${initialStudents.length} estudiantes del grupo oficial.`
            });
        } catch (e) {
            console.error("Error loading official students:", e);
            toast({
                variant: 'destructive',
                title: 'Error de Vinculación',
                description: 'No se pudieron cargar los estudiantes del grupo oficial.'
            });
        }
    }

    const id = `G${Date.now()}`;
    const newGroup: Group = {
      id,
      subject: newGroupSubject.trim(),
      semester: newGroupSemester.trim(),
      groupName: newGroupGroupName.trim(),
      facilitator: newGroupFacilitator.trim(),
      whatsappLink: newGroupWhatsapp.trim(),
      students: initialStudents,
      criteria: [],
      officialGroupId: newGroupOfficialId !== 'manual' ? newGroupOfficialId : undefined,
      status: 'active'
    };
    
    try {
        await setGroups((prev: Group[]) => [...prev, newGroup]);

        toast({
          title: 'Grupo Creado',
          description: `El grupo "${newGroup.subject}" ha sido creado exitosamente.`,
        });
        
        // Reset form and close dialog
        setNewGroupSubject('');
        setNewGroupSemester('');
        setNewGroupGroupName('');
        setNewGroupWhatsapp('');
        setNewGroupOfficialId('manual');
        setNewGroupFacilitator(settings.facilitatorName || '');
        setIsDialogOpen(false);
    } catch (e) {
        console.error("Error creating group:", e);
        toast({
            variant: "destructive",
            title: "Error al crear grupo",
            description: "No se pudo guardar el nuevo grupo. Inténtalo de nuevo."
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleCardClick = (groupId: string) => {
    setActiveGroupId(groupId);
  }

  const activeGroups = groups.filter(g => !g.status || g.status === 'active');
  const archivedGroups = groups.filter(g => g.status === 'archived');
  
  const renderGroupCard = (group: Group, index: number, isArchived: boolean = false) => {
    const linkedOfficialGroup = group.officialGroupId ? officialGroups.find(og => og.id === group.officialGroupId) : null;

    return (
    <Card key={group.id} className={cn("flex flex-col hover:shadow-lg transition-shadow text-card-foreground-alt relative group", isArchived ? "opacity-80 grayscale" : "", cardColors[index % cardColors.length])}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="mb-1">{group.subject}</CardTitle>
                
                {linkedOfficialGroup ? (
                   <div className="mt-2">
                      <span className="bg-black/20 text-white px-2 py-1 rounded text-sm font-bold block w-fit">
                          {linkedOfficialGroup.name}
                      </span>
                      <CardDescription className="text-card-foreground-alt/80 text-xs mt-1">
                          Grupo Oficial Vinculado
                      </CardDescription>
                   </div>
                ) : (
                    <CardDescription className="text-card-foreground-alt/80">
                      {group.semester && `${group.semester} | `}
                      {group.groupName && `Grupo: ${group.groupName}`}
                    </CardDescription>
                )}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-white/50 hover:text-white hover:bg-white/20">
                        <span className="sr-only">Abrir menú</span>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    {!isArchived ? (
                         <>
                            <DropdownMenuItem onClick={() => setActiveGroupId(group.id)}>
                                <Link href={`/groups/${group.id}`} className="w-full">Administrar</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setGroupToArchive(group)} className="text-orange-600 focus:text-orange-600">
                                <Archive className="mr-2 h-4 w-4" />
                                Cerrar / Archivar
                            </DropdownMenuItem>
                         </>
                    ) : (
                         <>
                            <DropdownMenuItem onClick={() => handleRestore(group.id)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restaurar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setGroupToDelete(group)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                         </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
         <div className="text-sm">
            <p>Facilitador: {group.facilitator || 'No especificado'}</p>
            {isArchived && group.archivedAt && (
                <p className="mt-2 text-xs opacity-75">
                    Archivado el: {new Date(group.archivedAt).toLocaleDateString()}
                    <br/>
                    <span className="text-[10px]">(Se eliminará en 1 año)</span>
                </p>
            )}
         </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center bg-black/20 p-4">
          <div className="flex items-center text-sm font-medium">
              <Users className="mr-2 h-4 w-4" />
              <span>{group.students ? group.students.length : 0} Estudiante(s)</span>
          </div>
        {!isArchived ? (
             <Button asChild variant="ghost" size="sm" onClick={() => setActiveGroupId(group.id)} className="hover:bg-white/20">
              <Link href={`/groups/${group.id}`}>
                Administrar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
        ) : (
            <span className="text-xs font-medium border border-white/30 rounded px-2 py-1">En Resguardo</span>
        )}
      </CardFooter>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Grupos</h1>
          <p className="text-muted-foreground">
            Administra tus grupos y estudiantes.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Nuevo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Grupo</DialogTitle>
              <DialogDescription>
                Ingresa los detalles para crear un nuevo grupo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Vincular a Grupo Oficial (Opcional)</Label>
                <Select value={newGroupOfficialId} onValueChange={setNewGroupOfficialId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grupo oficial..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">-- Carga Manual --</SelectItem>
                    {officialGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newGroupOfficialId && newGroupOfficialId !== 'manual' && (
                    <p className="text-xs text-muted-foreground">
                        Se cargarán automáticamente los estudiantes de este grupo.
                    </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Nombre de la Asignatura*</Label>
                <Input
                  id="subject"
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value)}
                  placeholder="Ej. Matemáticas Avanzadas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semestre</Label>
                <Input
                  id="semester"
                  value={newGroupSemester}
                  onChange={(e) => setNewGroupSemester(e.target.value)}
                  placeholder="Ej. Tercero"
                  disabled={newGroupOfficialId !== 'manual'}
                  className={newGroupOfficialId !== 'manual' ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupName">Grupo</Label>
                <Input
                  id="groupName"
                  value={newGroupGroupName}
                  onChange={(e) => setNewGroupGroupName(e.target.value)}
                  placeholder="Ej. A, B, TSPA..."
                  disabled={newGroupOfficialId !== 'manual'}
                  className={newGroupOfficialId !== 'manual' ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilitator">Facilitador</Label>
                <Input
                  id="facilitator"
                  value={newGroupFacilitator}
                  onChange={(e) => setNewGroupFacilitator(e.target.value)}
                  placeholder="Ej. Dr. Alberto Rodriguez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Enlace de WhatsApp (Opcional)</Label>
                <Input
                  id="whatsapp"
                  value={newGroupWhatsapp}
                  onChange={(e) => setNewGroupWhatsapp(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button onClick={handleCreateGroup} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Crear Grupo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
            <TabsTrigger value="active" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Grupos Activos
                <span className="ml-2 bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">{activeGroups.length}</span>
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center">
                <Archive className="mr-2 h-4 w-4" />
                Resguardo / Histórico
                <span className="ml-2 bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">{archivedGroups.length}</span>
            </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
             {activeGroups.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeGroups.map((group, i) => renderGroupCard(group, i, false))}
                </div>
              ) : (
                <Card className="md:col-span-2 lg:col-span-3 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                        <div className="bg-muted rounded-full p-4">
                            <Users className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <CardTitle>No hay grupos activos</CardTitle>
                        <CardDescription>
                            Crea un nuevo grupo o restaura uno desde el resguardo.
                        </CardDescription>
                    </CardContent>
                </Card>
              )}
        </TabsContent>
        
        <TabsContent value="archived">
            {archivedGroups.length > 0 ? (
                <div>
                    <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-3">
                         <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                         <div className="text-sm">
                             <h4 className="font-semibold text-amber-800 dark:text-amber-500">Zona de Resguardo</h4>
                             <p className="text-amber-700 dark:text-amber-400">
                                 Los grupos aquí almacenados se conservarán por un máximo de 1 año antes de ser eliminados automáticamente para optimizar el sistema.
                             </p>
                         </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-90">
                      {archivedGroups.map((group, i) => renderGroupCard(group, i, true))}
                    </div>
                </div>
              ) : (
                <Card className="md:col-span-2 lg:col-span-3 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                        <div className="bg-muted rounded-full p-4">
                            <Archive className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <CardTitle>Archivo vacío</CardTitle>
                        <CardDescription>
                            No tienes grupos en resguardo.
                        </CardDescription>
                    </CardContent>
                </Card>
              )}
        </TabsContent>
      </Tabs>
      
      {/* Archive Confirmation */}
      <AlertDialog open={!!groupToArchive} onOpenChange={(open) => !open && setGroupToArchive(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Cerrar grupo y enviar a resguardo?</AlertDialogTitle>
                <AlertDialogDescription>
                    El grupo &quot;{groupToArchive?.subject}&quot; dejará de aparecer en tu lista principal. 
                    Se almacenará en la sección de Resguardo por 1 año antes de eliminarse.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive}>Confirmar Cierre</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar permanentemente?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. El grupo &quot;{groupToDelete?.subject}&quot; y todos sus datos serán eliminados del sistema.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
