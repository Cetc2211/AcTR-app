'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EcosistemaAuthGuard from '@/components/ecosistema/ecosistema-auth-guard';
import EstacionCard from '@/components/ecosistema/estacion-card';
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

type TipoMaterial = 'libro' | 'articulo' | 'ensayo' | 'curso';

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

export default function PaginaEstacion({ config }: { config: ConfigEstacion }) {
  const { tieneAcceso } = useEcosistema();
  const [materiales, setMateriales] = useState<MaterialItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function cargarMateriales() {
      try {
        console.log('[PaginaEstacion] Iniciando carga de materiales');
        console.log('[PaginaEstacion] Colección Firestore:', config.coleccionFirestore);
        const snapshot = await getDocs(collection(db, config.coleccionFirestore));
        console.log('[PaginaEstacion] Documentos recibidos de Firestore:', snapshot.size);
        snapshot.docs.forEach((d) => {
          console.log('[PaginaEstacion] Doc ID:', d.id, '| Datos:', JSON.stringify(d.data()));
        });
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
        console.log('[PaginaEstacion] Items mapeados:', items.length);
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

  return (
    <EcosistemaAuthGuard accesoRequerido={config.claveAcceso}>
      <div style={{ padding: '2rem 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link
            href="/ecosistema"
            style={{
              fontSize: '0.85rem',
              color: config.color,
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
            }}
          >
            &larr; Biblioteca
          </Link>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.2rem',
              fontWeight: 700,
              color: config.color,
              margin: '0.5rem 0 0',
            }}
          >
            {config.nombre}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              color: '#707070',
              margin: '0.25rem 0 0',
            }}
          >
            Estacion {config.numeroRomano}
          </p>
        </div>

        {cargando ? (
          <p style={{ fontFamily: 'var(--font-body)', color: '#999' }}>
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
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
                  Posibles causas: los documentos no tienen el campo <code>orden</code> (requerido por la consulta), la colección tiene otro nombre, o las reglas de Firestore bloquean la lectura.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {materiales.map((material) => (
              <EstacionCard
                key={material.id}
                titulo={material.titulo}
                subtitulo={material.subtitulo}
                tipo={material.tipo}
                href={`${config.rutaBase}/${material.id}`}
                claveCache={`${config.id}_${material.id}`}
                tieneAcceso={tieneAcceso(config.claveAcceso)}
                numero={material.orden}
                colorEstacion={config.color}
              />
            ))}
          </div>
        )}
      </div>
    </EcosistemaAuthGuard>
  );
}