'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useEcosistema } from '@/hooks/use-ecosistema';
import { useOnlineStatus } from '@/hooks/use-online-status';

type NavLink = {
  href: string;
  label: string;
  color?: string;
  active: boolean;
};

export default function EcosistemaNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { perfil, estaAutenticado, rolLegible } = useEcosistema();
  const { isOnline } = useOnlineStatus();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
    setDropdownAbierto(false);
  }, [pathname]);

  const navLinks = useMemo<NavLink[]>(
    () => [
      { href: '/ecosistema', label: 'Biblioteca', active: pathname === '/ecosistema' },
      {
        href: '/ecosistema/cs1',
        label: 'CS-I',
        color: '#4a2e10',
        active: pathname.startsWith('/ecosistema/cs1'),
      },
      {
        href: '/ecosistema/cs2',
        label: 'CS-II',
        color: '#1a1060',
        active: pathname.startsWith('/ecosistema/cs2'),
      },
      {
        href: '/ecosistema/cs3',
        label: 'CS-III',
        color: '#0a5040',
        active: pathname.startsWith('/ecosistema/cs3'),
      },
    ],
    [pathname]
  );

  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace('/ecosistema/login');
    } catch (error) {
      console.error('[EcosistemaNav] Error al cerrar sesion:', error);
    }
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#fdf8f0',
        borderBottom: '1px solid #e8dcc8',
        padding: '0 1.5rem',
        height: '4.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #8b1a1a, #4a3728)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
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
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--pardo)',
            }}
          >
            Letras Necias
          </span>
        </Link>

        <span
          style={{
            fontSize: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: isOnline ? '#059669' : '#d97706',
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
        </span>
      </div>

      <div className="hidden items-center gap-1 md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 6,
              fontSize: '0.85rem',
              fontWeight: link.active ? 600 : 400,
              color: link.active ? link.color || '#8b1a1a' : '#707070',
              background: link.active ? '#f5ead8' : 'transparent',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

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
                <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#808080' }}>
                  {perfil.email}
                </div>
                <div style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem', color: '#8b1a1a', fontWeight: 600 }}>
                  {rolLegible}
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #e8dcc8', margin: '0.5rem 0' }} />
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
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setMenuAbierto((current) => !current)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--pardo)',
          }}
          className="md:hidden"
          aria-label={menuAbierto ? 'Cerrar menu' : 'Abrir menu'}
        >
          {menuAbierto ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuAbierto && (
        <div
          style={{
            position: 'fixed',
            top: '4.25rem',
            left: 0,
            right: 0,
            background: '#fdf8f0',
            borderBottom: '1px solid #e8dcc8',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 49,
            fontFamily: 'var(--font-body)',
          }}
          className="md:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuAbierto(false)}
              style={{
                padding: '0.5rem 0',
                fontSize: '1rem',
                fontWeight: link.active ? 600 : 400,
                color: link.active ? link.color || '#8b1a1a' : '#707070',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              color: '#8b1a1a',
              fontFamily: 'var(--font-body)',
            }}
          >
            <LogOut size={16} />
            Cerrar sesion
          </button>
        </div>
      )}
    </nav>
  );
}