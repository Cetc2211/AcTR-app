import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.WORDPRESS_URL || '';
const WP_USER = process.env.WORDPRESS_APP_USER || '';
const WP_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email } = body as { nombre?: string; email?: string };

    if (!nombre || !email) {
      return NextResponse.json(
        { error: 'nombre y email son requeridos' },
        { status: 400 }
      );
    }

    // Crear suscriptor en WordPress vía REST API
    if (WP_URL && WP_USER && WP_APP_PASSWORD) {
      const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Basic ' +
            Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64'),
        },
        body: JSON.stringify({
          username: email,
          email,
          name: nombre,
          password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
          roles: ['subscriber'],
        }),
      });

      if (!wpRes.ok) {
        const wpErr = await wpRes.text();
        console.error(
          '[notificar-registro] WordPress respondio con error:',
          wpRes.status,
          wpErr
        );
      } else {
        console.log(
          '[notificar-registro] Suscriptor creado en WordPress:',
          email
        );
      }
    } else {
      console.warn(
        '[notificar-registro] Credenciales WordPress no configuradas. Se omite la creacion del suscriptor.'
      );
    }

    console.log('[notificar-registro] Registro notificado:', { nombre, email });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[notificar-registro] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Metodo no permitido' }, { status: 405 });
}
