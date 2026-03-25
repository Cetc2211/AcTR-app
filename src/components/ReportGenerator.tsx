'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Archive, FileDown, ShieldAlert, Send } from "lucide-react";
import SafetyPlan from "./safety-plan";
import ReferralFlow from "./referral-flow";
import { Student, ClinicalAssessment } from '@/lib/store';
import { calculateRisk } from '@/lib/risk-analysis';

interface ReportGeneratorProps {
    student?: Student;
    clinicalAssessment?: ClinicalAssessment;
}

export default function ReportGenerator({ student, clinicalAssessment }: ReportGeneratorProps) {
    const [isReferralOpen, setIsReferralOpen] = useState(false);
    
    if (!student) return null;

    const handleGenerateIntegralReport = () => {
        // Simulación de la estructura de datos que se usaría para el PDF.
        const reportData = {
            studentInfo: student,
            clinicalData: clinicalAssessment,
            // ... Aquí se consumirían los datos de otras colecciones: análisis funcional, plan de tratamiento, resultados WISC/WAIS, etc.
            generatedAt: new Date().toISOString(),
            reportStructure: {
                motivoConsulta: `El estudiante es derivado por el área de Orientación debido a ${student.academicData.gpa < 7 ? 'bajo rendimiento académico' : 'preocupaciones conductuales observadas en el aula'}.`,
                pruebasAplicadas: ['Escala Wechsler de Inteligencia', 'Tamizaje Neuropsicológico', 'Inventarios de Beck (Depresión y Ansiedad)'],
                analisisResultados: 'El perfil cognitivo del estudiante se encuentra dentro del rango promedio para su edad. Se observan, sin embargo, indicadores de dificultades en la memoria de trabajo que podrían impactar su desempeño académico. Clínicamente, se reporta sintomatología ansioso-depresiva de carácter moderado a severo.',
                recomendaciones: ['Implementar técnica de "pausas activas" de 2 minutos.', 'Utilizar organizadores gráficos para tareas complejas.', 'Establecer metas a corto plazo para proyectos (contrato de contingencias).'],
            }
        };

        console.log("--- SIMULACIÓN: Generando Informe de Valoración Integral (Cap. 8.2) ---");
        console.log("Datos ensamblados para el motor de PDF:", reportData);
        alert("Simulación de exportación de Informe Integral completada. Revisa la consola para ver la estructura de datos.");
    };

    const handleCloseCase = () => {
        // Simulación de los inputs para el cálculo de riesgo
        const ausentismo_norm = (student.academicData.absences || 0) / 100;
        const bajo_rendimiento_bin = (student.academicData.gpa || 0) < 7.0 ? 1 : 0;
        const ansiedad_norm = (student.ansiedadScore || 0) / 21;
        
        const riskResult = calculateRisk({ ausentismo_norm, bajo_rendimiento_bin, ansiedad_norm });
        const P_Abandono = riskResult.IRC / 100;

        console.log(`Probabilidad de Abandono calculada para cierre: ${P_Abandono.toFixed(2)}`);

        if (P_Abandono < 0.20) {
            console.log("--- SIMULACIÓN: Protocolo de Cierre de Caso y Archivo Muerto (Cap. 8.4 y 8.5) ---");
            console.log(`El riesgo del estudiante (${P_Abandono.toFixed(2)}) es menor a 0.20. Procediendo a archivar.`);
            console.log("Expediente movido a la colección 'archivo_pasivo' con un timestamp de expiración de 5 años.");
            alert("Caso cerrado y archivado con éxito (simulación).");
        } else {
            alert(`Cierre de caso denegado. El nivel de riesgo actual (${P_Abandono.toFixed(2)}) es superior al umbral de seguridad (< 0.20).`);
        }
    };

    return (
        <Card className="shadow-lg border-green-500">
            <CardHeader>
                <CardTitle>Módulo 8: Reporte y Cierre Documental</CardTitle>
                <CardDescription>Generación de informes oficiales, derivación y archivo de expedientes.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-around items-center">

                {/* Acción 1: Plan de Seguridad */}
                <Dialog>
                    <DialogTrigger asChild>
                         <Button variant={"destructive"} className="font-bold w-full">
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Plan de Seguridad
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Módulo de Plan de Seguridad y Crisis</DialogTitle>
                          <DialogDescription>
                            Herramienta para el manejo activo del riesgo suicida y de autolesiones (Cap. 11.2).
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex-grow overflow-y-auto">
                           <SafetyPlan studentName={student.name} />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Acción 2: Generar Informe Integral */}
                <Button onClick={handleGenerateIntegralReport} variant="outline" className="font-bold w-full">
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar Informe Integral
                </Button>

                {/* Acción 3: Generar Carta de Referencia */}
                <Dialog open={isReferralOpen} onOpenChange={setIsReferralOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="font-bold w-full">
                            <Send className="mr-2 h-4 w-4" />
                            Generar Carta de Referencia
                        </Button>
                    </DialogTrigger>
                    {clinicalAssessment && (
                        <ReferralFlow 
                            studentName={student.name}
                            diagnosticImpression={clinicalAssessment.impresion_diagnostica} 
                        />
                    )}
                </Dialog>
                
                {/* Acción 4: Cerrar y Archivar Caso */}
                <Button onClick={handleCloseCase} className="w-full md:col-span-2 lg:col-span-3 bg-gray-600 hover:bg-gray-700 text-white font-bold">
                    <Archive className="mr-2 h-4 w-4" />
                    Cerrar y Archivar Caso
                </Button>

            </CardContent>
        </Card>
    )
}
