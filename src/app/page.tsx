'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  UserPlus, Users, ClipboardList, Send, Eye, Loader2, CheckCircle, Clock, 
  AlertTriangle, FileText, Brain, Mail, Copy, ExternalLink 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

interface Expediente {
  id: string;
  nombre: string;
  apellido: string;
  edad: number | null;
  grupo: string | null;
  email: string | null;
  telefono: string | null;
  createdAt: string;
  pruebas?: PruebaEnviada[];
  resultados?: ResultadoPrueba[];
}

interface PruebaEnviada {
  id: string;
  tipoPrueba: string;
  estado: string;
  token: string;
  fechaEnvio: string | null;
  fechaCompletado: string | null;
}

interface ResultadoPrueba {
  id: string;
  tipoPrueba: string;
  puntaje: number;
  interpretacion: string | null;
  nivelRiesgo: string | null;
}

const PRUEBAS = [
  { id: 'gad-7', nombre: 'GAD-7', descripcion: 'Escala de Ansiedad Generalizada', items: 7 },
  { id: 'phq-9', nombre: 'PHQ-9', descripcion: 'Cuestionario de Salud del Paciente (Depresión)', items: 9 },
  { id: 'bdi-ii', nombre: 'BDI-II', descripcion: 'Inventario de Depresión de Beck', items: 21 },
  { id: 'bai', nombre: 'BAI', descripcion: 'Inventario de Ansiedad de Beck', items: 21 },
];

