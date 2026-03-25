'use client';

import { Loader2 } from 'lucide-react';

export default function HomePage() {
  // This component now only shows a loader.
  // The redirection logic is handled by MainLayoutClient, which is more robust.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-4">Cargando...</span>
    </div>
  );
}
