/**
 * Firestore REST API Client
 * 
 * Alternativa al SDK de Firebase que usa HTTP REST en lugar de WebSockets.
 * Más tolerante a conexiones intermitentes, firewalls y redes móviles.
 * 
 * Usado cuando el SDK de Firebase tiene problemas de conexión (iPad en escuelas).
 */

import { auth } from '@/lib/firebase';
import { getIdToken } from 'firebase/auth';

const FIRESTORE_PROJECT_ID = 'academic-tracker-qeoxi';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

// Configuración
const REQUEST_TIMEOUT = 30000; // 30 segundos
const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 5000, 10000]; // 2s, 5s, 10s

/**
 * Obtiene el token de autenticación actual
 */
async function getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
        return null;
    }
    
    try {
        const token = await getIdToken(user, false);
        return token;
    } catch (error) {
        console.error('Error obteniendo token:', error);
        return null;
    }
}

/**
 * Espera un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
        // Verificar si es un Date
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
 * Parsea un valor de Firestore a JavaScript
 */
function parseFirestoreValue(value: any): any {
    if (!value) return null;
    
    if ('nullValue' in value) return null;
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return parseInt(value.integerValue, 10);
    if ('doubleValue' in value) return value.doubleValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('timestampValue' in value) return new Date(value.timestampValue);
    
    if ('arrayValue' in value) {
        return (value.arrayValue.values || []).map(parseFirestoreValue);
    }
    
    if ('mapValue' in value) {
        const result: any = {};
        const fields = value.mapValue.fields || {};
        for (const [k, v] of Object.entries(fields)) {
            result[k] = parseFirestoreValue(v);
        }
        return result;
    }
    
    return null;
}

/**
 * Realiza una petición HTTP con timeout y reintentos
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout = REQUEST_TIMEOUT
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Realiza una petición con reintentos automáticos
 */
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retryCount = 0
): Promise<Response> {
    try {
        const response = await fetchWithTimeout(url, options);
        
        // Éxito
        if (response.ok) {
            return response;
        }
        
        // Error de servidor - reintentar
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
            console.warn(`⚠️ REST API error ${response.status}, reintentando...`);
            await sleep(RETRY_DELAYS[retryCount]);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        
        return response;
        
    } catch (error: any) {
        // Error de red - reintentar
        if (retryCount < MAX_RETRIES) {
            console.warn(`⚠️ Error de red REST, reintentando... (${retryCount + 1}/${MAX_RETRIES})`);
            await sleep(RETRY_DELAYS[retryCount]);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        throw error;
    }
}

/**
 * Verifica la conexión REST
 */
export async function checkRestConnection(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    const token = await getAuthToken();
    if (!token) {
        return { healthy: false, latency: 0, error: 'No autenticado' };
    }
    
    try {
        // Usar el endpoint de documentos para verificar conexión
        // No creamos nada, solo intentamos leer
        const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;
        
        const response = await fetchWithTimeout(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        }, 10000); // 10 segundos para health check
        
        const latency = Date.now() - startTime;
        
        // Cualquier respuesta indica que el servidor está accesible
        return { healthy: true, latency };
        
    } catch (error: any) {
        const latency = Date.now() - startTime;
        return { healthy: false, latency, error: error.message || 'Connection failed' };
    }
}

/**
 * Sube un documento a Firestore via REST API
 */
