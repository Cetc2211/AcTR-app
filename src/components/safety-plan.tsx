'use client';

import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Separator } from './ui/separator';

interface SafetyPlanProps {
    studentName: string;
}

const safetyPlanSteps = [
    { id: 'step1', label: 'Paso 1: Señales de Advertencia (Triggers)', placeholder: 'Ej. "Sentirme solo", "Recibir una mala calificación", "Pensar que no puedo con todo"...' },
    { id: 'step2', label: 'Paso 2: Estrategias de Afrontamiento Internas', placeholder: 'Ej. "Usar la habilidad de Mindfulness de 5 minutos", "Escribir en mi diario", "Escuchar música relajante"...' },
    { id: 'step3', label: 'Paso 3: Contactos Sociales que Brindan Distracción', placeholder: 'Ej. "Llamar a [Amigo/a]", "Ir a la sala y hablar con [Familiar]", "Enviar mensaje a [Tutor/a]"...' },
    { id: 'step4', label: 'Paso 4: Contactos de Ayuda Profesional', placeholder: 'Ej. "Psicólogo(a) [Nombre]: [Teléfono]", "Psiquiatra [Nombre]: [Teléfono]"...' },
    { id: 'step5', label: 'Paso 5: Sitios o Clínicas de Emergencia', placeholder: 'Ej. "Línea de la Vida: 800 911 2000", "Llamar al 911", "Acudir al Hospital General más cercano"...' },
    { id: 'step6', label: 'Paso 6: Restricción de Medios Letales', placeholder: 'Ej. "Le he pedido a [Familiar] que guarde bajo llave los medicamentos", "Me comprometo a no estar solo(a) en [Lugar específico]"...' },
];

export default function SafetyPlan({ studentName }: SafetyPlanProps) {

    const handleSaveAndPrint = (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);
        
        const planData = {
            studentId: 'S001', // Debería ser dinámico
            studentName,
            createdAt: new Date().toISOString(),
            steps: safetyPlanSteps.map(step => ({
                step: step.label,
                content: formData.get(step.id) as string,
            }))
        };

        console.log("Guardando Plan de Seguridad en 'safety_plans':", planData);
        alert("Plan de Seguridad guardado (simulación). Preparando para imprimir...");

        // En una aplicación real, aquí iría la lógica para generar un PDF o abrir la ventana de impresión.
        window.print();
    };

    return (
        <div className="pt-6">
            <form onSubmit={handleSaveAndPrint} className="space-y-8">
                {safetyPlanSteps.map((step, index) => (
                    <div key={step.id} className="space-y-2">
                        <Label htmlFor={step.id} className="text-md font-semibold text-gray-800">{step.label}</Label>
                        <Textarea
                            id={step.id}
                            name={step.id}
                            placeholder={step.placeholder}
                            className="min-h-[100px] text-base"
                            required
                        />
                            {index < safetyPlanSteps.length - 1 && <Separator className="mt-6"/>}
                    </div>
                ))}
                
                <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-6 py-3">
                        <Printer className="mr-2 h-5 w-5" />
                        Guardar y Generar Contrato de Seguridad
                    </Button>
                </div>
            </form>
        </div>
    );
}
