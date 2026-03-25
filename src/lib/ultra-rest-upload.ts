/**
 * ULTRA ROBUST REST UPLOAD SYSTEM
 * 
 * Sistema de subida que EVITA COMPLETAMENTE el Firebase SDK WebChannel.
 * Usa solo peticiones HTTP REST directas - mucho más estables para conexiones
 * intermitentes, firewalls y redes móviles.
 * 
 * CARACTERÍSTICAS:
 * - Micro-subidas de 1 item a la vez
 * - Confirmación de cada subida antes de continuar
 * - Reintentos con backoff exponencial
 * - Timeout adaptativo
 * - Progreso detallado
 */

import { auth } from '@/lib/firebase';
import { getIdToken } from 'firebase/auth';

const FIRESTORE_PROJECT_ID = 'academic-tracker-qeoxi';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

// Configuración conservadora para conexiones problemáticas
const REQUEST_TIMEOUT = 45000; // 45 segundos por petición
const MAX_RETRIES = 5; // Más reintentos
const BASE_DELAY = 2000; // 2 segundos base
const MAX_DELAY = 30000; // 30 segundos máximo

export interface UltraUploadResult {
    success: boolean;
    uploadedItems: number;
    totalItems: number;
    errors: string[];
    duration: number;
}

export interface ItemUploadResult {
    key: string;
    success: boolean;
    attempts: number;
    error?: string;
}

/**
 * Obtiene el token de autenticación actual
 */
async function getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
        console.error('❌ No hay usuario autenticado');
        return null;
    }
    
    try {
        const token = await getIdToken(user, false);
        return token;
    } catch (error) {
        console.error('❌ Error obteniendo token:', error);
        return null;
    }
}

/**
 * Espera un tiempo determinado con jitter
 */
function sleep(ms: number): Promise<void> {
    const jitter = Math.random() * 1000;
    return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

/**
 * Calcula delay para backoff exponencial
 */
function getBackoffDelay(attempt: number): number {
    const delay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
    return delay + Math.random() * 1000; // Jitter
}

/**
 * Convierte un valor JavaScript a formato Firestore REST API
 */
function toFirestoreValue(value: any): any {
    if (value === null || value === undefined) {
        return { nullValue: null };
    }
    if (typeof value === 'string') {
        return { stringValue: value };
    }
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return { integerValue: String(value) };
        }
        return { doubleValue: value };
    }
    if (typeof value === 'boolean') {
        return { booleanValue: value };
    }
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(v => toFirestoreValue(v))
            }
        };
    }
    if (typeof value === 'object' && value !== null) {
        if (value instanceof Date) {
            return { timestampValue: value.toISOString() };
        }
        
        const fields: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
            fields[key] = toFirestoreValue(val);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(value) };
}

/**
 * Realiza una petición HTTP con timeout
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`⏱️ Request timeout después de ${timeout}ms`);
    }, timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Timeout después de ${timeout / 1000}s`);
        }
        throw error;
    }
}

/**
 * Sube un solo documento via REST API con reintentos
 */
