'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Role = 'Clinico' | 'Orientador' | 'loading' | 'unauthenticated' | null;

interface SessionContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('loading');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem('userRole') as Role;
      if (storedRole && (storedRole === 'Clinico' || storedRole === 'Orientador')) {
        setRole(storedRole);
      } else {
        setRole('unauthenticated');
      }
    } catch (error) {
      // If localStorage is not available (e.g., in SSR),
      // it remains 'unauthenticated' or 'loading'.
      setRole('unauthenticated');
    }
  }, []);

  useEffect(() => {
    // If not authenticated and not on the home page, redirect to home.
    if (role === 'unauthenticated' && pathname !== '/') {
        router.replace('/');
    }
  }, [role, pathname, router]);

  const handleSetRole = (newRole: Role) => {
    if (newRole) {
      if(newRole !== 'unauthenticated' && newRole !== 'loading'){
        localStorage.setItem('userRole', newRole);
      } else {
        localStorage.removeItem('userRole');
      }
    }
    setRole(newRole);
  };

  const value = { role, setRole: handleSetRole as (role: Role) => void };
  
  // Show a generic loader if the session is still loading on any protected page.
  if (role === 'loading' && pathname !== '/') {
    return (
        <div className="flex h-screen w-full items-center justify-center p-8">
            <div className="flex items-center gap-2 text-xl text-gray-600">
                Cargando Sesión...
            </div>
        </div>
    );
  }
  
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
