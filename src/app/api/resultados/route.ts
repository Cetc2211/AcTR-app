import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Función para interpretar puntajes
function interpretarResultado(tipoPrueba: string, puntaje: number): { interpretacion: string; nivelRiesgo: string } {
  switch (tipoPrueba.toLowerCase()) {
    case 'gad-7':
      if (puntaje <= 4) return { interpretacion: 'Ansiedad mínima', nivelRiesgo: 'bajo' };
      if (puntaje <= 9) return { interpretacion: 'Ansiedad leve', nivelRiesgo: 'bajo' };
      if (puntaje <= 14) return { interpretacion: 'Ansiedad moderada', nivelRiesgo: 'medio' };
      return { interpretacion: 'Ansiedad severa', nivelRiesgo: 'alto' };
    
    case 'phq-9':
      if (puntaje <= 4) return { interpretacion: 'Depresión mínima', nivelRiesgo: 'bajo' };
      if (puntaje <= 9) return { interpretacion: 'Depresión leve', nivelRiesgo: 'bajo' };
      if (puntaje <= 14) return { interpretacion: 'Depresión moderada', nivelRiesgo: 'medio' };
      if (puntaje <= 19) return { interpretacion: 'Depresión moderadamente severa', nivelRiesgo: 'alto' };
      return { interpretacion: 'Depresión severa', nivelRiesgo: 'critico' };
    
    case 'bdi-ii':
      if (puntaje <= 10) return { interpretacion: 'Depresión mínima', nivelRiesgo: 'bajo' };
      if (puntaje <= 16) return { interpretacion: 'Depresión leve', nivelRiesgo: 'bajo' };
      if (puntaje <= 20) return { interpretacion: 'Depresión moderada', nivelRiesgo: 'medio' };
      if (puntaje <= 30) return { interpretacion: 'Depresión severa', nivelRiesgo: 'alto' };
      return { interpretacion: 'Depresión muy severa', nivelRiesgo: 'critico' };
    
    case 'bai':
      if (puntaje <= 7) return { interpretacion: 'Ansiedad mínima', nivelRiesgo: 'bajo' };
      if (puntaje <= 15) return { interpretacion: 'Ansiedad leve', nivelRiesgo: 'bajo' };
      if (puntaje <= 25) return { interpretacion: 'Ansiedad moderada', nivelRiesgo: 'medio' };
      return { interpretacion: 'Ansiedad severa', nivelRiesgo: 'alto' };
    
    default:
      return { interpretacion: 'Sin interpretación disponible', nivelRiesgo: 'bajo' };
  }
}

// POST - Guardar resultado de prueba
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { pruebaId, expedienteId, tipoPrueba, puntaje, respuestas } = data;
    
    if (!expedienteId || !tipoPrueba || puntaje === undefined) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }
    
    // Interpretar resultado
    const { interpretacion, nivelRiesgo } = interpretarResultado(tipoPrueba, puntaje);
    
    // Crear el resultado
    const resultado = await db.resultadoPrueba.create({
      data: {
        expedienteId,
        pruebaId: pruebaId || undefined,
        tipoPrueba,
        puntaje,
        respuestas: JSON.stringify(respuestas || {}),
        interpretacion,
        nivelRiesgo
      }
    });
    
    // Actualizar estado de la prueba si existe
    if (pruebaId) {
      await db.pruebaEnviada.update({
        where: { id: pruebaId },
        data: { 
          estado: 'completado',
          fechaCompletado: new Date()
        }
      });
    }
    
    return NextResponse.json({ resultado });
  } catch (error) {
    console.error('Error guardando resultado:', error);
    return NextResponse.json({ error: 'Error al guardar el resultado' }, { status: 500 });
  }
}
