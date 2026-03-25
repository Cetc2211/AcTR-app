import { NextResponse } from 'next/server';

// Configuration for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Timeout for the backend fetch operation (15 seconds)
const FETCH_TIMEOUT = 15000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request to backend timed out after ${timeout}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { groupId, attendanceData } = body;

    if (!groupId || !attendanceData) {
      return NextResponse.json({ error: 'Faltan datos requeridos (groupId, attendanceData).' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_CLOUD_RUN_ENDPOINT;
    if (!backendUrl) {
      console.error('Error: La variable de entorno NEXT_PUBLIC_CLOUD_RUN_ENDPOINT no está configurada.');
      return NextResponse.json({ error: 'La URL del servicio de backend no está configurada.' }, { status: 500 });
    }

    const backendResponse = await fetchWithTimeout(`${backendUrl}/record-attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: groupId, attendance_data: attendanceData }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text();
      console.error(`Error from backend service: ${backendResponse.status} ${errorData}`);
      return NextResponse.json({ error: `El servicio de backend respondió con un error: ${errorData}` }, { status: backendResponse.status });
    }

    const result = await backendResponse.json();

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error en /api/record-attendance:', error);
    return NextResponse.json({ error: error.message || 'Ocurrió un error inesperado en el servidor.' }, { status: 500 });
  }
}
