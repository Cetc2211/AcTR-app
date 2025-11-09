import { NextRequest, NextResponse } from 'next/server';
import { testApiKey } from '@/lib/generate';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'La clave de API no puede estar vacía.' }, { status: 400 });
    }
    const ok = await testApiKey(apiKey);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'La clave de API no es válida o no tiene acceso.' }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error?.message || 'No se pudo validar la clave de API. Verifica tu conexión y permisos.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
