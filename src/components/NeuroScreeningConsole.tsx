'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Timer, CheckCircle, Plus, Minus, RotateCcw, Play, Pause } from 'lucide-react';

interface NeuroScreeningConsoleProps {
  studentId: string;
}

export const NeuroScreeningConsole: React.FC<NeuroScreeningConsoleProps> = ({ studentId }) => {
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [hits, setHits] = useState(0);
  
  // Lógica de cronómetro para pruebas de atención sostenida
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimer((timer) => timer + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);
  
  const handleToggleTimer = () => {
      setIsActive(!isActive);
  };

  const resetTask = useCallback(() => {
    setIsActive(false);
    setTimer(0);
    setHits(0);
  }, []);

  const handleFinish = () => {
      const timeLimit = 120; // Límite de 2 minutos para Búsqueda de Símbolos, por ejemplo.
      if (timer > timeLimit) {
          alert(`Tiempo límite de ${timeLimit}s excedido. La puntuación puede no ser válida.`);
      }
      console.log(`Tamizaje finalizado para ${studentId}.`);
      console.log(`Tiempo total: ${timer}s, Aciertos: ${hits}.`);
      alert("Simulación: Tamizaje finalizado. Revisa la consola para ver los datos capturados.");
      resetTask();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consola de Aplicación: Tamizaje Neuropsicológico</CardTitle>
        <CardDescription>Herramienta para el registro en tiempo real de pruebas de atención y funciones ejecutivas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="w-full h-48 bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white">
            <p className="text-lg">Estímulo Visual</p>
            <p className="text-sm">(El estímulo de la prueba se mostraría aquí)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sección de Cronometraje */}
          <div className="p-4 border rounded-lg bg-slate-50 flex flex-col items-center justify-center space-y-3">
            <p className="text-sm font-semibold text-gray-600">Cronómetro de Tarea</p>
            <p className="text-5xl font-mono text-slate-800">{timer}s</p>
            <Button 
              onClick={handleToggleTimer}
              variant={isActive ? 'destructive' : 'default'}
              className="w-full"
            >
              {isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isActive ? 'Pausar Tiempo' : 'Iniciar Tiempo'}
            </Button>
          </div>

          {/* Registro de Aciertos/Errores */}
          <div className="p-4 border rounded-lg bg-slate-50 flex flex-col items-center justify-center space-y-3">
            <p className="text-sm font-semibold text-gray-600">Registro de Aciertos</p>
            <p className="text-5xl font-mono text-slate-800">{hits}</p>
            <div className="flex gap-2 w-full">
              <Button onClick={() => setHits(hits + 1)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus/> Acierto
              </Button>
              <Button onClick={() => setHits(Math.max(0, hits - 1))} variant="secondary" className="flex-1">
                <Minus/> Corregir
              </Button>
            </div>
          </div>
        </div>

        {/* Botones de Finalización y Reseteo */}
        <div className="flex flex-col sm:flex-row gap-4">
             <Button onClick={resetTask} variant="outline" className="w-full">
                <RotateCcw className="mr-2"/>
                Reiniciar Tarea Actual
            </Button>
            <Button onClick={handleFinish} className="w-full bg-indigo-700 text-white font-bold text-base">
                <CheckCircle className="mr-2"/>
                Finalizar y Calcular Percentiles
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};