export default function HomePage() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null);
  const [nuevoExpediente, setNuevoExpediente] = useState({
    nombre: '', apellido: '', edad: '', grupo: '', email: '', telefono: ''
  });
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState<string>('gad-7');
  const [generandoLink, setGenerandoLink] = useState(false);
  const [linkGenerado, setLinkGenerado] = useState<string | null>(null);
  const [generandoDiagnostico, setGenerandoDiagnostico] = useState(false);
  
  const { toast } = useToast();

  // Cargar expedientes
  useEffect(() => {
    cargarExpedientes();
  }, []);

  const cargarExpedientes = async () => {
    try {
      const res = await fetch('/api/expedientes');
      const data = await res.json();
      setExpedientes(data.expedientes || []);
    } catch (error) {
      console.error('Error cargando expedientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Crear expediente
  const crearExpediente = async () => {
    if (!nuevoExpediente.nombre || !nuevoExpediente.apellido) {
      toast({ title: 'Error', description: 'Nombre y apellido son requeridos', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch('/api/expedientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoExpediente,
          edad: nuevoExpediente.edad ? parseInt(nuevoExpediente.edad) : null
        })
      });
      
      if (res.ok) {
        toast({ title: 'Éxito', description: 'Expediente creado correctamente' });
        setNuevoExpediente({ nombre: '', apellido: '', edad: '', grupo: '', email: '', telefono: '' });
        cargarExpedientes();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear el expediente', variant: 'destructive' });
    }
  };

  // Generar link de prueba
  const generarLinkPrueba = async (expedienteId: string) => {
    setGenerandoLink(true);
    setLinkGenerado(null);
    
    try {
      const res = await fetch('/api/pruebas/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expedienteId,
          tipoPrueba: pruebaSeleccionada
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setLinkGenerado(data.link);
        toast({ title: 'Link generado', description: 'El link está listo para enviar' });
        cargarExpedientes();
      } else {
        toast({ title: 'Error', description: data.error || 'No se pudo generar el link', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al generar link', variant: 'destructive' });
    } finally {
      setGenerandoLink(false);
    }
  };

  // Copiar al portapapeles
  const copiarLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: 'Copiado', description: 'Link copiado al portapapeles' });
  };

  // Generar diagnóstico
  const generarDiagnostico = async (expedienteId: string) => {
    setGenerandoDiagnostico(true);
    
    try {
      const res = await fetch('/api/diagnostico/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expedienteId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: 'Diagnóstico generado', description: 'La impresión diagnóstica está lista' });
        cargarExpedientes();
      } else {
        toast({ title: 'Error', description: data.error || 'No se pudo generar el diagnóstico', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al generar diagnóstico', variant: 'destructive' });
    } finally {
      setGenerandoDiagnostico(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1"/>Completado</Badge>;
      case 'enviado':
        return <Badge className="bg-blue-500"><Send className="h-3 w-3 mr-1"/>Enviado</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1"/>Pendiente</Badge>;
    }
  };

  const getNivelRiesgoBadge = (nivel: string | null) => {
    if (!nivel) return null;
    switch (nivel) {
      case 'critico':
        return <Badge className="bg-red-600 animate-pulse">CRÍTICO</Badge>;
      case 'alto':
        return <Badge className="bg-red-500">ALTO</Badge>;
      case 'medio':
        return <Badge className="bg-amber-500">MEDIO</Badge>;
      default:
        return <Badge className="bg-green-500">BAJO</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Gestión Psicométrica</h1>
          <p className="text-gray-600">Crear expedientes, enviar pruebas y generar impresiones diagnósticas</p>
        </div>

        <Tabs defaultValue="expedientes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="expedientes"><Users className="h-4 w-4 mr-2"/>Expedientes</TabsTrigger>
            <TabsTrigger value="nuevo"><UserPlus className="h-4 w-4 mr-2"/>Nuevo Expediente</TabsTrigger>
          </TabsList>

          {/* Lista de Expedientes */}
          <TabsContent value="expedientes">
            {expedientes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay expedientes registrados</p>
                  <p className="text-sm">Crea un nuevo expediente para comenzar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {expedientes.map((exp) => (
                  <Card key={exp.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{exp.nombre} {exp.apellido}</CardTitle>
                          <CardDescription>
                            {exp.grupo && `Grupo: ${exp.grupo}`} 
                            {exp.edad && ` • Edad: ${exp.edad} años`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {/* Dialog para enviar pruebas */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedExpediente(exp)}>
                                <Send className="h-4 w-4 mr-1"/> Enviar Prueba
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Enviar Prueba a {exp.nombre} {exp.apellido}</DialogTitle>
                                <DialogDescription>
                                  Selecciona la prueba y genera un link para enviar
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Seleccionar Prueba</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {PRUEBAS.map((prueba) => (
                                      <Button
                                        key={prueba.id}
                                        variant={pruebaSeleccionada === prueba.id ? "default" : "outline"}
                                        className="justify-start h-auto py-3"
                                        onClick={() => setPruebaSeleccionada(prueba.id)}
                                      >
                                        <div className="text-left">
                                          <div className="font-semibold">{prueba.nombre}</div>
                                          <div className="text-xs opacity-70">{prueba.descripcion}</div>
                                        </div>
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                
                                {linkGenerado && (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <Label className="text-green-700">Link Generado</Label>
                                    <div className="flex gap-2 mt-1">
                                      <Input value={linkGenerado} readOnly className="text-xs" />
                                      <Button size="sm" onClick={() => copiarLink(linkGenerado)}>
                                        <Copy className="h-4 w-4"/>
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                <Button 
                                  className="w-full" 
                                  onClick={() => generarLinkPrueba(exp.id)}
                                  disabled={generandoLink}
                                >
                                  {generandoLink ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Generando...</>
                                  ) : (
                                    <><ExternalLink className="h-4 w-4 mr-2"/>Generar Link</>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {/* Dialog para ver resultados */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1"/> Ver Resultados
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Resultados de {exp.nombre} {exp.apellido}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                {exp.pruebas && exp.pruebas.length > 0 ? (
                                  <>
                                    {/* Pruebas enviadas */}
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Pruebas Enviadas</h4>
                                      {exp.pruebas.map((prueba) => (
                                        <div key={prueba.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                          <div>
                                            <span className="font-medium">{prueba.tipoPrueba.toUpperCase()}</span>
                                            <span className="text-sm text-gray-500 ml-2">
                                              {prueba.fechaEnvio ? new Date(prueba.fechaEnvio).toLocaleDateString() : 'Sin enviar'}
                                            </span>
                                          </div>
                                          {getEstadoBadge(prueba.estado)}
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Resultados */}
                                    {exp.resultados && exp.resultados.length > 0 && (
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Resultados Obtenidos</h4>
                                        {exp.resultados.map((resultado) => (
                                          <div key={resultado.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <span className="font-semibold">{resultado.tipoPrueba.toUpperCase()}</span>
                                                <span className="ml-2 text-2xl font-bold text-blue-600">{resultado.puntaje}</span>
                                              </div>
                                              {getNivelRiesgoBadge(resultado.nivelRiesgo)}
                                            </div>
                                            {resultado.interpretacion && (
                                              <p className="text-sm text-gray-600 mt-2">{resultado.interpretacion}</p>
                                            )}
                                          </div>
                                        ))}
                                        
                                        {/* Botón generar diagnóstico */}
                                        <Button 
                                          className="w-full mt-4" 
                                          onClick={() => generarDiagnostico(exp.id)}
                                          disabled={generandoDiagnostico}
                                        >
                                          {generandoDiagnostico ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Generando diagnóstico...</>
                                          ) : (
                                            <><Brain className="h-4 w-4 mr-2"/>Generar Impresión Diagnóstica</>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No hay pruebas registradas</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Nuevo Expediente */}
          <TabsContent value="nuevo">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nuevo Expediente</CardTitle>
                <CardDescription>Ingresa los datos del paciente para crear su expediente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input 
                      id="nombre" 
                      value={nuevoExpediente.nombre}
                      onChange={(e) => setNuevoExpediente({...nuevoExpediente, nombre: e.target.value})}
                      placeholder="Nombre(s)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input 
                      id="apellido" 
                      value={nuevoExpediente.apellido}
                      onChange={(e) => setNuevoExpediente({...nuevoExpediente, apellido: e.target.value})}
                      placeholder="Apellido(s)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edad">Edad</Label>
                    <Input 
                      id="edad" 
                      type="number"
                      value={nuevoExpediente.edad}
                      onChange={(e) => setNuevoExpediente({...nuevoExpediente, edad: e.target.value})}
                      placeholder="Edad en años"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grupo">Grupo/Grado</Label>
                    <Input 
                      id="grupo" 
                      value={nuevoExpediente.grupo}
                      onChange={(e) => setNuevoExpediente({...nuevoExpediente, grupo: e.target.value})}
                      placeholder="Ej: 3A, 5B"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={nuevoExpediente.email}
                      onChange={(e) => setNuevoExpediente({...nuevoExpediente, email: e.target.value})}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input 
                      id="telefono" 
                      value={nuevoExpediente.telefono}
                      onChange={(e) => setNuevoExpediente({...nuevoExpediente, telefono: e.target.value})}
                      placeholder="Número de teléfono"
                    />
                  </div>
                </div>
                <Button className="mt-6" onClick={crearExpediente}>
                  <UserPlus className="h-4 w-4 mr-2"/>Crear Expediente
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