async function uploadSingleDocument(
    userId: string,
    key: string,
    data: any,
    attempt: number = 0
): Promise<{ success: boolean; attempts: number; error?: string }> {
    const token = await getAuthToken();
    if (!token) {
        return { success: false, attempts: attempt + 1, error: 'No autenticado' };
    }
    
    // Preparar payload
    const payload = {
        value: data,
        lastUpdated: Date.now()
    };
    
    // Convertir a formato Firestore
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
        fields[k] = toFirestoreValue(v);
    }
    
    const document = { fields };
    
    // URL del documento - usar PATCH para actualizar
    const url = `${FIRESTORE_BASE_URL}/users/${userId}/userData/${key}`;
    
    try {
        console.log(`📤 REST API: Subiendo ${key} (intento ${attempt + 1})...`);
        
        const response = await fetchWithTimeout(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(document)
        }, REQUEST_TIMEOUT);
        
        if (response.ok) {
            console.log(`✅ REST API: ${key} subido correctamente`);
            return { success: true, attempts: attempt + 1 };
        }
        
        // Error de servidor - reintentar
        if (response.status >= 500 && attempt < MAX_RETRIES - 1) {
            const delay = getBackoffDelay(attempt);
            console.warn(`⚠️ Error ${response.status}, reintentando en ${delay/1000}s...`);
            await sleep(delay);
            return uploadSingleDocument(userId, key, data, attempt + 1);
        }
        
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ REST API error ${response.status}:`, errorText.slice(0, 200));
        return { 
            success: false, 
            attempts: attempt + 1, 
            error: `HTTP ${response.status}` 
        };
        
    } catch (error: any) {
        // Error de red - reintentar
        if (attempt < MAX_RETRIES - 1) {
            const delay = getBackoffDelay(attempt);
            console.warn(`⚠️ Error de red: ${error.message}, reintentando en ${delay/1000}s...`);
            await sleep(delay);
            return uploadSingleDocument(userId, key, data, attempt + 1);
        }
        
        console.error(`❌ REST API exception:`, error.message);
        return { success: false, attempts: attempt + 1, error: error.message };
    }
}

/**
 * Verifica conexión REST
 */
export async function checkUltraRestConnection(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    const token = await getAuthToken();
    if (!token) {
        return { healthy: false, latency: 0, error: 'No autenticado' };
    }
    
    try {
        const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;
        
        const response = await fetchWithTimeout(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        }, 10000);
        
        const latency = Date.now() - startTime;
        
        // Cualquier respuesta del servidor indica que la red funciona
        return { healthy: true, latency };
        
    } catch (error: any) {
        const latency = Date.now() - startTime;
        return { healthy: false, latency, error: error.message };
    }
}

/**
 * Sube datos fragmentándolos en documentos pequeños
 * Cada fragmento se confirma antes de continuar con el siguiente
 */
export async function ultraChunkedUpload(
    userId: string,
    key: string,
    data: any,
    chunkSize: number = 30 * 1024, // 30KB por fragmento
    onProgress?: (current: number, total: number, status: string) => void
): Promise<ItemUploadResult> {
    console.log(`📦 Iniciando subida fragmentada REST de ${key}...`);
    
    // Serializar datos
    const jsonStr = JSON.stringify(data);
    const totalSize = jsonStr.length;
    
    console.log(`📊 Tamaño total: ${(totalSize / 1024).toFixed(1)} KB`);
    
    // Dividir en fragmentos
    const chunks: string[] = [];
    for (let i = 0; i < jsonStr.length; i += chunkSize) {
        chunks.push(jsonStr.slice(i, i + chunkSize));
    }
    
    console.log(`📊 Dividido en ${chunks.length} fragmentos`);
    
    // 1. Subir metadatos primero
    onProgress?.(0, chunks.length + 1, 'Subiendo metadatos...');
    
    const metaPayload = {
        totalChunks: chunks.length,
        totalSize,
        lastUpdated: Date.now(),
        originalKey: key,
        version: '3.0-ultra-rest'
    };
    
    const metaResult = await uploadSingleDocument(userId, `${key}_meta`, metaPayload);
    if (!metaResult.success) {
        return { 
            key, 
            success: false, 
            attempts: metaResult.attempts, 
            error: `Error subiendo metadatos: ${metaResult.error}` 
        };
    }
    
    console.log(`✅ Metadatos subidos`);
    
    // 2. Subir cada fragmento secuencialmente con confirmación
    let successfulChunks = 0;
    let totalAttempts = metaResult.attempts;
    
    for (let i = 0; i < chunks.length; i++) {
        onProgress?.(i + 1, chunks.length + 1, `Subiendo fragmento ${i + 1}/${chunks.length}...`);
        
        const chunkPayload = {
            index: i,
            data: chunks[i],
            totalChunks: chunks.length,
            lastUpdated: Date.now()
        };
        
        const chunkResult = await uploadSingleDocument(userId, `${key}_chunk_${i}`, chunkPayload);
        totalAttempts += chunkResult.attempts;
        
        if (chunkResult.success) {
            successfulChunks++;
            console.log(`✅ Fragmento ${i + 1}/${chunks.length} subido`);
        } else {
            console.error(`❌ Fragmento ${i + 1}/${chunks.length} falló: ${chunkResult.error}`);
            // Continuar con otros fragmentos aunque uno falle
        }
        
        // Pequeña pausa entre fragmentos para no sobrecargar
        await sleep(200);
    }
    
    // 3. Resultado final
    if (successfulChunks === chunks.length) {
        console.log(`✅ Todos los fragmentos subidos: ${chunks.length}`);
        onProgress?.(chunks.length + 1, chunks.length + 1, 'Completado');
        return { key, success: true, attempts: totalAttempts };
    } else if (successfulChunks > 0) {
        console.warn(`⚠️ Subida parcial: ${successfulChunks}/${chunks.length} fragmentos`);
        return { 
            key, 
            success: false, 
            attempts: totalAttempts, 
            error: `Solo ${successfulChunks}/${chunks.length} fragmentos subidos` 
        };
    } else {
        return { 
            key, 
            success: false, 
            attempts: totalAttempts, 
            error: 'Todos los fragmentos fallaron' 
        };
    }
}

/**
 * Sube un item con estrategia adaptativa
 * - Datos pequeños: subida directa
 * - Datos grandes: fragmentación
 */
export async function ultraUploadItem(
    userId: string,
    key: string,
    data: any,
    onProgress?: (status: string) => void
): Promise<ItemUploadResult> {
    const jsonStr = JSON.stringify(data);
    const sizeBytes = jsonStr.length;
    const sizeKB = sizeBytes / 1024;
    
    console.log(`📊 Preparando ${key}: ${sizeKB.toFixed(1)} KB`);
    
    // Verificar conexión primero
    const connection = await checkUltraRestConnection();
    console.log(`📡 Conexión REST: ${connection.healthy ? 'OK' : 'DEGRADADO'} (${connection.latency}ms)`);
    
    // Determinar estrategia basada en tamaño y conexión
    if (sizeKB < 50 && connection.healthy && connection.latency < 5000) {
        // Datos pequeños y conexión buena: subida directa
        onProgress?.(`Subiendo ${key}...`);
        return uploadSingleDocument(userId, key, data);
    } else {
        // Datos grandes o conexión lenta: fragmentación
        onProgress?.(`Fragmentando ${key}...`);
        return ultraChunkedUpload(userId, key, data, 30 * 1024, (c, t, s) => {
            onProgress?.(s);
        });
    }
}

/**
 * Sube múltiples items secuencialmente con progreso detallado
 * Este es el método principal para subir todos los datos
 */
export async function ultraUploadAll(
    userId: string,
    items: { key: string; data: any; name: string }[],
    onProgress?: (current: number, total: number, status: string) => void
): Promise<UltraUploadResult> {
    const startTime = Date.now();
    const results: ItemUploadResult[] = [];
    const errors: string[] = [];
    let uploadedItems = 0;
    
    console.log(`🚀 Iniciando subida ULTRA REST de ${items.length} items...`);
    
    // Verificar conexión inicial
    onProgress?.(0, items.length, 'Verificando conexión...');
    const connection = await checkUltraRestConnection();
    
    if (!connection.healthy) {
        console.warn(`⚠️ Conexión REST degradada: ${connection.error}`);
    }
    
    // Subir cada item secuencialmente
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        onProgress?.(i, items.length, `Subiendo ${item.name}...`);
        
        const result = await ultraUploadItem(userId, item.key, item.data, (status) => {
            onProgress?.(i, items.length, `${item.name}: ${status}`);
        });
        
        results.push(result);
        
        if (result.success) {
            uploadedItems++;
            console.log(`✅ ${item.name} subido (${i + 1}/${items.length})`);
        } else {
            const errorMsg = `${item.name}: ${result.error}`;
            errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
        }
        
        // Pausa entre items para no sobrecargar
        if (i < items.length - 1) {
            await sleep(500);
        }
    }
    
    const duration = Date.now() - startTime;
    console.log(`🎯 Subida completada: ${uploadedItems}/${items.length} en ${(duration / 1000).toFixed(1)}s`);
    
    onProgress?.(items.length, items.length, 'Completado');
    
    return {
        success: uploadedItems === items.length,
        uploadedItems,
        totalItems: items.length,
        errors,
        duration
    };
}

/**
 * Strips base64 photos from data to reduce size
 */
export function stripPhotos<T>(data: T): T {
    if (Array.isArray(data)) {
        return data.map(item => {
            if (item && typeof item === 'object') {
                const processed = { ...item };
                if ('photo' in processed && typeof processed.photo === 'string' && processed.photo.startsWith('data:')) {
                    delete (processed as any).photo;
                }
                // Also check students array in groups
                if ('students' in processed && Array.isArray(processed.students)) {
                    processed.students = processed.students.map((s: any) => {
                        if (s.photo?.startsWith('data:')) {
                            const { photo, ...rest } = s;
                            return rest;
                        }
                        return s;
                    });
                }
                return processed;
            }
            return item;
        }) as T;
    }
    return data;
}
