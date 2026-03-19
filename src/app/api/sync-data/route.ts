import { NextResponse } from 'next/server';

/**
 * SYNC DATA API - Endpoint robusto para sincronización con Firestore
 * 
 * Este endpoint usa la REST API de Firestore directamente (sin WebSockets),
 * lo cual es más confiable para conexiones inestables (iPad en red móvil, etc.)
 * 
 * Usa el token de autenticación del usuario para validar la escritura.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Firebase configuration
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'academic-tracker-qeoxi';
const FIRESTORE_API = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Timeout para operaciones HTTP (30 segundos)
const HTTP_TIMEOUT = 30000;

interface SyncRequest {
    key: string;
    data: any;
    lastUpdated: number;
    idToken: string;
}

interface BatchSyncRequest {
    items: SyncRequest[];
}

/**
 * Fetch con timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout = HTTP_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Convierte datos JavaScript a formato Firestore
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
            return { integerValue: value.toString() };
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
    if (typeof value === 'object') {
        const fields: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
            fields[k] = toFirestoreValue(v);
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(value) };
}

/**
 * Guarda un documento en Firestore via REST API
 */
async function saveDocument(
    uid: string,
    key: string,
    data: any,
    lastUpdated: number,
    idToken: string
): Promise<{ success: boolean; error?: string }> {
    
    const documentPath = `users/${uid}/userData/${key}`;
    const url = `${FIRESTORE_API}/${documentPath}`;
    
    // Preparar el documento en formato Firestore
    const document = {
        fields: {
            value: toFirestoreValue(data),
            lastUpdated: { integerValue: lastUpdated.toString() }
        }
    };
    
    try {
        // Usar PATCH para hacer merge con documento existente
        const response = await fetchWithTimeout(`${url}?updateMask.fieldPaths=value&updateMask.fieldPaths=lastUpdated`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(document)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Firestore REST API error for ${key}:`, response.status, errorText);
            return { success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 200)}` };
        }
        
        return { success: true };
        
    } catch (error: any) {
        console.error(`Error saving ${key} via REST API:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * POST /api/sync-data
 * Sincroniza un documento individual
 */
export async function POST(req: Request) {
    try {
        const body: SyncRequest = await req.json();
        const { key, data, lastUpdated, idToken } = body;
        
        // Validación
        if (!key || !idToken) {
            return NextResponse.json({ 
                success: false, 
                error: 'Faltan parámetros requeridos: key, idToken' 
            }, { status: 400 });
        }
        
        // Extraer UID del token (validación básica)
        // El token JWT tiene el UID en el payload
        let uid: string;
        try {
            const tokenParts = idToken.split('.');
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            uid = payload.user_id || payload.sub;
            
            if (!uid) {
                throw new Error('UID not found in token');
            }
        } catch (e) {
            return NextResponse.json({ 
                success: false, 
                error: 'Token de autenticación inválido' 
            }, { status: 401 });
        }
        
        // Guardar documento
        const result = await saveDocument(uid, key, data, lastUpdated, idToken);
        
        return NextResponse.json(result, { 
            status: result.success ? 200 : 500 
        });
        
    } catch (error: any) {
        console.error('Error in sync-data API:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Error desconocido' 
        }, { status: 500 });
    }
}

/**
 * PUT /api/sync-data
 * Sincroniza múltiples documentos en batch
 */
export async function PUT(req: Request) {
    try {
        const body: BatchSyncRequest = await req.json();
        const { items } = body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Se requiere un array de items' 
            }, { status: 400 });
        }
        
        // Extraer UID del primer token
        const firstItem = items[0];
        let uid: string;
        try {
            const tokenParts = firstItem.idToken.split('.');
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            uid = payload.user_id || payload.sub;
            
            if (!uid) {
                throw new Error('UID not found in token');
            }
        } catch (e) {
            return NextResponse.json({ 
                success: false, 
                error: 'Token de autenticación inválido' 
            }, { status: 401 });
        }
        
        // Procesar cada item secuencialmente
        const results: { key: string; success: boolean; error?: string }[] = [];
        
        for (const item of items) {
            const result = await saveDocument(uid, item.key, item.data, item.lastUpdated, item.idToken);
            results.push({ key: item.key, ...result });
            
            // Pequeña pausa entre escrituras para no sobrecargar
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const successCount = results.filter(r => r.success).length;
        
        return NextResponse.json({
            success: successCount === items.length,
            total: items.length,
            succeeded: successCount,
            failed: items.length - successCount,
            results
        });
        
    } catch (error: any) {
        console.error('Error in batch sync:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Error desconocido' 
        }, { status: 500 });
    }
}
