'use client';

import { useEffect, useMemo, useState } from 'react';
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

interface CapituloGrupo {
  num: number;
  titulo: string;
  materiales: MaterialItem[];
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

const TIPO_ORDEN: Record<string, number> = {
  novela: 1,
  cuadernillo: 2,
  guia: 3,
  libro: 1,
  articulo: 2,
  ensayo: 3,
  curso: 4,
};

export default function PaginaEstacion({ config }: { config: ConfigEstacion }) {
  const { tieneAcceso } = useEcosistema();
  const [materiales, setMateriales] = useState<MaterialItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<number | null>(null);

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
            if (ordenA !== ordenB) return ordenA - ordenB;
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

  // Agrupar materiales por capítulo
  const capitulos = useMemo<CapituloGrupo[]>(() => {
    const mapa = new Map<number, MaterialItem[]>();

    for (const m of materiales) {
      const capMatch = m.id.match(/cap(\d+)/);
      const capNum = capMatch ? parseInt(capMatch[1], 10) : (m.orden ?? 0);
      if (!mapa.has(capNum)) mapa.set(capNum, []);
      mapa.get(capNum)!.push(m);
    }

    const grupos: CapituloGrupo[] = [];
    for (const [num, mats] of mapa) {
      // Ordenar materiales dentro del capítulo: novela, cuadernillo, guía
      mats.sort((a, b) => (TIPO_ORDEN[a.tipo] ?? 99) - (TIPO_ORDEN[b.tipo] ?? 99));
      grupos.push({
        num,
        titulo: mats[0]?.titulo || `Capítulo ${num}`,
        materiales: mats,
      });
    }

    grupos.sort((a, b) => a.num - b.num);
    return grupos;
  }, [materiales]);

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
            Estación {config.numeroRomano} · {capitulos.length} capítulos
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '.75rem',
            }}>
              {capitulos.map((cap) => {
                const abierto = expandido === cap.num;

                return (
                  <div key={cap.num}>
                    {/* CAJA CAPÍTULO */}
                    <div
                      onClick={() => setExpandido(abierto ? null : cap.num)}
                      style={{
                        background: config.color,
                        borderRadius: abierto ? '6px 6px 0 0' : 6,
                        padding: '1rem 1.2rem',
                        cursor: 'pointer',
                        transition: 'transform .2s, box-shadow .2s',
                        boxShadow: abierto
                          ? '0 4px 16px rgba(0,0,0,0.15)'
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseEnter={e => {
                        if (!abierto) {
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.18)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!abierto) {
                          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }
                      }}
                    >
                      <div>
                        <span style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '.55rem',
                          letterSpacing: '.18em',
                          textTransform: 'uppercase',
                          color: 'rgba(255,255,255,.4)',
                          display: 'block',
                          marginBottom: '.25rem',
                        }}>
                          Capítulo {cap.num}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontStyle: 'italic',
                          fontWeight: 400,
                          fontSize: '.95rem',
                          lineHeight: 1.2,
                          color: '#fff',
                        }}>
                          {cap.titulo}
                        </span>
                      </div>

                      {/* Indicador expandir/colapsar */}
                      <span style={{
                        fontSize: '1.1rem',
                        color: 'rgba(255,255,255,.35)',
                        transition: 'transform .2s',
                        transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)',
                        lineHeight: 1,
                        userSelect: 'none',
                      }}>
                        ▾
                      </span>
                    </div>

                    {/* MATERIALES DESPLEGADOS */}
                    {abierto && (
                      <div style={{
                        background: 'rgba(0,0,0,.08)',
                        borderRadius: '0 0 6px 6px',
                        overflow: 'hidden',
                      }}>
                        {cap.materiales.map((mat) => {
                          const tipoLabel = TIPO_LABEL[mat.tipo] || mat.tipo;

                          return (
                            <Link
                              key={mat.id}
                              href={`${config.rutaBase}/${mat.id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '.65rem 1.2rem',
                                textDecoration: 'none',
                                color: config.color,
                                fontFamily: 'var(--font-body)',
                                fontSize: '.82rem',
                                borderBottom: '1px solid rgba(0,0,0,.04)',
                                transition: 'background .15s',
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,0,0,.04)';
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                              }}
                            >
                              <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '.5rem',
                              }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: config.color,
                                  opacity: .4,
                                }} />
                                {tipoLabel}
                              </span>
                              <span style={{ fontSize: '.7rem', color: '#999' }}>→</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </EcosistemaAuthGuard>
  );
}
