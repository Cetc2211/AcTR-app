'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import EcosistemaAuthGuard from '@/components/ecosistema/ecosistema-auth-guard';
import MaterialReader from '@/components/ecosistema/material-reader';
import type { ConfigEstacion } from '@/components/ecosistema/pagina-estacion';

interface PaginaCapituloProps {
  config: ConfigEstacion;
}

async function solicitarUrlDescarga(
  clave: string,
  estacion: string
): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('No autenticado');
  }

  const response = await fetch('/api/ecosistema/descargar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ clave, estacion }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error || `Error ${response.status}`);
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export default function PaginaCapitulo({ config }: PaginaCapituloProps) {
  const params = useParams();
  const capitulo = params.capitulo as string;

  const solicitarDescarga = (clave: string) =>
    solicitarUrlDescarga(clave, config.id);

  return (
    <EcosistemaAuthGuard accesoRequerido={config.claveAcceso}>
      <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
        <nav
          style={{
            fontSize: '0.85rem',
            fontFamily: 'var(--font-body)',
            color: '#707070',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Link href="/ecosistema" style={{ color: config.color, textDecoration: 'none' }}>
            Biblioteca
          </Link>
          <span>/</span>
          <Link href={config.rutaBase} style={{ color: config.color, textDecoration: 'none' }}>
            {config.nombre}
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--pardo)', fontWeight: 600 }}>
            Capitulo {capitulo}
          </span>
        </nav>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontWeight: 700,
              color: config.color,
              margin: '0 0 0.25rem',
            }}
          >
            {config.nombre}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              color: '#707070',
              margin: 0,
              fontSize: '0.95rem',
            }}
          >
            Capitulo {capitulo}
          </p>
        </div>

        <Link
          href={config.rutaBase}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.4rem 0.85rem',
            background: '#f5ead8',
            color: config.color,
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            marginBottom: '1.5rem',
          }}
        >
          &larr; Volver a la estacion
        </Link>

        <MaterialReader
          titulo={`${config.nombre} · Capitulo ${capitulo}`}
          claveMaterial={`${config.id}-${capitulo}`}
          rutaFirestore={`${config.coleccionFirestore}/${capitulo}`}
          archivoRemoto={`${config.id}-${capitulo}`}
          colorEstacion={config.color}
          rutaRegreso={config.rutaBase}
          nombreEstacion={config.nombre}
          solicitarUrlDescarga={solicitarDescarga}
        />
      </div>
    </EcosistemaAuthGuard>
  );
}
