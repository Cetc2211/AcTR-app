'use client';

import React, { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { get } from 'idb-keyval';
import { AlertTriangle, RefreshCw, Upload, Database, CheckCircle } from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export default function DefragmentDataPage() {
    const [user, loading] = useAuthState(auth);
    const { toast } = useToast();
    
    const [isWorking, setIsWorking] = useState(false);
    const [status, setStatus] = useState('');
    const [done, setDone] = useState(false);
    const [results, setResults] = useState<string[]>([]);

    const addResult = (msg: string) => {
        setResults(prev => [...prev, msg]);
        console.log(msg);
    };

    // Proceso simplificado - un documento a la vez
    const runProcess = async () => {
        if (!user) return;
        
        setIsWorking(true);
        setResults([]);
        setDone(false);

        try {
            // Paso 1: Leer grupos
            setStatus('Leyendo grupos locales...');
            const groupsData = await get('app_groups');
            if (!groupsData?.value) {
                throw new Error('No hay grupos en IndexedDB');
            }
            const groups = groupsData.value;
            addResult(`✅ Grupos: ${groups.length}`);
            
            // Obtener IDs de estudiantes activos
            const activeStudentIds = new Set<string>();
            groups.forEach((g: any) => {
                if (g.students) {
                    g.students.forEach((s: any) => {
                        if (s.id) activeStudentIds.add(s.id);
                    });
                }
            });
            addResult(`✅ Estudiantes en grupos: ${activeStudentIds.size}`);

            // Paso 2: Leer y filtrar estudiantes
            setStatus('Leyendo estudiantes...');
            const studentsData = await get('app_students');
            const allStudents = studentsData?.value || [];
            const activeStudents = allStudents.filter((s: any) => activeStudentIds.has(s.id));
            addResult(`✅ Estudiantes activos: ${activeStudents.length} (eliminados: ${allStudents.length - activeStudents.length})`);

            // Paso 3: Leer y filtrar observaciones
            setStatus('Leyendo observaciones...');
            const obsData = await get('app_observations');
            const allObs = obsData?.value || {};
            const filteredObs: any = {};
            Object.keys(allObs).forEach(studentId => {
                if (activeStudentIds.has(studentId)) {
                    filteredObs[studentId] = allObs[studentId];
                }
            });
            addResult(`✅ Observaciones: ${Object.keys(filteredObs).length} estudiantes`);

            // Paso 4: Leer y filtrar datos parciales
            setStatus('Leyendo datos parciales...');
            const partialsData = await get('app_partialsData');
            const allPartials = partialsData?.value || {};
            const activeGroupIds = new Set(groups.map((g: any) => g.id));
            const filteredPartials: any = {};
            Object.keys(allPartials).forEach(groupId => {
                if (activeGroupIds.has(groupId)) {
                    filteredPartials[groupId] = allPartials[groupId];
                }
            });
            addResult(`✅ Datos parciales: ${Object.keys(filteredPartials).length} grupos`);

            // Paso 5: Subir cada documento individualmente con batch pequeño
            setStatus('Subiendo grupos...');
            
            // Usar batch para grupos
            const batch1 = writeBatch(db);
            const groupsRef = doc(db, 'users', user.uid, 'userData', 'app_groups');
            batch1.set(groupsRef, { value: groups, lastUpdated: Date.now() });
            await batch1.commit();
            addResult('✅ Grupos subidos');
            setStatus('Subiendo estudiantes...');

            // Usar batch para estudiantes
            await new Promise(r => setTimeout(r, 500)); // Pequeña pausa
            const batch2 = writeBatch(db);
            const studentsRef = doc(db, 'users', user.uid, 'userData', 'app_students');
            batch2.set(studentsRef, { value: activeStudents, lastUpdated: Date.now() });
            await batch2.commit();
            addResult('✅ Estudiantes subidos');
            setStatus('Subiendo observaciones...');

            // Usar batch para observaciones
            await new Promise(r => setTimeout(r, 500));
            const batch3 = writeBatch(db);
            const obsRef = doc(db, 'users', user.uid, 'userData', 'app_observations');
            batch3.set(obsRef, { value: filteredObs, lastUpdated: Date.now() });
            await batch3.commit();
            addResult('✅ Observaciones subidas');
            setStatus('Subiendo datos parciales...');

            // Usar batch para parciales
            await new Promise(r => setTimeout(r, 500));
            const batch4 = writeBatch(db);
            const partialsRef = doc(db, 'users', user.uid, 'userData', 'app_partialsData');
            batch4.set(partialsRef, { value: filteredPartials, lastUpdated: Date.now() });
            await batch4.commit();
            addResult('✅ Datos parciales subidos');

            // Paso 6: Limpiar chunks antiguos
            setStatus('Limpiando datos antiguos...');
            const keys = ['app_groups', 'app_students', 'app_observations', 'app_partialsData'];
            for (const key of keys) {
                try {
                    // Eliminar metadata de chunks
                    await deleteDoc(doc(db, 'users', user.uid, 'userData', `${key}_meta`));
                    // Eliminar chunks (intentar eliminar los primeros 20)
                    for (let i = 0; i < 20; i++) {
                        try {
                            await deleteDoc(doc(db, 'users', user.uid, 'userData', `${key}_chunk_${i}`));
                        } catch (e) {}
                    }
                } catch (e) {}
            }
            addResult('✅ Datos fragmentados eliminados');

            setDone(true);
            setStatus('¡Completado!');
            toast({ title: '¡Éxito!', description: 'Datos subidos correctamente' });

        } catch (error: any) {
            addResult(`❌ Error: ${error.message}`);
            setStatus('Error');
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsWorking(false);
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
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Database className="h-8 w-8" />
                    Subir Datos Limpios
                </h1>
                <p className="text-muted-foreground mt-2">
                    Sube solo los datos activos a Firebase de forma estable.
                </p>
            </div>

            <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Proceso optimizado</AlertTitle>
                <AlertDescription>
                    Este proceso sube los datos en pequeños lotes para evitar que la app se reinicie.
                    Solo se subirán los datos de los grupos activos actuales.
                </AlertDescription>
            </Alert>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Estado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Button 
                            onClick={runProcess} 
                            disabled={isWorking}
                            size="lg"
                        >
                            {isWorking ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : done ? (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Completado - Repetir
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Iniciar Proceso
                                </>
                            )}
                        </Button>
                        {status && (
                            <span className="text-sm text-muted-foreground">{status}</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Resultados</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted p-4 rounded-lg min-h-[200px] font-mono text-sm">
                        {results.length > 0 ? (
                            results.map((r, i) => <div key={i}>{r}</div>)
                        ) : (
                            <span className="text-muted-foreground">Presiona "Iniciar Proceso" para comenzar</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {done && (
                <Alert className="mt-6 border-green-500">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>¡Proceso completado!</AlertTitle>
                    <AlertDescription>
                        Ve al celular o navegador y recarga la página para ver los datos actualizados.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
