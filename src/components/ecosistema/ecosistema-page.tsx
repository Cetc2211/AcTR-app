'use client';

import { useRouter } from 'next/navigation';
import { useEcosistema } from '@/hooks/use-ecosistema';
import EstacionCard from '@/components/ecosistema/estacion-card';

const ECOSISTEMAS = [
  {
    id: 'cs1',
    href: '/ecosistema/cs1',
    claveAcceso: 'estacion_cs1',
    label: 'Ciencias Sociales I',
    titulo: 'El Código del Ejido',
    subtitulo: 'Estado, ciudadanía y relaciones de poder',
    descripcion: 'María Tlaloc llega al CBTA y encuentra que el agua del ejido está en disputa. Ocho capítulos, novela narrativa, cuadernillo y guía docente.',
    caps: '8 capítulos · 3 materiales por capítulo',
    color: '#4a2e10',
    colorClaro: '#fdf5e8',
    acento: '#c9a227',
    semestre: 'Primer semestre',
  },
  {
    id: 'cs2',
    href: '/ecosistema/cs2',
    claveAcceso: 'estacion_cs2',
    label: 'Ciencias Sociales II',
    titulo: 'La Cadena Rota',
    subtitulo: 'Organización, relaciones económicas y sociales',
    descripcion: 'El grupo mapea la cadena de valor del aguacate: 32 pesos al productor, 178 en el supermercado. Interseccionalidad, cooperativismo y análisis económico desde el territorio.',
    caps: '8 capítulos · 3 materiales por capítulo',
    color: '#1a1060',
    colorClaro: '#eeeaf8',
    acento: '#7b6fd0',
    semestre: 'Segundo semestre',
  },
  {
    id: 'cs3',
    href: '/ecosistema/cs3',
    claveAcceso: 'estacion_cs3',
    label: 'Ciencias Sociales III',
    titulo: 'Generación Raíz',
    subtitulo: 'Las dinámicas de la realidad actual',
    descripcion: 'Movilidad social, migración, crisis climática y brecha digital. Las juventudes como agentes de transformación desde el territorio.',
    caps: '8 capítulos · 3 materiales por capítulo',
    color: '#0a5040',
    colorClaro: '#e6f2ee',
    acento: '#4db896',
    semestre: 'Tercer semestre',
  },
  {
    id: 'pfh1',
    href: '/ecosistema/pfh1',
    claveAcceso: 'estacion_pfh1',
    label: 'Pensamiento Filosófico y Humanidades 1',
    titulo: 'La pregunta que habita el mundo',
    subtitulo: 'Doxa, episteme y comunidad de indagación',
    descripcion: 'Mateo Solís llega al bachillerato y encuentra los pupitres en círculo. Dieciséis módulos que van del asombro inicial a la práctica filosófica plena.',
    caps: '16 módulos · 3 materiales por módulo',
    color: '#1a1440',
    colorClaro: '#eceaf8',
    acento: '#a87c2a',
    semestre: 'Pensamiento Filosófico · DGB',
  },
];

