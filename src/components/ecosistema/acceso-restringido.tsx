'use client';

import { Lock, Mail, RefreshCw } from 'lucide-react';

interface AccesoRestringidoProps {
  variant: 'sin_acceso' | 'expirado' | 'sin_perfil';
  rolActual?: string;
}

const MENSAJES = {
  sin_acceso: {
    titulo: 'Acceso restringido',
    descripcion:
      'No tienes acceso a esta estacion. Tu plan actual no incluye este contenido. Contacta al administrador para ampliar tu acceso.',
    boton: 'Contactar',
  },
  expirado: {
    titulo: 'Suscripcion expirada',
    descripcion:
      'Tu suscripcion ha expirado y ya no tienes acceso a este contenido. Renueva tu suscripcion para continuar leyendo.',
    boton: 'Renovar',
  },
  sin_perfil: {
    titulo: 'Perfil no encontrado',
    descripcion:
      'No se encontro tu perfil en el sistema. Esto puede deberse a un problema de sincronizacion. Intenta re-autenticarte.',
    boton: 'Re-autenticarse',
  },
} as const;

const EMAIL_CONTACTO = 'soporte@letrasnecias.com';

export default function AccesoRestringido({
  variant,
  rolActual,
}: AccesoRestringidoProps) {
  const mensaje = MENSAJES[variant];

  function handleAction() {
    if (variant === 'sin_acceso' || variant === 'expirado') {
      window.location.href = `mailto:${EMAIL_CONTACTO}`;
      return;
    }

    window.location.href = '/ecosistema/login';
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        padding: '2rem',
        fontFamily: 'var(--font-body)',
        color: 'var(--pardo)',
        textAlign: 'center',
      }}
    >
      <Lock size={48} style={{ color: '#8b1a1a', marginBottom: '1rem' }} />
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          fontWeight: 700,
          margin: '0 0 0.5rem',
        }}
      >
        {mensaje.titulo}
      </h2>
      <p
        style={{
          maxWidth: 420,
          lineHeight: 1.6,
          color: '#606060',
          margin: '0 0 1rem',
        }}
      >
        {mensaje.descripcion}
      </p>
      {rolActual && (
        <span
          style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            background: '#f5ead8',
            borderRadius: 20,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#4a3728',
            marginBottom: '1rem',
          }}
        >
          Rol actual: {rolActual}
        </span>
      )}
      <button
        onClick={handleAction}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 1.5rem',
          background: '#8b1a1a',
          color: '#fdf8f0',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        {variant === 'sin_acceso' || variant === 'expirado' ? (
          <Mail size={16} />
        ) : (
          <RefreshCw size={16} />
        )}
        {mensaje.boton}
      </button>
    </div>
  );
}