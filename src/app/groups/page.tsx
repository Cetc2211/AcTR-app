
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
import { useData } from '@/hooks/use-data';
import { Group } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Users, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';


const cardColors = [
  'bg-card-1', 'bg-card-2', 'bg-card-3', 'bg-card-4', 'bg-card-5'
];


export default function GroupsPage() {
  const { groups, setActiveGroupId, isLoading, setGroups, settings } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [newGroupSemester, setNewGroupSemester] = useState('');
  const [newGroupGroupName, setNewGroupGroupName] = useState('');
  const [newGroupFacilitator, setNewGroupFacilitator] = useState('');
  const [newGroupWhatsapp, setNewGroupWhatsapp] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if(settings.facilitatorName) {
        setNewGroupFacilitator(settings.facilitatorName);
    }
  }, [settings.facilitatorName, isDialogOpen]);

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
    
    const id = `G${Date.now()}`;
    const newGroup: Group = {
      id,
      subject: newGroupSubject.trim(),
      semester: newGroupSemester.trim(),
      groupName: newGroupGroupName.trim(),
      facilitator: newGroupFacilitator.trim(),
      whatsappLink: newGroupWhatsapp.trim(),
      students: [],
      criteria: [],
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupName">Grupo</Label>
                <Input
                  id="groupName"
                  value={newGroupGroupName}
                  onChange={(e) => setNewGroupGroupName(e.target.value)}
                  placeholder="Ej. A, B, TSPA..."
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

      {groups.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, index) => (
            <Card key={group.id} className={cn("flex flex-col hover:shadow-lg transition-shadow text-card-foreground-alt", cardColors[index % cardColors.length])}>
              <CardHeader>
                <CardTitle>{group.subject}</CardTitle>
                <CardDescription className="text-card-foreground-alt/80">
                  {group.semester && `${group.semester} | `}
                  {group.groupName && `Grupo: ${group.groupName}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="text-sm">
                    <p>Facilitador: {group.facilitator || 'No especificado'}</p>
                 </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center bg-black/20 p-4">
                  <div className="flex items-center text-sm font-medium">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{group.students.length} Estudiante(s)</span>
                  </div>
                <Button asChild variant="ghost" size="sm" onClick={() => handleCardClick(group.id)} className="hover:bg-white/20">
                  <Link href={`/groups/${group.id}`}>
                    Administrar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center text-center p-12 gap-4">
                <div className="bg-muted rounded-full p-4">
                    <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle>No hay grupos todavía</CardTitle>
                <CardDescription>
                    Crea tu primer grupo para empezar a agregar estudiantes y registrar su progreso.
                </CardDescription>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
