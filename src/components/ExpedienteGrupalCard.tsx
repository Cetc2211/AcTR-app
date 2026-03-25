'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Share2,
  RefreshCw,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Heart,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';

// ============================================
// TIPOS - ACTUALIZADOS PARA COINCIDIR CON DATOS REALES
// ============================================

interface ResultadoEvaluacion {
  id: string;
  expedienteId: string;
  testId: string;
  testName: string;
  puntaje: number;
  matricula: string;
  nombreCompleto: string;
  grupoId: string;
  grupoNombre: string;
  fechaCompletado: Date;
  respuestas?: Record<string, any>;
  sessionId?: string;
}

interface EstudianteResultado {
  expedienteId: string;
  nombreCompleto: string;
  matricula: string;
  tests: {
    testId: string;
    testName: string;
    puntaje: number;
    interpretacion: string;
    nivel: 'normal' | 'leve' | 'moderado' | 'grave';
  }[];
}

interface PerfilGrupo {
  // CHTE - Hábitos de Estudio
  chtePlanificacion: number;
  chteConcentracion: number;
  chteEstrategias: number;

  // EBMA - Motivación
  motivacionIntrinseca: number;
  motivacionExtrinseca: number;
  amotivacion: number;

  // BAI - Ansiedad
  ansiedadMinima: number;
  ansiedadLeve: number;
  ansiedadModerada: number;
  ansiedadGrave: number;

  // PHQ-9 / BDI-II - Depresión
  depresionMinima: number;
  depresionLeve: number;
  depresionModerada: number;
  depresionGrave: number;

  // Alertas críticas
  alertasSuicida: number;
  alertasAnsiedadSevera: number;
  alertasDepresionSevera: number;
}

interface ExpedienteGrupal {
  grupoId: string;
  grupoNombre: string;
  fechaEvaluacion: Date;
  totalEstudiantes: number;
  tasaRespuesta: number;
  perfil: PerfilGrupo;
  recomendaciones: string[];
  estudiantes: EstudianteResultado[];
  casosAtencion: {
    nivel2: number;
    nivel3: number;
  };
}

// ============================================
// FUNCIONES DE INTERPRETACIÓN
// ============================================

function interpretarBAI(puntaje: number): { nivel: string; color: string; categoria: 'normal' | 'leve' | 'moderado' | 'grave' } {
  if (puntaje <= 10) return { nivel: 'Mínima', color: 'bg-green-500', categoria: 'normal' };
  if (puntaje <= 18) return { nivel: 'Leve', color: 'bg-yellow-500', categoria: 'leve' };
  if (puntaje <= 25) return { nivel: 'Moderada', color: 'bg-orange-500', categoria: 'moderado' };
  return { nivel: 'Grave', color: 'bg-red-500', categoria: 'grave' };
}

function interpretarBDI(puntaje: number): { nivel: string; color: string; categoria: 'normal' | 'leve' | 'moderado' | 'grave' } {
  if (puntaje <= 13) return { nivel: 'Mínima', color: 'bg-green-500', categoria: 'normal' };
  if (puntaje <= 19) return { nivel: 'Leve', color: 'bg-yellow-500', categoria: 'leve' };
  if (puntaje <= 28) return { nivel: 'Moderada', color: 'bg-orange-500', categoria: 'moderado' };
  return { nivel: 'Grave', color: 'bg-red-500', categoria: 'grave' };
}

function interpretarGAD7(puntaje: number): { nivel: string; color: string; categoria: 'normal' | 'leve' | 'moderado' | 'grave' } {
  if (puntaje <= 4) return { nivel: 'Mínima', color: 'bg-green-500', categoria: 'normal' };
  if (puntaje <= 9) return { nivel: 'Leve', color: 'bg-yellow-500', categoria: 'leve' };
  if (puntaje <= 14) return { nivel: 'Moderada', color: 'bg-orange-500', categoria: 'moderado' };
  return { nivel: 'Grave', color: 'bg-red-500', categoria: 'grave' };
}

