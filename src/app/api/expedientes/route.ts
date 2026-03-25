import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar expedientes con sus pruebas y resultados
export async function GET() {
  try {
    const expedientes = await db.expediente.findMany({
      include: {
        pruebas: true,
        resultados: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ expedientes });
  } catch (error) {
    console.error('Error obteniendo expedientes:', error);
    return NextResponse.json({ error: 'Error al obtener expedientes' }, { status: 500 });
  }
}

// POST - Crear nuevo expediente
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const expediente = await db.expediente.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        edad: data.edad ? parseInt(data.edad) : null,
        grupo: data.grupo || null,
        email: data.email || null,
        telefono: data.telefono || null,
      }
    });
    
    return NextResponse.json({ expediente });
  } catch (error) {
    console.error('Error creando expediente:', error);
    return NextResponse.json({ error: 'Error al crear expediente' }, { status: 500 });
  }
}
