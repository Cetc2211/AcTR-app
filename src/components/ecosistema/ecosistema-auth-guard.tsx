'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AccesoRestringido from '@/components/ecosistema/acceso-restringido';
import { useEcosistema } from '@/hooks/use-ecosistema';

interface EcosistemaAuthGuardProps {
  accesoRequerido?: string;
  children: ReactNode;
}

export default function EcosistemaAuthGuard({
  accesoRequerido,
  children,
}: EcosistemaAuthGuardProps) {
  const {
    estaAutenticado,
    perfil,
    cargando,
    tieneAcceso,
    suscripcionExpirada,
    rolLegible,
  } = useEcosistema();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !estaAutenticado) {
      router.replace('/ecosistema/login');
    }
  }, [cargando, estaAutenticado, router]);

  useEffect(() => {
    if (!cargando && estaAutenticado && !perfil) {
      router.replace('/ecosistema/login');
    }
  }, [cargando, estaAutenticado, perfil, router]);

  if (cargando) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          fontFamily: 'var(--font-body)',
          color: 'var(--pardo)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid var(--crema)',
              borderTopColor: 'var(--pardo)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p>Verificando acceso...</p>
        </div>
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    );
  }

  if (!estaAutenticado) {
    return null;
  }

  if (!perfil) {
    return null;
  }

  if (suscripcionExpirada) {
    return <AccesoRestringido variant="expirado" rolActual={rolLegible} />;
  }

  if (accesoRequerido && !tieneAcceso(accesoRequerido)) {
    return <AccesoRestringido variant="sin_acceso" rolActual={rolLegible} />;
  }

  return <>{children}</>;
}