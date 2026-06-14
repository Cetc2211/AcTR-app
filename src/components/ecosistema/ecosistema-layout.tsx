'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  Cormorant_Garamond,
  Libre_Baskerville,
  Space_Mono,
} from 'next/font/google';
import EcosistemaAuthGuard from '@/components/ecosistema/ecosistema-auth-guard';
import EcosistemaNav from '@/components/ecosistema/ecosistema-nav';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['italic', 'normal'],
  variable: '--font-cormorant',
  display: 'swap',
});

const libre = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal'],
  variable: '--font-libre',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal'],
  variable: '--font-space',
  display: 'swap',
});

const ecosistemaCSS = `
  :root {
    --papel: #fdf8f0;
    --crema: #f5ead8;
    --pardo: #4a3728;
    --rojo-ln: #8b1a1a;
    --cs1: #4a2e10;
    --cs2: #1a1060;
    --cs3: #0a5040;
    --font-display: var(--font-cormorant), Georgia, serif;
    --font-body: var(--font-libre), Georgia, serif;
    --font-mono: var(--font-space), monospace;
    --ecosistema-bg: var(--papel);
    --ecosistema-fg: var(--pardo);
  }
`;

export default function EcosistemaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const esLogin = pathname === '/ecosistema/login';

  return (
    <div
      className={`${cormorant.variable} ${libre.variable} ${spaceMono.variable} min-h-screen`}
      style={{ backgroundColor: 'var(--papel)', color: 'var(--pardo)' }}
    >
      <style dangerouslySetInnerHTML={{ __html: ecosistemaCSS }} />
      {!esLogin && <EcosistemaNav />}
      <main
        style={{
          fontFamily: 'var(--font-body)',
          minHeight: esLogin ? 'auto' : 'calc(100vh - 3.5rem)',
          padding: esLogin ? 0 : '1.5rem',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {esLogin ? children : <EcosistemaAuthGuard>{children}</EcosistemaAuthGuard>}
      </main>
    </div>
  );
}