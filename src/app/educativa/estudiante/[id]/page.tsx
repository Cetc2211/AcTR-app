'use client';

import { useParams, redirect } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import React, { useEffect, useState } from 'react';
import { getStudentById, getEducationalAssessmentByStudentId, Student } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Send } from 'lucide-react';
import PIEIFeedback from '@/components/piei-feedback';
import EducationalDataSummary from '@/components/EducationalDataSummary';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ReferralFlow from '@/components/referral-flow';


export default function EducationalFilePage() {
    const params = useParams();
    const studentId = params.id as string;
    const { role } = useSession();

    const [isLoaded, setIsLoaded] = useState(false);
    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const [student, setStudent] = useState<Student | undefined>(undefined);

    useEffect(() => {
        if (studentId) {
            setStudent(getStudentById(studentId));
        }
    }, [studentId]);


    useEffect(() => {
        if (role && role !== 'loading') {
            setIsLoaded(true);
        }
    }, [role]);

    // GUARDIA DE RUTA INVERSA: Si eres Clínico, ve a tu vista completa
    if (isLoaded) {
        if (role === 'Clinico') {
            redirect(`/clinica/expediente/${studentId}`);
            return null; 
        }
    }
    
    if (role === 'loading' || !isLoaded || !student) {
        return <div className="p-8 text-center text-xl">Verificando Permisos Educativos...</div>;
    }
    
    const educationalAssessment = getEducationalAssessmentByStudentId(studentId);


    if (!student) {
        // En una app real, esto sería una página 404
        return <div className="p-8">Estudiante no encontrado.</div>;
    }

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-blue-700">PERFIL ESTUDIANTIL Y PIEI (NIVEL 1/2)</h1>
                    <p className="text-md text-gray-500">{student.name}</p>
                </div>

                 <Card className="mb-8 bg-purple-50 border-purple-500">
                    <CardHeader className="flex-row items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Lock className="h-8 w-8 text-purple-700" />
                            <div>
                                <CardTitle className="text-purple-800">Ambiente Educativo (Rol: {role})</CardTitle>
                                <CardDescription className="text-purple-700">
                                   Esta vista muestra únicamente los componentes pedagógicos y de seguimiento académico, protegiendo la información clínica sensible.
                                </CardDescription>
                            </div>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="bg-white">
                                    <Send className="mr-2" />
                                    Iniciar Derivación Espontánea
                                </Button>
                            </DialogTrigger>
                             <ReferralFlow 
                                studentName={student.name}
                                // Se deja vacío para que el orientador lo llene
                                diagnosticImpression={''} 
                            />
                        </Dialog>
                    </CardHeader>
                </Card>

                <div className="space-y-12">
                   <EducationalDataSummary educationalAssessment={educationalAssessment} />
                   <PIEIFeedback />
                </div>
            </div>
        </div>
    )
}
