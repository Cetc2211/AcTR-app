import './globals.css';
import LayoutProvider from './layout-provider';

export const metadata = {
  title: 'Academic Tracker Pro',
  description: 'Gestiona el rendimiento académico de tus estudiantes con el poder de la IA.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#10b981" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <LayoutProvider>{children}</LayoutProvider>
    </html>
  );
}
