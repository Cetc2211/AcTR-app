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
  pfh1_estudiante: { estacion_pfh1: true, pfh1_estudiante: true },
  pfh1_docente:    { estacion_pfh1: true, pfh1_docente: true },
  pfh2_estudiante: { estacion_pfh2: true, pfh2_estudiante: true },
  pfh2_docente:    { estacion_pfh2: true, pfh2_docente: true },
  pfh3_estudiante: { estacion_pfh3: true, pfh3_estudiante: true },
  pfh3_docente:    { estacion_pfh3: true, pfh3_docente: true },
};

/**
 * Mapeo de download_id + price_id de EDD a accesos PFH.
 * EDD productos: PFH1=475, PFH2=748, PFH3=751
 * price_id: 0=estudiante ($80), 1=docente ($100)
 */
const EDD_PRICE_ACCESOS: Record<string, Record<string, boolean>> = {
  '475_0': { estacion_pfh1: true, pfh1_estudiante: true },
  '475_1': { estacion_pfh1: true, pfh1_docente: true },
  '748_0': { estacion_pfh2: true, pfh2_estudiante: true },
  '748_1': { estacion_pfh2: true, pfh2_docente: true },
  '751_0': { estacion_pfh3: true, pfh3_estudiante: true },
  '751_1': { estacion_pfh3: true, pfh3_docente: true },
};

export async function POST(request: Request) {
  try {
    const { email, producto, secret, download_id, price_id } = (await request.json()) as {
      email: string;
      producto?: string;
      secret: string;
      download_id?: string | number;
      price_id?: string | number;
    };

    // Verificar secret
    const expectedSecret = process.env.EDD_WEBHOOK_SECRET || '';
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Falta el campo email' }, { status: 400 });
    }

    // Resolver accesos: por nombre de producto o por download_id + price_id de EDD
    let accesosNuevos: Record<string, boolean> | undefined;
    let productoLabel: string;

    if (download_id !== undefined && price_id !== undefined) {
      const eddKey = `${download_id}_${price_id}`;
      accesosNuevos = EDD_PRICE_ACCESOS[eddKey];
      productoLabel = `EDD:${eddKey}`;
    } else if (producto) {
      accesosNuevos = ACCESOS_POR_PRODUCTO[producto];
      productoLabel = producto;
    } else {
      return NextResponse.json(
        { error: 'Falta producto o download_id + price_id' },
        { status: 400 }
      );
    }

    if (!accesosNuevos) {
      return NextResponse.json({ error: `Producto no reconocido: ${productoLabel}` }, { status: 400 });
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
        producto: productoLabel,
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
        rol: (productoLabel.includes('docente') || productoLabel.includes('trilogia')) ? 'lector_premium' : 'lector_free',
        fechaExpiracion: new Date('2027-08-01').toISOString(),
      });
    } else {
      // Crear documento si no existe
      await docRef.set({
        uid,
        email: email.trim().toLowerCase(),
        nombre: email.split('@')[0],
        rol: (productoLabel.includes('docente') || productoLabel.includes('trilogia')) ? 'lector_premium' : 'lector_free',
        accesos: {
          preview_cap1: true,
          articulacion: true,
          estacion_cs1: false,
          estacion_cs2: false,
          estacion_cs3: false,
          estacion_pfh1: false,
          estacion_pfh2: false,
          estacion_pfh3: false,
          pfh1_estudiante: false,
          pfh1_docente: false,
          pfh2_estudiante: false,
          pfh2_docente: false,
          pfh3_estudiante: false,
          pfh3_docente: false,
          ...accesosNuevos,
        },
        fechaRegistro: new Date().toISOString(),
        fechaExpiracion: new Date('2027-08-01').toISOString(),
        activo: true,
      });
    }

    console.log(`[activar-acceso] Accesos activados: ${email} → ${productoLabel}`);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('[activar-acceso]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}
