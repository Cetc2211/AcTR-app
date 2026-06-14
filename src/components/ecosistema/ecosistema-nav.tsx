'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {
  BookOpen,
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  User,
  X,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useEcosistema } from '@/hooks/use-ecosistema';
import { useOnlineStatus } from '@/hooks/use-online-status';

/* ─── Tipos ────────────────────────────────────────────────────── */

type EstacionLink = {
  id: string;
  href: string;
  label: string;
  nombre: string;
  color: string;
};

type DocumentoLink = {
  id: string;
  nombre: string;
  url: string;
  color: string;
};

type SeccionDisciplina = {
  titulo: string;
  estaciones: EstacionLink[];
  documentos?: DocumentoLink[];
};

/* ─── Datos del menú ───────────────────────────────────────────── */

const SECCIONES: SeccionDisciplina[] = [
  {
    titulo: 'Ciencias Sociales',
    estaciones: [
      { id: 'cs1', href: '/ecosistema/cs1', label: 'CS I', nombre: 'Ciencias Sociales I', color: '#4a2e10' },
      { id: 'cs2', href: '/ecosistema/cs2', label: 'CS II', nombre: 'Ciencias Sociales II', color: '#1a1060' },
      { id: 'cs3', href: '/ecosistema/cs3', label: 'CS III', nombre: 'Ciencias Sociales III', color: '#0a5040' },
    ],
    documentos: [
      {
        id: 'art-cs1',
        nombre: 'Art. Curricular CS1',
        url: 'https://letrasnecias.com/wp-content/uploads/2026/06/Articulacion-Pedagogica-TrilogiaRaizDigital.pdf',
        color: '#4a2e10',
      },
    ],
  },
  {
    titulo: 'Pensamiento Filosófico',
    estaciones: [
      { id: 'pfh1', href: '/ecosistema/pfh1', label: 'PFH I', nombre: 'P. Filosófico y Humanidades I', color: '#1a1440' },
      { id: 'pfh2', href: '/ecosistema/pfh2', label: 'PFH II', nombre: 'P. Filosófico y Humanidades II', color: '#2a1a50' },
      { id: 'pfh3', href: '/ecosistema/pfh3', label: 'PFH III', nombre: 'P. Filosófico y Humanidades III', color: '#3a2060' },
    ],
  },
];

const SIDEBAR_WIDTH = 260;

/* ─── Componente ───────────────────────────────────────────────── */

