'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, ArrowRight, CheckCircle, Database, RefreshCw, Users, XCircle } from 'lucide-react';

interface UserDataSummary {
    groups: number;
    students: number;
    observations: number;
    partialsData: number;
    settings: boolean;
    lastUpdated?: number;
}

export default function MigrateUsersPage() {
    const [user, loading] = useAuthState(auth);
    const { toast } = useToast();
    
    const [sourceUserId, setSourceUserId] = useState('5aVFWuV3EYZex7wKN8jFyxKNTZi1');
    const [targetUserId, setTargetUserId] = useState('');
    const [sourceData, setSourceData] = useState<UserDataSummary | null>(null);
    const [targetData, setTargetData] = useState<UserDataSummary | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationResult, setMigrationResult] = useState<string | null>(null);
    const [migrateOptions, setMigrateOptions] = useState({
        groups: true,
        students: true,
        observations: true,
        partialsData: true,
        settings: false,
        deleteSource: false
    });

    useEffect(() => {
        if (user) {
            setTargetUserId(user.uid);
        }
    }, [user]);

    const analyzeUser = async (userId: string): Promise<UserDataSummary> => {
        const summary: UserDataSummary = {
            groups: 0,
            students: 0,
            observations: 0,
            partialsData: 0,
            settings: false
        };

        try {
            // Check groups
            const groupsDoc = await getDoc(doc(db, 'users', userId, 'userData', 'app_groups'));
            if (groupsDoc.exists()) {
                const data = groupsDoc.data();
                summary.groups = Array.isArray(data.value) ? data.value.length : 0;
                summary.lastUpdated = data.lastUpdated;
            }

            // Check students
            const studentsDoc = await getDoc(doc(db, 'users', userId, 'userData', 'app_students'));
            if (studentsDoc.exists()) {
                const data = studentsDoc.data();
                summary.students = Array.isArray(data.value) ? data.value.length : 0;
            }

            // Check observations
            const observationsDoc = await getDoc(doc(db, 'users', userId, 'userData', 'app_observations'));
            if (observationsDoc.exists()) {
                const data = observationsDoc.data();
                summary.observations = data.value ? Object.keys(data.value).length : 0;
            }

            // Check partialsData
            const partialsDoc = await getDoc(doc(db, 'users', userId, 'userData', 'app_partialsData'));
            if (partialsDoc.exists()) {
                const data = partialsDoc.data();
                summary.partialsData = data.value ? Object.keys(data.value).length : 0;
            }

            // Check settings
            const settingsDoc = await getDoc(doc(db, 'users', userId, 'userData', 'app_settings'));
            summary.settings = settingsDoc.exists();

            // Check chunked data
            const metaDoc = await getDoc(doc(db, 'users', userId, 'userData', 'app_groups_meta'));
            if (metaDoc.exists()) {
                const metaData = metaDoc.data();
                if (metaData.totalChunks) {
                    summary.groups = metaData.totalItems || summary.groups;
                }
            }

        } catch (error) {
            console.error(`Error analyzing user ${userId}:`, error);
        }

        return summary;
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setMigrationResult(null);

        try {
            const [source, target] = await Promise.all([
                analyzeUser(sourceUserId),
                analyzeUser(targetUserId)
            ]);

            setSourceData(source);
            setTargetData(target);

            toast({
                title: 'Análisis completado',
                description: 'Se han analizado los datos de ambos usuarios.'
            });
        } catch (error) {
            console.error('Error analyzing:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudieron analizar los usuarios.'
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const migrateData = async () => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Debes estar autenticado para realizar la migración.'
            });
            return;
        }

        setIsMigrating(true);
        setMigrationResult(null);

        try {
            const results: string[] = [];
            const timestamp = Date.now();

            // Helper to get all chunked data
            const getChunkedData = async (userId: string, key: string): Promise<any> => {
                const metaRef = doc(db, 'users', userId, 'userData', `${key}_meta`);
                const metaSnap = await getDoc(metaRef);
                
                if (metaSnap.exists()) {
                    const metaData = metaSnap.data();
                    const chunks: any[] = [];
                    
                    for (let i = 0; i < (metaData.totalChunks || 0); i++) {
                        const chunkRef = doc(db, 'users', userId, 'userData', `${key}_chunk_${i}`);
                        const chunkSnap = await getDoc(chunkRef);
                        if (chunkSnap.exists()) {
                            chunks.push(chunkSnap.data().value);
                        }
                    }
                    
                    // Reconstruct data from chunks
                    if (key === 'app_groups' || key === 'app_students') {
                        return chunks.flat();
                    } else if (key === 'app_partialsData') {
                        return Object.assign({}, ...chunks);
                    }
                }
                return null;
            };

            // Migrate groups
            if (migrateOptions.groups) {
                let sourceGroups: any[] = [];
                
                // Check for chunked data first
                const chunkedGroups = await getChunkedData(sourceUserId, 'app_groups');
                if (chunkedGroups) {
                    sourceGroups = chunkedGroups;
                } else {
                    const groupsDoc = await getDoc(doc(db, 'users', sourceUserId, 'userData', 'app_groups'));
                    if (groupsDoc.exists()) {
                        sourceGroups = groupsDoc.data().value || [];
                    }
                }

                // Get target groups
                let targetGroups: any[] = [];
                const targetGroupsDoc = await getDoc(doc(db, 'users', targetUserId, 'userData', 'app_groups'));
                if (targetGroupsDoc.exists()) {
                    targetGroups = targetGroupsDoc.data().value || [];
                }

                // Merge groups - preserve both, prefer source for duplicates
                const mergedMap = new Map<string, any>();
                
                // Add target groups first
                targetGroups.forEach((g: any) => mergedMap.set(g.id, g));
                
                // Add/override with source groups
                sourceGroups.forEach((g: any) => mergedMap.set(g.id, g));

                const mergedGroups = Array.from(mergedMap.values());
                
                // Save merged groups
                await setDoc(
                    doc(db, 'users', targetUserId, 'userData', 'app_groups'),
                    { value: mergedGroups, lastUpdated: timestamp },
                    { merge: true }
                );

                results.push(`Grupos: ${targetGroups.length} + ${sourceGroups.length} → ${mergedGroups.length} grupos fusionados`);
            }

            // Migrate students
            if (migrateOptions.students) {
                let sourceStudents: any[] = [];
                
                const chunkedStudents = await getChunkedData(sourceUserId, 'app_students');
                if (chunkedStudents) {
                    sourceStudents = chunkedStudents;
                } else {
                    const studentsDoc = await getDoc(doc(db, 'users', sourceUserId, 'userData', 'app_students'));
                    if (studentsDoc.exists()) {
                        sourceStudents = studentsDoc.data().value || [];
                    }
                }

                let targetStudents: any[] = [];
                const targetStudentsDoc = await getDoc(doc(db, 'users', targetUserId, 'userData', 'app_students'));
                if (targetStudentsDoc.exists()) {
                    targetStudents = targetStudentsDoc.data().value || [];
                }

                // Merge students
                const mergedMap = new Map<string, any>();
                targetStudents.forEach((s: any) => mergedMap.set(s.id, s));
                sourceStudents.forEach((s: any) => mergedMap.set(s.id, s));

                const mergedStudents = Array.from(mergedMap.values());

                await setDoc(
                    doc(db, 'users', targetUserId, 'userData', 'app_students'),
                    { value: mergedStudents, lastUpdated: timestamp },
                    { merge: true }
                );

                results.push(`Estudiantes: ${targetStudents.length} + ${sourceStudents.length} → ${mergedStudents.length} estudiantes fusionados`);
            }

            // Migrate observations
            if (migrateOptions.observations) {
                const obsDoc = await getDoc(doc(db, 'users', sourceUserId, 'userData', 'app_observations'));
                if (obsDoc.exists()) {
                    const sourceObs = obsDoc.data().value || {};
                    
                    let targetObs: any = {};
                    const targetObsDoc = await getDoc(doc(db, 'users', targetUserId, 'userData', 'app_observations'));
                    if (targetObsDoc.exists()) {
                        targetObs = targetObsDoc.data().value || {};
                    }

                    // Merge observations
                    const mergedObs = { ...targetObs, ...sourceObs };

                    await setDoc(
                        doc(db, 'users', targetUserId, 'userData', 'app_observations'),
                        { value: mergedObs, lastUpdated: timestamp },
                        { merge: true }
                    );

                    results.push(`Observaciones: ${Object.keys(targetObs).length} + ${Object.keys(sourceObs).length} → ${Object.keys(mergedObs).length} claves fusionadas`);
                }
            }

            // Migrate partialsData
            if (migrateOptions.partialsData) {
                let sourcePartials: any = {};
                
                const chunkedPartials = await getChunkedData(sourceUserId, 'app_partialsData');
                if (chunkedPartials) {
                    sourcePartials = chunkedPartials;
                } else {
                    const partialsDoc = await getDoc(doc(db, 'users', sourceUserId, 'userData', 'app_partialsData'));
                    if (partialsDoc.exists()) {
                        sourcePartials = partialsDoc.data().value || {};
                    }
                }

                let targetPartials: any = {};
                const targetPartialsDoc = await getDoc(doc(db, 'users', targetUserId, 'userData', 'app_partialsData'));
                if (targetPartialsDoc.exists()) {
                    targetPartials = targetPartialsDoc.data().value || {};
                }

                // Deep merge partials
                const mergedPartials = { ...targetPartials };
                Object.keys(sourcePartials).forEach(groupId => {
                    if (!mergedPartials[groupId]) {
                        mergedPartials[groupId] = sourcePartials[groupId];
                    } else {
                        mergedPartials[groupId] = {
                            ...mergedPartials[groupId],
                            ...sourcePartials[groupId]
                        };
                    }
                });

                await setDoc(
                    doc(db, 'users', targetUserId, 'userData', 'app_partialsData'),
                    { value: mergedPartials, lastUpdated: timestamp },
                    { merge: true }
                );

                results.push(`Datos parciales: ${Object.keys(targetPartials).length} + ${Object.keys(sourcePartials).length} → ${Object.keys(mergedPartials).length} grupos fusionados`);
            }

            // Migrate settings
            if (migrateOptions.settings) {
                const settingsDoc = await getDoc(doc(db, 'users', sourceUserId, 'userData', 'app_settings'));
                if (settingsDoc.exists()) {
                    await setDoc(
                        doc(db, 'users', targetUserId, 'userData', 'app_settings'),
                        { value: settingsDoc.data().value, lastUpdated: timestamp },
                        { merge: true }
                    );
                    results.push('Configuración migrada');
                }
            }

            // Delete source data if requested
            if (migrateOptions.deleteSource) {
                const keys = ['app_groups', 'app_students', 'app_observations', 'app_partialsData', 'app_settings', 'app_specialNotes'];
                for (const key of keys) {
                    await deleteDoc(doc(db, 'users', sourceUserId, 'userData', key));
                    // Also delete chunks
                    const metaRef = doc(db, 'users', sourceUserId, 'userData', `${key}_meta`);
                    const metaSnap = await getDoc(metaRef);
                    if (metaSnap.exists()) {
                        const metaData = metaSnap.data();
                        for (let i = 0; i < (metaData.totalChunks || 0); i++) {
                            await deleteDoc(doc(db, 'users', sourceUserId, 'userData', `${key}_chunk_${i}`));
                        }
                        await deleteDoc(metaRef);
                    }
                }
                results.push('Datos de origen eliminados');
            }

            setMigrationResult(results.join('\n'));

            toast({
                title: 'Migración completada',
                description: 'Los datos se han fusionado correctamente.'
            });

            // Re-analyze after migration
            await handleAnalyze();

        } catch (error) {
            console.error('Migration error:', error);
            toast({
                variant: 'destructive',
                title: 'Error en migración',
                description: String(error)
            });
        } finally {
            setIsMigrating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Autenticación requerida</AlertTitle>
                    <AlertDescription>
                        Debes iniciar sesión para acceder a esta página.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Migración de Datos entre Usuarios</h1>
                <p className="text-muted-foreground mt-2">
                    Fusiona datos de dos cuentas de usuario diferentes.
                </p>
            </div>

            <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Precaución</AlertTitle>
                <AlertDescription>
                    Esta operación modificará los datos en Firebase. Asegúrate de tener una copia de seguridad 
                    antes de proceder. Los datos se fusionarán, no se sobrescribirán.
                </AlertDescription>
            </Alert>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Configurar Migración
                        </CardTitle>
                        <CardDescription>
                            Especifica el ID del usuario de origen (datos a migrar) y destino (tu cuenta actual).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="source">Usuario Origen (datos a migrar)</Label>
                                <Input
                                    id="source"
                                    value={sourceUserId}
                                    onChange={(e) => setSourceUserId(e.target.value)}
                                    placeholder="ID del usuario origen"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="target">Usuario Destino (tu cuenta)</Label>
                                <Input
                                    id="target"
                                    value={targetUserId}
                                    onChange={(e) => setTargetUserId(e.target.value)}
                                    placeholder="ID del usuario destino"
                                    disabled
                                />
                            </div>
                        </div>

                        <Button onClick={handleAnalyze} disabled={isAnalyzing || !sourceUserId}>
                            {isAnalyzing ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Analizando...
                                </>
                            ) : (
                                <>
                                    <Database className="mr-2 h-4 w-4" />
                                    Analizar Usuarios
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {sourceData && targetData && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Resultado del Análisis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Badge variant="outline">Origen</Badge>
                                        {sourceUserId.substring(0, 8)}...
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Grupos:</span>
                                            <Badge>{sourceData.groups}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Estudiantes:</span>
                                            <Badge>{sourceData.students}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Observaciones:</span>
                                            <Badge>{sourceData.observations}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Datos parciales:</span>
                                            <Badge>{sourceData.partialsData}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Configuración:</span>
                                            {sourceData.settings ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Badge variant="default">Destino</Badge>
                                        {targetUserId.substring(0, 8)}...
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Grupos:</span>
                                            <Badge>{targetData.groups}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Estudiantes:</span>
                                            <Badge>{targetData.students}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Observaciones:</span>
                                            <Badge>{targetData.observations}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Datos parciales:</span>
                                            <Badge>{targetData.partialsData}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Configuración:</span>
                                            {targetData.settings ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {sourceData && targetData && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Opciones de Migración</CardTitle>
                            <CardDescription>
                                Selecciona qué datos deseas fusionar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="migrate-groups"
                                        checked={migrateOptions.groups}
                                        onCheckedChange={(checked) => 
                                            setMigrateOptions(prev => ({ ...prev, groups: !!checked }))
                                        }
                                    />
                                    <label htmlFor="migrate-groups" className="text-sm font-medium">
                                        Grupos ({sourceData.groups} para fusionar)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="migrate-students"
                                        checked={migrateOptions.students}
                                        onCheckedChange={(checked) => 
                                            setMigrateOptions(prev => ({ ...prev, students: !!checked }))
                                        }
                                    />
                                    <label htmlFor="migrate-students" className="text-sm font-medium">
                                        Estudiantes ({sourceData.students} para fusionar)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="migrate-observations"
                                        checked={migrateOptions.observations}
                                        onCheckedChange={(checked) => 
                                            setMigrateOptions(prev => ({ ...prev, observations: !!checked }))
                                        }
                                    />
                                    <label htmlFor="migrate-observations" className="text-sm font-medium">
                                        Observaciones ({sourceData.observations} claves)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="migrate-partials"
                                        checked={migrateOptions.partialsData}
                                        onCheckedChange={(checked) => 
                                            setMigrateOptions(prev => ({ ...prev, partialsData: !!checked }))
                                        }
                                    />
                                    <label htmlFor="migrate-partials" className="text-sm font-medium">
                                        Datos parciales ({sourceData.partialsData} grupos)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="migrate-settings"
                                        checked={migrateOptions.settings}
                                        onCheckedChange={(checked) => 
                                            setMigrateOptions(prev => ({ ...prev, settings: !!checked }))
                                        }
                                    />
                                    <label htmlFor="migrate-settings" className="text-sm font-medium">
                                        Configuración (sobrescribirá)
                                    </label>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="delete-source"
                                    checked={migrateOptions.deleteSource}
                                    onCheckedChange={(checked) => 
                                        setMigrateOptions(prev => ({ ...prev, deleteSource: !!checked }))
                                    }
                                />
                                <label htmlFor="delete-source" className="text-sm font-medium text-destructive">
                                    Eliminar datos del usuario origen después de migrar
                                </label>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ArrowRight className="h-4 w-4" />
                                    Fusionará los datos de origen en tu cuenta actual
                                </div>
                                <Button 
                                    onClick={migrateData} 
                                    disabled={isMigrating}
                                    variant="default"
                                >
                                    {isMigrating ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            Migrando...
                                        </>
                                    ) : (
                                        'Iniciar Migración'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {migrationResult && (
                    <Card className="border-green-500">
                        <CardHeader>
                            <CardTitle className="text-green-600 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Migración Completada
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                                {migrationResult}
                            </pre>
                            <p className="mt-4 text-sm text-muted-foreground">
                                Recarga la página para ver los cambios reflejados en la aplicación.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
