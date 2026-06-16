import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/firebase-admin';

const ACCESOS_POR_PRODUCTO: Record<string, Record<string, boolean>> = {
  cs1_estudiante:  { estacion_cs1: true },
  cs1_docente:     { estacion_cs1: true },
  cs2_estudiante:  { estacion_cs2: true },
  cs2_docente:     { estacion_cs2: true },
  cs3_estudiante:  { estacion_cs3: true },
  cs3_docente:     { estacion_cs3: true },
  trilogia_docente:{ estacion_cs1: true, estacion_cs2: true, estacion_cs3: true },
  // PFH: se mantiene estacion_pfhN para retrocompatibilidad con EcosistemaAuthGuard,
  // y se agrega pfhN_estudiante/pfhN_docente para el filtro de descarga de guías.
  pfh1_estudiante: { estacion_pfh1: true, pfh1_estudiante: true },
  pfh1_docente:    { estacion_pfh1: true, pfh1_docente: true },
  pfh2_estudiante: { estacion_pfh2: true, pfh2_estudiante: true },
  pfh2_docente:    { estacion_pfh2: true, pfh2_docente: true },
  pfh3_estudiante: { estacion_pfh3: true, pfh3_estudiante: true },
  pfh3_docente:    { estacion_pfh3: true, pfh3_docente: true },
};

export async function POST(request: Request) {
  try {
    const { email, producto, secret } = (await request.json()) as {
      email: string;
      producto: string;
      secret: string;
    };

    // Verificar secret
    const expectedSecret = process.env.EDD_WEBHOOK_SECRET || '';
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!email || !producto) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    const accesosNuevos = ACCESOS_POR_PRODUCTO[producto];
    if (!accesosNuevos) {
      return NextResponse.json({ error: `Producto no reconocido: ${producto}` }, { status: 400 });
    }

    const db = getAdminDb();

    // Buscar usuario en Firebase Auth por email
    let uid: string;
    try {
      const userRecord = await getAuth().getUserByEmail(email.trim().toLowerCase());
      uid = userRecord.uid;
    } catch {
      // Usuario no registrado aún — guardar acceso pendiente
      await db.collection('ecosistema_accesos_pendientes').doc(email.trim().toLowerCase()).set({
        email: email.trim().toLowerCase(),
        producto,
        accesos: accesosNuevos,
        fechaPago: new Date().toISOString(),
        aplicado: false,
      }, { merge: true });

      console.log(`[activar-acceso] Usuario no registrado aún, acceso pendiente: ${email}`);
      return NextResponse.json({ ok: true, pendiente: true });
    }

    // Usuario existe — activar accesos en ecosistema_usuarios
    const docRef = db.collection('ecosistema_usuarios').doc(uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const accesosActuales = (docSnap.data() as any)?.accesos || {};
      await docRef.update({
        accesos: { ...accesosActuales, ...accesosNuevos },
        rol: producto.includes('docente') || producto.includes('trilogia') ? 'lector_premium' : 'lector_cs1',
        fechaExpiracion: new Date('2027-08-01').toISOString(),
      });
    } else {
      // Crear documento si no existe
      await docRef.set({
        uid,
        email: email.trim().toLowerCase(),
        nombre: email.split('@')[0],
        rol: producto.includes('docente') || producto.includes('trilogia') ? 'lector_premium' : 'lector_cs1',
        accesos: {
          preview_cap1: true,
          articulacion: true,
          estacion_cs1: false,
          estacion_cs2: false,
          estacion_cs3: false,
          estacion_pfh1: false,
          estacion_pfh2: false,
          estacion_pfh3: false,
          ...accesosNuevos,
        },
        fechaRegistro: new Date().toISOString(),
        fechaExpiracion: new Date('2027-08-01').toISOString(),
        activo: true,
      });
    }

    console.log(`[activar-acceso] Accesos activados: ${email} → ${producto}`);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('[activar-acceso]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}
