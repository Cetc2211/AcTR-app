'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';

interface ClinicalScreeningDialogProps {
  studentId: string;
  studentName: string;
  initialNeuropsi?: number;
  initialGad7?: number;
  initialDate?: string;
  trigger?: React.ReactNode;
  onSaved?: () => void;
}

export function ClinicalScreeningDialog({
  studentId,
  studentName,
  initialNeuropsi,
  initialGad7,
  initialDate,
  trigger,
  onSaved
}: ClinicalScreeningDialogProps) {
  const [open, setOpen] = useState(false);
  const [neuropsi, setNeuropsi] = useState<string>(initialNeuropsi?.toString() || '');
  const [gad7, setGad7] = useState<string>(initialGad7?.toString() || '');
  const [date, setDate] = useState<Date | undefined>(initialDate ? new Date(initialDate) : new Date());
  const [loading, setLoading] = useState(false);
  const { updateStudent } = useData();
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
        await updateStudent(studentId, {
            neuropsiScore: neuropsi ? parseFloat(neuropsi) : undefined,
            gad7Score: gad7 ? parseFloat(gad7) : undefined,
            screeningDate: date ? date.toISOString() : undefined
        });

        toast({
            title: "Tamizaje Actualizado",
            description: "Los resultados clínicos se han guardado correctamente.",
        });
        setOpen(false);
        if (onSaved) onSaved();
    } catch (error) {
        console.error("Error saving screening:", error);
        toast({
            variant: "destructive",
            title: "Error al guardar",
            description: "No se pudieron guardar los cambios.",
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Capturar Tamizaje</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tamizaje Universal (Local)</DialogTitle>
          <DialogDescription>
            Ingrese los resultados de las pruebas aplicadas a {studentName}. 
            Estos datos se procesan localmente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="neuropsi" className="text-right col-span-2">
              NEUROPSI (0-100)
              <span className="block text-xs text-muted-foreground w-full">Atención y Memoria</span>
            </Label>
            <Input
              id="neuropsi"
              type="number"
              min="0"
              max="100"
              value={neuropsi}
              onChange={(e) => setNeuropsi(e.target.value)}
              className="col-span-2"
              placeholder="Puntaje"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gad7" className="text-right col-span-2">
              GAD-7 (0-21)
              <span className="block text-xs text-muted-foreground">Escala de Ansiedad</span>
            </Label>
            <Input
              id="gad7"
              type="number"
              min="0"
              max="21"
              value={gad7}
              onChange={(e) => setGad7(e.target.value)}
              className="col-span-2"
              placeholder="Puntaje"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right col-span-2">
              Fecha de Aplicación
            </Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "col-span-2 justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Resultados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
