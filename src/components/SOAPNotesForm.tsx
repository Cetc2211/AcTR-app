'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Save } from 'lucide-react';
import { Separator } from './ui/separator';

export default function SOAPNotesForm() {
    const [soapNote, setSoapNote] = useState({
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSoapNote(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveNote = () => {
        const noteData = {
            studentId: 'S001', // Dinámico en una app real
            sessionId: `session_${new Date().getTime()}`, // Generar ID único
            createdAt: new Date().toISOString(),
            ...soapNote,
        };

        // Simulación de guardado
        console.log("--- Guardando Nota de Evolución SOAP (Cap. 10.4) ---");
        console.log("Guardando en 'session_notes':", noteData);
        alert("Nota SOAP guardada con éxito. Válida para fines legales (simulación).");

        // Limpiar formulario
        setSoapNote({ subjective: '', objective: '', assessment: '', plan: '' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText />
                    Registro de Sesión (Notas SOAP)
                </CardTitle>
                <CardDescription>
                    Documento legal de la sesión clínica según la NOM-004 (Cap. 10.4).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="subjective" className="text-md font-semibold text-gray-700">S (Subjetivo)</Label>
                    <Textarea 
                        id="subjective"
                        name="subjective"
                        value={soapNote.subjective}
                        onChange={handleChange}
                        placeholder="Reporte del paciente: cómo se sintió, eventos relevantes desde la última sesión, etc."
                        className="min-h-[100px]"
                    />
                </div>
                <Separator />
                <div className="space-y-2">
                    <Label htmlFor="objective" className="text-md font-semibold text-gray-700">O (Objetivo)</Label>
                    <Textarea 
                        id="objective"
                        name="objective"
                        value={soapNote.objective}
                        onChange={handleChange}
                        placeholder="Observaciones del clínico: apariencia, afecto, comportamiento, resultados de KPIs, etc."
                         className="min-h-[100px]"
                    />
                </div>
                 <Separator />
                <div className="space-y-2">
                    <Label htmlFor="assessment" className="text-md font-semibold text-gray-700">A (Apreciación / Análisis)</Label>
                    <Textarea 
                        id="assessment"
                        name="assessment"
                        value={soapNote.assessment}
                        onChange={handleChange}
                        placeholder="Análisis del clínico: interpretación de S y O, progreso hacia los objetivos, hipótesis funcional, etc."
                         className="min-h-[120px]"
                    />
                </div>
                 <Separator />
                <div className="space-y-2">
                    <Label htmlFor="plan" className="text-md font-semibold text-gray-700">P (Plan)</Label>
                    <Textarea 
                        id="plan"
                        name="plan"
                        value={soapNote.plan}
                        onChange={handleChange}
                        placeholder="Plan para la siguiente sesión: tareas, ajustes al plan de tratamiento, temas a discutir, etc."
                         className="min-h-[100px]"
                    />
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveNote} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        <Save className="mr-2" />
                        Guardar y Firmar Nota de Sesión
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
