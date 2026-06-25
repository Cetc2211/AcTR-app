'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useEcosistema } from '@/hooks/use-ecosistema';
import {
  cacheMaterial,
  getCachedMaterial,
  isMaterialCached,
} from '@/lib/ecosistema-storage';

interface MaterialReaderProps {
  titulo: string;
  claveMaterial: string;
  rutaFirestore: string;
  archivoRemoto?: string;
  colorEstacion?: string;
  rutaRegreso?: string;
  nombreEstacion?: string;
  solicitarUrlDescarga?: (claveMaterial: string) => Promise<string>;
}

type EstadoCarga = 'cargando' | 'cache_disponible' | 'listo' | 'error';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function MaterialReader({
  titulo,
  claveMaterial,
  rutaFirestore,
  archivoRemoto,
  colorEstacion,
  rutaRegreso,
  nombreEstacion,
  solicitarUrlDescarga,
}: MaterialReaderProps) {
  const { perfil } = useEcosistema();
  const esAdmin = perfil?.rol === 'admin';
  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  const [html, setHtml] = useState('');
  const [cacheDisponible, setCacheDisponible] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [descargando, setDescargando] = useState(false);
  const cacheDisponibleRef = useRef(false);

  const cargarMaterial = useCallback(async () => {
    if (!claveMaterial || !rutaFirestore) {
      return;
    }

    setEstado('cargando');
    setProgreso(0);

    try {
      const enCache = await isMaterialCached(claveMaterial);
      if (enCache) {
        const htmlCache = await getCachedMaterial(claveMaterial);
        if (htmlCache) {
          setHtml(htmlCache);
          setCacheDisponible(true);
          cacheDisponibleRef.current = true;
          setEstado('cache_disponible');
        }
      }

      setProgreso(35);
      const docRef = doc(db, rutaFirestore);
      const snapshot = await getDoc(docRef);
      setProgreso(70);

      if (!snapshot.exists()) {
        if (!solicitarUrlDescarga) {
          if (!cacheDisponibleRef.current) {
            setEstado('error');
          }
          return;
        }

        const url = await solicitarUrlDescarga(archivoRemoto || claveMaterial);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`No se pudo descargar el material (${response.status})`);
        }
        const htmlRemoto = await response.text();
        if (!htmlRemoto) {
          if (!cacheDisponibleRef.current) {
            setEstado('error');
          }
          return;
        }

        setHtml(htmlRemoto);
        setEstado('listo');
        await cacheMaterial(claveMaterial, htmlRemoto);
        setCacheDisponible(true);
        cacheDisponibleRef.current = true;
        setProgreso(100);
        return;
      }

      const data = snapshot.data() as {
        html?: string;
        contenido?: string;
        archivo?: string;
        nombreArchivo?: string;
        rutaArchivo?: string;
        storageFile?: string;
      };
      const htmlRemoto = data.html || data.contenido || '';
      if (!htmlRemoto) {
        if (solicitarUrlDescarga) {
          const archivoParaDescargar =
            data.archivo || data.nombreArchivo || data.rutaArchivo || data.storageFile || archivoRemoto || claveMaterial;
          const url = await solicitarUrlDescarga(archivoParaDescargar);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`No se pudo descargar el material (${response.status})`);
          }
          const htmlDesdeStorage = await response.text();
          if (!htmlDesdeStorage) {
            if (!cacheDisponibleRef.current) {
              setEstado('error');
            }
            return;
          }

          setHtml(htmlDesdeStorage);
          setEstado('listo');
          await cacheMaterial(claveMaterial, htmlDesdeStorage);
          setCacheDisponible(true);
          cacheDisponibleRef.current = true;
          setProgreso(100);
          return;
        }

        if (!cacheDisponibleRef.current) {
          setEstado('error');
        }
        return;
      }

      setHtml(htmlRemoto);
      setEstado('listo');
      await cacheMaterial(claveMaterial, htmlRemoto);
      setCacheDisponible(true);
      cacheDisponibleRef.current = true;
      setProgreso(100);
    } catch (error) {
      console.error('[MaterialReader] Error cargando material:', error);
      if (!cacheDisponibleRef.current) {
        setEstado('error');
      }
    }
  }, [archivoRemoto, claveMaterial, rutaFirestore, solicitarUrlDescarga]);

  useEffect(() => {
    void cargarMaterial();
  }, [cargarMaterial]);

  const srcDoc = useMemo(() => {
    const watermark = escapeHtml(perfil?.email || '');
    return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; }
      body {
        font-family: Georgia, serif;
        line-height: 1.65;
        color: #2b2b2b;
        padding: 1.25rem;
        user-select: none;
        -webkit-user-select: none;
      }
      .watermark {
        position: fixed;
        right: 12px;
        bottom: 12px;
        pointer-events: none;
        color: rgba(0, 0, 0, 0.15);
        font-size: 10px;
        font-family: monospace;
        z-index: 9999;
      }
    </style>
  </head>
  <body>
    <div class="watermark">${watermark}</div>
    ${html}
    <script>
      document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      document.addEventListener('selectstart', function (e) { e.preventDefault(); });
      document.addEventListener('copy', function (e) { e.preventDefault(); });
      document.addEventListener('cut', function (e) { e.preventDefault(); });
      document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && ['c', 'u', 'p', 's'].includes((e.key || '').toLowerCase())) {
          e.preventDefault();
        }
      });
    </script>
  </body>
