import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json({ ok: false, error: 'This endpoint is deprecated.' }, { status: 410 });
}

export const runtime = 'nodejs';

