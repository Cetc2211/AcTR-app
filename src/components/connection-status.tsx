'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
    syncStatus?: 'synced' | 'pending' | 'syncing';
    showLabel?: boolean;
    compact?: boolean;
}

/**
 * Componente que muestra el estado de conexión a internet y sincronización
 * 
 * @param syncStatus - Estado de sincronización con la nube
 * @param showLabel - Mostrar etiqueta de texto junto al ícono
 * @param compact - Modo compacto para espacios reducidos
 */
export function ConnectionStatus({ 
    syncStatus = 'synced', 
    showLabel = false,
    compact = false 
}: ConnectionStatusProps) {
    const { isOnline, isOffline, wasOffline } = useOnlineStatus();

    // Modo compacto: solo un punto de color
    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            isOnline ? "bg-green-500" : "bg-red-500",
                            isOnline && syncStatus === 'pending' && "bg-yellow-500 animate-pulse"
                        )} />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">
                            {isOnline ? 'Conectado' : 'Sin conexión'}
                            {isOnline && syncStatus === 'pending' && ' - Sincronizando...'}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Sin conexión - Banner prominente
    if (isOffline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
                <WifiOff className="h-4 w-4" />
                <span>Sin conexión a internet - Los cambios se guardarán localmente</span>
            </div>
        );
    }

    // Recuperación de conexión
    if (wasOffline && isOnline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 animate-pulse">
                <Cloud className="h-4 w-4" />
                <span>Conexión recuperada - Sincronizando datos...</span>
            </div>
        );
    }

    // Indicador de estado normal
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "gap-1.5 cursor-default",
                            syncStatus === 'pending' && "border-yellow-500 text-yellow-600 bg-yellow-50",
                            syncStatus === 'syncing' && "border-blue-500 text-blue-600 bg-blue-50",
                            syncStatus === 'synced' && "border-green-500 text-green-600 bg-green-50"
                        )}
                    >
                        {syncStatus === 'syncing' ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : syncStatus === 'pending' ? (
                            <CloudOff className="h-3 w-3" />
                        ) : (
                            <Cloud className="h-3 w-3" />
                        )}
                        {showLabel && (
                            <span className="text-xs">
                                {syncStatus === 'syncing' ? 'Sincronizando' : 
                                 syncStatus === 'pending' ? 'Pendiente' : 'Sincronizado'}
                            </span>
                        )}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs">
                        {syncStatus === 'syncing' ? 'Sincronizando con la nube...' :
                         syncStatus === 'pending' ? 'Cambios pendientes de sincronizar' :
                         'Todos los cambios sincronizados'}
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default ConnectionStatus;
