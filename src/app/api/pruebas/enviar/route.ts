import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// POST - Crear link de prueba
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { expedienteId, tipoPrueba } = data;
    
    if (!expedienteId || !tipoPrueba) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }
    
    // Verificar que el expediente existe
    const expediente = await db.expediente.findUnique({
      where: { id: expedienteId }
    });
    
    if (!expediente) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }
    
    // Generar token único
    const token = randomUUID();
    
    // Crear la prueba en la base de datos
    const prueba = await db.pruebaEnviada.create({
      data: {
        expedienteId,
        tipoPrueba,
        token,
        estado: 'enviado',
        fechaEnvio: new Date()
      }
    });
    
    // Generar el link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
      'http://localhost:3000';
    const link = `${baseUrl}/evaluar/${token}`;
    
    return NextResponse.json({ 
      prueba,
      link,
      token 
    });
  } catch (error) {
    console.error('Error creando prueba:', error);
    return NextResponse.json({ error: 'Error al crear la prueba' }, { status: 500 });
  }
}
