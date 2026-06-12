'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  GraduationCap,
  Lock,
  PenTool,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { isMaterialCached } from '@/lib/ecosistema-storage';

type TipoMaterial = 'libro' | 'articulo' | 'ensayo' | 'curso';

interface EstacionCardProps {
  titulo: string;
  subtitulo?: string;
  tipo: TipoMaterial;
  href: string;
  claveCache?: string;
  tieneAcceso: boolean;
  expirado?: boolean;
  numero?: number;
  colorEstacion?: string;
}

const ICONOS: Record<TipoMaterial, ReactNode> = {
  libro: <BookOpen size={14} />,
  articulo: <FileText size={14} />,
  ensayo: <PenTool size={14} />,
  curso: <GraduationCap size={14} />,
};

const LABELS: Record<TipoMaterial, string> = {
  libro: 'Libro',
  articulo: 'Articulo',
  ensayo: 'Ensayo',
  curso: 'Curso',
};

export default function EstacionCard({
  titulo,
  subtitulo,
  tipo,
  href,
  claveCache,
  tieneAcceso,
  expirado,
  numero,
  colorEstacion,
}: EstacionCardProps) {
  const [cacheado, setCacheado] = useState(false);
  const accesoBloqueado = !tieneAcceso || Boolean(expirado);

  useEffect(() => {
    let activo = true;

    if (!claveCache) {
      setCacheado(false);
      return () => {
        activo = false;
      };
    }

    isMaterialCached(claveCache)
      .then((estaCacheado) => {
        if (activo) {
          setCacheado(estaCacheado);
        }
      })
      .catch(() => {
        if (activo) {
          setCacheado(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [claveCache]);

  return (
    <Link
      href={href}
      aria-disabled={accesoBloqueado}
      onClick={(event) => {
        if (accesoBloqueado) {
          event.preventDefault();
        }
      }}
      style={{
        display: 'block',
        background: '#fdf8f0',
        borderRadius: 10,
        borderLeft: `4px solid ${colorEstacion || '#4a3728'}`,
        padding: '1.15rem 1.25rem',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: accesoBloqueado ? 'default' : 'pointer',
        position: 'relative',
        opacity: accesoBloqueado ? 0.88 : 1,
      }}
      onMouseEnter={(event) => {
        if (!accesoBloqueado) {
          event.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
          event.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.boxShadow = 'none';
        event.currentTarget.style.transform = 'none';
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '0.15rem 0.5rem',
          borderRadius: 4,
          fontSize: '0.7rem',
          fontWeight: 600,
          background: '#f5ead8',
          color: '#4a3728',
          marginBottom: '0.5rem',
        }}
      >
        {ICONOS[tipo]}
        {LABELS[tipo]}
      </span>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 600,
          margin: '0 0 0.25rem',
          color: 'var(--pardo)',
        }}
      >
        {numero != null && `${numero}. `}
        {titulo}
      </h3>

      {subtitulo && (
        <p
          style={{
            fontSize: '0.85rem',
            color: '#808080',
            margin: 0,
          }}
        >
          {subtitulo}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginTop: '0.75rem',
          fontSize: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {cacheado && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669' }}>
            <Wifi size={12} /> Disponible offline
          </span>
        )}
        {!tieneAcceso && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#8b1a1a' }}>
            <Lock size={12} /> Sin acceso
          </span>
        )}
        {expirado && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#d97706' }}>
            <WifiOff size={12} /> Expirado
          </span>
        )}
      </div>
    </Link>
  );
}