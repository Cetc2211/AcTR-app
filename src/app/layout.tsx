import type { Metadata } from "next";
import "./globals.css";
import LayoutProvider from "./layout-provider";

export const metadata: Metadata = {
  title: "Academic Tracker - Sistema de Seguimiento Académico",
  description: "Plataforma integral para el seguimiento académico, gestión de calificaciones, asistencia y reportes estudiantiles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <LayoutProvider>
        {children}
      </LayoutProvider>
    </html>
  );
}
