'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    ArrowRight, FileText, User, Shield, Check, AlertCircle, 
    CreditCard, Loader2, LogOut, ChevronRight, CheckCircle2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';
import { validarMatricula, vincularExpediente, type MatriculaRegistro } from '@/lib/matricula-service';
import FichaIdentificacionForm from '@/components/FichaIdentificacionForm';
import BdiForm from '@/components/BdiForm';
import BaiForm from '@/components/BaiForm';
import Phq9Form from '@/components/Phq9Form';
import Gad7Form from '@/components/Gad7Form';
import HadsForm from '@/components/HadsForm';
import BhsForm from '@/components/BhsForm';
import SsiForm from '@/components/SsiForm';
import ColumbiaForm from '@/components/ColumbiaForm';
import PlutchikForm from '@/components/PlutchikForm';
import IdareForm from '@/components/IdareForm';
import LiraForm from '@/components/LiraForm';
import GocaForm from '@/components/GocaForm';
import IpaForm from '@/components/IpaForm';
import CdfrForm from '@/components/CdfrForm';
import AssistForm from '@/components/AssistForm';
import EbmaForm from '@/components/EbmaForm';
import ChteForm from '@/components/ChteForm';

// Catálogo de formularios
const formComponents: Record<string, React.ComponentType<{ studentId?: string; onComplete?: (result: any) => void }>> = {
    'ficha-id': FichaIdentificacionForm,
    'bdi-ii': BdiForm,
    'bai': BaiForm,
    'phq-9': Phq9Form,
    'gad-7': Gad7Form,
    'hads': HadsForm,
    'bhs': BhsForm,
    'ssi': SsiForm,
    'columbia': ColumbiaForm,
    'plutchik': PlutchikForm,
    'idare': IdareForm,
    'lira': LiraForm,
    'goca': GocaForm,
    'ipa': IpaForm,
    'cdfr': CdfrForm,
    'assist': AssistForm,
    'ebma': EbmaForm,
    'chte': ChteForm,
};

// Nombres amigables para las pruebas
const testNames: Record<string, string> = {
    'ficha-id': 'Ficha de Identificación',
    'bdi-ii': 'BDI-II (Depresión)',
    'bai': 'BAI (Ansiedad)',
    'phq-9': 'PHQ-9 (Depresión)',
    'gad-7': 'GAD-7 (Ansiedad)',
    'hads': 'HADS (Ansiedad/Depresión)',
    'bhs': 'BHS (Desesperanza)',
    'ssi': 'SSI (Ideación Suicida)',
    'columbia': 'Columbia C-SSRS',
    'plutchik': 'Plutchik (Riesgo Suicida)',
    'idare': 'IDARE/STAI (Ansiedad)',
    'lira': 'LIRA (Riesgo Académico)',
    'goca': 'GOCA (Observación)',
    'ipa': 'IPA (Pensamientos Automáticos)',
    'cdfr': 'CDFR (Factores de Riesgo)',
    'assist': 'ASSIST (Sustancias)',
    'ebma': 'EBMA (Motivación)',
    'chte': 'CHTE (Hábitos de Estudio)',
};

interface SessionData {
    id: string;
    name: string;
    tests: string[];
    groups: string[];
    status: string;
    expiresAt?: Date;
}

