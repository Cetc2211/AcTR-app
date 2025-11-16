'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Trash, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { notFound, useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/hooks/use-data';
import type { EvaluationCriteria } from '@/lib/placeholder-data';

const nameOptions = ["Actividades", "Portafolio", "Participación", "Examen", "Proyecto Integrador", "Otros"];
const weightOptions = ["10", "20", "30", "40", "50", "60", "70", "80", "90", "100", "Otros"];

export default function GroupCriteriaPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { activeGroup, partialData, updateGroupCriteria } = useData();
  const { criteria = [] } = activeGroup || {};
  const { activities, participations } = partialData;

  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('');
  const [customWeight, setCustomWeight] = useState('');
  const [newCriterionValue, setNewCriterionValue] = useState('');
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<EvaluationCriteria | null>(null);

  const { toast } = useToast();
  
  const isSelectedCriterionAutomated = useMemo(() => {
    const name = selectedName === 'Otros' ? customName : selectedName;
    return name === 'Participación' || name === 'Actividades' || name === 'Portafolio';
  }, [selectedName, customName]);

  useEffect(() => {
    if(isSelectedCriterionAutomated) {
        setNewCriterionValue('0');
    } else {
        setNewCriterionValue('');
    }
  }, [isSelectedCriterionAutomated]);

  
  const handleAddCriterion = () => {
    const finalName = selectedName === 'Otros' ? customName.trim() : selectedName;
    const finalWeight = selectedWeight === 'Otros' ? customWeight : selectedWeight;
    
    const weight = parseFloat(finalWeight);
    const expectedValue = parseInt(newCriterionValue, 10);

    if (!finalName || isNaN(weight) || weight <= 0 || weight > 100 || (isNaN(expectedValue) && !isSelectedCriterionAutomated) || (!isSelectedCriterionAutomated && expectedValue < 0) ) {
        toast({
            variant: 'destructive',
            title: 'Datos inválidos',
            description: 'El nombre no puede estar vacío, el peso debe ser un número entre 1 y 100, y el valor esperado debe ser un número positivo.',
        });
        return;
    }

    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) + weight;
    if (totalWeight > 100) {
        toast({
            variant: 'destructive',
            title: 'Límite de peso excedido',
            description: `El peso total (${totalWeight}%) no puede superar el 100%.`,
        });
        return;
    }

    const newCriterion: EvaluationCriteria = {
        id: `C${Date.now()}`,
        name: finalName,
        weight: weight,
        expectedValue: isSelectedCriterionAutomated ? 0 : expectedValue,
    };

    updateGroupCriteria([...criteria, newCriterion]);
    setSelectedName('');
    setCustomName('');
    setSelectedWeight('');
    setCustomWeight('');
    setNewCriterionValue('');
    toast({ title: 'Criterio Agregado', description: `Se agregó "${newCriterion.name}" a la lista.`});
  };
  
  const handleRemoveCriterion = (criterionId: string) => {
    const newCriteria = criteria.filter(c => c.id !== criterionId);
    updateGroupCriteria(newCriteria);
    toast({ title: 'Criterio Eliminado', description: 'El criterio de evaluación ha sido eliminado.' });
  };
  
  const handleOpenEditDialog = (criterion: EvaluationCriteria) => {
    setEditingCriterion({ ...criterion });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCriterion = () => {
    if (!editingCriterion) return;

    const weight = editingCriterion.weight;
    const expectedValue = editingCriterion.expectedValue;
    const isAutomated = editingCriterion.name === 'Participación' || editingCriterion.name === 'Actividades' || editingCriterion.name === 'Portafolio';

     if (!editingCriterion.name.trim() || isNaN(weight) || weight <= 0 || weight > 100 || (isNaN(expectedValue) && !isAutomated) || (!isAutomated && expectedValue < 0) ) {
        toast({
            variant: 'destructive',
            title: 'Datos inválidos',
            description: 'El nombre no puede estar vacío, el peso debe ser un número entre 1 y 100, y el valor esperado debe ser un número positivo.',
        });
        return;
    }

    const otherCriteriaWeight = criteria
      .filter(c => c.id !== editingCriterion.id)
      .reduce((sum, c) => sum + c.weight, 0);

    const totalWeight = otherCriteriaWeight + weight;
    if (totalWeight > 100) {
        toast({
            variant: 'destructive',
            title: 'Límite de peso excedido',
            description: `El peso total (${totalWeight}%) no puede superar el 100%.`,
        });
        return;
    }
    
    const updatedCriterion = { ...editingCriterion };
    if (isAutomated) {
        updatedCriterion.expectedValue = 0;
    }

    const updatedCriteria = criteria.map(c => c.id === updatedCriterion.id ? updatedCriterion : c);
    updateGroupCriteria(updatedCriteria);

    setIsEditDialogOpen(false);
    setEditingCriterion(null);
    toast({ title: 'Criterio Actualizado', description: 'Los cambios han sido guardados.' });
  };


  const totalWeight = useMemo(() => {
    return criteria.reduce((sum, c) => sum + c.weight, 0);
  }, [criteria]);

  if (!activeGroup) {
    return notFound();
  }
  
  const finalNameForCheck = selectedName === 'Otros' ? customName.trim() : selectedName;
  const finalWeightForCheck = selectedWeight === 'Otros' ? customWeight : selectedWeight;
  const isAddButtonDisabled = !finalNameForCheck || !finalWeightForCheck || (!newCriterionValue && !isSelectedCriterionAutomated);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href={`/groups/${groupId}`}>
            <ArrowLeft />
            <span className="sr-only">Volver al Grupo</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Criterios de Evaluación</h1>
          <p className="text-muted-foreground">
            Gestiona los rubros para el grupo &quot;{activeGroup.subject}&quot;. Estos criterios se aplicarán a todos los parciales.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Definir Criterios</CardTitle>
          <CardDescription>
            Define los rubros, su peso para la calificación final y el valor esperado para cada uno. El peso total no debe exceder el 100%.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end gap-2">
                <div className="flex-grow space-y-1">
                    <Label htmlFor="criterion-name">Nombre del criterio</Label>
                    <div className="flex gap-2">
                        <Select value={selectedName} onValueChange={setSelectedName}>
                            <SelectTrigger id="criterion-name">
                                <SelectValue placeholder="Selecciona un nombre" />
                            </SelectTrigger>
                            <SelectContent>
                                {nameOptions.map(option => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedName === 'Otros' && (
                            <Input 
                                placeholder="Nombre personalizado" 
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                            />
                        )}
                    </div>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="criterion-weight">Peso %</Label>
                    <div className="flex gap-2">
                        <Select value={selectedWeight} onValueChange={setSelectedWeight}>
                            <SelectTrigger id="criterion-weight" className="w-[120px]">
                                <SelectValue placeholder="Peso" />
                            </SelectTrigger>
                            <SelectContent>
                                {weightOptions.map(option => (
                                    <SelectItem key={option} value={option === 'Otros' ? option : `${option}`}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedWeight === 'Otros' && (
                            <Input 
                                type="number"
                                placeholder="Peso %" 
                                className="w-[120px]"
                                value={customWeight}
                                onChange={(e) => setCustomWeight(e.target.value)}
                            />
                        )}
                    </div>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="criterion-value">Valor Esperado</Label>
                    <Input 
                        id="criterion-value"
                        type="number" 
                        placeholder={isSelectedCriterionAutomated ? "Cálculo automático" : "Valor Esperado"}
                        className="w-[180px]"
                        value={newCriterionValue}
                        onChange={(e) => setNewCriterionValue(e.target.value)}
                        disabled={isSelectedCriterionAutomated}
                    />
                </div>
                <Button size="icon" onClick={handleAddCriterion} disabled={isAddButtonDisabled}>
                    <PlusCircle className="h-4 w-4"/>
                    <span className="sr-only">Agregar</span>
                </Button>
            </div>
          </div>
          
          <h3 className="text-lg font-medium mb-2 mt-6">Lista de Criterios</h3>
          <div className="space-y-2">
            {criteria.map(criterion => (
                <div key={criterion.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div>
                        <span className="font-medium">{criterion.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {criterion.name === 'Portafolio' || criterion.name === 'Actividades'
                            ? `Automático (basado en entregas)` : 
                            criterion.name === 'Participación' ? `Automático (basado en participaciones)`
                            : `${criterion.expectedValue} es el valor esperado`
                          }
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">{criterion.weight}%</Badge>
                         <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleOpenEditDialog(criterion)}>
                            <Edit className="h-4 w-4"/>
                            <span className="sr-only">Editar</span>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRemoveCriterion(criterion.id)}>
                            <Trash className="h-4 w-4 text-destructive"/>
                            <span className="sr-only">Eliminar</span>
                        </Button>
                    </div>
                </div>
            ))}
            {(!criteria || criteria.length === 0) && (
                <p className="text-sm text-center text-muted-foreground py-8">No has agregado criterios de evaluación.</p>
            )}
          </div>
        </CardContent>

        {(totalWeight > 0 || criteria.length > 0) && (
            <CardHeader className="border-t pt-4 mt-4">
                <div className="flex justify-end">
                    {totalWeight > 0 && (
                        <div className={`text-right font-bold ${totalWeight > 100 ? 'text-destructive' : ''}`}>
                            Total: {totalWeight}% {totalWeight > 100 && "(Sobrepasa el 100%)"}
                        </div>
                    )}
                </div>
            </CardHeader>
        )}
      </Card>

      {editingCriterion && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Criterio de Evaluación</DialogTitle>
              <DialogDescription>
                Ajusta los detalles de tu criterio de evaluación.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="edit-name"
                  value={editingCriterion.name}
                  onChange={(e) => setEditingCriterion({ ...editingCriterion, name: e.target.value })}
                  className="col-span-3"
                  disabled={editingCriterion.name === 'Participación' || editingCriterion.name === 'Actividades' || editingCriterion.name === 'Portafolio'}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-weight" className="text-right">
                  Peso %
                </Label>
                <Input
                  id="edit-weight"
                  type="number"
                  value={editingCriterion.weight}
                   onChange={(e) => setEditingCriterion({ ...editingCriterion, weight: parseFloat(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-value" className="text-right">
                  Valor Esperado
                </Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={editingCriterion.expectedValue}
                  onChange={(e) => setEditingCriterion({ ...editingCriterion, expectedValue: parseInt(e.target.value, 10) || 0 })}
                  className="col-span-3"
                  disabled={editingCriterion.name === 'Participación' || editingCriterion.name === 'Actividades' || editingCriterion.name === 'Portafolio'}
                  placeholder={(editingCriterion.name === 'Participación' || editingCriterion.name === 'Actividades' || editingCriterion.name === 'Portafolio') ? 'Automático' : ''}
                />
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpdateCriterion}>Guardar Cambios</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
