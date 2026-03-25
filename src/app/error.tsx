'use client'; // Los componentes de error deben ser componentes de cliente

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registrar el error en un servicio de monitoreo
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="max-w-lg text-center bg-white p-10 rounded-lg shadow-lg border border-red-200">
        <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-3xl font-extrabold text-gray-800 mb-2">
          Ocurrió un Error Inesperado
        </h2>
        <p className="text-gray-600 mb-6">
          Algo no funcionó como se esperaba. Por favor, intente recargar la página.
        </p>
        <Button
          onClick={
            // Intenta recuperarte volviendo a renderizar el segmento de ruta
            () => reset()
          }
          className="bg-red-600 hover:bg-red-700 text-white font-bold"
        >
          Intentar de Nuevo
        </Button>
      </div>
    </div>
  );
}
