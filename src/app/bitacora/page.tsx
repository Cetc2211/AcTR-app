'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import type { Student, PartialId, StudentObservation } from '@/lib/placeholder-data';
import { BookText, User, Search, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

const observationTypes = ['Problema de conducta', 'Episodio emocional', 'Mérito', 'Demérito', 'Asesoría académica', 'Otros'];
const canalizationTargets = ['Tutor', 'Atención psicológica', 'Directivo', 'Padre/Madre/Tutor legal', 'Otros'];

export default function BitacoraPage() {
  const { activeGroup, allObservations, addStudentObservation } = useData();
  const { toast } = useToast();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [observationType, setObservationType] = useState('');
  const [customObservationType, setCustomObservationType] = useState('');
  const [details, setDetails] = useState('');
  const [partialId, setPartialId] = useState<PartialId>('p1');
  const [requiresCanalization, setRequiresCanalization] = useState(false);
  const [canalizationTarget, setCanalizationTarget] = useState('');
  const [customCanalizationTarget, setCustomCanalizationTarget] = useState('');
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  
  const studentsInGroup = useMemo(() => {
    if (!activeGroup) return [];
    if (!searchQuery) return activeGroup.students;
    return activeGroup.students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeGroup, searchQuery]);

  const recentObservations = useMemo(() => {
    if (!activeGroup) return [];
    
    const observations: (StudentObservation & { studentName: string })[] = [];
    activeGroup.students.forEach(student => {
      const studentObs = allObservations[student.id] || [];
      studentObs.forEach(obs => {
        observations.push({ ...obs, studentName: student.name });
      });
    });
    return observations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  }, [allObservations, activeGroup]);

  const resetForm = () => {
    setObservationType('');
    setCustomObservationType('');
    setDetails('');
    setPartialId('p1');
    setRequiresCanalization(false);
    setCanalizationTarget('');
    setCustomCanalizationTarget('');
    setRequiresFollowUp(false);
  };
  
  const handleAddObservation = async () => {
    const finalObservationType = observationType === 'Otros' ? customObservationType.trim() : observationType;
    const finalCanalizationTarget = canalizationTarget === 'Otros' ? customCanalizationTarget.trim() : canalizationTarget;
    
    if (!selectedStudent || !finalObservationType || !details.trim() || !partialId) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Debes seleccionar un estudiante e ingresar el tipo, detalle y parcial de la observación.',
      });
      return;
    }
    
    try {
        await addStudentObservation({
          studentId: selectedStudent.id,
          partialId,
          type: finalObservationType,
          details,
          requiresCanalization,
          canalizationTarget: requiresCanalization ? finalCanalizationTarget : undefined,
          requiresFollowUp,
        });
        
        toast({
          title: 'Observación registrada',
          description: `Se ha añadido una nueva entrada en la bitácora para ${selectedStudent.name}.`,
        });
        
        resetForm();
        setSelectedStudent(null);
    } catch(e) {
        toast({
          variant: 'destructive',
          title: 'Error al registrar',
          description: 'No se pudo guardar la observación. Inténtalo de nuevo.',
        });
    }
  };

  if (!activeGroup) {
    return (
      <Card>
        <CardHeader className="text-center">
            <BookText className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle>Bitácora</CardTitle>
            <CardDescription>
                Para registrar o ver observaciones, por favor <Link href="/groups" className="text-primary underline">selecciona un grupo</Link> primero.
            </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isFormValid = selectedStudent && (observationType === 'Otros' ? customObservationType : observationType) && details && partialId;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Bitácora del Grupo</h1>
        <p className="text-muted-foreground">
          Registro de observaciones y seguimientos para el grupo: {activeGroup.subject}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Registrar Nueva Observación</CardTitle>
            <CardDescription>
              Selecciona un estudiante y completa los detalles de la observación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 border rounded-lg">
                <Label>1. Seleccionar Estudiante</Label>
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar estudiante en el grupo..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                 <ScrollArea className="max-h-64 overflow-y-auto mt-2 space-y-1">
                    {studentsInGroup.map(student => (
                        <div
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className={`p-2 flex items-center gap-3 rounded-md cursor-pointer ${selectedStudent?.id === student.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                        >
                            <Image src={student.photo} alt={student.name} width={32} height={32} className="rounded-full" />
                            <span className="font-medium text-sm">{student.name}</span>
                        </div>
                    ))}
                 </ScrollArea>
                 {selectedStudent && (
                    <div className="mt-2 text-sm font-semibold text-primary p-2 bg-primary/10 rounded-md flex items-center gap-2">
                        <User className="h-4 w-4"/>
                        Estudiante seleccionado: {selectedStudent.name}
                    </div>
                 )}
            </div>

            <div className="p-4 border rounded-lg space-y-4">
                <Label>2. Detalles de la Observación</Label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="observation-type">Tipo de Observación</Label>
                        <Select value={observationType} onValueChange={setObservationType}>
                            <SelectTrigger id="observation-type">
                                <SelectValue placeholder="Seleccionar tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {observationTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {observationType === 'Otros' && (
                             <Input placeholder="Especificar tipo" value={customObservationType} onChange={(e) => setCustomObservationType(e.target.value)} />
                        )}
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="partial-id">Parcial Correspondiente</Label>
                        <Select value={partialId} onValueChange={(v) => setPartialId(v as PartialId)}>
                            <SelectTrigger id="partial-id">
                                <SelectValue placeholder="Seleccionar parcial..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="p1">Primer Parcial</SelectItem>
                                <SelectItem value="p2">Segundo Parcial</SelectItem>
                                <SelectItem value="p3">Tercer Parcial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="details">Descripción Detallada</Label>
                    <Textarea id="details" placeholder="Describe el incidente, mérito, o situación observada..." value={details} onChange={(e) => setDetails(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 pt-4">
                        <Checkbox id="requiresCanalization" checked={requiresCanalization} onCheckedChange={(checked) => setRequiresCanalization(!!checked)}/>
                        <Label htmlFor="requiresCanalization">¿Requiere canalización?</Label>
                    </div>
                     <div className="flex items-center space-x-2 pt-4">
                        <Checkbox id="requiresFollowUp" checked={requiresFollowUp} onCheckedChange={(checked) => setRequiresFollowUp(!!checked)}/>
                        <Label htmlFor="requiresFollowUp">¿Requiere seguimiento?</Label>
                    </div>
                </div>
                {requiresCanalization && (
                    <div className="space-y-1">
                        <Label htmlFor="canalization-target">Canalizar a</Label>
                         <Select value={canalizationTarget} onValueChange={setCanalizationTarget}>
                            <SelectTrigger id="canalization-target">
                                <SelectValue placeholder="Seleccionar destino..." />
                            </SelectTrigger>
                            <SelectContent>
                                {canalizationTargets.map(target => <SelectItem key={target} value={target}>{target}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {canalizationTarget === 'Otros' && (
                             <Input placeholder="Especificar destino" value={customCanalizationTarget} onChange={(e) => setCustomCanalizationTarget(e.target.value)} />
                        )}
                    </div>
                )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddObservation} disabled={!isFormValid}>Registrar Observación</Button>
          </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Bitácora Reciente del Grupo</CardTitle>
                <CardDescription>Últimas 5 observaciones registradas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {recentObservations.length > 0 ? recentObservations.map(obs => (
                    <div key={obs.id} className="p-2 border rounded-md text-sm">
                        <div className="flex justify-between items-start">
                            <p className="font-semibold">{obs.studentName}</p>
                             <div className="text-xs text-muted-foreground flex items-center gap-1">
                                {obs.requiresFollowUp ? <AlertCircle className="h-3 w-3 text-amber-500" /> : <CheckCircle className="h-3 w-3 text-green-500" />}
                                {obs.type}
                             </div>
                        </div>
                        <p className="text-muted-foreground text-xs mt-1">{obs.details.substring(0, 50)}...</p>
                    </div>
                )) : (
                    <p className="text-center text-sm text-muted-foreground py-8">No hay observaciones recientes.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
