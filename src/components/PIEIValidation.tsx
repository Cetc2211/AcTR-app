'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface PIEIValidationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const checklistItems = [
    { id: 'check1', label: 'Las instrucciones son pedagógicas, no clínicas (ej. "usar apoyos visuales" vs. "tratar ansiedad").' },
    { id: 'check2', label: 'Las recomendaciones son viables y realistas para un entorno escolar.' },
    { id: 'check3', label: 'Se protege la confidencialidad del diagnóstico (no se revela información sensible).' },
    { id: 'check4', label: 'He verificado que el PIEI no contiene jerga clínica ni patologiza al estudiante.' }
];

export default function PIEIValidation({ isOpen, onClose, onConfirm }: PIEIValidationProps) {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const allChecked = Object.values(checkedItems).length === checklistItems.length && Object.values(checkedItems).every(Boolean);

    useEffect(() => {
        if (isOpen) {
            setCheckedItems({});
        }
    }, [isOpen]);

    const handleCheckboxChange = (itemId: string, isChecked: boolean) => {
        setCheckedItems(prev => ({
            ...prev,
            [itemId]: isChecked
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="text-yellow-500" />
                        Validación de Cortafuegos Ético (Cap. 10.4.1)
                    </DialogTitle>
                    <DialogDescription>
                        Antes de finalizar, confirme que el Plan de Intervención Educativa Integrado (PIEI) cumple con los siguientes principios para proteger la confidencialidad y la viabilidad.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {checklistItems.map(item => (
                        <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md border">
                            <Checkbox 
                                id={item.id} 
                                onCheckedChange={(checked) => handleCheckboxChange(item.id, !!checked)}
                                checked={checkedItems[item.id] || false}
                            />
                            <Label htmlFor={item.id} className="text-sm font-medium leading-snug cursor-pointer">
                                {item.label}
                            </Label>
                        </div>
                    ))}
                </div>
                 {allChecked && (
                    <div className="p-3 bg-green-100 border border-green-300 rounded-md text-sm text-green-800 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4"/>
                        <span>¡Validación de seguridad y confidencialidad completada! Puede proceder.</span>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onConfirm} disabled={!allChecked}>
                        Confirmar y Guardar PIEI
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}