export async function uploadViaRest(
    userId: string,
    key: string,
    data: any
): Promise<{ success: boolean; error?: string }> {
    const token = await getAuthToken();
    if (!token) {
        return { success: false, error: 'No autenticado' };
    }
    
    // Preparar payload
    const payload = {
        value: data,
        lastUpdated: Date.now()
    };
    
    // Convertir a formato Firestore
    const fields: Record<string, any> = {};
    for (const [key, value] of Object.entries(payload)) {
        fields[key] = toFirestoreValue(value);
    }
    
    const document = { fields };
    
    // URL del documento
    const url = `${FIRESTORE_BASE_URL}/users/${userId}/userData/${key}`;
    
    try {
        const response = await fetchWithRetry(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(document)
        });
        
        if (response.ok) {
            console.log(`✅ REST API: ${key} subido correctamente`);
            return { success: true };
        } else {
            const errorText = await response.text();
            console.error(`❌ REST API error: ${response.status}`, errorText.slice(0, 200));
            return { success: false, error: `HTTP ${response.status}` };
        }
        
    } catch (error: any) {
        console.error(`❌ REST API exception:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Descarga un documento via REST API
 */
export async function downloadViaRest<T>(
    userId: string,
    key: string
): Promise<{ data: T | null; error?: string }> {
    const token = await getAuthToken();
    if (!token) {
        return { data: null, error: 'No autenticado' };
    }
    
    const url = `${FIRESTORE_BASE_URL}/users/${userId}/userData/${key}`;
    
    try {
        const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        
        if (response.ok) {
            const doc = await response.json();
            const fields = doc.fields || {};
            const value = parseFirestoreValue(fields.value);
            return { data: value as T };
        } else if (response.status === 404) {
            return { data: null };
        } else {
            return { data: null, error: `HTTP ${response.status}` };
        }
        
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

/**
 * Sube datos fragmentados via REST API
 */
export async function uploadChunkedViaRest(
    userId: string,
    key: string,
    data: any,
    chunkSize: number = 50 * 1024, // 50KB por defecto
    onProgress?: (current: number, total: number, status: string) => void
): Promise<{ success: boolean; error?: string }> {
    const token = await getAuthToken();
    if (!token) {
        return { success: false, error: 'No autenticado' };
    }
    
    try {
        // Serializar datos
        const jsonStr = JSON.stringify(data);
        const totalSize = jsonStr.length;
        const chunks: string[] = [];
        
        // Dividir en fragmentos
        for (let i = 0; i < jsonStr.length; i += chunkSize) {
            chunks.push(jsonStr.slice(i, i + chunkSize));
        }
        
        onProgress?.(0, chunks.length + 1, 'Guardando metadatos...');
        
        // Guardar metadatos
        const metaPayload = {
            totalChunks: chunks.length,
            totalSize,
            lastUpdated: Date.now(),
            originalKey: key,
            version: '2.0-rest'
        };
        
        const metaResult = await uploadViaRest(userId, `${key}_meta`, metaPayload);
        if (!metaResult.success) {
            return { success: false, error: 'Error guardando metadatos: ' + metaResult.error };
        }
        
        // Subir cada fragmento
        for (let i = 0; i < chunks.length; i++) {
            onProgress?.(i + 1, chunks.length + 1, `Subiendo fragmento ${i + 1}/${chunks.length}...`);
            
            const chunkPayload = {
                index: i,
                data: chunks[i],
                totalChunks: chunks.length,
                lastUpdated: Date.now()
            };
            
            const chunkResult = await uploadViaRest(userId, `${key}_chunk_${i}`, chunkPayload);
            if (!chunkResult.success) {
                return { success: false, error: `Error en fragmento ${i + 1}: ${chunkResult.error}` };
            }
            
            console.log(`✅ Fragmento REST ${i + 1}/${chunks.length} subido`);
        }
        
        onProgress?.(chunks.length + 1, chunks.length + 1, 'Completado');
        
        return { success: true };
        
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Sistema híbrido: SDK primero, REST como fallback
 */
export async function hybridUpload(
    userId: string,
    key: string,
    data: any,
    onProgress?: (status: string) => void
): Promise<{ success: boolean; method: string; error?: string }> {
    
    onProgress?.('Intentando subir via SDK...');
    
    // Primero intentar con SDK normal
    try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        const docRef = doc(db, 'users', userId, 'userData', key);
        const payload = { value: data, lastUpdated: Date.now() };
        
        // Timeout de 15 segundos para SDK
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('SDK timeout')), 15000);
        });
        
        await Promise.race([
            setDoc(docRef, payload, { merge: true }),
            timeoutPromise
        ]);
        
        onProgress?.('SDK exitoso');
        return { success: true, method: 'sdk' };
        
    } catch (sdkError: any) {
        console.warn(`⚠️ SDK falló: ${sdkError.message}, intentando REST...`);
        onProgress?.('SDK falló, intentando REST...');
    }
    
    // Fallback a REST API
    const jsonStr = JSON.stringify(data);
    const sizeKB = jsonStr.length / 1024;
    
    if (sizeKB > 100) {
        // Datos grandes: usar fragmentación REST
        const result = await uploadChunkedViaRest(userId, key, data, 50 * 1024, (c, t, s) => {
            onProgress?.(s);
        });
        return { ...result, method: result.success ? 'rest-chunked' : 'failed' };
    } else {
        // Datos pequeños: subir directo
        const result = await uploadViaRest(userId, key, data);
        return { ...result, method: result.success ? 'rest' : 'failed' };
    }
}
