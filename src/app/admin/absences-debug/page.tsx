'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Users, Shield, Database } from 'lucide-react';

export default function AbsencesDebugPage() {
  const { isAdmin, loading: loadingAdmin } = useAdmin();
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<{
    user: {
      uid: string | null;
      email: string | null;
      emailVerified: boolean;
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
      recent: {
        id: string;
        date: string;
        teacherId: string;
        teacherEmail: string;
        groupName: string;
        studentCount: number;
        timestamp: string;
      }[];
    };
  }>({
    user: { uid: null, email: null, emailVerified: false },
    roles: { exists: false, tracking_managers: [] },
    isManager: false,
    isAdmin: false,
    absences: { count: 0, recent: [] }
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
    
    const info = {
      user: {
        uid: user?.uid || null,
        email: user?.email || null,
        emailVerified: user?.emailVerified || false,
      },
      roles: {
        exists: false,
        tracking_managers: [] as string[],
      },
      isManager: false,
      isAdmin: isAdmin,
      absences: {
        count: 0,
        recent: [] as typeof debugInfo.absences.recent,
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
        
        // Check if current user is manager
        if (info.roles.tracking_managers.some(
          (email: string) => email.toLowerCase() === user?.email?.toLowerCase()
        )) {
          info.isManager = true;
        }
      }
    } catch (e: any) {
      info.roles.error = e.message;
    }

    try {
      // Get absences count and recent records
      const absencesRef = collection(db, 'absences');
      const absencesSnap = await getDocs(absencesRef);
      
      info.absences.count = absencesSnap.size;
      
      const recentRecords: typeof debugInfo.absences.recent = [];
      absencesSnap.forEach((doc) => {
        const data = doc.data();
        recentRecords.push({
          id: doc.id,
          date: data.date || 'N/A',
          teacherId: data.teacherId || 'N/A',
          teacherEmail: data.teacherEmail || 'N/A',
          groupName: data.groupName || 'N/A',
          studentCount: data.absentStudents?.length || 0,
          timestamp: data.timestamp || 'N/A',
        });
      });
      
      // Sort by timestamp descending
      recentRecords.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      info.absences.recent = recentRecords.slice(0, 20);
    } catch (e: any) {
      console.error('Error fetching absences:', e);
    }

    setDebugInfo(info);
    setIsLoading(false);
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
          <h1 className="text-3xl font-bold">Diagnóstico de Seguimiento</h1>
          <p className="text-muted-foreground">
            Verificación de permisos y estado de la colección de inasistencias
          </p>
        </div>
        <Button onClick={runDiagnostics}>
          Actualizar Diagnóstico
        </Button>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuario Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">UID</p>
              <p className="font-mono text-sm">{debugInfo.user.uid || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-mono text-sm">{debugInfo.user.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Verificado</p>
              <Badge variant={debugInfo.user.emailVerified ? "default" : "secondary"}>
                {debugInfo.user.emailVerified ? 'Sí' : 'No'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Es Admin</p>
              <Badge variant={debugInfo.isAdmin ? "default" : "secondary"}>
                {debugInfo.isAdmin ? 'Sí' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuración de Roles
          </CardTitle>
          <CardDescription>
            Documento: app_config/roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {debugInfo.roles.error ? (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span>Error: {debugInfo.roles.error}</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Documento Existe</p>
                  <Badge variant={debugInfo.roles.exists ? "default" : "secondary"}>
                    {debugInfo.roles.exists ? 'Sí' : 'No'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Es Manager</p>
                  <Badge variant={debugInfo.isManager ? "default" : "secondary"}>
                    {debugInfo.isManager ? 'Sí' : 'No'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tracking Managers ({debugInfo.roles.tracking_managers.length})</p>
                {debugInfo.roles.tracking_managers.length > 0 ? (
                  <div className="space-y-1">
                    {debugInfo.roles.tracking_managers.map((email, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {email.toLowerCase() === debugInfo.user.email?.toLowerCase() ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                        <span className={`text-sm ${email.toLowerCase() === debugInfo.user.email?.toLowerCase() ? 'font-bold text-green-600' : ''}`}>
                          {email}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay managers configurados</p>
                )}
              </div>
              
              {!debugInfo.isManager && debugInfo.roles.exists && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-800">Usuario NO es Manager</p>
                      <p className="text-sm text-yellow-700">
                        Tu email no está en la lista de tracking_managers. Solo verás tus propios reportes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Absences Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Colección de Inasistencias
          </CardTitle>
          <CardDescription>
            Colección: absences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Total de reportes</p>
            <p className="text-2xl font-bold">{debugInfo.absences.count}</p>
          </div>
          
          {debugInfo.absences.recent.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Reportes más recientes</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Grupo</th>
                      <th className="text-left p-2">Docente</th>
                      <th className="text-left p-2">Teacher UID</th>
                      <th className="text-left p-2">Alumnos</th>
                      <th className="text-left p-2">Timestamp</th>
                      <th className="text-left p-2">¿Mío?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugInfo.absences.recent.map((record) => (
                      <tr key={record.id} className="border-b">
                        <td className="p-2 font-mono text-xs">{record.id.slice(0, 20)}...</td>
                        <td className="p-2">{record.date}</td>
                        <td className="p-2">{record.groupName}</td>
                        <td className="p-2">{record.teacherEmail}</td>
                        <td className="p-2 font-mono text-xs">
                          {record.teacherId === debugInfo.user.uid ? (
                            <span className="text-green-600 font-bold">{record.teacherId.slice(0, 10)}...</span>
                          ) : (
                            <span>{record.teacherId.slice(0, 10)}...</span>
                          )}
                        </td>
                        <td className="p-2">{record.studentCount}</td>
                        <td className="p-2 text-xs">{record.timestamp}</td>
                        <td className="p-2">
                          {record.teacherId === debugInfo.user.uid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Detection */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Diagnóstico de Problemas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!debugInfo.roles.exists && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="font-semibold text-red-800">Documento de roles no existe</p>
                <p className="text-sm text-red-700">
                  El documento app_config/roles no existe en Firebase. Nadie puede ser manager.
                </p>
              </div>
            )}
            
            {debugInfo.roles.exists && !debugInfo.isManager && !debugInfo.isAdmin && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="font-semibold text-yellow-800">Usuario sin permisos de manager</p>
                <p className="text-sm text-yellow-700">
                  Tu email ({debugInfo.user.email}) no está en la lista de tracking_managers.
                  Solo verás tus propios reportes en la sección de seguimiento.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  <strong>Solución:</strong> Agrega tu email al documento app_config/roles en el campo tracking_managers.
                </p>
              </div>
            )}
            
            {debugInfo.absences.count === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="font-semibold text-yellow-800">No hay reportes de inasistencias</p>
                <p className="text-sm text-yellow-700">
                  La colección absences está vacía. No se han reportado inasistencias todavía.
                </p>
              </div>
            )}
            
            {debugInfo.isManager && debugInfo.absences.count > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="font-semibold text-green-800">Configuración correcta</p>
                <p className="text-sm text-green-700">
                  Tienes permisos de manager. Deberías ver todos los reportes en la sección de seguimiento.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
