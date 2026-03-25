'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Upload, RefreshCw, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { get } from 'idb-keyval';

interface DataStatus {
    key: string;
    exists: boolean;
    isChunked: boolean;
    size?: string;
    itemCount?: number;
    hasData: boolean;
}

export default function DiagnosticDataPage() {
    const [user, loading] = useAuthState(auth);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isCleaning, setIsCleaning] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [cloudStatus, setCloudStatus] = useState<DataStatus[]>([]);
    const [localStatus, setLocalStatus] = useState<DataStatus[]>([]);
    const [log, setLog] = useState<string[]>([]);

    const dataKeys = [
        'app_groups',
        'app_students', 
        'app_observations',
        'app_specialNotes',
        'app_partialsData',
        'app_settings'
    ];

    const addLog = (message: string) => {
        setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const getDataSize = (data: unknown): string => {
        if (!data) return '0 B';
        const json = JSON.stringify(data);
        const bytes = new Blob([json]).size;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    useEffect(() => {
        if (user) {
            checkDataStatus();
        }
    }, [user]);

    const checkDataStatus = async () => {
        if (!user) return;
        setIsLoading(true);
        addLog('Verificando estado de datos...');

        const cloud: DataStatus[] = [];
        const local: DataStatus[] = [];

        // Check cloud data
        for (const key of dataKeys) {
            try {
                // Check for normal document
                const docRef = doc(db, 'users', user.uid, 'userData', key);
                const docSnap = await getDoc(docRef);
                
                // Check for chunked data (meta document)
                const metaRef = doc(db, 'users', user.uid, 'userData', `${key}_meta`);
                const metaSnap = await getDoc(metaRef);

                if (metaSnap.exists()) {
                    cloud.push({
                        key,
                        exists: true,
                        isChunked: true,
                        hasData: true
                    });
                    addLog(`Nube ${key}: FRAGMENTADO (datos en chunks)`);
                } else if (docSnap.exists()) {
                    const data = docSnap.data();
                    const value = data.value;
                    cloud.push({
                        key,
                        exists: true,
                        isChunked: false,
                        size: getDataSize(value),
                        itemCount: Array.isArray(value) ? value.length : (typeof value === 'object' && value !== null ? Object.keys(value).length : 1),
                        hasData: true
                    });
                    addLog(`Nube ${key}: ${getDataSize(value)} (${Array.isArray(value) ? value.length + ' items' : 'objeto'})`);
                } else {
                    cloud.push({
                        key,
                        exists: false,
                        isChunked: false,
                        hasData: false
                    });
                    addLog(`Nube ${key}: NO EXISTE en Firebase`);
                }
            } catch (error: unknown) {
                const errMsg = error instanceof Error ? error.message : 'Error desconocido';
                cloud.push({
                    key,
                    exists: false,
                    isChunked: false,
                    hasData: false
                });
                addLog(`Error verificando ${key}: ${errMsg}`);
            }
        }

        // Check local data (IndexedDB)
        for (const key of dataKeys) {
            try {
                const localData = await get(key);
                if (localData) {
                    const value = (localData as { value?: unknown }).value || localData;
                    local.push({
                        key,
                        exists: true,
                        isChunked: false,
                        size: getDataSize(value),
                        itemCount: Array.isArray(value) ? value.length : (typeof value === 'object' && value !== null ? Object.keys(value).length : 1),
                        hasData: true
                    });
                    addLog(`Local ${key}: ${getDataSize(value)} (${Array.isArray(value) ? value.length + ' items' : 'objeto'})`);
                } else {
                    local.push({
                        key,
                        exists: false,
                        isChunked: false,
                        hasData: false
                    });
                    addLog(`Local ${key}: NO EXISTE`);
                }
            } catch (error: unknown) {
                local.push({
                    key,
                    exists: false,
                    isChunked: false,
                    hasData: false
                });
            }
        }

        setCloudStatus(cloud);
        setLocalStatus(local);
        setIsLoading(false);
        addLog('Verificacion completada.');
    };

    const cleanChunkedData = async () => {
        if (!user) return;
        setIsCleaning(true);
        addLog('Iniciando limpieza de datos fragmentados...');

        let cleaned = 0;

        for (const key of dataKeys) {
            // Check for meta document
            const metaRef = doc(db, 'users', user.uid, 'userData', `${key}_meta`);
            const metaSnap = await getDoc(metaRef);
            
            if (metaSnap.exists()) {
                const metaData = metaSnap.data();
                const totalChunks = metaData.totalChunks || 0;
                
                // Delete all chunks
                for (let i = 0; i < totalChunks; i++) {
                    try {
                        const chunkRef = doc(db, 'users', user.uid, 'userData', `${key}_chunk_${i}`);
                        await deleteDoc(chunkRef);
                        addLog(`   Eliminado chunk ${i} de ${key}`);
                    } catch {
                        // Ignore errors
                    }
                }
                
                // Delete meta
                await deleteDoc(metaRef);
                addLog(`Datos fragmentados de ${key} eliminados`);
                cleaned++;
            }
        }

        setIsCleaning(false);
        addLog(`Limpieza completada. ${cleaned} colecciones limpiadas.`);
        toast({ title: 'Limpieza completada', description: `${cleaned} colecciones de datos fragmentados eliminadas.` });
        
        // Refresh status
        await checkDataStatus();
    };

    const stripPhotos = (data: unknown): unknown => {
        if (Array.isArray(data)) {
            return data.map(item => {
                if (item && typeof item === 'object') {
                    const processed = { ...item } as Record<string, unknown>;
                    // Remove photo from students
                    if (processed.photo && typeof processed.photo === 'string' && processed.photo.startsWith('data:')) {
                        delete processed.photo;
                    }
                    // Remove photos from nested students array in groups
                    if (processed.students && Array.isArray(processed.students)) {
                        processed.students = processed.students.map((s: Record<string, unknown>) => {
                            if (s.photo && typeof s.photo === 'string' && s.photo.startsWith('data:')) {
                                const { photo: _, ...rest } = s;
                                return rest;
                            }
                            return s;
                        });
                    }
                    return processed;
                }
                return item;
            });
        }
        return data;
    };

    const uploadLocalData = async () => {
        if (!user) return;
        setIsUploading(true);
        addLog('Iniciando subida de datos locales...');

        let uploaded = 0;
        const errors: string[] = [];

        for (const key of dataKeys) {
            try {
                const localData = await get(key);
                if (!localData) {
                    addLog(`${key}: No hay datos locales, saltando...`);
                    continue;
                }

                const rawValue = (localData as { value?: unknown }).value || localData;
                
                // Strip photos from groups and students to keep document under 1MB
                let dataToUpload = rawValue;
                if (key === 'app_groups' || key === 'app_students') {
                    dataToUpload = stripPhotos(rawValue);
                    addLog(`Fotos removidas de ${key} para reducir tamano`);
                }

                const docRef = doc(db, 'users', user.uid, 'userData', key);
                await setDoc(docRef, { value: dataToUpload, lastUpdated: Date.now() }, { merge: true });
                
                addLog(`${key}: Subido correctamente (${getDataSize(dataToUpload)})`);
                uploaded++;
            } catch (error: unknown) {
                const errMsg = error instanceof Error ? error.message : 'Error desconocido';
                addLog(`Error subiendo ${key}: ${errMsg}`);
                errors.push(`${key}: ${errMsg}`);
            }
        }

        setIsUploading(false);
        
        if (errors.length === 0) {
            addLog(`Subida completada. ${uploaded} colecciones subidas.`);
            toast({ title: 'Subida completada', description: `${uploaded} colecciones subidas correctamente.` });
        } else {
            addLog(`Subida parcial. ${uploaded} exitosos, ${errors.length} errores.`);
            toast({ variant: 'destructive', title: 'Subida parcial', description: `Errores: ${errors.slice(0, 2).join(', ')}` });
        }

        // Refresh status
        await checkDataStatus();
    };

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Diagnostico y Reparacion de Datos</h1>
                <p className="text-muted-foreground">
                    Usuario: {user.uid}
                </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cloud Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Estado en Firebase (Nube)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {cloudStatus.map(status => (
                                <div key={status.key} className="flex items-center justify-between p-2 rounded bg-muted">
                                    <span className="font-mono text-sm">{status.key}</span>
                                    <div className="flex items-center gap-2">
                                        {status.isChunked && (
                                            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                                                FRAGMENTADO
                                            </span>
                                        )}
                                        {status.exists ? (
                                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                {status.itemCount} items
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                                                NO EXISTE
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Local Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Estado Local (IndexedDB)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {localStatus.map(status => (
                                <div key={status.key} className="flex items-center justify-between p-2 rounded bg-muted">
                                    <span className="font-mono text-sm">{status.key}</span>
                                    {status.exists ? (
                                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            {status.itemCount} items ({status.size})
                                        </span>
                                    ) : (
                                        <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded">
                                            VACIO
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Warning if chunked data detected */}
            {cloudStatus.some(s => s.isChunked) && (
                <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-6 w-6 text-orange-500 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                                    Datos Fragmentados Detectados
                                </h3>
                                <p className="text-sm text-orange-600 dark:text-orange-300">
                                    Hay datos en formato fragmentado que otros dispositivos no pueden leer. 
                                    Usa &quot;Limpiar Fragmentados&quot; para eliminarlos y luego &quot;Subir Datos Locales&quot; para subir datos correctos.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle>Acciones</CardTitle>
                    <CardDescription>
                        Ejecuta las acciones en orden: primero limpia datos fragmentados, luego sube datos locales.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <Button 
                            onClick={checkDataStatus} 
                            disabled={isLoading || isCleaning || isUploading}
                            variant="outline"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                            Actualizar Estado
                        </Button>
                        
                        <Button 
                            onClick={cleanChunkedData} 
                            disabled={isLoading || isCleaning || isUploading}
                            variant="destructive"
                        >
                            {isCleaning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Limpiar Fragmentados
                        </Button>
                        
                        <Button 
                            onClick={uploadLocalData} 
                            disabled={isLoading || isCleaning || isUploading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Subir Datos Locales
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Log */}
            <Card>
                <CardHeader>
                    <CardTitle>Registro de Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-[300px] overflow-y-auto">
                        {log.length === 0 ? (
                            <span className="text-gray-500">Esperando acciones...</span>
                        ) : (
                            log.map((entry, i) => (
                                <div key={i}>{entry}</div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
