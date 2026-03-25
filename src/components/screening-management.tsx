'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    FolderPlus, Send, Eye, Users, Link2, Mail, MessageSquare, 
    CheckSquare, Clock, CheckCircle2, Copy, ExternalLink,
    Plus, Search, QrCode, Share2, FileText, CreditCard, BarChart3,
    AlertTriangle, RefreshCw, Download
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useSession } from '@/context/SessionContext';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import ScreeningInstrumentDialog from './ScreeningInstrumentDialog';
import { ExpedienteGrupalCard } from './ExpedienteGrupalCard';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { 
    generarMatriculasGrupo, 
    obtenerMatriculasGrupo,
    generarTextoListaMatriculas,
    type MatriculaRegistro,
    type ListaMatriculasGrupo
} from '@/lib/matricula-service';
import { 
    obtenerGrupos,
    obtenerEstudiantesGrupo,
    type Grupo,
    type EstudianteGrupo
} from '@/lib/grupos-service';

// ============================================
// CATÁLOGO DE PRUEBAS COMPLETO
// ============================================
const allScreenings = [
    // Ficha de Identificación
    { id: 'ficha-id', title: 'Ficha de Identificación', description: 'Datos demográficos y sociofamiliares', category: 'Ficha', duration: '5 min', roles: ['Orientador', 'Clinico'] },
    
    // Habilidades Académicas
    { id: 'chte', title: 'CHTE (Hábitos de Estudio)', description: 'Estrategias de planificación y estudio', category: 'Académicas', duration: '15 min', roles: ['Orientador', 'Clinico'] },
    { id: 'neuro-screen', title: 'Tamizaje Neuropsicológico', description: 'Atención, memoria de trabajo, control inhibitorio', category: 'Académicas', duration: '20 min', roles: ['Orientador', 'Clinico'] },
    { id: 'lira', title: 'LIRA (Riesgo Académico)', description: 'Factores de riesgo académico', category: 'Académicas', duration: '10 min', roles: ['Orientador', 'Clinico'] },
    { id: 'goca', title: 'GOCA (Observación Conductual)', description: 'Observación docente en aula', category: 'Académicas', duration: '10 min', roles: ['Orientador', 'Docente'] },
    { id: 'ebma', title: 'EBMA (Motivación Académica)', description: 'Motivación intrínseca y extrínseca', category: 'Académicas', duration: '10 min', roles: ['Orientador', 'Clinico'] },
    
    // Socioemocionales
    { id: 'phq-9', title: 'PHQ-9 (Depresión)', description: 'Tamizaje depresión + alerta suicida', category: 'Socioemocionales', duration: '5 min', roles: ['Clinico', 'Orientador'] },
    { id: 'gad-7', title: 'GAD-7 (Ansiedad)', description: 'Tamizaje ansiedad generalizada', category: 'Socioemocionales', duration: '5 min', roles: ['Clinico', 'Orientador'] },
    { id: 'bdi-ii', title: 'BDI-II (Depresión Beck)', description: 'Severidad síntomas depresivos', category: 'Socioemocionales', duration: '10 min', roles: ['Clinico'] },
    { id: 'bai', title: 'BAI (Ansiedad Beck)', description: 'Severidad ansiedad con 4 factores', category: 'Socioemocionales', duration: '10 min', roles: ['Clinico'] },
    { id: 'hads', title: 'HADS (Ansiedad/Depresión)', description: 'Escala hospitalaria', category: 'Socioemocionales', duration: '5 min', roles: ['Clinico'] },
    { id: 'idare', title: 'IDARE/STAI (Rasgo-Estado)', description: 'Ansiedad rasgo y estado', category: 'Socioemocionales', duration: '15 min', roles: ['Clinico'] },
    { id: 'bhs', title: 'BHS (Desesperanza)', description: 'Escala de desesperanza de Beck', category: 'Socioemocionales', duration: '5 min', roles: ['Clinico'] },
    { id: 'ipa', title: 'IPA (Pensamientos Automáticos)', description: 'Distorsiones cognitivas', category: 'Socioemocionales', duration: '15 min', roles: ['Clinico'] },
    
    // Riesgo Suicida
    { id: 'ssi', title: 'SSI (Ideación Suicida Beck)', description: '⚠️ Evaluación detallada ideación suicida', category: 'Riesgo Suicida', duration: '15 min', roles: ['Clinico'] },
    { id: 'plutchik', title: 'Plutchik (Riesgo Suicida)', description: '⚠️ Tamizaje riesgo suicida', category: 'Riesgo Suicida', duration: '5 min', roles: ['Clinico'] },
    { id: 'columbia', title: 'Columbia C-SSRS', description: '⚠️ Evaluación severidad suicida', category: 'Riesgo Suicida', duration: '5 min', roles: ['Clinico'] },
    { id: 'cdfr', title: 'CDFR (Factores de Riesgo)', description: 'Factores de riesgo psicosocial', category: 'Riesgo Suicida', duration: '10 min', roles: ['Clinico', 'Orientador'] },
    
    // Conductas de Riesgo
    { id: 'assist', title: 'ASSIST (Consumo Sustancias)', description: 'Detección consumo de sustancias', category: 'Conductas Riesgo', duration: '10 min', roles: ['Clinico'] },
    
    // Evaluación Clínica
    { id: 'wisc-v', title: 'WISC-V/WAIS-IV', description: 'Evaluación de inteligencia', category: 'Evaluación Clínica', duration: '60-90 min', roles: ['Clinico'] },
];

