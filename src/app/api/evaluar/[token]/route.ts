import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener prueba por token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }
    
    const prueba = await db.pruebaEnviada.findUnique({
      where: { token },
      include: { 
        expediente: true
      }
    });
    
    if (!prueba) {
      return NextResponse.json({ error: 'Prueba no encontrada' }, { status: 404 });
    }
    
    // Verificar si ya está completada
    if (prueba.estado === 'completado') {
      const resultado = await db.resultadoPrueba.findUnique({
        where: { pruebaId: prueba.id }
      });
      return NextResponse.json({ 
        prueba, 
        resultado,
        yaCompletada: true 
      });
    }
    
    return NextResponse.json({ prueba, yaCompletada: false });
  } catch (error) {
    console.error('Error obteniendo prueba:', error);
    return NextResponse.json({ error: 'Error al obtener la prueba' }, { status: 500 });
  }
}
