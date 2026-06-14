import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { getAdminDb } from '@/lib/firebase-admin';

const NIVEL_POR_ESTACION: Record<string, string> = {
  cs1: 'estacion_cs1',
  cs2: 'estacion_cs2',
  cs3: 'estacion_cs3',
  pfh1: 'estacion_pfh1',
  pfh2: 'estacion_pfh2',
  pfh3: 'estacion_pfh3',
};

const URL_EXPIRACION_SEGUNDOS = 15 * 60;

/**
 * Mapea un nivel a las carpetas candidatas en Storage.
 * Se prueban en orden; la primera que contenga el archivo gana.
 */
function foldersForNivel(nivel: string): string[] {
  switch (nivel) {
    case 'preview_cap1':
      return ['ecosistema/preview'];
    case 'articulacion':
      return [
        'ecosistema/materiales/articulacion',
        'ecosistema/materiales/Articulacion',
      ];
    case 'estacion_cs1':
      return [
        'ecosistema/materiales/estacion_CS1',
        'ecosistema/materiales/estacion_cs1',
      ];
    case 'estacion_cs2':
      return [
        'ecosistema/materiales/estacion_CS2',
        'ecosistema/materiales/estacion_cs2',
      ];
    case 'estacion_cs3':
      return [
        'ecosistema/materiales/estacion_CS3',
        'ecosistema/materiales/estacion_cs3',
      ];
    case 'estacion_pfh1':
      return [
        'ecosistema/materiales/estacion_PFH1',
        'ecosistema/materiales/estacion_pfh1',
      ];
    case 'estacion_pfh2':
      return [
        'ecosistema/materiales/estacion_PFH2',
        'ecosistema/materiales/estacion_pfh2',
      ];
    case 'estacion_pfh3':
      return [
        'ecosistema/materiales/estacion_PFH3',
        'ecosistema/materiales/estacion_pfh3',
      ];
    default:
      return [];
  }
}

/**
 * Normaliza el nombre del archivo probando con y sin extensión .html
 */
function normalizeArchivo(archivo: string): string[] {
  const trimmed = archivo.trim();
  if (!trimmed) return [];
  if (trimmed.toLowerCase().endsWith('.html')) {
    return [trimmed, trimmed.replace(/\.html$/i, '')];
  }
  return [trimmed, `${trimmed}.html`];
}

/**
 * Busca el archivo en Storage recorriendo las carpetas candidatas.
 * Retorna la ruta completa del primer archivo encontrado, o null.
 */
async function findExistingFilePath(
  nivel: string,
  archivo: string
): Promise<string | null> {
  const app = getAdminDb().app;
  const bucket = getStorage(app).bucket();
  const folders = foldersForNivel(nivel);
  const files = normalizeArchivo(archivo);

  for (const folder of folders) {
    for (const fileName of files) {
      const candidatePath = `${folder}/${fileName}`;
      try {
        const [exists] = await bucket.file(candidatePath).exists();
        if (exists) return candidatePath;
      } catch {
        // Continuar con la siguiente combinación
      }
    }
  }
  return null;
}

function methodNotAllowed() {
  return NextResponse.json({ error: 'Metodo no permitido' }, { status: 405 });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticacion requerido' },
        { status: 401 }
      );
    }

    // Garantiza inicializacion de Firebase Admin usando la configuracion centralizada.
    getAdminDb();

    const token = authHeader.slice(7);

    let decodedToken: Awaited<ReturnType<ReturnType<typeof getAuth>['verifyIdToken']>>;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Token invalido o expirado' },
        { status: 401 }
      );
    }

    if (!decodedToken.uid) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 401 });
    }

    let body: { clave?: string; estacion?: string };
    try {
      body = (await request.json()) as { clave?: string; estacion?: string };
    } catch {
      return NextResponse.json({ error: 'Body JSON invalido' }, { status: 400 });
    }

    const { clave, estacion } = body;

    if (!clave || !estacion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: clave, estacion' },
        { status: 400 }
      );
    }

    const nivel = NIVEL_POR_ESTACION[estacion];
    if (!nivel) {
      return NextResponse.json(
        { error: `Estacion no valida: ${estacion}` },
        { status: 400 }
      );
    }

    const archivo = `${clave}.html`;

    // Buscar archivo en Storage directamente (sin Cloud Function)
    const filePath = await findExistingFilePath(nivel, archivo);

    if (!filePath) {
      console.error(
        '[ecosistema/descargar] Archivo no encontrado en Storage:',
        nivel,
        archivo
      );
      return NextResponse.json(
        { error: `El archivo "${archivo}" no existe en el nivel "${nivel}".` },
        { status: 404 }
      );
    }

    // Generar signed URL directamente con Admin SDK
    const app = getAdminDb().app;
    const bucket = getStorage(app).bucket();
    const expiresAt = Date.now() + URL_EXPIRACION_SEGUNDOS * 1000;

    const [url] = await bucket.file(filePath).getSignedUrl({
      action: 'read',
      expires: expiresAt,
    });

    if (!url) {
      console.error('[ecosistema/descargar] No se pudo generar signed URL');
      return NextResponse.json(
        { error: 'Error al generar URL de descarga' },
        { status: 500 }
      );
    }

    console.log('[ecosistema/descargar] Signed URL generada:', nivel, archivo, '→', filePath);

    return NextResponse.json(
      { url, expira: new Date(expiresAt).toISOString() },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ecosistema/descargar] Error interno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}
