'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

// Definición de las pruebas
const PRUEBAS: Record<string, { 
  nombre: string; 
  descripcion: string; 
  instrucciones: string;
  items: { texto: string }[];
  opciones: { valor: number; texto: string }[];
}> = {
  'gad-7': {
    nombre: 'GAD-7 (Escala de Ansiedad Generalizada)',
    descripcion: 'Cuestionario de 7 ítems para evaluar síntomas de ansiedad',
    instrucciones: 'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?',
    items: [
      { texto: 'Sentirse nervioso, ansioso o con mucho estrés' },
      { texto: 'No poder dejar de preocuparse o controlar la preocupación' },
      { texto: 'Preocuparse demasiado por diferentes cosas' },
      { texto: 'Dificultad para relajarse' },
      { texto: 'Sentirse tan inquieto que es difícil quedarse quieto' },
      { texto: 'Sentirse fácilmente molesto o irritable' },
      { texto: 'Sentir miedo como si algo terrible fuera a pasar' },
    ],
    opciones: [
      { valor: 0, texto: 'Nunca (0)' },
      { valor: 1, texto: 'Varios días (1)' },
      { valor: 2, texto: 'Más de la mitad de los días (2)' },
      { valor: 3, texto: 'Casi todos los días (3)' },
    ]
  },
  'phq-9': {
    nombre: 'PHQ-9 (Cuestionario de Salud del Paciente)',
    descripcion: 'Cuestionario de 9 ítems para evaluar síntomas depresivos',
    instrucciones: 'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?',
    items: [
      { texto: 'Tener poco interés o placer en hacer cosas' },
      { texto: 'Sentirse deprimido(a), triste o sin esperanzas' },
      { texto: 'Tener dificultad para quedarse o seguir dormido(a), o dormir demasiado' },
      { texto: 'Sentirse cansado(a) o con poca energía' },
      { texto: 'Tener poco apetito o comer en exceso' },
      { texto: 'Sentirse mal consigo mismo(a), sentirse un fracaso o haber decepcionado a su familia o a usted mismo(a)' },
      { texto: 'Tener dificultad para concentrarse en actividades como leer el periódico o ver televisión' },
      { texto: 'Moverse o hablar tan despacio que otras personas lo podrían notar, o estar tan inquieto(a) que se mueve más de lo acostumbrado' },
      { texto: 'Pensar que estaría mejor muerto(a) o hacerse daño de alguna manera' },
    ],
    opciones: [
      { valor: 0, texto: 'Nunca (0)' },
      { valor: 1, texto: 'Varios días (1)' },
      { valor: 2, texto: 'Más de la mitad de los días (2)' },
      { valor: 3, texto: 'Casi todos los días (3)' },
    ]
  },
  'bdi-ii': {
    nombre: 'BDI-II (Inventario de Depresión de Beck)',
    descripcion: 'Inventario de 21 ítems para evaluar severidad de síntomas depresivos',
    instrucciones: 'Seleccione la opción que mejor describe cómo se ha sentido durante las últimas dos semanas, incluyendo hoy.',
    items: [
      { texto: 'Tristeza' },
      { texto: 'Pesimismo' },
      { texto: 'Fracaso' },
      { texto: 'Pérdida de placer' },
      { texto: 'Sentimiento de culpa' },
      { texto: 'Sentimiento de castigo' },
      { texto: 'Insatisfacción con uno mismo' },
      { texto: 'Autocrítica' },
      { texto: 'Pensamientos o deseos suicidas' },
      { texto: 'Llanto' },
      { texto: 'Agitación' },
      { texto: 'Pérdida de interés' },
      { texto: 'Indecisión' },
      { texto: 'Desvalorización' },
      { texto: 'Pérdida de energía' },
      { texto: 'Cambios en hábitos de sueño' },
      { texto: 'Irritabilidad' },
      { texto: 'Cambios en apetito' },
      { texto: 'Dificultad de concentración' },
      { texto: 'Cansancio o fatiga' },
      { texto: 'Pérdida de interés en el sexo' },
    ],
    opciones: [
      { valor: 0, texto: 'No presente (0)' },
      { valor: 1, texto: 'Leve (1)' },
      { valor: 2, texto: 'Moderado (2)' },
      { valor: 3, texto: 'Severo (3)' },
    ]
  },
  'bai': {
    nombre: 'BAI (Inventario de Ansiedad de Beck)',
    descripcion: 'Inventario de 21 ítems para evaluar severidad de ansiedad',
    instrucciones: 'Indique cuánto le ha afectado cada síntoma durante la última semana, incluyendo hoy.',
    items: [
      { texto: 'Entumecimiento u hormigueo' },
      { texto: 'Sensación de calor' },
      { texto: 'Temblores en las piernas' },
      { texto: 'Incapacidad de relajarse' },
      { texto: 'Miedo a que ocurra lo peor' },
      { texto: 'Mareos o aturdimiento' },
      { texto: 'Latidos del corazón fuertes y acelerados' },
      { texto: 'Inestabilidad' },
      { texto: 'Aterrorizado' },
      { texto: 'Nerviosismo' },
      { texto: 'Sensación de ahogo' },
      { texto: 'Temblores en las manos' },
      { texto: 'Inquietud' },
      { texto: 'Miedo a perder el control' },
      { texto: 'Sensación de ahogo' },
      { texto: 'Miedo a morir' },
      { texto: 'Miedo' },
      { texto: 'Problemas digestivos' },
      { texto: 'Desmayos' },
      { texto: 'Rubor facial' },
      { texto: 'Sudoración' },
    ],
    opciones: [
      { valor: 0, texto: 'Nada (0)' },
      { valor: 1, texto: 'Leve (1)' },
      { valor: 2, texto: 'Moderado (2)' },
      { valor: 3, texto: 'Severo (3)' },
    ]
  }
};

