'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Student, StudentObservation } from '@/lib/placeholder-data';
import { useState, useEffect } from 'react';
import { useData } from '@/hooks/use-data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { getPartialLabel } from '@/lib/utils';
import { Loader2 } from 'lucide-react';


interface ObservationItemProps {
  observation: StudentObservation;
  onUpdate: (observationId: string, updateText: string, isClosing: boolean) => void;
  studentName: string;
}

const ObservationItem = ({ observation, onUpdate, studentName }: ObservationItemProps) => {
    const [updateText, setUpdateText] = useState('');
    const [isClosingCase, setIsClosingCase] = useState(false);
    const { toast } = useToast();

    const handleSaveUpdate = () => {
        if (!updateText.trim()) return;
        onUpdate(observation.id, updateText, isClosingCase);
        setUpdateText('');
        setIsClosingCase(false);
    };

    return (
      <div className={`border-l-4 pl-3 py-2 ${observation.isClosed ? 'opacity-60' : ''}`} style={{borderColor: observation.type === 'Mérito' ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}}>
            <div className="flex justify-between items-center">
                <div className='flex items-center gap-2'>
                    <p className="font-semibold text-sm">{observation.type}</p>
                    {observation.isClosed && <Badge variant="secondary">Cerrado</Badge>}
                </div>
                <div className="text-xs text-muted-foreground space-x-2">
                    <Badge variant="outline" className="text-xs">{getPartialLabel(observation.partialId)}</Badge>
                    <span>{format(new Date(observation.date), "dd MMM yyyy", { locale: es })}</span>
                </div>
            </div>
            <p className="text-sm mt-1 mb-2">{observation.details}</p>
            {observation.canalizationTarget && <Badge variant="outline" className="text-xs">Canalizado a: {observation.canalizationTarget}</Badge>}
            
            {observation.followUpUpdates.length > 0 && (
                <div className="mt-3 space-y-2 border-t pt-2">
                    <p className='text-xs font-bold'>Actualizaciones de seguimiento:</p>
                    {observation.followUpUpdates.map((update, index) => (
                        <div key={index} className="text-xs bg-muted/50 p-2 rounded-md">
                            <p className='font-semibold'>{format(new Date(update.date), "dd MMM yyyy", { locale: es })}:</p>
                            <p>{update.update}</p>
                        </div>
                    ))}
                </div>
            )}

            {observation.requiresFollowUp && !observation.isClosed && (
                <div className="mt-3 space-y-2 border-t pt-3">
                    <Textarea 
                        value={updateText}
                        onChange={(e) => setUpdateText(e.target.value)}
                        placeholder="Añadir actualización de seguimiento..."
                        rows={2}
                        className="text-sm"
                    />
                    <div className='flex justify-between items-center'>
                        <div className="flex items-center space-x-2">
                            <Checkbox id={`close-${observation.id}`} checked={isClosingCase} onCheckedChange={(checked) => setIsClosingCase(!!checked)} />
                            <Label htmlFor={`close-${observation.id}`} className="text-xs font-normal">Marcar caso como cerrado</Label>
                        </div>
                         <div className='flex items-center gap-2'>
                           <Button size="sm" onClick={handleSaveUpdate} disabled={!updateText.trim()}>Guardar Seguimiento</Button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    )
}

interface StudentObservationLogDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentObservationLogDialog({ student, open, onOpenChange }: StudentObservationLogDialogProps) {
  const { allObservations, updateStudentObservation } = useData();
  const [observations, setObservations] = useState<StudentObservation[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (student) {
        const studentObs = allObservations[student.id] || [];
        setObservations([...studentObs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } else {
        setObservations([]);
    }
  }, [student, allObservations, open]);

  const handleUpdate = async (observationId: string, updateText: string, isClosing: boolean) => {
    if (!student) return;
    try {
      await updateStudentObservation(student.id, observationId, updateText, isClosing);
      toast({
        title: 'Seguimiento Actualizado',
        description: `Se ha añadido una nueva actualización para ${student.name}.`,
      });
    } catch(e) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: 'No se pudo guardar el seguimiento.',
      });
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bitácora de {student.name}</DialogTitle>
          <DialogDescription>
            Historial de observaciones y seguimientos registrados.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] h-full my-4 pr-4">
             {observations.length > 0 ? (
                <div className="space-y-4">
                    {observations.map(obs => (
                        <ObservationItem key={obs.id} observation={obs} onUpdate={handleUpdate} studentName={student.name} />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-center text-muted-foreground py-12">No hay observaciones registradas para este estudiante.</p>
            )}
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
