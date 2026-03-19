/**
 * Chunked Upload System for Firebase - V2 ROBUSTO
 * 
 * Sistema mejorado para subir datos a Firebase con:
 * - Fragmentación para datos grandes
 * - Reintentos con backoff exponencial
 * - Verificación de conexión
 * - Micro-subidas individuales como fallback
 * - Timeouts adaptativos
 */

import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadViaRest, checkRestConnection } from './firestore-rest';

// Configuración adaptativa
const CHUNK_SIZE = 10 * 1024; // 10KB por fragmento (más pequeño = más confiable)
const MAX_RETRIES = 5; // Máximo de reintentos
const BASE_DELAY = 1000; // 1 segundo base para backoff
const MAX_DELAY = 30000; // 30 segundos máximo de espera
const CHUNK_TIMEOUT = 45000; // 45 segundos por fragmento (más tiempo para conexiones lentas)
const CONNECTION_TEST_TIMEOUT = 10000; // 10 segundos para test de conexión

interface ChunkMetadata {
    totalChunks: number;
    totalSize: number;
    lastUpdated: number;
    originalKey: string;
    version: string; // Para compatibilidad futura
}

interface UploadResult {
    success: boolean;
    method: 'normal' | 'chunked' | 'micro' | 'failed';
    chunksUploaded?: number;
    itemsUploaded?: number;
    totalItems?: number;
    error?: string;
    retries?: number;
}

/**
 * Espera un tiempo determinado (promesa utilizable con await)
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calcula el delay para backoff exponencial
 */
function getBackoffDelay(attempt: number): number {
    const delay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
    // Añadir jitter para evitar sincronización
    return delay + Math.random() * 1000;
}

/**
 * Verifica si la conexión a Firebase está saludable
 */
export async function checkFirebaseConnection(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
        // Intentar una operación simple de lectura
        const testRef = doc(db, '_health_check', 'test');
        
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Connection test timeout')), CONNECTION_TEST_TIMEOUT);
        });
        
        await Promise.race([
            setDoc(testRef, { timestamp: Date.now() }, { merge: true }),
            timeoutPromise
        ]);
        
        const latency = Date.now() - startTime;
        
        // Si la latencia es muy alta (>5s), advertir pero permitir
        if (latency > 5000) {
            console.warn(`⚠️ Conexión Firebase lenta: ${latency}ms`);
        }
        
        return { healthy: true, latency };
    } catch (error: any) {
        const latency = Date.now() - startTime;
        console.error(`❌ Firebase connection check failed:`, error);
        return { 
            healthy: false, 
            latency, 
            error: error?.message || 'Connection failed' 
        };
    }
}

/**
 * Ejecuta una operación con reintentos y backoff exponencial
 */
async function withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = MAX_RETRIES
): Promise<{ result: T | null; success: boolean; attempts: number; error?: string }> {
    let lastError: string = '';
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const result = await operation();
            return { result, success: true, attempts: attempt + 1 };
        } catch (error: any) {
            lastError = error?.message || 'Unknown error';
            console.warn(`⚠️ ${operationName} failed (attempt ${attempt + 1}/${maxRetries}):`, lastError);
            
            // Si no es el último intento, esperar con backoff
            if (attempt < maxRetries - 1) {
                const delay = getBackoffDelay(attempt);
                console.log(`   Reintentando en ${(delay/1000).toFixed(1)}s...`);
                await sleep(delay);
            }
        }
    }
    
    return { result: null, success: false, attempts: maxRetries, error: lastError };
}

/**
 * Divide datos en fragmentos pequeños
 */
function splitIntoChunks<T>(data: T, chunkSize: number = CHUNK_SIZE): { chunks: string[], totalSize: number } {
    const jsonStr = JSON.stringify(data);
    const totalSize = jsonStr.length;
    const chunks: string[] = [];
    
    for (let i = 0; i < jsonStr.length; i += chunkSize) {
        chunks.push(jsonStr.slice(i, i + chunkSize));
    }
    
    return { chunks, totalSize };
}

/**
 * Recombina fragmentos en datos originales
 */
function combineChunks<T>(chunks: string[]): T {
    const jsonStr = chunks.join('');
    return JSON.parse(jsonStr);
}

/**
 * Sube un solo fragmento con timeout y reintentos
 */