const categories = ['Ficha', 'Académicas', 'Socioemocionales', 'Riesgo Suicida', 'Conductas Riesgo', 'Evaluación Clínica'];

// ============================================
// DATOS DE GRUPOS - Cargados dinámicamente desde Firestore/Academic Tracker
// ============================================

// ============================================
// INTERFAZ DE SESIÓN DE EVALUACIÓN
// ============================================
interface EvaluationSession {
    id: string;
    name: string;
    tests: string[];
    groups: string[];
    status: 'draft' | 'active' | 'completed';
    createdAt: Date;
    link?: string;
    expiresAt?: Date;
    completedCount: number;
    totalCount: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function ScreeningManagement() {
    const { role } = useSession();
    const [activeTab, setActiveTab] = useState('grupo');
    
    // Estado de grupos (cargados desde Firestore)
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [loadingGrupos, setLoadingGrupos] = useState(true);
    const [errorGrupos, setErrorGrupos] = useState<string | null>(null);
    
    // Estado de selección de grupos
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    
    // Estado de matrículas
    const [matriculas, setMatriculas] = useState<MatriculaRegistro[]>([]);
    const [listaMatriculas, setListaMatriculas] = useState<ListaMatriculasGrupo | null>(null);
    const [generandoMatriculas, setGenerandoMatriculas] = useState(false);
    
    // Estado de selección de pruebas
    const [selectedTests, setSelectedTests] = useState<string[]>([]);
    
    // Estado de sesión actual
    const [currentSession, setCurrentSession] = useState<EvaluationSession | null>(null);
    const [sessions, setSessions] = useState<EvaluationSession[]>([]);
    
    // Estado de generación de enlaces
    const [sessionName, setSessionName] = useState('');
    const [expirationDays, setExpirationDays] = useState('7');
    const [generatedLink, setGeneratedLink] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // ============================================
    // CARGA DE GRUPOS DESDE FIRESTORE
    // ============================================
    useEffect(() => {
        async function cargarGrupos() {
            setLoadingGrupos(true);
            setErrorGrupos(null);
            
            try {
                const resultado = await obtenerGrupos();
                
                if (resultado.success) {
                    setGrupos(resultado.grupos);
                } else {
                    setErrorGrupos(resultado.error || 'Error al cargar grupos');
                    // Si hay error, usar grupos de respaldo para demo
                    setGrupos([
                        { id: 'G001', nombre: 'Grupo 1A - Semestre 1', semestre: 1, carrera: 'Tecnólogo', turno: 'Matutino', periodo: '2026-1', totalEstudiantes: 35, activo: true },
                        { id: 'G002', nombre: 'Grupo 2B - Semestre 2', semestre: 2, carrera: 'Tecnólogo', turno: 'Matutino', periodo: '2026-1', totalEstudiantes: 32, activo: true },
                        { id: 'G003', nombre: 'Grupo 3A - Semestre 3', semestre: 3, carrera: 'Tecnólogo', turno: 'Matutino', periodo: '2026-1', totalEstudiantes: 30, activo: true },
                        { id: 'G004', nombre: 'Grupo 4B - Semestre 4', semestre: 4, carrera: 'Tecnólogo', turno: 'Matutino', periodo: '2026-1', totalEstudiantes: 28, activo: true },
                        { id: 'G005', nombre: 'Grupo 5A - Semestre 5', semestre: 5, carrera: 'Tecnólogo', turno: 'Matutino', periodo: '2026-1', totalEstudiantes: 25, activo: true },
                        { id: 'G006', nombre: 'Grupo 6B - Semestre 6', semestre: 6, carrera: 'Tecnólogo', turno: 'Matutino', periodo: '2026-1', totalEstudiantes: 22, activo: true },
                    ]);
                }
            } catch (error) {
                console.error('Error cargando grupos:', error);
                setErrorGrupos('Error de conexión al cargar grupos');
            } finally {
                setLoadingGrupos(false);
            }
        }
        
        cargarGrupos();
    }, []);

    // Filtrar pruebas por rol
    const availableScreenings = allScreenings.filter(s => s.roles.includes(role as string));
    const categorizedTests = categories.map(category => ({
        name: category,
        tests: availableScreenings.filter(test => test.category === category)
    })).filter(cat => cat.tests.length > 0);

    // ============================================
    // HANDLERS
    // ============================================
    
    const toggleGroupSelection = (groupId: string) => {
        setSelectedGroups(prev => 
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    const toggleTestSelection = (testId: string) => {
        setSelectedTests(prev => 
            prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
        );
    };

    const calculateTotalStudents = () => {
        return selectedGroups.reduce((total, groupId) => {
            const group = grupos.find(g => g.id === groupId);
            return total + (group?.totalEstudiantes || 0);
        }, 0);
    };

    // Generar matrículas para los grupos seleccionados
    const handleGenerarMatriculas = async () => {
        if (selectedGroups.length === 0) return;
        
        setGenerandoMatriculas(true);
        const todasMatriculas: MatriculaRegistro[] = [];

        for (const grupoId of selectedGroups) {
            const grupo = grupos.find(g => g.id === grupoId);
            if (!grupo) continue;

            // Obtener estudiantes reales del grupo desde Firestore
            const resultadoEstudiantes = await obtenerEstudiantesGrupo(grupoId);
            
            let estudiantesParaMatricular: { id: string; nombre: string; telefono?: string; email?: string }[];
            
            if (resultadoEstudiantes.success && resultadoEstudiantes.estudiantes.length > 0) {
                // Usar estudiantes reales
                estudiantesParaMatricular = resultadoEstudiantes.estudiantes.map(est => ({
                    id: est.id,
                    nombre: est.nombre,
                    telefono: est.telefono,
                    email: est.email
                }));
            } else {
                // Crear lista simulada de estudiantes para demo
                estudiantesParaMatricular = Array.from({ length: grupo.totalEstudiantes }, (_, i) => ({
                    id: `est_${grupoId}_${i}`,
                    nombre: `Estudiante ${i + 1} - ${grupo.nombre}`,
                    telefono: undefined,
                    email: undefined
                }));
            }

            const resultado = await generarMatriculasGrupo(
                grupoId,
                grupo.nombre,
                estudiantesParaMatricular
            );

            todasMatriculas.push(...resultado.matriculas);
        }

        setMatriculas(todasMatriculas);
        
        // Cargar lista del primer grupo para mostrar
        if (selectedGroups.length > 0) {
            const lista = await obtenerMatriculasGrupo(selectedGroups[0]);
            setListaMatriculas(lista);
        }
        
        setGenerandoMatriculas(false);
        setActiveTab('matriculas');
    };

    const handleCreateSession = async () => {
        if (selectedTests.length === 0 || selectedGroups.length === 0 || !sessionName) {
            alert('Complete todos los campos requeridos');
            return;
        }

        setIsCreating(true);
        
        // Generar ID único
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Crear enlace
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/evaluacion/${sessionId}`;
        
        const newSession: EvaluationSession = {
            id: sessionId,
            name: sessionName,
            tests: selectedTests,
            groups: selectedGroups,
            status: 'active',
            createdAt: new Date(),
            link,
            expiresAt: new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000),
            completedCount: 0,
            totalCount: calculateTotalStudents()
        };

        // Guardar en Firestore
        if (db) {
            try {
                await addDoc(collection(db, 'evaluation_sessions'), {
                    ...newSession,
                    createdAt: Timestamp.now(),
                    expiresAt: Timestamp.fromDate(newSession.expiresAt!)
                });
            } catch (error) {
                console.error('Error guardando sesión:', error);
            }
        }

        setGeneratedLink(link);
        setCurrentSession(newSession);
        setSessions(prev => [...prev, newSession]);
        setIsCreating(false);
        
        setActiveTab('enlaces');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado al portapapeles');
    };

    const shareViaWhatsApp = (link: string, message?: string) => {
        const text = message || `Se le invita a completar la evaluación psicométrica. Acceda al siguiente enlace: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareViaEmail = (link: string, subject?: string) => {
        const emailSubject = subject || 'Evaluación Psicométrica - PIGEC';
        const emailBody = `Estimado estudiante,%0D%0A%0D%0ASe le invita a completar la evaluación psicométrica.%0D%0A%0D%0AAcceda al siguiente enlace: ${link}%0D%0A%0D%0ASaludos cordiales.`;
        window.open(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${emailBody}`, '_blank');
    };

    const resetSession = () => {
        setSelectedGroups([]);
        setMatriculas([]);
        setListaMatriculas(null);
        setSelectedTests([]);
        setSessionName('');
        setGeneratedLink('');
        setCurrentSession(null);
        setActiveTab('grupo');
    };

    // ============================================
    // RENDER
    // ============================================
    
    return (
        <div className="space-y-6">
            {/* Header con resumen rápido */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Users className="h-6 w-6 text-blue-600" />
                            <div>
                                <p className="text-xl font-bold text-blue-700">{selectedGroups.length}</p>
                                <p className="text-xs text-blue-600">Grupos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CreditCard className="h-6 w-6 text-green-600" />
                            <div>
                                <p className="text-xl font-bold text-green-700">{matriculas.length}</p>
                                <p className="text-xs text-green-600">Matrículas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <FolderPlus className="h-6 w-6 text-purple-600" />
                            <div>
                                <p className="text-xl font-bold text-purple-700">{selectedTests.length}</p>
                                <p className="text-xs text-purple-600">Pruebas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-amber-600" />
                            <div>
                                <p className="text-xl font-bold text-amber-700">{calculateTotalStudents()}</p>
                                <p className="text-xs text-amber-600">Estudiantes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="h-6 w-6 text-gray-600" />
                            <div>
                                <p className="text-xl font-bold text-gray-700">{sessions.filter(s => s.status === 'active').length}</p>
                                <p className="text-xs text-gray-600">Sesiones activas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs principales */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="grupo" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden md:inline">1. Grupo</span>
                    </TabsTrigger>
                    <TabsTrigger value="matriculas" className="flex items-center gap-2" disabled={selectedGroups.length === 0}>
                        <CreditCard className="h-4 w-4" />
                        <span className="hidden md:inline">2. Matrículas</span>
                    </TabsTrigger>
                    <TabsTrigger value="pruebas" className="flex items-center gap-2" disabled={matriculas.length === 0}>
                        <FolderPlus className="h-4 w-4" />
                        <span className="hidden md:inline">3. Pruebas</span>
                    </TabsTrigger>
                    <TabsTrigger value="enlaces" className="flex items-center gap-2" disabled={selectedTests.length === 0}>
                        <Link2 className="h-4 w-4" />
                        <span className="hidden md:inline">4. Enviar</span>
                    </TabsTrigger>
                    <TabsTrigger value="monitorear" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden md:inline">5. Monitorear</span>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: SELECCIONAR GRUPO */}
                <TabsContent value="grupo" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Seleccionar Grupo(s)
                            </CardTitle>
                            <CardDescription>
                                Seleccione los grupos que participarán en la evaluación. 
                                Los datos se obtienen de Academic Tracker.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Buscador */}
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input placeholder="Buscar grupo..." className="pl-10" />
                                    </div>
                                </div>
                                <Select defaultValue="all">
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Filtrar por semestre" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los semestres</SelectItem>
                                        <SelectItem value="1">Semestre 1</SelectItem>
                                        <SelectItem value="2">Semestre 2</SelectItem>
                                        <SelectItem value="3">Semestre 3</SelectItem>
                                        <SelectItem value="4">Semestre 4</SelectItem>
                                        <SelectItem value="5">Semestre 5</SelectItem>
                                        <SelectItem value="6">Semestre 6</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Estado de carga */}
                            {loadingGrupos && (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                                    <span className="text-gray-600">Cargando grupos desde Academic Tracker...</span>
                                </div>
                            )}

                            {/* Error de carga */}
                            {errorGrupos && !loadingGrupos && (
                                <Alert className="mb-4 border-amber-200 bg-amber-50">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <AlertTitle>Modo Demostración</AlertTitle>
                                    <AlertDescription className="text-amber-700">
                                        {errorGrupos}. Se muestran grupos de ejemplo.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Lista de grupos */}
                            {!loadingGrupos && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {grupos.length === 0 ? (
                                        <div className="col-span-full text-center py-8 text-gray-500">
                                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                            <p>No se encontraron grupos activos.</p>
                                            <p className="text-sm mt-2">Verifique que existan grupos en Academic Tracker.</p>
                                        </div>
                                    ) : (
                                        grupos.map(group => (
                                            <div 
                                                key={group.id}
                                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                                    selectedGroups.includes(group.id)
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => toggleGroupSelection(group.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={selectedGroups.includes(group.id)}
                                                        onCheckedChange={() => toggleGroupSelection(group.id)}
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-semibold">{group.nombre}</p>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <Users className="h-3 w-3" />
                                                            <span>{group.totalEstudiantes} estudiantes</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span>{group.carrera}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Resumen y botón continuar */}
                            <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-green-800">
                                            {selectedGroups.length} grupo(s) seleccionado(s)
                                        </p>
                                        <p className="text-sm text-green-600">
                                            Total de estudiantes: {calculateTotalStudents()}
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={handleGenerarMatriculas}
                                        disabled={selectedGroups.length === 0 || generandoMatriculas}
                                    >
                                        {generandoMatriculas ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Generando...
                                            </>
                                        ) : (
                                            <>
                                                Generar Matrículas
                                                <Send className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: MATRÍCULAS */}
                <TabsContent value="matriculas" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Matrículas Generadas
                            </CardTitle>
                            <CardDescription>
                                Distribuya estas matrículas a los estudiantes para que puedan acceder a las evaluaciones.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {matriculas.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <p>No hay matrículas generadas.</p>
                                    <p className="text-sm mt-2">Seleccione grupos y genere las matrículas primero.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Resumen */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-blue-700">{matriculas.length}</p>
                                            <p className="text-xs text-blue-600">Total matrículas</p>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-green-700">{selectedGroups.length}</p>
                                            <p className="text-xs text-green-600">Grupos</p>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-purple-700">
                                                {matriculas.filter(m => m.expedienteId).length}
                                            </p>
                                            <p className="text-xs text-purple-600">Con expediente</p>
                                        </div>
                                        <div className="p-3 bg-amber-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-amber-700">
                                                {matriculas.filter(m => m.evaluacionesCompletadas > 0).length}
                                            </p>
                                            <p className="text-xs text-amber-600">Evaluados</p>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                if (listaMatriculas) {
                                                    copyToClipboard(generarTextoListaMatriculas(listaMatriculas));
                                                }
                                            }}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copiar Lista
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                if (listaMatriculas) {
                                                    shareViaWhatsApp(generarTextoListaMatriculas(listaMatriculas));
                                                }
                                            }}
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Enviar por WhatsApp
                                        </Button>
                                        <Button variant="outline">
                                            <Download className="h-4 w-4 mr-2" />
                                            Descargar PDF
                                        </Button>
                                    </div>

                                    {/* Tabla de matrículas */}
                                    <div className="border rounded-lg overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="w-36">Matrícula</TableHead>
                                                    <TableHead>Nombre Completo</TableHead>
                                                    <TableHead>Grupo</TableHead>
                                                    <TableHead className="w-24 text-center">Estado</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {matriculas.slice(0, 50).map((mat) => (
                                                    <TableRow key={mat.matricula} className="hover:bg-gray-50">
                                                        <TableCell className="font-mono font-medium text-sm">
                                                            {mat.matricula}
                                                        </TableCell>
                                                        <TableCell className="text-sm">{mat.nombreCompleto}</TableCell>
                                                        <TableCell className="text-sm">{mat.grupoNombre}</TableCell>
                                                        <TableCell className="text-center">
                                                            {mat.evaluacionesCompletadas > 0 ? (
                                                                <Badge className="bg-green-100 text-green-800 text-xs">
                                                                    ✅ Activo
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    ⏳ Pendiente
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {matriculas.length > 50 && (
                                        <p className="text-sm text-gray-500 mt-2 text-center">
                                            Mostrando 50 de {matriculas.length} matrículas
                                        </p>
                                    )}

                                    {/* Instrucciones */}
                                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="font-semibold text-blue-800 mb-2">📌 Instrucciones:</h4>
                                        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                                            <li>Entregue a cada estudiante su matrícula correspondiente</li>
                                            <li>El estudiante ingresará su matrícula al acceder al enlace de evaluación</li>
                                            <li>Si pierde su matrícula, puede consultarse en esta lista</li>
                                        </ol>
                                    </div>

                                    {/* Continuar */}
                                    <div className="mt-6 flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setActiveTab('grupo')}>
                                            ← Volver
                                        </Button>
                                        <Button onClick={() => setActiveTab('pruebas')}>
                                            Continuar a Pruebas
                                            <Send className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: PRUEBAS */}
                <TabsContent value="pruebas" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderPlus className="h-5 w-5" />
                                Seleccionar Pruebas
                            </CardTitle>
                            <CardDescription>
                                Elija los instrumentos psicométricos que conformarán la batería de evaluación
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Filtros */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                <Badge 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-blue-100" 
                                    onClick={() => setSelectedTests(availableScreenings.map(t => t.id))}
                                >
                                    Seleccionar todas
                                </Badge>
                                <Badge 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-gray-100" 
                                    onClick={() => setSelectedTests([])}
                                >
                                    Limpiar selección
                                </Badge>
                                {categories.map(cat => (
                                    <Badge 
                                        key={cat} 
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => {
                                            const catTests = availableScreenings.filter(t => t.category === cat).map(t => t.id);
                                            setSelectedTests(prev => [...new Set([...prev, ...catTests])]);
                                        }}
                                    >
                                        + {cat}
                                    </Badge>
                                ))}
                            </div>

                            {/* Lista de pruebas por categoría */}
                            <div className="space-y-6">
                                {categorizedTests.map(category => (
                                    <div key={category.name}>
                                        <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">
                                            {category.name}
                                            <span className="ml-2 text-sm font-normal text-gray-500">
                                                ({category.tests.filter(t => selectedTests.includes(t.id)).length}/{category.tests.length})
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {category.tests.map(test => (
                                                <Dialog key={test.id}>
                                                    <div 
                                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                            selectedTests.includes(test.id) 
                                                                ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                        onClick={() => toggleTestSelection(test.id)}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <Checkbox
                                                                id={test.id}
                                                                checked={selectedTests.includes(test.id)}
                                                                onCheckedChange={() => toggleTestSelection(test.id)}
                                                                className="mt-1"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <label className="font-medium cursor-pointer truncate text-sm">
                                                                        {test.title}
                                                                    </label>
                                                                    {test.category === 'Riesgo Suicida' && (
                                                                        <Badge variant="destructive" className="text-xs">Crítico</Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-500 truncate">{test.description}</p>
                                                                <p className="text-xs text-gray-400 mt-1">⏱ {test.duration}</p>
                                                            </div>
                                                            <DialogTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                        </div>
                                                    </div>
                                                    <ScreeningInstrumentDialog instrumentId={test.id} instrumentTitle={test.title} />
                                                </Dialog>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Resumen y botón continuar */}
                            <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-purple-800">
                                            {selectedTests.length} prueba(s) seleccionada(s)
                                        </p>
                                        <p className="text-sm text-purple-600">
                                            Tiempo estimado: {selectedTests.reduce((acc, id) => {
                                                const test = availableScreenings.find(t => t.id === id);
                                                return acc + parseInt(test?.duration || '0');
                                            }, 0)} minutos
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setActiveTab('matriculas')}>
                                            ← Volver
                                        </Button>
                                        <Button 
                                            onClick={() => setActiveTab('enlaces')}
                                            disabled={selectedTests.length === 0}
                                        >
                                            Continuar a Enlaces
                                            <Send className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: ENLACES */}
                <TabsContent value="enlaces" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="h-5 w-5" />
                                Generar y Enviar Enlaces
                            </CardTitle>
                            <CardDescription>
                                Configure la sesión de evaluación y genere los enlaces para compartir
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Resumen de selección */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Alert>
                                    <Users className="h-4 w-4" />
                                    <AlertTitle>{selectedGroups.length} Grupos</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        {calculateTotalStudents()} estudiantes
                                    </AlertDescription>
                                </Alert>
                                <Alert>
                                    <CreditCard className="h-4 w-4" />
                                    <AlertTitle>{matriculas.length} Matrículas</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        Listas para distribuir
                                    </AlertDescription>
                                </Alert>
                                <Alert>
                                    <FolderPlus className="h-4 w-4" />
                                    <AlertTitle>{selectedTests.length} Pruebas</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        {selectedTests.reduce((acc, id) => acc + parseInt(availableScreenings.find(t => t.id === id)?.duration || '0'), 0)} min total
                                    </AlertDescription>
                                </Alert>
                            </div>

                            {/* Configuración de sesión */}
                            {!generatedLink && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50">
                                    <div className="space-y-2">
                                        <Label htmlFor="sessionName">Nombre de la Sesión *</Label>
                                        <Input 
                                            id="sessionName"
                                            placeholder="Ej: Evaluación Semestre 1 - Marzo 2026"
                                            value={sessionName}
                                            onChange={(e) => setSessionName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="expiration">Vigencia del Enlace</Label>
                                        <Select value={expirationDays} onValueChange={setExpirationDays}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1 día</SelectItem>
                                                <SelectItem value="3">3 días</SelectItem>
                                                <SelectItem value="7">7 días</SelectItem>
                                                <SelectItem value="14">14 días</SelectItem>
                                                <SelectItem value="30">30 días</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {/* Botón generar o enlace generado */}
                            {!generatedLink ? (
                                <Button 
                                    onClick={handleCreateSession}
                                    disabled={!sessionName || isCreating}
                                    className="w-full"
                                    size="lg"
                                >
                                    {isCreating ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <Link2 className="mr-2 h-5 w-5" />
                                            Generar Enlace de Evaluación
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="font-semibold text-green-800 mb-2">✓ Sesión creada exitosamente</p>
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                value={generatedLink} 
                                                readOnly 
                                                className="bg-white font-mono text-sm"
                                            />
                                            <Button 
                                                variant="outline" 
                                                size="icon"
                                                onClick={() => copyToClipboard(generatedLink)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="icon"
                                                onClick={() => window.open(generatedLink, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Opciones de compartir */}
                                    <div className="p-4 border rounded-lg">
                                        <p className="font-semibold mb-4">Compartir Enlace</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <Button 
                                                variant="outline" 
                                                className="flex flex-col items-center gap-2 h-auto py-4"
                                                onClick={() => shareViaWhatsApp(generatedLink)}
                                            >
                                                <MessageSquare className="h-6 w-6 text-green-600" />
                                                <span className="text-xs">WhatsApp</span>
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="flex flex-col items-center gap-2 h-auto py-4"
                                                onClick={() => shareViaEmail(generatedLink)}
                                            >
                                                <Mail className="h-6 w-6 text-blue-600" />
                                                <span className="text-xs">Correo</span>
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="flex flex-col items-center gap-2 h-auto py-4"
                                            >
                                                <QrCode className="h-6 w-6 text-gray-600" />
                                                <span className="text-xs">Código QR</span>
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="flex flex-col items-center gap-2 h-auto py-4"
                                            >
                                                <Share2 className="h-6 w-6 text-purple-600" />
                                                <span className="text-xs">Mensaje</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Mensaje predefinido */}
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <p className="font-semibold mb-2">Mensaje sugerido:</p>
                                        <div className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
{`Estimado(a) estudiante,

Se le invita a completar la evaluación psicométrica: ${sessionName}

📋 Pruebas: ${selectedTests.length}
⏱️ Tiempo estimado: ${selectedTests.reduce((acc, id) => acc + parseInt(availableScreenings.find(t => t.id === id)?.duration || '0'), 0)} minutos
📅 Disponible hasta: ${new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX')}

🔗 Enlace: ${generatedLink}

IMPORTANTE: Use su matrícula asignada para acceder.

Departamento de Orientación - CBTa 130`}
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="mt-2"
                                            onClick={() => copyToClipboard(`Estimado(a) estudiante,\n\nSe le invita a completar la evaluación psicométrica.\n\n🔗 ${generatedLink}\n\nUse su matrícula asignada para acceder.`)}
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copiar mensaje
                                        </Button>
                                    </div>

                                    {/* Acciones finales */}
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setActiveTab('monitorear')}>
                                            Ver Monitoreo
                                        </Button>
                                        <Button variant="outline" onClick={resetSession}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Nueva Sesión
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 5: MONITOREAR */}
                <TabsContent value="monitorear" className="mt-6">
                    {/* Expediente Psicopedagógico Grupal */}
                    {selectedGroups.length > 0 ? (
                        <ExpedienteGrupalCard 
                            grupoId={selectedGroups[0]}
                            grupoNombre={grupos.find(g => g.id === selectedGroups[0])?.nombre || 'Grupo'}
                            totalEstudiantes={calculateTotalStudents()}
                        />
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-500">Seleccione un grupo para ver el expediente psicopedagógico</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sesiones activas */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Sesiones de Evaluación
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {sessions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No hay sesiones activas</p>
                                    <Button 
                                        variant="outline" 
                                        className="mt-4"
                                        onClick={() => setActiveTab('grupo')}
                                    >
                                        Crear Nueva Sesión
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {sessions.map(session => (
                                        <div key={session.id} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="font-semibold">{session.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        Creado: {session.createdAt.toLocaleDateString('es-MX')}
                                                    </p>
                                                </div>
                                                <Badge 
                                                    variant={session.status === 'active' ? 'default' : 'secondary'}
                                                    className={session.status === 'active' ? 'bg-green-500' : ''}
                                                >
                                                    {session.status === 'active' ? 'Activo' : 'Completado'}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                                <div>
                                                    <p className="text-gray-500">Pruebas</p>
                                                    <p className="font-medium">{session.tests.length}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Progreso</p>
                                                    <p className="font-medium">{session.completedCount}/{session.totalCount}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Expira</p>
                                                    <p className="font-medium">
                                                        {session.expiresAt?.toLocaleDateString('es-MX')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Progress 
                                                value={(session.completedCount / session.totalCount) * 100} 
                                                className="h-2"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
