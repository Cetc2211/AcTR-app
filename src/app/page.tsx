'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(160deg, #f7efe4 0%, #efe4d5 100%)',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          background: '#fffaf3',
          border: '1px solid #e6d6bf',
          borderRadius: 14,
          boxShadow: '0 16px 42px rgba(80, 58, 38, 0.12)',
          padding: '1.8rem',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '2rem',
            color: '#4a3728',
            fontWeight: 700,
          }}
        >
          Centro de acceso
        </h1>
        <p style={{ margin: '0.6rem 0 1.5rem', color: '#6b5b4b', lineHeight: 1.5 }}>
          Selecciona la experiencia que deseas abrir.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          <Link
            href="/login"
            style={{
              display: 'block',
              textDecoration: 'none',
              border: '1px solid #dbcfbe',
              borderRadius: 12,
              padding: '1rem 1.1rem',
              background: '#ffffff',
              color: '#4a3728',
            }}
          >
            <strong style={{ fontSize: '1.05rem' }}>Academic Tracker</strong>
            <p style={{ margin: '0.45rem 0 0', color: '#786a5c', fontSize: '0.92rem' }}>
              Panel docente y gestion academica.
            </p>
          </Link>

          <Link
            href="/ecosistema/login"
            style={{
              display: 'block',
              textDecoration: 'none',
              border: '1px solid #d5c2aa',
              borderRadius: 12,
              padding: '1rem 1.1rem',
              background: '#fdf5ea',
              color: '#5a2a22',
            }}
          >
            <strong style={{ fontSize: '1.05rem' }}>Letras Necias</strong>
            <p style={{ margin: '0.45rem 0 0', color: '#7d4d42', fontSize: '0.92rem' }}>
              Mini app de lectura protegida por roles.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
