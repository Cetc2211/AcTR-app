'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Users, Shield, Database, Send, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AbsencesDebugPage() {
  const { isAdmin, loading: loadingAdmin } = useAdmin();
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [isAddingManager, setIsAddingManager] = useState(false);
  
  const [debugInfo, setDebugInfo] = useState<{
    user: {
      uid: string | null;
      email: string | null;
      emailVerified: boolean;
      displayName: string | null;
    };
    authState: {
      isLoaded: boolean;
      hasUser: boolean;
      authLoading: boolean;
    };
    roles: {
      exists: boolean;
      tracking_managers: string[];
      error?: string;
    };
    isManager: boolean;
    isAdmin: boolean;
    absences: {
      count: number;
      myReports: number;
      otherReports: number;
      recent: {
        id: string;
        date: string;
        teacherId: string;
        teacherEmail: string;
        groupName: string;
        studentCount: number;
        timestamp: string;
        isMyReport: boolean;
      }[];
    };
    testReport: {
      canSend: boolean;
      lastError?: string;
    };
  }>({
    user: { uid: null, email: null, emailVerified: false, displayName: null },
    authState: { isLoaded: false, hasUser: false, authLoading: true },
    roles: { exists: false, tracking_managers: [] },
    isManager: false,
    isAdmin: false,
    absences: { count: 0, myReports: 0, otherReports: 0, recent: [] },
    testReport: { canSend: false }
  });

  useEffect(() => {
    if (loadingAuth || loadingAdmin) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    
    runDiagnostics();
  }, [user, loadingAuth, loadingAdmin, isAdmin]);

  const runDiagnostics = async () => {
    setIsLoading(true);
    
    // Verificar estado de autenticación DIRECTO de Firebase
    const currentUser = auth.currentUser;
    
    const info = {
      user: {
        uid: currentUser?.uid || null,
        email: currentUser?.email || null,
        emailVerified: currentUser?.emailVerified || false,
        displayName: currentUser?.displayName || null,
      },
      authState: {
        isLoaded: !loadingAuth,
        hasUser: !!currentUser,
        authLoading: loadingAuth,
      },
      roles: {
        exists: false,
        tracking_managers: [] as string[],
      },
      isManager: false,
      isAdmin: isAdmin,
      absences: {
        count: 0,
        myReports: 0,
        otherReports: 0,
        recent: [] as typeof debugInfo.absences.recent,
      },
      testReport: {
        canSend: !!currentUser,
      },
    };

    try {
      // Check roles document
      const rolesRef = doc(db, 'app_config', 'roles');
      const rolesSnap = await getDoc(rolesRef);
      
      if (rolesSnap.exists()) {
        info.roles.exists = true;
        const data = rolesSnap.data();
        info.roles.tracking_managers = data.tracking_managers || [];
        
        if (info.roles.tracking_managers.some(
          (email: string) => email.toLowerCase() === currentUser?.email?.toLowerCase()
        )) {
          info.isManager = true;
        }
      }
    } catch (e: any) {
      info.roles.error = e.message;
    }

    try {
      // Get ALL absences
      const absencesRef = collection(db, 'absences');
      const absencesSnap = await getDocs(absencesRef);
      
      info.absences.count = absencesSnap.size;
      
      const recentRecords: typeof debugInfo.absences.recent = [];
      let myCount = 0;
      let otherCount = 0;
      
      absencesSnap.forEach((doc) => {
        const data = doc.data();
        const isMyReport = data.teacherId === currentUser?.uid;
        
        if (isMyReport) myCount++;
        else otherCount++;
        
        recentRecords.push({
          id: doc.id,
          date: data.date || 'N/A',
          teacherId: data.teacherId || 'N/A',
          teacherEmail: data.teacherEmail || 'N/A',
          groupName: data.groupName || 'N/A',
          studentCount: data.absentStudents?.length || 0,
          timestamp: data.timestamp || 'N/A',
          isMyReport: isMyReport,
        });
      });
      
      info.absences.myReports = myCount;
      info.absences.otherReports = otherCount;
      
      // Sort by timestamp descending
      recentRecords.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      info.absences.recent = recentRecords.slice(0, 30);
    } catch (e: any) {
      console.error('Error fetching absences:', e);
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const handleAddManager = async () => {
    if (!newManagerEmail.trim()) return;
    
    setIsAddingManager(true);
    try {
      const rolesRef = doc(db, 'app_config', 'roles');
      const rolesSnap = await getDoc(rolesRef);
      
      if (rolesSnap.exists()) {
        await updateDoc(rolesRef, {
          tracking_managers: arrayUnion(newManagerEmail.trim().toLowerCase())
        });
      } else {
        await setDoc(rolesRef, {
          tracking_managers: [newManagerEmail.trim().toLowerCase()]
        });
      }
      
      toast({ title: 'Manager agregado', description: `${newManagerEmail} ha sido agregado como manager.` });
      setNewManagerEmail('');
      await runDiagnostics();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsAddingManager(false);
    }
  };

  const sendTestReport = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'No hay usuario autenticado' });
        return;
      }
      
      const testReport = {
        groupId: 'test_diagnostic',
        groupName: 'TEST DIAGNÓSTICO - ELIMINAR',
        date: new Date().toLocaleDateString('es-MX'),
        teacherId: currentUser.uid,
        teacherEmail: currentUser.email,
        absentStudents: [{ id: 'test', name: 'Estudiante de Prueba' }],
        timestamp: new Date().toISOString(),
        isTestReport: true,
      };
      
      await setDoc(doc(db, 'absences', `test_${Date.now()}`), testReport);
      
      toast({ title: 'Reporte de prueba enviado', description: `UID: ${currentUser.uid}` });
      await runDiagnostics();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  if (loadingAuth || loadingAdmin || isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Ejecutando diagnóstico...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnóstico de Reportes de Inasistencia</h1>
          <p className="text-muted-foreground">
            Verifica por qué tus reportes no llegan a la responsable
          </p>
        </div>
        <Button onClick={runDiagnostics}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* CRITICAL: Auth State */}
      <Card className={debugInfo.user.uid ? 'border-green-500' : 'border-red-500'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {debugInfo.user.uid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            Estado de Autenticación (CRÍTICO)
          </CardTitle>
          <CardDescription>
            Verifica que el UID coincida con tu cuenta correcta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Tu UID en esta instalación</p>
              <p className="font-mono text-lg font-bold break-all">
                {debugInfo.user.uid || 'NO AUTENTICADO'}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Tu Email</p>
              <p className="font-mono text-lg font-bold">
                {debugInfo.user.email || 'NO AUTENTICADO'}
              </p>
            </div>
          </div>
          
          {!debugInfo.user.uid && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="font-semibold text-red-800">⚠️ NO HAY USUARIO AUTENTICADO</p>
              <p className="text-sm text-red-700">
                En esta instalación no hay usuario logueado. Los reportes se enviarán como "guest_teacher".
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de Reportes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Resumen de Reportes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{debugInfo.absences.myReports}</p>
              <p className="text-sm text-green-700">Tus Reportes</p>
              <p className="text-xs text-muted-foreground">(con tu UID actual)</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{debugInfo.absences.otherReports}</p>
              <p className="text-sm text-blue-700">Otros Docentes</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{debugInfo.absences.count}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
          
          {debugInfo.absences.myReports === 0 && debugInfo.absences.count > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800">No hay reportes con tu UID actual</p>
                  <p className="text-sm text-yellow-700">
                    Hay {debugInfo.absences.count} reportes en la base de datos, pero ninguno coincide con tu UID actual.
                    Esto indica que has enviado reportes desde otra cuenta o instalación.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Recientes (¿Cuáles son tuyos?)</CardTitle>
          <CardDescription>
            Los marcados con ✓ son los que coinciden con tu UID actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Grupo</th>
                  <th className="text-left p-2">Docente Email</th>
                  <th className="text-left p-2">Teacher UID</th>
                  <th className="text-left p-2">Alumnos</th>
                  <th className="text-left p-2">¿Mío?</th>
                </tr>
              </thead>
              <tbody>
                {debugInfo.absences.recent.map((record) => (
                  <tr key={record.id} className={`border-b ${record.isMyReport ? 'bg-green-50' : ''}`}>
                    <td className="p-2">{record.date}</td>
                    <td className="p-2">{record.groupName}</td>
                    <td className="p-2">{record.teacherEmail}</td>
                    <td className="p-2 font-mono text-xs">
                      {record.isMyReport ? (
                        <span className="text-green-600 font-bold">{record.teacherId}</span>
                      ) : (
                        <span>{record.teacherId}</span>
                      )}
                    </td>
                    <td className="p-2">{record.studentCount}</td>
                    <td className="p-2">
                      {record.isMyReport ? (
                        <Badge className="bg-green-500">✓ Tuyo</Badge>
                      ) : (
                        <Badge variant="outline">Otro</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones de Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={sendTestReport} variant="default">
              <Send className="mr-2 h-4 w-4" />
              Enviar Reporte de Prueba
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Esto enviará un reporte de prueba para verificar que tu UID se está guardando correctamente.
          </p>
        </CardContent>
      </Card>

      {/* Configuración de Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tracking Managers
          </CardTitle>
          <CardDescription>
            Usuarios que pueden ver TODOS los reportes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            {debugInfo.roles.tracking_managers.map((email, i) => (
              <div key={i} className="flex items-center gap-2">
                {email.toLowerCase() === debugInfo.user.email?.toLowerCase() ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span className={email.toLowerCase() === debugInfo.user.email?.toLowerCase() ? 'font-bold text-green-600' : ''}>
                  {email}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="email@ejemplo.com"
              value={newManagerEmail}
              onChange={(e) => setNewManagerEmail(e.target.value)}
            />
            <Button onClick={handleAddManager} disabled={isAddingManager}>
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instrucciones */}
      <Card className="border-blue-500">
        <CardHeader>
          <CardTitle className="text-blue-700">Instrucciones de Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex gap-4">
            <Smartphone className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-semibold">Paso 1: Abre esta página en la aplicación problemática</p>
              <p>Ve a Admin → Diagnóstico de Seguimiento y compara el UID mostrado.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Monitor className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-semibold">Paso 2: Compara con otra instalación</p>
              <p>Abre la misma página en el navegador o en otro dispositivo donde los reportes sí funcionan.</p>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="font-semibold text-blue-800">Si los UID son diferentes:</p>
            <p className="text-blue-700">La aplicación problemática está usando una cuenta diferente. Cierra sesión y vuelve a iniciar con la cuenta correcta.</p>
          </div>
          <div className="p-3 bg-green-50 rounded-md">
            <p className="font-semibold text-green-800">Si los UID son iguales:</p>
            <p className="text-green-700">El problema puede ser de fecha/hora o de permisos de la responsable. Verifica que el email de la responsable esté en Tracking Managers.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
