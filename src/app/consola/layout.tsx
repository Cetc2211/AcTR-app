import type { Metadata } from "next";
import "../globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Consola de Evaluación - PIGEC-130",
  description: "Entorno de aplicación clínica presencial.",
};

export default function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
