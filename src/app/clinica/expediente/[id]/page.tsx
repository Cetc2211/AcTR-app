'use client';

import { useParams, redirect } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import React, { useEffect, useState } from 'react';

import ClinicalAssessmentForm from "@/components/clinical-assessment-form";
import FunctionalAnalysisForm from "@/components/functional-analysis-form";
import TreatmentPlanGenerator from "@/components/treatment-plan-generator";
import ProgressTracker from "@/components/progress-tracker";
import PIEIGenerator from "@/components/piei-generator";
import ReportGenerator from "@/components/ReportGenerator";
import { getStudentById, getClinicalAssessmentByStudentId, getFunctionalAnalysisByStudentId, getTreatmentPlanByStudentId, getProgressTrackingByStudentId, Student } from "@/lib/store";
import ClinicalKPILogger from '@/components/ClinicalKPILogger';
import RiskTimelineChart from '@/components/RiskTimelineChart';
import SOAPNotesForm from '@/components/SOAPNotesForm';
import WISCScoringConsole from '@/components/WISC-VScoringConsole';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ShieldAlert, Loader, ClipboardList, BookOpen, FileText, FileDown, Activity, UserCheck, BrainCircuit } from "lucide-react";
import ScreeningManagement from '@/components/screening-management';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NeuroScreeningConsole } from '@/components/NeuroScreeningConsole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import StudentIdentificationCard from '@/components/StudentIdentificationCard';


export default function ClinicalFilePage() {
    const params = useParams();
    const studentId = params.id as string;
    const { role } = useSession();
    const [student, setStudent] = useState<Student | undefined>(undefined);

    useEffect(() => {
        if (studentId) {
            setStudent(getStudentById(studentId));
        }
    }, [studentId]);

    useEffect(() => {
        if (role && role !== 'loading' && role !== 'Clinico') {
            console.log(`ACCESO DENEGADO: Rol '${role}' intentó acceder a ruta clínica. Redirigiendo.`);
            redirect(`/educativa/estudiante/${studentId}`);
        }
    }, [role, studentId]);
    
    if (role === 'loading' || !student) {
        return (
            <div className="flex h-screen w-full items-center justify-center p-8">
                <div className="flex items-center gap-2 text-xl text-gray-600">
                    <Loader className="animate-spin" />
                    {role === 'loading' ? 'Verificando Permisos de Seguridad...' : 'Cargando datos del estudiante...'}
                </div>
            </div>
        );
    }
    
    if (role !== 'Clinico') {
        return null;
    }

    const clinicalAssessment = getClinicalAssessmentByStudentId(studentId);
    const functionalAnalysis = getFunctionalAnalysisByStudentId(studentId);
    const treatmentPlan = getTreatmentPlanByStudentId(studentId);
    const progressTracking = getProgressTrackingByStudentId(studentId);

    const isHighRisk = student.suicideRiskLevel === 'Alto' || student.suicideRiskLevel === 'Crítico';

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                 <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-red-700">EXPEDIENTE CLÍNICO NIVEL 3 - CONFIDENCIAL</h1>
                    <p className="text-md text-gray-500">{student.name}</p>
                </div>
                
                {isHighRisk && (
                    <Alert variant="destructive" className="mb-8">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>
                            {student.suicideRiskLevel === 'Crítico' ? 'Alerta de Riesgo Crítico (Código Rojo)' : 'Alerta de Riesgo Alto'}
                        </AlertTitle>
                        <AlertDescription>
                            Este caso está marcado con Riesgo Suicida '{student.suicideRiskLevel}'. Se debe priorizar la aplicación inmediata del Plan de Seguridad y la canalización externa de emergencia (Criterio A/B).
                        </AlertDescription>
                    </Alert>
                )}

                <Alert className="mb-8 border-yellow-500 text-yellow-800">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Disclaimer Deontológico (Cap. 1.5)</AlertTitle>
                    <AlertDescription>
                        El resultado de este expediente (IRC, BDI, etc.) constituye una Alerta de Riesgo y una <strong>Impresión Diagnóstica Provisional</strong>, no un diagnóstico nosológico definitivo.
                    </AlertDescription>
                </Alert>

                <Tabs defaultValue="resumen" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="identificacion"><UserCheck className="mr-2"/>Ficha de Identificación</TabsTrigger>
                        <TabsTrigger value="resumen"><Activity className="mr-2"/>Resumen Ejecutivo</TabsTrigger>
                        <TabsTrigger value="pruebas"><ClipboardList className="mr-2"/>Gestión de Pruebas</TabsTrigger>
                        <TabsTrigger value="soap"><FileText className="mr-2"/>Evolución y Notas</TabsTrigger>
                        <TabsTrigger value="documentacion"><FileDown className="mr-2"/>Documentación Legal</TabsTrigger>
                    </TabsList>

                    <TabsContent value="identificacion" className="mt-6">
                        <StudentIdentificationCard student={student} />
                    </TabsContent>
                    
                    <TabsContent value="resumen" className="mt-6 space-y-12">
                        <ClinicalAssessmentForm initialData={clinicalAssessment} />
                        <FunctionalAnalysisForm studentName={student.name} initialData={functionalAnalysis} />
                        <TreatmentPlanGenerator studentName={student.name} initialData={treatmentPlan} />
                        <PIEIGenerator clinicalData={clinicalAssessment} />
                        <ProgressTracker initialData={progressTracking} />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ClinicalKPILogger />
                            <RiskTimelineChart />
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="pruebas" className="mt-6 space-y-12">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardList />
                                    Aplicar Instrumento de Tamizaje Individual
                                </CardTitle>
                                <CardDescription>
                                    Genera un enlace para que el estudiante responda a un instrumento clínico específico.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <ScreeningManagement />
                            </CardContent>
                        </Card>

                        <Card>
                           <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen />
                                    Consola de Aplicación: Evaluación Psicométrica
                                </CardTitle>
                                <CardDescription>
                                     El sistema seleccionará automáticamente la escala Wechsler apropiada según la edad cronológica del evaluado, que es de <strong>{student.demographics.age} años</strong>.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                <Button asChild size="lg">
                                    <Link href={`/consola/${studentId}`} target="_blank">
                                        Iniciar Aplicación Presencial ({student.demographics.age < 17 ? 'WISC-V' : 'WAIS-IV'})
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BrainCircuit />
                                    Consola de Aplicación: Tamizaje Neuropsicológico
                                </CardTitle>
                                <CardDescription>Herramienta para el registro en tiempo real de pruebas de atención y funciones ejecutivas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <NeuroScreeningConsole studentId={studentId} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="soap" className="mt-6">
                        <SOAPNotesForm />
                    </TabsContent>

                    <TabsContent value="documentacion" className="mt-6">
                         <ReportGenerator student={student} clinicalAssessment={clinicalAssessment} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
