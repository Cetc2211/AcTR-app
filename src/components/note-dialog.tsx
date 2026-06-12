
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Student, StudentObservation, SpecialNote } from '@/lib/placeholder-data';
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';


export const NoteDialog = ({
    note,
    onSave,
    children,
}: {
    note?: SpecialNote | null,
    onSave: (text: string, dateRange: DateRange | undefined) => void,
    children: React.ReactNode,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const [date, setDate] = useState<DateRange | undefined>(undefined);

    useEffect(() => {
        if (isOpen) {
            if (note) {
                setText(note.text);
                setDate({ from: parseISO(note.startDate), to: parseISO(note.endDate) });
            } else {
                setText('');
                setDate(undefined);
            }
        }
    }, [note, isOpen]);

    const handleSave = () => {
        onSave(text, date);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{note ? 'Editar' : 'Agregar'} Consideración Especial</DialogTitle>
                    <DialogDescription>
                        Esta nota aparecerá en el dashboard durante el rango de fechas seleccionado.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="note-text">Mensaje de la Nota</Label>
                        <Textarea id="note-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej. Horario especial por semana de exámenes." />
                    </div>
                    <div className="space-y-2">
                        <Label>Rango de Fechas</Label>
                        <div className="flex justify-center">
                            <Calendar
                                mode="range"
                                selected={date}
                                onSelect={setDate}
                                locale={es}
                                className="rounded-md border"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleSave}>Guardar Nota</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
