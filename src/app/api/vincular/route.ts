import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { alumnoId, grupoId, resultado, pruebaNombre } = await request.json();

    // Referencia al documento del alumno en el CBTa 130
    const alumnoRef = doc(db, 'alumnos', alumnoId);
    const alumnoSnap = await getDoc(alumnoRef);

    if (!alumnoSnap.exists()) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
    }

    // Aplicamos la lógica de redondeo (.6) y validación de reprobación
    let califFinal = Math.floor(resultado);
    if (resultado - califFinal >= 0.6) {
      califFinal += 1;
    }
    
    // Regla: Si es menor a 6, se registra como 5 para actas oficiales
    if (califFinal < 6) califFinal = 5;

    // Actualizamos el registro con el resultado de PIGEC
    await updateDoc(alumnoRef, {
      [`evaluaciones.${pruebaNombre}`]: califFinal,
      ultimaSincronizacion: new Date().toISOString()
    });

    return NextResponse.json({ success: true, calificacionProcesada: califFinal });
  } catch (error) {
    return NextResponse.json({ error: 'Error en el puente de datos' }, { status: 500 });
  }
}