function interpretarPHQ9(puntaje: number): { nivel: string; color: string; categoria: 'normal' | 'leve' | 'moderado' | 'grave' } {
  if (puntaje <= 4) return { nivel: 'Mínima', color: 'bg-green-500', categoria: 'normal' };
  if (puntaje <= 9) return { nivel: 'Leve', color: 'bg-yellow-500', categoria: 'leve' };
  if (puntaje <= 14) return { nivel: 'Moderada', color: 'bg-orange-500', categoria: 'moderado' };
  if (puntaje <= 19) return { nivel: 'Mod. Grave', color: 'bg-red-400', categoria: 'grave' };
  return { nivel: 'Grave', color: 'bg-red-600', categoria: 'grave' };
}

function interpretarTest(testId: string, puntaje: number): { nivel: string; color: string; categoria: 'normal' | 'leve' | 'moderado' | 'grave' } {
  switch (testId) {
    case 'bai':
      return interpretarBAI(puntaje);
    case 'bdi-ii':
    case 'bdi':
      return interpretarBDI(puntaje);
    case 'gad-7':
    case 'gad7':
      return interpretarGAD7(puntaje);
    case 'phq-9':
    case 'phq9':
      return interpretarPHQ9(puntaje);
    default:
      return { nivel: 'Sin interpretación', color: 'bg-gray-500', categoria: 'normal' };
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface ExpedienteGrupalCardProps {
  grupoId: string;
  grupoNombre: string;
  totalEstudiantes: number;
}

export function ExpedienteGrupalCard({
  grupoId,
  grupoNombre,
  totalEstudiantes
}: ExpedienteGrupalCardProps) {
  const [expediente, setExpediente] = useState<ExpedienteGrupal | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (grupoId) {
      calcularExpediente();
    }
  }, [grupoId]);

  const calcularExpediente = async () => {
    setLoading(true);

    if (!db) {
      setLoading(false);
      return;
    }

    try {
      // Obtener todos los resultados del grupo
      const q = query(
        collection(db, 'test_results'),
        where('grupoId', '==', grupoId)
      );

      const snapshot = await getDocs(q);
      const resultados: ResultadoEvaluacion[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCompletado: doc.data().fechaCompletado?.toDate() || new Date()
      })) as ResultadoEvaluacion[];

      if (resultados.length === 0) {
        setLoading(false);
        return;
      }

      // Agrupar por expedienteId (estudiante)
      const porEstudiante: Record<string, EstudianteResultado> = {};
      
      resultados.forEach(r => {
        const expedienteId = r.expedienteId || r.matricula;
        if (!porEstudiante[expedienteId]) {
          porEstudiante[expedienteId] = {
            expedienteId,
            nombreCompleto: r.nombreCompleto || 'Sin nombre',
            matricula: r.matricula,
            tests: []
          };
        }
        
        // Agregar resultado con interpretación
        if (r.puntaje !== null && r.puntaje !== undefined && r.testId) {
          const interpretacion = interpretarTest(r.testId, r.puntaje);
          porEstudiante[expedienteId].tests.push({
            testId: r.testId,
            testName: r.testName || r.testId,
            puntaje: r.puntaje,
            interpretacion: interpretacion.nivel,
            nivel: interpretacion.categoria
          });
        }
      });

      const estudiantes = Object.values(porEstudiante);
      const estudiantesEvaluados = estudiantes.length;

      // Calcular perfil del grupo
      const perfil = calcularPerfilGrupo(resultados, estudiantesEvaluados);

      // Generar recomendaciones
      const recomendaciones = generarRecomendaciones(perfil);

      // Identificar casos de atención
      const casosAtencion = identificarCasosAtencion(estudiantes);

      setExpediente({
        grupoId,
        grupoNombre,
        fechaEvaluacion: new Date(),
        totalEstudiantes,
        tasaRespuesta: Math.round((estudiantesEvaluados / totalEstudiantes) * 100),
        perfil,
        recomendaciones,
        estudiantes,
        casosAtencion
      });
    } catch (error) {
      console.error('Error calculando expediente grupal:', error);
    }

    setLoading(false);
  };

  const calcularPerfilGrupo = (resultados: ResultadoEvaluacion[], estudiantesEvaluados: number): PerfilGrupo => {
    const perfil: PerfilGrupo = {
      chtePlanificacion: 50,
      chteConcentracion: 50,
      chteEstrategias: 50,
      motivacionIntrinseca: 50,
      motivacionExtrinseca: 50,
      amotivacion: 20,
      ansiedadMinima: 0,
      ansiedadLeve: 0,
      ansiedadModerada: 0,
      ansiedadGrave: 0,
      depresionMinima: 0,
      depresionLeve: 0,
      depresionModerada: 0,
      depresionGrave: 0,
      alertasSuicida: 0,
      alertasAnsiedadSevera: 0,
      alertasDepresionSevera: 0
    };

    // Agrupar por tipo de test
    const porTipo: Record<string, ResultadoEvaluacion[]> = {};
    resultados.forEach(r => {
      if (!porTipo[r.testId]) porTipo[r.testId] = [];
      porTipo[r.testId].push(r);
    });

    // Calcular distribución de niveles por tipo
    // BAI - Ansiedad
    if (porTipo['bai'] && porTipo['bai'].length > 0) {
      const bai = porTipo['bai'];
      perfil.ansiedadMinima = bai.filter(r => r.puntaje <= 10).length / bai.length * 100;
      perfil.ansiedadLeve = bai.filter(r => r.puntaje > 10 && r.puntaje <= 18).length / bai.length * 100;
      perfil.ansiedadModerada = bai.filter(r => r.puntaje > 18 && r.puntaje <= 25).length / bai.length * 100;
      perfil.ansiedadGrave = bai.filter(r => r.puntaje > 25).length / bai.length * 100;
    }

    // GAD-7 - Ansiedad Generalizada
    if (porTipo['gad-7'] && porTipo['gad-7'].length > 0) {
      const gad = porTipo['gad-7'];
      perfil.ansiedadMinima = gad.filter(r => r.puntaje <= 4).length / gad.length * 100;
      perfil.ansiedadLeve = gad.filter(r => r.puntaje >= 5 && r.puntaje <= 9).length / gad.length * 100;
      perfil.ansiedadModerada = gad.filter(r => r.puntaje >= 10 && r.puntaje <= 14).length / gad.length * 100;
      perfil.ansiedadGrave = gad.filter(r => r.puntaje >= 15).length / gad.length * 100;
    }

    // PHQ-9 - Depresión
    if (porTipo['phq-9'] && porTipo['phq-9'].length > 0) {
      const phq = porTipo['phq-9'];
      perfil.depresionMinima = phq.filter(r => r.puntaje <= 4).length / phq.length * 100;
      perfil.depresionLeve = phq.filter(r => r.puntaje >= 5 && r.puntaje <= 9).length / phq.length * 100;
      perfil.depresionModerada = phq.filter(r => r.puntaje >= 10 && r.puntaje <= 14).length / phq.length * 100;
      perfil.depresionGrave = phq.filter(r => r.puntaje >= 15).length / phq.length * 100;
    }

    // BDI-II - Depresión Beck
    if (porTipo['bdi-ii'] && porTipo['bdi-ii'].length > 0) {
      const bdi = porTipo['bdi-ii'];
      perfil.depresionMinima = bdi.filter(r => r.puntaje <= 13).length / bdi.length * 100;
      perfil.depresionLeve = bdi.filter(r => r.puntaje >= 14 && r.puntaje <= 19).length / bdi.length * 100;
      perfil.depresionModerada = bdi.filter(r => r.puntaje >= 20 && r.puntaje <= 28).length / bdi.length * 100;
      perfil.depresionGrave = bdi.filter(r => r.puntaje >= 29).length / bdi.length * 100;
    }

    // EBMA - Motivación
    if (porTipo['ebma'] && porTipo['ebma'].length > 0) {
      const ebma = porTipo['ebma'];
      perfil.motivacionIntrinseca = ebma.reduce((acc, r) => acc + (r.puntaje / 5 * 100), 0) / ebma.length;
    }

    // CHTE - Hábitos de Estudio
    if (porTipo['chte'] && porTipo['chte'].length > 0) {
      const chte = porTipo['chte'];
      perfil.chtePlanificacion = chte.reduce((acc, r) => acc + (r.puntaje || 50), 0) / chte.length;
      perfil.chteEstrategias = perfil.chtePlanificacion;
      perfil.chteConcentracion = perfil.chtePlanificacion;
    }

    return perfil;
  };

  const generarRecomendaciones = (perfil: PerfilGrupo): string[] => {
    const recomendaciones: string[] = [];

    if (perfil.chteEstrategias < 40) {
      recomendaciones.push('Implementar talleres de técnicas de estudio y organización del tiempo.');
    }
    if (perfil.chtePlanificacion < 40) {
      recomendaciones.push('Introducir uso de agendas y planificadores académicos.');
    }
    if (perfil.amotivacion > 30) {
      recomendaciones.push('Atender casos de amotivación mediante entrevistas individuales.');
    }
    if (perfil.ansiedadGrave > 5 || perfil.depresionGrave > 5) {
      recomendaciones.push('Coordinar con orientación seguimiento de casos con ansiedad/depresión grave.');
    }
    if (perfil.alertasSuicida > 0) {
      recomendaciones.push(`⚠️ URGENTE: ${perfil.alertasSuicida} caso(s) con alerta de riesgo.`);
    }

    if (recomendaciones.length === 0) {
      recomendaciones.push('El grupo presenta un perfil saludable. Continuar con monitoreo periódico.');
    }

    return recomendaciones;
  };

  const identificarCasosAtencion = (estudiantes: EstudianteResultado[]) => {
    let nivel2 = 0;
    let nivel3 = 0;

    estudiantes.forEach(est => {
      const testsGraves = est.tests.filter(t => t.nivel === 'grave');
      const testsModerados = est.tests.filter(t => t.nivel === 'moderado');
      
      if (testsGraves.length >= 1) {
        nivel3++;
      } else if (testsModerados.length >= 1) {
        nivel2++;
      }
    });

    return { nivel2, nivel3 };
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Calculando perfil del grupo...</span>
        </CardContent>
      </Card>
    );
  }

  if (!expediente) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-12 text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Aún no hay datos de evaluación para este grupo.</p>
          <p className="text-sm mt-2">Los resultados aparecerán cuando los estudiantes completen las evaluaciones.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{expediente.grupoNombre}</h2>
              <p className="text-blue-200">Expediente Psicopedagógico Grupal</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{expediente.tasaRespuesta}%</p>
              <p className="text-blue-200 text-sm">Tasa de respuesta ({expediente.estudiantes.length}/{totalEstudiantes})</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas críticas */}
      {expediente.perfil.alertasSuicida > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="font-bold text-red-800">
                  ⚠️ {expediente.perfil.alertasSuicida} Alerta(s) de Riesgo
                </h3>
                <p className="text-red-600 text-sm">
                  Requieren evaluación clínica inmediata.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Perfiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hábitos de Estudio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Hábitos de Estudio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Planificación</span>
                <span>{expediente.perfil.chtePlanificacion.toFixed(0)}%</span>
              </div>
              <Progress value={expediente.perfil.chtePlanificacion} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Concentración</span>
                <span>{expediente.perfil.chteConcentracion.toFixed(0)}%</span>
              </div>
              <Progress value={expediente.perfil.chteConcentracion} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Estrategias</span>
                <span>{expediente.perfil.chteEstrategias.toFixed(0)}%</span>
              </div>
              <Progress value={expediente.perfil.chteEstrategias} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Motivación */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-green-600" />
              Motivación Académica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Intrínseca</span>
                <span>{expediente.perfil.motivacionIntrinseca.toFixed(0)}%</span>
              </div>
              <Progress value={expediente.perfil.motivacionIntrinseca} className="h-2 bg-green-100 [&>div]:bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Extrínseca</span>
                <span>{expediente.perfil.motivacionExtrinseca.toFixed(0)}%</span>
              </div>
              <Progress value={expediente.perfil.motivacionExtrinseca} className="h-2 bg-yellow-100 [&>div]:bg-yellow-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Amotivación</span>
                <span>{expediente.perfil.amotivacion.toFixed(0)}%</span>
              </div>
              <Progress value={expediente.perfil.amotivacion} className="h-2 bg-red-100 [&>div]:bg-red-500" />
            </div>
          </CardContent>
        </Card>

        {/* Ansiedad */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-orange-600" />
              Niveles de Ansiedad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-green-50 rounded">
                <p className="text-lg font-bold text-green-700">{expediente.perfil.ansiedadMinima.toFixed(0)}%</p>
                <p className="text-xs text-green-600">Mínima</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded">
                <p className="text-lg font-bold text-yellow-700">{expediente.perfil.ansiedadLeve.toFixed(0)}%</p>
                <p className="text-xs text-yellow-600">Leve</p>
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <p className="text-lg font-bold text-orange-700">{expediente.perfil.ansiedadModerada.toFixed(0)}%</p>
                <p className="text-xs text-orange-600">Moderada</p>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <p className="text-lg font-bold text-red-700">{expediente.perfil.ansiedadGrave.toFixed(0)}%</p>
                <p className="text-xs text-red-600">Grave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Depresión */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-purple-600" />
              Niveles de Depresión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-green-50 rounded">
                <p className="text-lg font-bold text-green-700">{expediente.perfil.depresionMinima.toFixed(0)}%</p>
                <p className="text-xs text-green-600">Mínima</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded">
                <p className="text-lg font-bold text-yellow-700">{expediente.perfil.depresionLeve.toFixed(0)}%</p>
                <p className="text-xs text-yellow-600">Leve</p>
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <p className="text-lg font-bold text-orange-700">{expediente.perfil.depresionModerada.toFixed(0)}%</p>
                <p className="text-xs text-orange-600">Moderada</p>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <p className="text-lg font-bold text-red-700">{expediente.perfil.depresionGrave.toFixed(0)}%</p>
                <p className="text-xs text-red-600">Grave</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de estudiantes evaluados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estudiantes Evaluados ({expediente.estudiantes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expediente.estudiantes.map((est, idx) => (
              <div key={est.expedienteId || idx} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{est.nombreCompleto}</p>
                    <p className="text-xs text-gray-500">{est.matricula}</p>
                  </div>
                  <div className="flex gap-1">
                    {est.tests.some(t => t.nivel === 'grave') && (
                      <Badge className="bg-red-500">Atención Urgente</Badge>
                    )}
                    {est.tests.some(t => t.nivel === 'moderado') && !est.tests.some(t => t.nivel === 'grave') && (
                      <Badge className="bg-orange-500">Seguimiento</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {est.tests.map((test, tIdx) => (
                    <Badge
                      key={tIdx}
                      variant="outline"
                      className={`${
                        test.nivel === 'grave' ? 'border-red-500 text-red-700' :
                        test.nivel === 'moderado' ? 'border-orange-500 text-orange-700' :
                        test.nivel === 'leve' ? 'border-yellow-500 text-yellow-700' :
                        'border-green-500 text-green-700'
                      }`}
                    >
                      {test.testName}: {test.interpretacion} ({test.puntaje})
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Casos de Atención */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Casos Identificados para Atención
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-3xl font-bold text-amber-700">{expediente.casosAtencion.nivel2}</p>
              <p className="text-amber-600 font-medium">Segundo Nivel de Soporte</p>
              <p className="text-xs text-amber-500 mt-1">Intervención focalizada</p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-3xl font-bold text-red-700">{expediente.casosAtencion.nivel3}</p>
              <p className="text-red-600 font-medium">Tercer Nivel de Soporte</p>
              <p className="text-xs text-red-500 mt-1">Evaluación especializada</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recomendaciones Pedagógicas
          </CardTitle>
          <CardDescription>
            Sugerencias basadas en el perfil del grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {expediente.recomendaciones.map((rec, idx) => (
              <li key={idx} className={`p-3 rounded-lg ${rec.includes('URGENTE') ? 'bg-red-50 text-red-800' : 'bg-gray-50'}`}>
                {rec.includes('URGENTE') ? '🚨' : '📌'} {rec}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Compartir con Docentes
        </Button>
        <Button variant="outline" className="flex items-center gap-2" onClick={calcularExpediente}>
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>
    </div>
  );
}
