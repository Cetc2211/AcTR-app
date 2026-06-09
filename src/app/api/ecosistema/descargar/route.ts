import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/firebase-admin';

const NIVEL_POR_ESTACION: Record<string, string> = {
  cs1: 'estacion_cs1',
  cs2: 'estacion_cs2',
  cs3: 'estacion_cs3',
};

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

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'academic-tracker-qeoxi';
    const functionsUrl = process.env.FIREBASE_FUNCTIONS_URL || `https://us-central1-${projectId}.cloudfunctions.net`;
    const baseUrl = functionsUrl.endsWith('/') ? functionsUrl.slice(0, -1) : functionsUrl;

    const cfResp = await fetch(`${baseUrl}/solicitarDescarga`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: { nivel, archivo } }),
    });

    if (!cfResp.ok) {
      const cfError = await cfResp.json().catch(() => ({}));
      console.error(
        '[ecosistema/descargar] Cloud Function error:',
        cfResp.status,
        cfError
      );
      return NextResponse.json(
        { error: 'Error al solicitar descarga desde el servidor' },
        { status: 502 }
      );
    }

    const cfData = (await cfResp.json()) as { result?: { url?: string } };
    const url = cfData?.result?.url;

    if (!url) {
      console.error('[ecosistema/descargar] Cloud Function sin URL:', cfData);
      return NextResponse.json(
        { error: 'Respuesta invalida del servidor de descargas' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url }, { status: 200 });
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