async function uploadSingleChunk(
    userId: string,
    key: string,
    chunkIndex: number,
    chunkData: string,
    totalChunks: number
): Promise<{ success: boolean; error?: string }> {
    const chunkRef = doc(db, 'users', userId, 'userData', `${key}_chunk_${chunkIndex}`);
    const data = {
        index: chunkIndex,
        data: chunkData,
        lastUpdated: Date.now(),
        totalChunks
    };
    
    // Intentar subir con timeout
    const uploadOperation = async () => {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Chunk ${chunkIndex} timeout`)), CHUNK_TIMEOUT);
        });
        
        await Promise.race([
            setDoc(chunkRef, data),
            timeoutPromise
        ]);
    };
    
    const { success, error } = await withRetry(uploadOperation, `Chunk ${chunkIndex}`);
    return { success, error };
}

/**
 * Sube datos usando fragmentación con reintentos robustos
 */
export async function uploadWithChunks<T>(
    userId: string,
    key: string,
    data: T,
    onProgress?: (current: number, total: number, status: string) => void
): Promise<UploadResult> {
    try {
        console.log(`📦 Iniciando subida fragmentada de ${key}...`);
        
        // 1. Verificar conexión primero
        onProgress?.(0, 1, 'Verificando conexión...');
        const connectionCheck = await checkFirebaseConnection();
        
        if (!connectionCheck.healthy) {
            console.warn(`⚠️ Conexión no saludable, intentando de todas formas...`);
        } else {
            console.log(`✅ Conexión OK (${connectionCheck.latency}ms)`);
        }
        
        // 2. Dividir en fragmentos
        const { chunks, totalSize } = splitIntoChunks(data);
        const totalChunks = chunks.length;
        
        console.log(`📊 Dividido en ${totalChunks} fragmentos (${(totalSize / 1024).toFixed(1)} KB total)`);
        
        // 3. Guardar metadatos con reintentos
        onProgress?.(0, totalChunks, 'Guardando metadatos...');
        
        const metadata: ChunkMetadata = {
            totalChunks,
            totalSize,
            lastUpdated: Date.now(),
            originalKey: key,
            version: '2.0'
        };
        
        const metaRef = doc(db, 'users', userId, 'userData', `${key}_meta`);
        const metaOperation = async () => {
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Metadata upload timeout')), CHUNK_TIMEOUT);
            });
            await Promise.race([
                setDoc(metaRef, metadata),
                timeoutPromise
            ]);
        };
        
        const metaResult = await withRetry(metaOperation, 'Metadata upload');
        if (!metaResult.success) {
            return { success: false, method: 'failed', error: `Failed to upload metadata: ${metaResult.error}` };
        }
        
        // 4. Subir cada fragmento secuencialmente con reintentos
        let successfulChunks = 0;
        let failedChunks: number[] = [];
        
        for (let i = 0; i < chunks.length; i++) {
            onProgress?.(i, totalChunks, `Subiendo fragmento ${i + 1}/${totalChunks}...`);
            
            const result = await uploadSingleChunk(userId, key, i, chunks[i], totalChunks);
            
            if (result.success) {
                successfulChunks++;
                console.log(`✅ Fragmento ${i + 1}/${totalChunks} subido`);
            } else {
                failedChunks.push(i);
                console.error(`❌ Fragmento ${i + 1}/${totalChunks} falló: ${result.error}`);
            }
        }
        
        // 5. Si hay fragmentos fallidos, intentar una vez más
        if (failedChunks.length > 0 && failedChunks.length < totalChunks) {
            console.log(`🔄 Reintentando ${failedChunks.length} fragmentos fallidos...`);
            
            for (const chunkIndex of failedChunks) {
                onProgress?.(chunkIndex, totalChunks, `Reintentando fragmento ${chunkIndex + 1}...`);
                
                const result = await uploadSingleChunk(userId, key, chunkIndex, chunks[chunkIndex], totalChunks);
                
                if (result.success) {
                    successfulChunks++;
                    console.log(`✅ Fragmento ${chunkIndex + 1} recuperado en reintento`);
                }
            }
        }
        
        // 6. Resultado final
        if (successfulChunks === totalChunks) {
            console.log(`✅ Subida completa: ${totalChunks} fragmentos`);
            return { success: true, method: 'chunked', chunksUploaded: totalChunks };
        } else if (successfulChunks > 0) {
            console.warn(`⚠️ Subida parcial: ${successfulChunks}/${totalChunks} fragmentos`);
            return { 
                success: false, 
                method: 'chunked', 
                chunksUploaded: successfulChunks,
                error: `Solo ${successfulChunks}/${totalChunks} fragmentos subidos`
            };
        } else {
            return { success: false, method: 'failed', error: 'Todos los fragmentos fallaron' };
        }
        
    } catch (error: any) {
        console.error(`❌ Error en subida fragmentada:`, error);
        return { success: false, method: 'failed', error: error.message };
    }
}

/**
 * Sube datos individuales uno por uno (método ultra-conservador)
 * Útil cuando la fragmentación normal falla
 */
export async function uploadMicroItems<T>(
    userId: string,
    key: string,
    items: T[],
    getItemId: (item: T) => string,
    onProgress?: (current: number, total: number, status: string) => void
): Promise<UploadResult> {
    console.log(`🔬 Iniciando micro-subida de ${items.length} items...`);
    
    let successCount = 0;
    const totalItems = items.length;
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemId = getItemId(item);
        
        onProgress?.(i, totalItems, `Subiendo item ${i + 1}/${totalItems}...`);
        
        try {
            const itemRef = doc(db, 'users', userId, 'userData', `${key}_item_${itemId}`);
            
            const uploadOperation = async () => {
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error(`Item ${itemId} timeout`)), CHUNK_TIMEOUT);
                });
                await Promise.race([
                    setDoc(itemRef, { value: item, lastUpdated: Date.now() }),
                    timeoutPromise
                ]);
            };
            
            const { success } = await withRetry(uploadOperation, `Item ${itemId}`, 3);
            
            if (success) {
                successCount++;
            }
            
            // Pequeña pausa entre items para no sobrecargar
            await sleep(100);
            
        } catch (error: any) {
            console.error(`❌ Error subiendo item ${itemId}:`, error);
        }
    }
    
    // Guardar índice de items
    if (successCount > 0) {
        try {
            const indexRef = doc(db, 'users', userId, 'userData', `${key}_index`);
            await setDoc(indexRef, {
                itemIds: items.slice(0, successCount).map(getItemId),
                totalItems: successCount,
                lastUpdated: Date.now()
            });
        } catch (e) {
            console.warn('⚠️ No se pudo guardar índice de items');
        }
    }
    
    console.log(`🔬 Micro-subida completada: ${successCount}/${totalItems} items`);
    
    return {
        success: successCount === totalItems,
        method: 'micro',
        itemsUploaded: successCount,
        totalItems
    };
}

/**
 * Descarga datos fragmentados
 */
export async function downloadWithChunks<T>(
    userId: string,
    key: string,
    onProgress?: (current: number, total: number, status: string) => void
): Promise<{ data: T | null; metadata: ChunkMetadata | null }> {
    try {
        // 1. Leer metadatos
        onProgress?.(0, 1, 'Leyendo metadatos...');
        const metaRef = doc(db, 'users', userId, 'userData', `${key}_meta`);
        const metaSnap = await getDoc(metaRef);
        
        if (!metaSnap.exists()) {
            return { data: null, metadata: null };
        }
        
        const metadata = metaSnap.data() as ChunkMetadata;
        console.log(`📥 Descargando ${metadata.totalChunks} fragmentos...`);
        
        // 2. Leer todos los fragmentos
        const chunks: string[] = new Array(metadata.totalChunks);
        
        for (let i = 0; i < metadata.totalChunks; i++) {
            onProgress?.(i, metadata.totalChunks, `Descargando fragmento ${i + 1}/${metadata.totalChunks}...`);
            
            const chunkRef = doc(db, 'users', userId, 'userData', `${key}_chunk_${i}`);
            const chunkSnap = await getDoc(chunkRef);
            
            if (chunkSnap.exists()) {
                chunks[i] = chunkSnap.data().data;
            } else {
                console.warn(`⚠️ Fragmento ${i} no encontrado`);
            }
        }
        
        // 3. Recombinar
        const data = combineChunks<T>(chunks);
        console.log(`✅ Datos recombinados: ${(metadata.totalSize / 1024).toFixed(1)} KB`);
        
        return { data, metadata };
        
    } catch (error) {
        console.error(`❌ Error descargando fragmentos:`, error);
        return { data: null, metadata: null };
    }
}

/**
 * Elimina todos los fragmentos de un documento
 */
export async function deleteChunks(userId: string, key: string): Promise<void> {
    try {
        const metaRef = doc(db, 'users', userId, 'userData', `${key}_meta`);
        const metaSnap = await getDoc(metaRef);
        
        if (metaSnap.exists()) {
            const metadata = metaSnap.data() as ChunkMetadata;
            
            // Eliminar fragmentos en paralelo
            const deletePromises = [];
            for (let i = 0; i < metadata.totalChunks; i++) {
                const chunkRef = doc(db, 'users', userId, 'userData', `${key}_chunk_${i}`);
                deletePromises.push(deleteDoc(chunkRef));
            }
            
            await Promise.allSettled(deletePromises);
            
            // Eliminar metadatos
            await deleteDoc(metaRef);
        }
    } catch (error) {
        console.error(`❌ Error eliminando fragmentos:`, error);
    }
}

/**
 * Verifica si un documento está fragmentado
 */
export async function isChunked(userId: string, key: string): Promise<boolean> {
    const metaRef = doc(db, 'users', userId, 'userData', `${key}_meta`);
    const metaSnap = await getDoc(metaRef);
    return metaSnap.exists();
}

/**
 * Obtiene información de fragmentos sin descargar los datos
 */
export async function getChunkInfo(userId: string, key: string): Promise<ChunkMetadata | null> {
    const metaRef = doc(db, 'users', userId, 'userData', `${key}_meta`);
    const metaSnap = await getDoc(metaRef);
    
    if (metaSnap.exists()) {
        return metaSnap.data() as ChunkMetadata;
    }
    
    return null;
}

/**
 * Sube datos con lógica híbrida inteligente V2:
 * 1. Verifica conexión SDK
 * 2. Si conexión OK: upload normal SDK
 * 3. Si SDK falla: usar REST API como fallback
 * 4. Si REST falla para datos grandes: fragmentación REST
 * 5. Último recurso: micro-subidas individuales
 */
export async function smartUpload<T>(
    userId: string,
    key: string,
    data: T,
    onProgress?: (current: number, total: number, status: string) => void
): Promise<UploadResult> {
    const jsonStr = JSON.stringify(data);
    const sizeKB = jsonStr.length / 1024;
    
    console.log(`📊 Tamaño de ${key}: ${sizeKB.toFixed(1)} KB`);
    
    // 1. Verificar conexión SDK
    onProgress?.(0, 1, 'Verificando conexión SDK...');
    const connection = await checkFirebaseConnection();
    
    console.log(`📡 Conexión SDK: ${connection.healthy ? 'OK' : 'DEGRADADO'} (${connection.latency}ms)`);
    
    // 2. Si conexión SDK es buena y datos pequeños, intentar SDK normal
    if (connection.healthy && connection.latency < 5000 && sizeKB < 50) {
        onProgress?.(0, 1, 'Intentando SDK...');
        
        try {
            const docRef = doc(db, 'users', userId, 'userData', key);
            const uploadPayload = { value: data, lastUpdated: Date.now() };
            
            // Timeout de 15 segundos para SDK
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('SDK timeout')), 15000);
            });
            
            await Promise.race([
                setDoc(docRef, uploadPayload, { merge: true }),
                timeoutPromise
            ]);
            
            console.log(`✅ SDK upload exitoso: ${key}`);
            return { success: true, method: 'normal', retries: 0 };
            
        } catch (sdkError: any) {
            console.warn(`⚠️ SDK falló: ${sdkError.message}, cambiando a REST API...`);
        }
    }
    
    // 3. Fallback a REST API - más tolerante a conexiones problemáticas
    onProgress?.(0, 1, 'Usando REST API...');
    
    try {
        // Importar dinámicamente el módulo REST
        const { hybridUpload } = await import('./firestore-rest');
        
        const result = await hybridUpload(userId, key, data, (status) => {
            onProgress?.(1, 1, status);
        });
        
        if (result.success) {
            console.log(`✅ REST API exitoso: ${key} via ${result.method}`);
            return { 
                success: true, 
                method: result.method === 'rest' ? 'chunked' : 'chunked', // Normalizar
                chunksUploaded: result.method.includes('chunked') ? 1 : undefined 
            };
        }
        
        console.warn(`⚠️ REST API falló: ${result.error}`);
        
    } catch (restError: any) {
        console.error(`❌ Error en REST API:`, restError);
    }
    
    // 4. Intentar fragmentación SDK como último recurso
    onProgress?.(0, 1, 'Intentando fragmentación...');
    
    const chunkResult = await uploadWithChunks(userId, key, data, onProgress);
    
    if (chunkResult.success) {
        return chunkResult;
    }
    
    // 5. Si es un array, intentar micro-subida
    if (Array.isArray(data) && data.length > 0) {
        console.log(`🔬 Intentando micro-subida como último recurso...`);
        
        const microResult = await uploadMicroItems(
            userId,
            key,
            data,
            (item: any) => item?.id || String(Math.random()),
            onProgress
        );
        
        if (microResult.itemsUploaded && microResult.itemsUploaded > 0) {
            return microResult;
        }
    }
    
    // 6. Todo falló
    return { success: false, method: 'failed', error: chunkResult.error || 'Upload failed after all methods' };
}

/**
 * Descarga datos con lógica híbrida
 */
export async function smartDownload<T>(
    userId: string,
    key: string,
    onProgress?: (current: number, total: number, status: string) => void
): Promise<T | null> {
    // Check for chunked data first
    const chunked = await isChunked(userId, key);
    
    if (chunked) {
        console.log(`📥 Descargando ${key} en modo fragmentado...`);
        const result = await downloadWithChunks<T>(userId, key, onProgress);
        return result.data;
    }
    
    // Normal download
    try {
        const docRef = doc(db, 'users', userId, 'userData', key);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data().value as T;
        }
    } catch (e) {
        console.error(`❌ Error en descarga:`, e);
    }
    
    return null;
}
