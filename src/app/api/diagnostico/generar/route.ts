import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

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

// POST - Generar impresión diagnóstica con IA
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { expedienteId } = data;
    
    if (!expedienteId) {
      return NextResponse.json({ error: 'ID de expediente requerido' }, { status: 400 });
    }
    
    // Obtener expediente con resultados
    const expediente = await db.expediente.findUnique({
      where: { id: expedienteId },
      include: {
        resultados: true
      }
    });
    
    if (!expediente) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }
    
    if (expediente.resultados.length === 0) {
      return NextResponse.json({ error: 'No hay resultados de pruebas para generar diagnóstico' }, { status: 400 });
    }
    
    // Preparar resumen de resultados para la IA
    const resumenResultados = expediente.resultados.map(r => {
      const interp = interpretarResultado(r.tipoPrueba, r.puntaje);
      return `${r.tipoPrueba.toUpperCase()}: Puntaje ${r.puntaje} - ${interp.interpretacion} (Riesgo: ${interp.nivelRiesgo})`;
    }).join('\n');
    
    // Verificar si hay riesgo crítico
    const riesgoCritico = expediente.resultados.some(r => {
      const interp = interpretarResultado(r.tipoPrueba, r.puntaje);
      return interp.nivelRiesgo === 'critico';
    });
    
    // Usar IA para generar impresión diagnóstica
    let diagnosticoIA = null;
    
    try {
      const zai = await ZAI.create();
      
      const prompt = `Eres un psicólogo clínico especializado en evaluación psicométrica. Genera una impresión diagnóstica basada en los siguientes resultados de pruebas:

Paciente: ${expediente.nombre} ${expediente.apellido}
Edad: ${expediente.edad || 'No especificada'} años

RESULTADOS DE PRUEBAS:
${resumenResultados}

Proporciona:
1. Hipótesis diagnóstica principal (una oración clara)
2. Nivel de severidad (leve, moderado, severo, critico)
3. Tres factores de riesgo identificados
4. Tres factores protectores sugeridos
5. Tres recomendaciones específicas

Responde en formato JSON:
{
  "hipotesisPrincipal": "...",
  "nivelSeveridad": "...",
  "factoresRiesgo": ["...", "...", "..."],
  "factoresProtectores": ["...", "...", "..."],
  "recomendaciones": ["...", "...", "..."]
}`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'Eres un psicólogo clínico experto en evaluación psicométrica. Responde únicamente en formato JSON válido.' },
          { role: 'user', content: prompt }
        ]
      });
      
      const respuestaTexto = completion.choices[0]?.message?.content || '';
      
      // Intentar parsear JSON de la respuesta
      try {
        const jsonMatch = respuestaTexto.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          diagnosticoIA = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.log('No se pudo parsear JSON de IA, usando diagnóstico básico');
      }
    } catch (error) {
      console.log('Error con IA, generando diagnóstico básico:', error);
    }
    
    // Crear diagnóstico (con IA o básico)
    const diagnostico = await db.impresionDiagnostica.create({
      data: {
        expedienteId,
        hipotesisPrincipal: diagnosticoIA?.hipotesisPrincipal || 
          `Paciente con indicadores de ${riesgoCritico ? 'alto riesgo' : 'malestar psicológico'} según resultados de evaluación psicométrica.`,
        nivelSeveridad: diagnosticoIA?.nivelSeveridad || 
          (riesgoCritico ? 'critico' : expediente.resultados.some(r => {
            const interp = interpretarResultado(r.tipoPrueba, r.puntaje);
            return interp.nivelRiesgo === 'alto';
          }) ? 'severo' : 'moderado'),
        factoresRiesgo: JSON.stringify(diagnosticoIA?.factoresRiesgo || 
          ['Síntomas reportados en escalas de screening', 'Indicadores emocionales significativos', 'Posible afectación funcional']),
        factoresProtectores: JSON.stringify(diagnosticoIA?.factoresProtectores || 
          ['Capacidad de insight', 'Disposición a buscar ayuda', 'Red de apoyo potencial']),
        recomendaciones: JSON.stringify(diagnosticoIA?.recomendaciones || 
          ['Evaluación clínica detallada', 'Seguimiento psicológico', 'Exploración de red de apoyo']),
        requiereUrgente: riesgoCritico
      }
    });
    
    return NextResponse.json({ diagnostico });
  } catch (error) {
    console.error('Error generando diagnóstico:', error);
    return NextResponse.json({ error: 'Error al generar diagnóstico' }, { status: 500 });
  }
}
