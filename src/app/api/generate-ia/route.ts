import { NextResponse } from 'next/server';

// Configuración de runtime para Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  // Esta ruta se ejecuta bajo demanda, no durante el build de Vercel
  return NextResponse.json(
    { ok: false, error: 'This endpoint is deprecated. Use /api/test-ai instead.' },
    { status: 410 }
  );
}

