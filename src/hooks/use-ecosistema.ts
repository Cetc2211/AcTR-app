'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';

export interface EcosistemaAccessMap {
  estacion_cs1?: boolean;
  estacion_cs2?: boolean;
  estacion_cs3?: boolean;
  estacion_pfh1?: boolean;
  estacion_pfh2?: boolean;
  estacion_pfh3?: boolean;
  pfh1_estudiante?: boolean;
  pfh1_docente?: boolean;
  pfh2_estudiante?: boolean;
  pfh2_docente?: boolean;
  pfh3_estudiante?: boolean;
  pfh3_docente?: boolean;
  preview_cap1?: boolean;
  articulacion?: boolean;
  [key: string]: boolean | undefined;
}

export type EcosistemaAccesos = EcosistemaAccessMap;

export type EcosistemaRole =
  | 'lector_free'
  | 'lector_premium'
  | 'lector_institucional'
  | 'admin';

export interface EcosistemaUserProfile {
  nombre: string;
  email: string;
  rol: EcosistemaRole;
  accesos: EcosistemaAccessMap;
  fechaRegistro?: Timestamp;
  fechaExpiracion?: Timestamp;
  activo?: boolean;
}

const READABLE_ROLES: Record<EcosistemaRole, string> = {
  lector_free: 'Lector Free',
  lector_premium: 'Lector Premium',
  lector_institucional: 'Lector Institucional',
  admin: 'Administrador',
};

function getAdminAllowlist(): Set<string> {
  const raw =
    process.env.NEXT_PUBLIC_ECOSISTEMA_ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ECOSISTEMA_ADMIN_EMAIL ||
    '';

  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function useEcosistema() {
  const [user, authLoading, authError] = useAuthState(auth);
  const firebaseUser = (user ?? null) as FirebaseUser | null;
  const adminAllowlist = useMemo(() => getAdminAllowlist(), []);

  const [perfil, setPerfil] = useState<EcosistemaUserProfile | null>(null);
  const [perfilCargando, setPerfilCargando] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (!firebaseUser) {
      setPerfil(null);
      setPerfilCargando(false);
      setError(null);
      return;
    }

    setPerfilCargando(true);
    const profileRef = doc(db, 'ecosistema_usuarios', firebaseUser.uid);

    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPerfil(snapshot.data() as EcosistemaUserProfile);
        } else {
          const email = (firebaseUser.email || '').toLowerCase().trim();
          if (email && adminAllowlist.has(email)) {
            // Fallback de pruebas: permite acceso admin por correo sin documento en ecosistema_usuarios.
            setPerfil({
              nombre: firebaseUser.displayName || 'Administrador',
              email,
              rol: 'admin',
              accesos: {
                estacion_cs1: true,
                estacion_cs2: true,
                estacion_cs3: true,
                estacion_pfh1: true,
                estacion_pfh2: true,
                estacion_pfh3: true,
                pfh1_docente: true,
                pfh2_docente: true,
                pfh3_docente: true,
                pfh1_estudiante: true,
                pfh2_estudiante: true,
                pfh3_estudiante: true,
                preview_cap1: true,
                articulacion: true,
              },
              activo: true,
            });
          } else {
            setPerfil(null);
          }
        }

        setPerfilCargando(false);
        setError(null);
      },
      (snapshotError) => {
        console.error('[useEcosistema] Error en onSnapshot:', snapshotError);
        setError(snapshotError);
        setPerfilCargando(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, refreshNonce, adminAllowlist]);

  const tieneAcceso = useCallback(
    (clave: string): boolean => {
      if (!perfil?.accesos) {
        return false;
      }

      return perfil.accesos[clave] === true;
    },
    [perfil]
  );

  const suscripcionExpirada = useMemo(() => {
    const expirationDate = perfil?.fechaExpiracion?.toDate();
    if (!expirationDate) {
      return false;
    }

    return expirationDate < new Date();
  }, [perfil]);

  const rolLegible = useMemo(() => {
    if (!perfil?.rol) {
      return 'Sin rol';
    }

    return READABLE_ROLES[perfil.rol] || perfil.rol;
  }, [perfil]);

  const recargarPerfil = useCallback(() => {
    setPerfilCargando(true);
    setRefreshNonce((current) => current + 1);
  }, []);

  return {
    user: firebaseUser,
    perfil,
    cargando: authLoading || perfilCargando,
    tieneAcceso,
    estaAutenticado: Boolean(firebaseUser),
    suscripcionExpirada,
    error: error || authError || null,
    recargarPerfil,
    rolLegible,
  };
}