</html>`;
  }, [html, perfil?.email]);

  function handleImprimir() {
    if (!html) return;

    // Limpiar iframe anterior si existe
    const previo = document.getElementById('print-frame');
    if (previo) previo.remove();

    const watermark = escapeHtml(perfil?.email || '');
    const printHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(titulo)}</title>
    <style>
      html, body { margin: 0; padding: 0; }
      body {
        font-family: Georgia, serif;
        line-height: 1.65;
        color: #2b2b2b;
        padding: 1.25rem;
      }
      .watermark {
        position: fixed;
        right: 12px;
        bottom: 12px;
        pointer-events: none;
        color: rgba(0, 0, 0, 0.15);
        font-size: 10px;
        font-family: monospace;
        z-index: 9999;
      }
      @media print {
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          padding: 0;
          background: white !important;
        }
        .watermark { display: none; }
        .no-print { display: none !important; }
        /* Evitar superposición de fondos y elementos posicionados */
        [style*="position: fixed"],
        [style*="position:fixed"],
        [style*="position: absolute"],
        [style*="position:absolute"] {
          position: static !important;
        }
        [style*="z-index"] {
          z-index: auto !important;
        }
        /* Fondos oscuros → texto legible */
        [style*="background"] {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        img, svg {
          max-width: 100% !important;
          page-break-inside: avoid;
        }
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }
        p, li, blockquote {
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="watermark">${watermark}</div>
    ${html}
  </body>
</html>`;

    // Crear iframe fresco cada vez
    const iframe = document.createElement('iframe');
    iframe.id = 'print-frame';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      return;
    }
    doc.open();
    doc.write(printHtml);
    doc.close();

    // Delay para que Safari/iOS renderice el contenido antes de imprimir
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('[MaterialReader] Error al imprimir:', e);
      }
      // Limpiar iframe después de imprimir
      setTimeout(() => {
        iframe.remove();
      }, 1000);
    }, 500);
  }

  async function handleDescargarOffline() {
    try {
      setDescargando(true);

      if (solicitarUrlDescarga) {
        const url = await solicitarUrlDescarga(claveMaterial);
        const response = await fetch(url);
        const htmlContent = await response.text();
        setHtml(htmlContent);
        await cacheMaterial(claveMaterial, htmlContent);
      } else if (html) {
        await cacheMaterial(claveMaterial, html);
      }

      setCacheDisponible(true);
      cacheDisponibleRef.current = true;
      if (estado === 'error' && html) {
        setEstado('listo');
      }
    } catch (error) {
      console.error('[MaterialReader] Error descargando material offline:', error);
    } finally {
      setDescargando(false);
    }
  }

  if (estado === 'cargando') {
    return (
      <div
        style={{
          padding: '3rem',
          fontFamily: 'var(--font-body)',
          color: 'var(--pardo)',
          textAlign: 'center',
        }}
      >
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
        <p>Cargando material...</p>
        {progreso > 0 && (
          <div
            style={{
              width: 220,
              height: 4,
              background: '#e8dcc8',
              borderRadius: 2,
              margin: '1rem auto',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progreso}%`,
                height: '100%',
                background: colorEstacion || 'var(--pardo)',
                borderRadius: 2,
                transition: 'width 0.3s',
              }}
            />
          </div>
        )}
        <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div
        style={{
          padding: '3rem',
          fontFamily: 'var(--font-body)',
          color: '#8b1a1a',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Error al cargar el material
        </p>
        <p style={{ color: '#707070', fontSize: '0.9rem', marginBottom: '1rem' }}>
          No se pudo obtener el contenido. Intenta de nuevo.
        </p>
        <button
          onClick={() => {
            setEstado('cargando');
            setProgreso(0);
            void cargarMaterial();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            background: '#8b1a1a',
            color: '#fdf8f0',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
          padding: '0.75rem 1rem',
          border: '1px solid #e8dcc8',
          borderRadius: 10,
          background: '#fdf8f0',
          marginBottom: '0.85rem',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#707070' }}>
            {nombreEstacion || 'Ecosistema'}
          </p>
          <h2
            style={{
              margin: '0.2rem 0 0',
              fontSize: '1rem',
              fontWeight: 700,
              color: colorEstacion || 'var(--pardo)',
            }}
          >
            {titulo}
          </h2>
          {cacheDisponible && (
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#059669' }}>
              Disponible offline
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {esAdmin && (
            <button
              onClick={handleImprimir}
              disabled={!html}
              title="Imprimir material (solo administrador)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                border: '1px solid #8b1a1a',
                borderRadius: 7,
                background: '#8b1a1a',
                color: '#fdf8f0',
                cursor: html ? 'pointer' : 'not-allowed',
                fontSize: '0.82rem',
                fontWeight: 600,
                opacity: html ? 1 : 0.5,
              }}
            >
              <Printer size={14} />
              Imprimir
            </button>
          )}

          <button
            onClick={() => void handleDescargarOffline()}
            disabled={descargando}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              border: '1px solid #d6c7b2',
              borderRadius: 7,
              background: '#fff',
              cursor: descargando ? 'not-allowed' : 'pointer',
              fontSize: '0.82rem',
            }}
          >
            <Download size={14} />
            {descargando ? 'Guardando...' : 'Guardar offline'}
          </button>

          {rutaRegreso && (
            <Link
              href={rutaRegreso}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: 7,
                background: '#f5ead8',
                color: colorEstacion || '#4a3728',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              Volver
            </Link>
          )}
        </div>
      </div>

      <iframe
        title={titulo}
        srcDoc={srcDoc}
        sandbox="allow-same-origin"
        style={{
          width: '100%',
          minHeight: '72vh',
          border: '1px solid #e8dcc8',
          borderRadius: 10,
          background: '#fff',
        }}
      />
    </div>
  );
}