export default function EcosistemaPage() {
  const router = useRouter();
  const { perfil, tieneAcceso, suscripcionExpirada, rolLegible } = useEcosistema();

  return (
    <div style={{
      background: '#fdf8f0',
      minHeight: '100vh',
      fontFamily: 'var(--font-body)',
    }}>
      {/* HEADER */}
      <div style={{
        padding: '2rem 2rem 1.5rem',
        borderBottom: '1px solid rgba(74,55,40,0.1)',
        background: '#fff',
      }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--pardo)', margin: '0 0 .2rem' }}>
          {perfil?.nombre || 'Lector'}
        </p>
        <p style={{ fontSize: '.85rem', color: '#888', margin: 0 }}>
          {rolLegible}
          {suscripcionExpirada && <span style={{ color: '#d97706', marginLeft: '.5rem' }}>(Suscripción expirada)</span>}
        </p>
      </div>

      {/* GRID DE ECOSISTEMAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
        padding: '2rem',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {ECOSISTEMAS.map((eco) => {
          const acceso = tieneAcceso(eco.claveAcceso);
          const bloqueado = !acceso && suscripcionExpirada;

          return (
            <div
              key={eco.id}
              onClick={() => router.push(eco.href)}
              style={{
                background: eco.color,
                borderRadius: 8,
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                transition: 'transform .25s, box-shadow .25s',
                opacity: bloqueado ? 0.6 : 1,
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
              }}
            >
              {/* HEADER TARJETA */}
              <div style={{ padding: '1.8rem 1.8rem 1.2rem', position: 'relative', flex: 1 }}>
                {/* Número decorativo */}
                <span style={{
                  position: 'absolute', top: '1rem', right: '1.2rem',
                  fontFamily: 'var(--font-display)', fontStyle: 'italic',
                  fontSize: '5rem', lineHeight: 1,
                  color: 'rgba(255,255,255,.06)',
                  userSelect: 'none', pointerEvents: 'none',
                }}>
                  {eco.id === 'pfh1' ? 'PF' : eco.id.toUpperCase()}
                </span>

                {/* Badge semestre */}
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '.65rem', letterSpacing: '.22em',
                  textTransform: 'uppercase',
                  color: eco.acento,
                  display: 'block', marginBottom: '.8rem',
                }}>
                  {eco.semestre}
                </span>

                {/* Label */}
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '.6rem', letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.45)',
                  display: 'block', marginBottom: '.4rem',
                }}>
                  {eco.label}
                </span>

                {/* Título */}
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic', fontWeight: 400,
                  fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                  color: '#fff', lineHeight: 1.1,
                  marginBottom: '.3rem',
                }}>
                  {eco.titulo}
                </h2>

                {/* Subtítulo */}
                <p style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '.6rem', letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.4)',
                  marginBottom: '1rem',
                }}>
                  {eco.subtitulo}
                </p>

                {/* Descripción */}
                <p style={{
                  fontSize: '.85rem',
                  color: 'rgba(255,255,255,.65)',
                  lineHeight: 1.7,
                }}>
                  {eco.descripcion}
                </p>
              </div>

              {/* FOOTER TARJETA */}
              <div style={{
                padding: '.9rem 1.8rem',
                background: 'rgba(0,0,0,.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '.58rem', letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.4)',
                }}>
                  {eco.caps}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '.6rem', letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  color: acceso ? eco.acento : 'rgba(255,255,255,.3)',
                  display: 'flex', alignItems: 'center', gap: '.3rem',
                }}>
                  {acceso ? '● Acceso completo' : tieneAcceso('preview_cap1') ? '○ Vista previa' : '🔒 Sin acceso'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* VISTA PREVIA — Capítulo 1 gratuito */}
      {tieneAcceso('preview_cap1') && (
        <div style={{ padding: '0 2rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '.65rem', letterSpacing: '.25em',
            textTransform: 'uppercase', color: '#888',
            marginBottom: '1rem',
          }}>
            Vista previa gratuita · Capítulo 1
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {/* CS-I */}
            <EstacionCard titulo="CS-I · Novela Cap. 1" subtitulo="El Código del Ejido · Acceso gratuito" tipo="articulo" href="/ecosistema/cs1/cs1-cap1-novela" tieneAcceso={true} colorEstacion="#4a2e10" />
            <EstacionCard titulo="CS-I · Cuadernillo Cap. 1" subtitulo="El Código del Ejido · Acceso gratuito" tipo="articulo" href="/ecosistema/cs1/cs1-cap1-cuadernillo" tieneAcceso={true} colorEstacion="#4a2e10" />
            <EstacionCard titulo="CS-I · Guía Docente Cap. 1" subtitulo="El Código del Ejido · Acceso gratuito" tipo="articulo" href="/ecosistema/cs1/cs1-cap1-guia" tieneAcceso={true} colorEstacion="#4a2e10" />
            {/* CS-II */}
            <EstacionCard titulo="CS-II · Novela Cap. 1" subtitulo="La Cadena Rota · Acceso gratuito" tipo="articulo" href="/ecosistema/cs2/cs2-cap1-novela" tieneAcceso={true} colorEstacion="#1a1060" />
            <EstacionCard titulo="CS-II · Cuadernillo Cap. 1" subtitulo="La Cadena Rota · Acceso gratuito" tipo="articulo" href="/ecosistema/cs2/cs2-cap1-cuadernillo" tieneAcceso={true} colorEstacion="#1a1060" />
            <EstacionCard titulo="CS-II · Guía Docente Cap. 1" subtitulo="La Cadena Rota · Acceso gratuito" tipo="articulo" href="/ecosistema/cs2/cs2-cap1-guia" tieneAcceso={true} colorEstacion="#1a1060" />
            {/* CS-III */}
            <EstacionCard titulo="CS-III · Novela Cap. 1" subtitulo="Generación Raíz · Acceso gratuito" tipo="articulo" href="/ecosistema/cs3/cs3-cap1-novela" tieneAcceso={true} colorEstacion="#0a5040" />
            <EstacionCard titulo="CS-III · Cuadernillo Cap. 1" subtitulo="Generación Raíz · Acceso gratuito" tipo="articulo" href="/ecosistema/cs3/cs3-cap1-cuadernillo" tieneAcceso={true} colorEstacion="#0a5040" />
            <EstacionCard titulo="CS-III · Guía Docente Cap. 1" subtitulo="Generación Raíz · Acceso gratuito" tipo="articulo" href="/ecosistema/cs3/cs3-cap1-guia" tieneAcceso={true} colorEstacion="#0a5040" />
            {/* PFH1 */}
            <EstacionCard titulo="PFH1 · Capitulo 1 · Novela" subtitulo="Panta Rhei · Acceso gratuito" tipo="articulo" href="/ecosistema/pfh1/pfh1-cap1-novela" tieneAcceso={true} colorEstacion="#1a1440" />
            <EstacionCard titulo="PFH1 · Capitulo 1 · Cuadernillo" subtitulo="Panta Rhei · Acceso gratuito" tipo="articulo" href="/ecosistema/pfh1/pfh1-cap1-cuadernillo" tieneAcceso={true} colorEstacion="#1a1440" />
            <EstacionCard titulo="PFH1 · Capitulo 1 · Guía" subtitulo="Panta Rhei · Acceso gratuito" tipo="articulo" href="/ecosistema/pfh1/pfh1-cap1-guia" tieneAcceso={true} colorEstacion="#1a1440" />
          </div>
        </div>
      )}

      {/* ARTICULACIÓN */}
      {tieneAcceso('articulacion') && (
        <div style={{ padding: '0 2rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '.65rem', letterSpacing: '.25em',
            textTransform: 'uppercase', color: '#888',
            marginBottom: '1rem',
          }}>
            Articulación
          </p>
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

      {/* FOOTER */}
      <div
        style={{
          borderTop: '1px solid #e8dcc8',
          padding: '1.5rem 2rem',
          marginTop: '1rem',
          color: '#a0a0a0',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-body)',
        }}
      >
        <p style={{ margin: 0 }}>Ecosistema Letras Necias - Plataforma de lectura</p>
      </div>
    </div>
  );
}
