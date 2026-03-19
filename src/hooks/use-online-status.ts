'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para detectar el estado de conexión a internet
 * Proporciona información sobre si el usuario está online u offline
 * y permite ejecutar callbacks cuando cambia el estado
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [wasOffline, setWasOffline] = useState<boolean>(false);

    // Detectar estado inicial
    useEffect(() => {
        // Verificar si estamos en el cliente
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
        }
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Si estuvimos offline, marcamos que recuperamos conexión
            if (wasOffline) {
                console.log('Conexión recuperada - sincronizando datos...');
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            console.log('Sin conexión - modo offline activado');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    // Función para ejecutar cuando se recupera la conexión
    const onReconnect = useCallback((callback: () => void) => {
        if (isOnline && wasOffline) {
            callback();
            setWasOffline(false);
        }
    }, [isOnline, wasOffline]);

    return {
        isOnline,
        isOffline: !isOnline,
        wasOffline,
        onReconnect
    };
}

export default useOnlineStatus;