export default function EvaluacionPage() {
    const params = useParams();
    const tokenId = params.tokenId as string;

    // Estados
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<SessionData | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Identificación
    const [step, setStep] = useState<'matricula' | 'consentimiento' | 'evaluacion' | 'completado'>('matricula');
    const [matriculaInput, setMatriculaInput] = useState('');
    const [validandoMatricula, setValidandoMatricula] = useState(false);
    const [estudiante, setEstudiante] = useState<MatriculaRegistro | null>(null);
    const [matriculaError, setMatriculaError] = useState<string | null>(null);
    
    // Consentimiento
    const [isConsented, setIsConsented] = useState(false);
    
    // Evaluación
    const [currentTestIndex, setCurrentTestIndex] = useState(0);
    const [completedTests, setCompletedTests] = useState<string[]>([]);
    const [expedienteId, setExpedienteId] = useState<string | null>(null);

    // Cargar datos de la sesión
    useEffect(() => {
        const loadSession = async () => {
            if (!db) {
                setError('Base de datos no disponible');
                setLoading(false);
                return;
            }

            try {
                const q = query(
                    collection(db, 'evaluation_sessions'),
                    where('id', '==', tokenId)
                );
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setError('Sesión de evaluación no encontrada o expirada');
                } else {
                    const data = snapshot.docs[0].data();
                    setSession({
                        id: data.id,
                        name: data.name,
                        tests: data.tests || [],
                        groups: data.groups || [],
                        status: data.status,
                        expiresAt: data.expiresAt?.toDate()
                    });
                }
            } catch (err) {
                console.error('Error cargando sesión:', err);
                setError('Error al cargar la sesión');
            }
            setLoading(false);
        };

        loadSession();
    }, [tokenId]);

    // Validar matrícula
    const handleValidarMatricula = async () => {
        if (!matriculaInput.trim()) {
            setMatriculaError('Ingrese su matrícula');
            return;
        }

        setValidandoMatricula(true);
        setMatriculaError(null);

        try {
            const matriculaData = await validarMatricula(matriculaInput.trim().toUpperCase());
            
            if (matriculaData) {
                setEstudiante(matriculaData);
                setStep('consentimiento');
            } else {
                setMatriculaError('Matrícula no encontrada. Verifique e intente nuevamente.');
            }
        } catch (err) {
            console.error('Error validando matrícula:', err);
            setMatriculaError('Error al validar la matrícula');
        }
        
        setValidandoMatricula(false);
    };

    // Crear expediente y comenzar evaluación
    const handleIniciarEvaluacion = async () => {
        if (!estudiante || !session) return;

        try {
            // Crear expediente en Firestore
            const expedienteRef = await addDoc(collection(db!, 'expedientes'), {
                matricula: estudiante.matricula,
                nombreCompleto: estudiante.nombreCompleto,
                grupoId: estudiante.grupoId,
                grupoNombre: estudiante.grupoNombre,
                sessionId: session.id,
                sessionName: session.name,
                fechaCreacion: Timestamp.now(),
                consentimiento: true,
                fechaConsentimiento: Timestamp.now()
            });

            setExpedienteId(expedienteRef.id);

            // Vincular expediente a la matrícula
            await vincularExpediente(estudiante.matricula, expedienteRef.id);

            setStep('evaluacion');
        } catch (err) {
            console.error('Error creando expediente:', err);
            alert('Error al iniciar la evaluación. Intente nuevamente.');
        }
    };

    // Completar prueba actual y avanzar
    const handleTestComplete = () => {
        const currentTestId = session?.tests[currentTestIndex];
        if (currentTestId) {
            setCompletedTests(prev => [...prev, currentTestId]);
        }

        if (currentTestIndex < (session?.tests.length || 0) - 1) {
            setCurrentTestIndex(prev => prev + 1);
        } else {
            setStep('completado');
        }
    };

    // Renderizado de estados
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando sesión de evaluación...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-red-200 bg-red-50">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
                        <p className="text-red-600">{error}</p>
                        <p className="text-sm text-red-500 mt-4">
                            Contacte al personal de orientación si cree que esto es un error.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // MATRÍCULA
    if (step === 'matricula') {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <CreditCard className="h-8 w-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-xl">PIGEC-130</CardTitle>
                        <CardDescription>
                            {session?.name || 'Sistema de Evaluación Psicométrica'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="matricula">Ingrese su Matrícula</Label>
                            <Input
                                id="matricula"
                                placeholder="Ej: CBTA-2026-G1A-001"
                                value={matriculaInput}
                                onChange={(e) => setMatriculaInput(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && handleValidarMatricula()}
                                className="font-mono text-center text-lg"
                            />
                            {matriculaError && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {matriculaError}
                                </p>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Su matrícula le fue proporcionada por su tutor o el departamento de orientación
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full" 
                            onClick={handleValidarMatricula}
                            disabled={validandoMatricula}
                        >
                            {validandoMatricula ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Validando...
                                </>
                            ) : (
                                <>
                                    Continuar
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // CONSENTIMIENTO
    if (step === 'consentimiento' && estudiante) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full">
                    <CardHeader>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Bienvenido/a</CardTitle>
                                <p className="text-lg font-semibold text-gray-700">{estudiante.nombreCompleto}</p>
                                <p className="text-sm text-gray-500">{estudiante.grupoNombre}</p>
                            </div>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-amber-700">
                            <Shield className="h-4 w-4" />
                            Consentimiento Informado Digital
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                            <p className="text-sm text-blue-800">
                                <strong>Sesión:</strong> {session?.name}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                <strong>Pruebas a realizar:</strong> {session?.tests.length || 0}
                            </p>
                        </div>

                        <div className="text-sm text-gray-700 space-y-3">
                            <p>
                                Usted está a punto de realizar una evaluación psicométrica como parte del 
                                programa de detección temprana y apoyo del CBTA 130.
                            </p>
                            <p>
                                <strong>Confidencialidad:</strong> Los datos recopilados serán tratados con 
                                estricta confidencialidad por el personal autorizado, conforme a la Ley Federal 
                                de Protección de Datos Personales.
                            </p>
                            <p>
                                <strong>Propósito:</strong> Los resultados se utilizarán para generar orientación 
                                y, si es necesario, canalizarlo al servicio adecuado. Esto no constituye un 
                                tratamiento psicológico.
                            </p>
                            <p>
                                <strong>Consentimiento previo:</strong> Al continuar, usted confirma que fue 
                                informado sobre estos procesos al momento de su ingreso al CBTA 130.
                            </p>
                        </div>

                        <div className="flex items-start space-x-3 pt-4 border-t">
                            <Checkbox
                                id="consent"
                                checked={isConsented}
                                onCheckedChange={(checked) => setIsConsented(!!checked)}
                            />
                            <Label htmlFor="consent" className="text-sm cursor-pointer">
                                He leído y comprendo la información anterior. Acepto participar en esta evaluación.
                            </Label>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep('matricula')}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Usar otra matrícula
                        </Button>
                        <Button onClick={handleIniciarEvaluacion} disabled={!isConsented}>
                            Iniciar Evaluación
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // EVALUACIÓN
    if (step === 'evaluacion' && session) {
        const currentTestId = session.tests[currentTestIndex];
        const CurrentForm = currentTestId ? formComponents[currentTestId] : null;
        const progress = ((completedTests.length) / session.tests.length) * 100;

        return (
            <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
                <div className="max-w-3xl mx-auto">
                    {/* Header con progreso */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h1 className="text-lg font-bold text-gray-800">
                                    {session.name}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {estudiante?.nombreCompleto} • {estudiante?.matricula}
                                </p>
                            </div>
                            <Badge variant="secondary">
                                {completedTests.length + 1} de {session.tests.length}
                            </Badge>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Lista de pruebas completadas/pendientes */}
                    <div className="mb-6 flex flex-wrap gap-2">
                        {session.tests.map((testId, index) => (
                            <Badge
                                key={testId}
                                variant={completedTests.includes(testId) ? 'default' : index === currentTestIndex ? 'secondary' : 'outline'}
                                className={completedTests.includes(testId) ? 'bg-green-500' : index === currentTestIndex ? 'bg-blue-500 text-white' : ''}
                            >
                                {completedTests.includes(testId) && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {testNames[testId] || testId}
                            </Badge>
                        ))}
                    </div>

                    {/* Formulario actual */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {testNames[currentTestId] || 'Evaluación'}
                            </CardTitle>
                            <CardDescription>
                                Complete todas las preguntas y presione "Finalizar" al terminar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {CurrentForm ? (
                                <CurrentForm 
                                    studentId={expedienteId || undefined}
                                    grupoId={estudiante?.grupoId || undefined}
                                    matricula={estudiante?.matricula || undefined}
                                    onComplete={handleTestComplete}
                                />
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                                    <p>Instrumento no disponible</p>
                                    <Button className="mt-4" onClick={handleTestComplete}>
                                        Continuar
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // COMPLETADO
    if (step === 'completado') {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-700 mb-2">
                            ¡Evaluación Completada!
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Gracias por completar todas las evaluaciones, {estudiante?.nombreCompleto?.split(' ')[0]}.
                        </p>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                            <p className="text-sm text-green-800">
                                Sus respuestas han sido enviadas de forma segura. 
                                El equipo de orientación revisará sus resultados.
                            </p>
                        </div>
                        <div className="text-sm text-gray-500">
                            <p><strong>Matrícula:</strong> {estudiante?.matricula}</p>
                            <p><strong>Pruebas completadas:</strong> {completedTests.length}</p>
                        </div>
                        <p className="mt-6 text-xs text-gray-400">
                            Ya puede cerrar esta ventana.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