export default function EvaluarPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [prueba, setPrueba] = useState<any>(null);
  const [expediente, setExpediente] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  
  // Cargar datos de la prueba
  useEffect(() => {
    const cargarPrueba = async () => {
      try {
        const res = await fetch(`/api/evaluar/${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Error al cargar la prueba');
          return;
        }
        
        if (data.yaCompletada) {
          setCompletado(true);
          setResultado(data.resultado);
        }
        
        setPrueba(data.prueba);
        setExpediente(data.prueba?.expediente);
      } catch (err) {
        setError('Error al cargar la prueba');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      cargarPrueba();
    }
  }, [token]);
  
  // Calcular progreso
  const pruebaDef = prueba ? PRUEBAS[prueba.tipoPrueba] : null;
  const progreso = pruebaDef ? 
    (Object.keys(respuestas).length / pruebaDef.items.length) * 100 : 0;
  
  // Interpretar resultado
  const interpretarResultado = (tipoPrueba: string, puntaje: number) => {
    switch (tipoPrueba.toLowerCase()) {
      case 'gad-7':
        if (puntaje <= 4) return { interpretacion: 'Ansiedad mínima', nivel: 'bajo', color: 'text-green-600' };
        if (puntaje <= 9) return { interpretacion: 'Ansiedad leve', nivel: 'bajo', color: 'text-green-600' };
        if (puntaje <= 14) return { interpretacion: 'Ansiedad moderada', nivel: 'medio', color: 'text-amber-600' };
        return { interpretacion: 'Ansiedad severa', nivel: 'alto', color: 'text-red-600' };
      case 'phq-9':
        if (puntaje <= 4) return { interpretacion: 'Depresión mínima', nivel: 'bajo', color: 'text-green-600' };
        if (puntaje <= 9) return { interpretacion: 'Depresión leve', nivel: 'bajo', color: 'text-green-600' };
        if (puntaje <= 14) return { interpretacion: 'Depresión moderada', nivel: 'medio', color: 'text-amber-600' };
        if (puntaje <= 19) return { interpretacion: 'Depresión moderadamente severa', nivel: 'alto', color: 'text-red-600' };
        return { interpretacion: 'Depresión severa', nivel: 'critico', color: 'text-red-700' };
      case 'bdi-ii':
        if (puntaje <= 10) return { interpretacion: 'Depresión mínima', nivel: 'bajo', color: 'text-green-600' };
        if (puntaje <= 16) return { interpretacion: 'Depresión leve', nivel: 'bajo', color: 'text-green-600' };
        if (puntaje <= 20) return { interpretacion: 'Depresión moderada', nivel: 'medio', color: 'text-amber-600' };
        if (puntaje <= 30) return { interpretacion: 'Depresión severa', nivel: 'alto', color: 'text-red-600' };
        return { interpretacion: 'Depresión muy severa', nivel: 'critico', color: 'text-red-700' };
      case 'bai':
        if (puntaje <= 7) return { interpretacion: 'Ansiedad mínima', nivel: 'bajo', color: 'text-green-600' };
        if (puntaje <= 15) return { interpretacion: 'Ansiedad leve', nivel: 'bajo', color: 'text-green-600' };
        if (puntaje <= 25) return { interpretacion: 'Ansiedad moderada', nivel: 'medio', color: 'text-amber-600' };
        return { interpretacion: 'Ansiedad severa', nivel: 'alto', color: 'text-red-600' };
      default:
        return { interpretacion: 'Sin interpretación', nivel: 'bajo', color: 'text-gray-600' };
    }
  };
  
  // Enviar resultados
  const enviarResultados = async () => {
    if (!prueba || !pruebaDef) return;
    
    const totalItems = pruebaDef.items.length;
    
    if (Object.keys(respuestas).length < totalItems) {
      alert('Por favor responda todas las preguntas');
      return;
    }
    
    setEnviando(true);
    
    // Calcular puntaje
    const puntaje = Object.values(respuestas).reduce((sum, val) => sum + val, 0);
    
    try {
      const res = await fetch('/api/resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pruebaId: prueba.id,
          expedienteId: prueba.expedienteId,
          tipoPrueba: prueba.tipoPrueba,
          puntaje,
          respuestas
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setCompletado(true);
        setResultado(data.resultado);
      } else {
        alert('Error al guardar resultados');
      }
    } catch (err) {
      alert('Error al enviar resultados');
    } finally {
      setEnviando(false);
    }
  };
  
  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando evaluación...</p>
        </div>
      </div>
    );
  }
  
  // Pantalla de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Pantalla completado
  if (completado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Evaluación Completada</CardTitle>
            <CardDescription>Gracias por completar la evaluación</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {resultado && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Puntaje obtenido</p>
                <p className="text-4xl font-bold text-blue-600">{resultado.puntaje}</p>
                <p className={`text-sm font-medium mt-2 ${interpretarResultado(resultado.tipoPrueba, resultado.puntaje).color}`}>
                  {resultado.interpretacion}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Sus respuestas han sido guardadas. Un profesional revisará los resultados.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!pruebaDef) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Tipo de prueba no reconocido</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{pruebaDef.nombre}</CardTitle>
                <CardDescription>{pruebaDef.descripcion}</CardDescription>
              </div>
              {expediente && (
                <div className="text-right text-sm text-gray-500">
                  <p className="font-medium">{expediente.nombre} {expediente.apellido}</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{pruebaDef.instrucciones}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span>{Object.keys(respuestas).length} / {pruebaDef.items.length}</span>
              </div>
              <Progress value={progreso} />
            </div>
          </CardContent>
        </Card>
        
        {/* Items */}
        <div className="space-y-4">
          {pruebaDef.items.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Label className="text-base">{index + 1}. {item.texto}</Label>
                  <RadioGroup
                    value={respuestas[index]?.toString() || ''}
                    onValueChange={(value) => {
                      setRespuestas(prev => ({
                        ...prev,
                        [index]: parseInt(value)
                      }));
                    }}
                  >
                    {pruebaDef.opciones.map((opcion) => (
                      <div key={opcion.valor} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <RadioGroupItem value={opcion.valor.toString()} id={`item-${index}-${opcion.valor}`} />
                        <Label htmlFor={`item-${index}-${opcion.valor}`} className="font-normal cursor-pointer flex-1">
                          {opcion.texto}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Botón enviar */}
        <div className="mt-6">
          <Button 
            className="w-full" 
            size="lg"
            onClick={enviarResultados}
            disabled={enviando || Object.keys(respuestas).length < pruebaDef.items.length}
          >
            {enviando ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Enviando...</>
            ) : (
              'Enviar Resultados'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
