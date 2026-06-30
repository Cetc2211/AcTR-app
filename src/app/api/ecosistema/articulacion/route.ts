import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * GET /api/ecosistema/articulacion?estacion=pfh1
 *
 * Genera una signed URL para el archivo de articulación de una estación PFH
 * y la devuelve como JSON. Requiere autenticación.
 *
 * El cliente usa window.open(url) para abrir la URL directamente,
 * lo que evita problemas de CORS que ocurrirían con fetch() + redirect.
 *
 * Busca en orden:
 *   1. "Articulacion Curricular PFH1.html" (nombre con espacios)
 *   2. articulacion-{estacion}.html  (legacy con guiones)
 *   ... y variantes PDF / mayúsculas
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estacion = searchParams.get('estacion');

    if (!estacion || !['pfh1', 'pfh2', 'pfh3'].includes(estacion)) {
      return NextResponse.json(
        { error: 'Parámetro "estacion" inválido. Usa pfh1, pfh2 o pfh3.' },
        { status: 400 }
      );
    }

    // ── Autenticación ──
    const authHeader = request.headers.get('Authorization');
    let uid: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        getAdminDb(); // Garantiza inicialización
        const decoded = await getAuth().verifyIdToken(token);
        uid = decoded.uid;
      } catch {
        // Token inválido — continuar sin uid (no redirigirá)
      }
    }

    if (!uid) {
      return NextResponse.json(
        { error: 'Autenticación requerida para acceder a la articulación.' },
        { status: 401 }
      );
    }

    // ── Buscar archivo en Storage ──
    const app = getAdminDb().app;
    const bucket = getStorage(app).bucket();

    const estacionUpper = estacion.toUpperCase(); // e.g. "PFH1"
    const EstacionTitle = estacion.charAt(0).toUpperCase() + estacion.slice(1); // e.g. "Pfh1"

    const candidates = [
      // Patrón nuevo: "Articulacion Curricular PFH1.html" (con espacios)
      `ecosistema/materiales/estacion_${estacion}/Articulacion Curricular ${estacionUpper}.html`,
      `ecosistema/materiales/estacion_${estacion}/Articulacion Curricular ${estacionUpper}.pdf`,
      `ecosistema/materiales/estacion_${estacionUpper}/Articulacion Curricular ${estacionUpper}.html`,
      `ecosistema/materiales/estacion_${estacionUpper}/Articulacion Curricular ${estacionUpper}.pdf`,
      // Patrones legacy: guiones
      `ecosistema/materiales/estacion_${estacionUpper}/articulacion-${estacion}.html`,
      `ecosistema/materiales/estacion_${estacionUpper}/articulacion-${estacion}.pdf`,
      `ecosistema/materiales/estacion_${estacionUpper}/Articulacion-${EstacionTitle}.html`,
      `ecosistema/materiales/estacion_${estacionUpper}/Articulacion-${EstacionTitle}.pdf`,
      `ecosistema/materiales/estacion_${estacion}/articulacion-${estacion}.html`,
      `ecosistema/materiales/estacion_${estacion}/articulacion-${estacion}.pdf`,
    ];

    let foundPath: string | null = null;
    for (const candidate of candidates) {
      try {
        const [exists] = await bucket.file(candidate).exists();
        if (exists) {
          foundPath = candidate;
          break;
        }
      } catch {
        // Continuar con la siguiente opción
      }
    }

    if (!foundPath) {
      console.error('[articulacion] Archivo no encontrado para estación:', estacion);
      return NextResponse.json(
        { error: `No se encontró el archivo de articulación para ${estacion}.` },
        { status: 404 }
      );
    }

    // ── Generar signed URL ──
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos
    const [url] = await bucket.file(foundPath).getSignedUrl({
      action: 'read',
      expires: expiresAt,
    });

    if (!url) {
      return NextResponse.json(
        { error: 'Error al generar URL de descarga.' },
        { status: 500 }
      );
    }

    console.log('[articulacion] Signed URL generada:', estacion, '→', foundPath);

    // Devolver JSON con la signed URL — el cliente abre con window.open()
    // Esto evita el problema de CORS que ocurre cuando fetch() sigue un redirect
    // a un origen cruzado (Google Cloud Storage).
    return NextResponse.json(
      { url, expira: new Date(expiresAt).toISOString() },
      { status: 200 }
    );
  } catch (error) {
    console.error('[articulacion] Error interno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
