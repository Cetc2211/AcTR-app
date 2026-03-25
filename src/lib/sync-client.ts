/**
 * SYNC CLIENT - Sistema de sincronización V3 ULTRA ROBUSTO
 * 
 * Este módulo proporciona sincronización con Firebase usando SOLO REST API.
 * EVITA COMPLETAMENTE el WebChannel del SDK que causa problemas en conexiones inestables.
 * 
 * Estrategia:
 * 1. REST API directo (sin pasar por backend intermedio)
 * 2. Micro-subidas de un item a la vez
 * 3. Confirmación antes de continuar
 */

import { 
    ultraUploadItem, 
    ultraUploadAll, 
    checkUltraRestConnection, 
    stripPhotos,
    type UltraUploadResult,
    type ItemUploadResult
} from './ultra-rest-upload';

export interface SyncResult {
    success: boolean;
    method: 'rest' | 'rest-chunked' | 'failed';
    error?: string;
    duration?: number;
}

/**
 * Sube datos usando REST API directamente
 * EVITA el SDK WebChannel completamente
 */
export async function robustUpload<T>(
    userId: string,
    key: string,
    data: T,
    onProgress?: (status: string) => void
): Promise<SyncResult> {
    const startTime = Date.now();
    
    console.log(`📤 [robustUpload] Iniciando subida de ${key}...`);
    
    // Verificar conexión REST
    const connection = await checkUltraRestConnection();
    console.log(`📡 Conexión REST: ${connection.healthy ? 'OK' : 'DEGRADADO'} (${connection.latency}ms)`);
    
    // Strip photos if data is large
    const jsonStr = JSON.stringify(data);
    const sizeKB = jsonStr.length / 1024;
    
    let processedData = data;
    if (sizeKB > 100) {
        console.log(`📊 ${key} es grande (${sizeKB.toFixed(1)} KB), optimizando...`);
        processedData = stripPhotos(data);
        const newSizeKB = JSON.stringify(processedData).length / 1024;
        console.log(`📊 Optimizado: ${newSizeKB.toFixed(1)} KB`);
    }
    
    // Usar ultra-upload REST
    const result = await ultraUploadItem(userId, key, processedData, onProgress);
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
        console.log(`✅ [robustUpload] ${key} subido en ${duration}ms (${result.attempts} intentos)`);
        return {
            success: true,
            method: 'rest',
            duration
        };
    }
    
    console.error(`❌ [robustUpload] ${key} falló después de ${result.attempts} intentos: ${result.error}`);
    return {
        success: false,
        method: 'failed',
        error: result.error,
        duration
    };
}

/**
 * Sube múltiples documentos secuencialmente
 */
export async function batchUpload(
    items: { key: string; data: any; lastUpdated: number; name?: string }[],
    onProgress?: (current: number, total: number, status: string) => void
): Promise<{ success: boolean; succeeded: number; failed: number; results: any[] }> {
    
    const userId = items[0]?.data?.userId;
    
    // Obtener userId del contexto actual
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    
    if (!user) {
        return { success: false, succeeded: 0, failed: items.length, results: [] };
    }
    
    // Preparar items para ultra-upload
    const uploadItems = items.map(item => ({
        key: item.key,
        data: item.data,
        name: item.name || item.key
    }));
    
    // Usar ultra-upload
    const result = await ultraUploadAll(user.uid, uploadItems, onProgress);
    
    return {
        success: result.success,
        succeeded: result.uploadedItems,
        failed: result.totalItems - result.uploadedItems,
        results: result.errors.map(e => ({ error: e }))
    };
}

/**
 * Verifica si la conexión a Firebase está funcional
 */
export async function checkFirebaseHealth(): Promise<{ 
    sdk: boolean; 
    backend: boolean; 
    latency: number;
}> {
    const startTime = Date.now();
    const result = { sdk: false, backend: false, latency: 0 };
    
    // Test REST connection (no SDK)
    const restConnection = await checkUltraRestConnection();
    result.backend = restConnection.healthy;
    result.latency = restConnection.latency;
    
    // SDK no se usa, marcar como false
    result.sdk = false;
    
    return result;
}

// Re-export types
export type { UltraUploadResult, ItemUploadResult };
