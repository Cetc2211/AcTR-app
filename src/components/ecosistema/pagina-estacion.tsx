'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EcosistemaAuthGuard from '@/components/ecosistema/ecosistema-auth-guard';
import { useEcosistema } from '@/hooks/use-ecosistema';

export interface ConfigEstacion {
  id: string;
  nombre: string;
  color: string;
  numeroRomano: string;
  claveAcceso: string;
  coleccionFirestore: string;
  rutaBase: string;
}

export const CONFIG_CS1: ConfigEstacion = {
  id: 'cs1',
  nombre: 'Ciencias Sociales I',
  color: '#4a2e10',
  numeroRomano: 'I',
  claveAcceso: 'estacion_cs1',
  coleccionFirestore: 'ecosistema_materiales_cs1',
  rutaBase: '/ecosistema/cs1',
};

export const CONFIG_CS2: ConfigEstacion = {
  id: 'cs2',
  nombre: 'Ciencias Sociales II',
  color: '#1a1060',
  numeroRomano: 'II',
  claveAcceso: 'estacion_cs2',
  coleccionFirestore: 'ecosistema_materiales_cs2',
  rutaBase: '/ecosistema/cs2',
};

export const CONFIG_CS3: ConfigEstacion = {
  id: 'cs3',
  nombre: 'Ciencias Sociales III',
  color: '#0a5040',
  numeroRomano: 'III',
  claveAcceso: 'estacion_cs3',
  coleccionFirestore: 'ecosistema_materiales_cs3',
  rutaBase: '/ecosistema/cs3',
};

export const CONFIG_PFH1: ConfigEstacion = {
  id: 'pfh1',
  nombre: 'Pensamiento Filosófico y Humanidades I',
  color: '#1a1440',
  numeroRomano: 'I',
  claveAcceso: 'estacion_pfh1',
  coleccionFirestore: 'ecosistema_materiales_pfh1',
  rutaBase: '/ecosistema/pfh1',
};

type TipoMaterial = 'libro' | 'articulo' | 'ensayo' | 'curso' | 'novela' | 'cuadernillo' | 'guia';

interface MaterialItem {
  id: string;
  titulo: string;
  subtitulo?: string;
  tipo: TipoMaterial;
  orden?: number;
  archivo?: string;
  nombreArchivo?: string;
  rutaArchivo?: string;
  storageFile?: string;
}

const TIPO_LABEL: Record<string, string> = {
  novela: 'Novela',
  cuadernillo: 'Cuadernillo',
  guia: 'Guía docente',
  libro: 'Libro',
  articulo: 'Artículo',
  ensayo: 'Ensayo',
  curso: 'Curso',
};

export default function PaginaEstacion({ config }: { config: ConfigEstacion }) {
  const { tieneAcceso } = useEcosistema();
  const [materiales, setMateriales] = useState<MaterialItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function cargarMateriales() {
      try {
        const snapshot = await getDocs(collection(db, config.coleccionFirestore));
        const items: MaterialItem[] = snapshot.docs
          .map((materialDoc) => ({
            id: materialDoc.id,
            ...(materialDoc.data() as Omit<MaterialItem, 'id'>),
          }))
          .sort((a, b) => {
            const ordenA = typeof a.orden === 'number' ? a.orden : Number.MAX_SAFE_INTEGER;
            const ordenB = typeof b.orden === 'number' ? b.orden : Number.MAX_SAFE_INTEGER;
            if (ordenA !== ordenB) {
              return ordenA - ordenB;
            }
            return a.titulo.localeCompare(b.titulo, 'es');
          });
        setMateriales(items);
      } catch (error) {
        console.error('[PaginaEstacion] Error cargando materiales:', error);
        const msg = error instanceof Error ? error.message : String(error);
        setErrorMsg(msg);
      } finally {
        setCargando(false);
      }
    }

    setCargando(true);
    setErrorMsg(null);
    void cargarMateriales();
  }, [config.coleccionFirestore]);

  const accesoEstacion = tieneAcceso(config.claveAcceso);

  return (
    <EcosistemaAuthGuard accesoRequerido={config.claveAcceso}>
      <div style={{
        background: '#fdf8f0',
        minHeight: '100vh',
        fontFamily: 'var(--font-body)',
      }}>
        {/* HEADER */}
        <div style={{
          padding: '2rem 2rem 1.5rem',
          borderBottom: '1px solid rgba(74,55,40,0.1)',
          background: config.color,
        }}>
          <Link
            href="/ecosistema"
            style={{
              fontSize: '.75rem',
              color: 'rgba(255,255,255,.5)',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}
          >
            &larr; Biblioteca
          </Link>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
            color: '#fff',
            margin: '.5rem 0 0',
          }}>
            {config.nombre}
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '.6rem',
            letterSpacing: '.15em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.4)',
            margin: '.25rem 0 0',
          }}>
            Estación {config.numeroRomano} · {materiales.length} materiales
          </p>
        </div>

        {/* CONTENIDO */}
        <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
          {cargando ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '3rem' }}>
              Cargando materiales...
            </p>
          ) : materiales.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-body)' }}>
              {errorMsg ? (
                <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 8, padding: '1rem 1.25rem', color: '#a8071a' }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 700 }}>Error al cargar materiales</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{errorMsg}</p>
                  <p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: '#595959' }}>
                    Colección consultada: <code>{config.coleccionFirestore}</code>
                  </p>
                </div>
              ) : (
                <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: '1rem 1.25rem', color: '#614700' }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 700 }}>Sin materiales en Firestore</p>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    La colección <code>{config.coleccionFirestore}</code> no devolvió documentos.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '.75rem',
            }}>
              {materiales.map((material) => {
                const capNum = material.id.match(/cap(\d+)/)?.[1];
                const tipoKey = material.tipo || '';
                const tipoLabel = TIPO_LABEL[tipoKey] || tipoKey;

                return (
                  <Link
                    key={material.id}
                    href={`${config.rutaBase}/${material.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      background: config.color,
                      borderRadius: 6,
                      padding: '1rem 1.2rem',
                      textDecoration: 'none',
                      color: '#fff',
                      transition: 'transform .2s, box-shadow .2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      minHeight: 70,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.18)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* Capítulo + tipo */}
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '.55rem',
                      letterSpacing: '.18em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.4)',
                      marginBottom: '.3rem',
                    }}>
                      {capNum ? `Cap. ${capNum}` : ''} {tipoLabel}
                    </span>

                    {/* Título */}
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      fontSize: '.95rem',
                      lineHeight: 1.2,
                      color: '#fff',
                    }}>
                      {material.titulo}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </EcosistemaAuthGuard>
  );
}
