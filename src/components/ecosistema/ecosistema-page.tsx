'use client';

import { useEcosistema } from '@/hooks/use-ecosistema';
import EstacionCard from '@/components/ecosistema/estacion-card';

export default function EcosistemaPage() {
  const { perfil, tieneAcceso, suscripcionExpirada, rolLegible } = useEcosistema();

  const estaciones = [
    {
      id: 'cs1',
      titulo: 'Ciencias Sociales I',
      subtitulo: 'Fundamentos de pensamiento social',
      tipo: 'libro' as const,
      href: '/ecosistema/cs1',
      claveAcceso: 'estacion_cs1',
      color: '#4a2e10',
    },
    {
      id: 'cs2',
      titulo: 'Ciencias Sociales II',
      subtitulo: 'Teoria y critica contemporanea',
      tipo: 'libro' as const,
      href: '/ecosistema/cs2',
      claveAcceso: 'estacion_cs2',
      color: '#1a1060',
    },
    {
      id: 'cs3',
      titulo: 'Ciencias Sociales III',
      subtitulo: 'Investigacion y metodologia avanzada',
      tipo: 'libro' as const,
      href: '/ecosistema/cs3',
      claveAcceso: 'estacion_cs3',
      color: '#0a5040',
    },
  ];

  return (
    <div
      style={{
        padding: '2rem 1.5rem',
        maxWidth: 1200,
        margin: '0 auto',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--pardo)',
            margin: '0 0 0.25rem',
          }}
        >
          Bienvenido, {perfil?.nombre || 'lector'}
        </h1>
        <p style={{ color: '#707070', margin: 0, fontSize: '0.95rem' }}>
          {rolLegible}
          {suscripcionExpirada && (
            <span style={{ color: '#d97706', marginLeft: '0.5rem', fontWeight: 600 }}>
              (Suscripcion expirada)
            </span>
          )}
        </p>
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          fontWeight: 600,
          color: 'var(--pardo)',
          margin: '0 0 1rem',
        }}
      >
        Estaciones
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {estaciones.map((estacion) => (
          <EstacionCard
            key={estacion.id}
            titulo={estacion.titulo}
            subtitulo={estacion.subtitulo}
            tipo={estacion.tipo}
            href={estacion.href}
            tieneAcceso={tieneAcceso(estacion.claveAcceso)}
            expirado={suscripcionExpirada}
            colorEstacion={estacion.color}
          />
        ))}
      </div>

      {tieneAcceso('preview_cap1') && (
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 600,
              color: 'var(--pardo)',
              margin: '0 0 1rem',
            }}
          >
            Vista previa
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <EstacionCard
              titulo="CS-I · Capítulo 1"
              subtitulo="El Código del Ejido · Acceso gratuito"
              tipo="articulo"
              href="/ecosistema/cs1/cs1-cap1-novela"
              tieneAcceso={true}
              colorEstacion="#4a2e10"
            />
            <EstacionCard
              titulo="CS-II · Capítulo 1"
              subtitulo="La Cadena Rota · Acceso gratuito"
              tipo="articulo"
              href="/ecosistema/cs2/cs2-cap1-novela"
              tieneAcceso={true}
              colorEstacion="#1a1060"
            />
            <EstacionCard
              titulo="CS-III · Capítulo 1"
              subtitulo="Generación Raíz · Acceso gratuito"
              tipo="articulo"
              href="/ecosistema/cs3/cs3-cap1-novela"
              tieneAcceso={true}
              colorEstacion="#0a5040"
            />
          </div>
        </div>
      )}

      {tieneAcceso('articulacion') && (
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 600,
              color: 'var(--pardo)',
              margin: '0 0 1rem',
            }}
          >
            Articulación
          </h2>
          <a
            href="https://letrasnecias.com/wp-content/uploads/2026/06/Articulacion-Pedagogica-TrilogiaRaizDigital.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              background: '#3d2d1e',
              color: '#fdf8f0',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              transition: 'background 0.2s',
            }}
          >
            ↓ Descargar Articulación Pedagógica
          </a>
        </div>
      )}

      <div
        style={{
          borderTop: '1px solid #e8dcc8',
          paddingTop: '1.5rem',
          marginTop: '2rem',
          color: '#a0a0a0',
          fontSize: '0.8rem',
        }}
      >
        <p style={{ margin: 0 }}>Ecosistema Letras Necias - Plataforma de lectura</p>
      </div>
    </div>
  );
}