export default function EcosistemaNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { perfil, estaAutenticado, rolLegible } = useEcosistema();
  const { isOnline } = useOnlineStatus();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({});

  // Cerrar sidebar y dropdown al navegar
  useEffect(() => {
    setSidebarAbierto(false);
    setDropdownAbierto(false);
  }, [pathname]);

  // Abrir automáticamente la sección que contiene la estación activa
  const seccionesIniciales = useMemo(() => {
    const estado: Record<string, boolean> = {};
    for (const seccion of SECCIONES) {
      const tieneActiva = seccion.estaciones.some((e) =>
        pathname.startsWith(e.href)
      );
      if (tieneActiva) estado[seccion.titulo] = true;
    }
    return estado;
  }, [pathname]);

  useEffect(() => {
    setSeccionesAbiertas(seccionesIniciales);
  }, [seccionesIniciales]);

  function toggleSeccion(titulo: string) {
    setSeccionesAbiertas((prev) => ({ ...prev, [titulo]: !prev[titulo] }));
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace('/ecosistema/login');
    } catch (error) {
      console.error('[EcosistemaNav] Error al cerrar sesion:', error);
    }
  }

  /* ─── Sidebar contenido (reutilizado en desktop y mobile) ────── */

  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--font-body)',
        padding: '1rem 0',
      }}
    >
      {/* Botón cerrar (solo mobile) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '0 1rem 0.75rem',
        }}
        className="lg:hidden"
      >
        <button
          onClick={() => setSidebarAbierto(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--pardo)',
          }}
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      </div>

      {/* Link Biblioteca */}
      <Link
        href="/ecosistema"
        onClick={() => setSidebarAbierto(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.65rem 1.25rem',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: pathname === '/ecosistema' ? 600 : 400,
          color: pathname === '/ecosistema' ? 'var(--rojo-ln)' : 'var(--pardo)',
          background: pathname === '/ecosistema' ? '#f5ead8' : 'transparent',
          borderRight: pathname === '/ecosistema' ? '3px solid var(--rojo-ln)' : '3px solid transparent',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <BookOpen size={16} />
        Biblioteca
      </Link>

      {/* Separador */}
      <div
        style={{
          height: 1,
          background: '#e8dcc8',
          margin: '0.75rem 1.25rem',
        }}
      />

      {/* Secciones por disciplina */}
      {SECCIONES.map((seccion) => {
        const abierta = seccionesAbiertas[seccion.titulo] ?? false;
        const tieneActiva = seccion.estaciones.some((e) =>
          pathname.startsWith(e.href)
        );

        return (
          <div key={seccion.titulo} style={{ marginBottom: '0.25rem' }}>
            {/* Encabezado de sección */}
            <button
              onClick={() => toggleSeccion(seccion.titulo)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.55rem 1.25rem',
                background: tieneActiva ? '#f5ead8' : 'transparent',
                border: 'none',
                borderRight: tieneActiva ? '3px solid var(--rojo-ln)' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: tieneActiva ? 'var(--pardo)' : '#808080',
                fontFamily: 'var(--font-body)',
                transition: 'background 0.15s',
              }}
            >
              <span>{seccion.titulo}</span>
              <ChevronDown
                size={14}
                style={{
                  transform: abierta ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>

            {/* Estaciones de la sección */}
            {abierta && (
              <div>
                {seccion.estaciones.map((est) => {
                  const activa = pathname.startsWith(est.href);
                  return (
                    <Link
                      key={est.id}
                      href={est.href}
                      onClick={() => setSidebarAbierto(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.5rem 1.25rem 0.5rem 1.75rem',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: activa ? 600 : 400,
                        color: activa ? est.color : '#707070',
                        background: activa ? '#f5ead8' : 'transparent',
                        borderRight: activa
                          ? `3px solid ${est.color}`
                          : '3px solid transparent',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                    >
                      {/* Indicador de color */}
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: est.color,
                          display: 'inline-block',
                          flexShrink: 0,
                          opacity: activa ? 1 : 0.5,
                        }}
                      />
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {est.nombre}
                      </span>
                    </Link>
                  );
                })}

                {/* Documentos complementarios (ej. articulación curricular) */}
                {seccion.documentos && seccion.documentos.length > 0 && (
                  <>
                    <div
                      style={{
                        height: 1,
                        background: '#e8dcc8',
                        margin: '0.4rem 1.75rem 0.35rem',
                      }}
                    />
                    {seccion.documentos.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setSidebarAbierto(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.45rem 1.25rem 0.45rem 1.75rem',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: '#707070',
                          transition: 'color 0.15s',
                        }}
                      >
                        <FileText
                          size={13}
                          style={{ flexShrink: 0, color: doc.color, opacity: 0.7 }}
                        />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {doc.nombre}
                        </span>
                      </a>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Espaciador flexible */}
      <div style={{ flex: 1 }} />

      {/* Indicador online/offline */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          fontSize: '0.7rem',
          color: isOnline ? '#059669' : '#d97706',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isOnline ? '#059669' : '#d97706',
            display: 'inline-block',
          }}
        />
        {isOnline ? 'Online' : 'Offline'}
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Barra superior ─────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#fdf8f0',
          borderBottom: '1px solid #e8dcc8',
          padding: '0 1.5rem',
          height: '3.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Botón hamburguesa para abrir sidebar */}
          <button
            onClick={() => setSidebarAbierto((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--pardo)',
              padding: 4,
            }}
            aria-label={sidebarAbierto ? 'Cerrar menú' : 'Abrir menú'}
          >
            {sidebarAbierto ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link
            href="/ecosistema"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #8b1a1a, #4a3728)',
                borderRadius: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#fdf8f0',
                fontFamily: 'var(--font-display)',
              }}
            >
              LN
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--pardo)',
              }}
            >
              Letras Necias
            </span>
          </Link>
        </div>

        {/* Menú usuario */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {estaAutenticado && perfil && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownAbierto((current) => !current)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--pardo)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <User size={16} />
                <span
                  style={{
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {perfil.nombre}
                </span>
                <ChevronDown size={14} />
              </button>

              {dropdownAbierto && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    background: '#fdf8f0',
                    border: '1px solid #e8dcc8',
                    borderRadius: 8,
                    padding: '0.5rem',
                    minWidth: 180,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                      color: '#808080',
                    }}
                  >
                    {perfil.email}
                  </div>
                  <div
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.7rem',
                      color: '#8b1a1a',
                      fontWeight: 600,
                    }}
                  >
                    {rolLegible}
                  </div>
                  <hr
                    style={{
                      border: 'none',
                      borderTop: '1px solid #e8dcc8',
                      margin: '0.5rem 0',
                    }}
                  />
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      color: '#8b1a1a',
                      fontFamily: 'var(--font-body)',
                      borderRadius: 4,
                    }}
                  >
                    <LogOut size={14} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ─── Sidebar overlay (mobile) ──────────────────────────── */}
      {sidebarAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: '3.5rem',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 40,
          }}
          className="lg:hidden"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      {/* ─── Sidebar ───────────────────────────────────────────── */}
      <aside
        style={{
          position: 'fixed',
          top: '3.5rem',
          left: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          background: '#fdf8f0',
          borderRight: '1px solid #e8dcc8',
          overflowY: 'auto',
          zIndex: 45,
          transform: sidebarAbierto ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: sidebarAbierto ? '2px 0 8px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

/* ─── Exportar ancho del sidebar para que el layout lo use ─────── */
export { SIDEBAR_WIDTH };
