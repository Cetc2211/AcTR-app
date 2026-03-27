'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, UserX, UserPlus, Lock, Users, AlertTriangle } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth'; // Import auth directly
import Link from 'next/link';


export default function AdminPage() {
    const { user: dataUser, isLoading: isDataLoading } = useData();
    const { toast } = useToast();
    
    // Fallback auth check
    const [authUser, setAuthUser] = useState<any>(null);
    const [authChecked, setAuthChecked] = useState(false);
    
    useEffect(() => {
        if (dataUser) {
            setAuthUser(dataUser);
            setAuthChecked(true);
        }
        
        // Always try direct auth just in case useData is slow/failing
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged((u) => {
             console.log("Direct auth user found:", u?.email);
             if (u) {
                 setAuthUser(u);
             }
             setAuthChecked(true);
        });
        return () => unsubscribe();
    }, [dataUser]);

    const user = authUser || dataUser;

    // Estado para verificar si el usuario es administrador
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [checkingAdmin, setCheckingAdmin] = useState(true);

    // Lista de correos autorizados (admins)
    const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');

    // Verificar permisos y cargar lista
    useEffect(() => {
        // Wait for direct auth check or useData loading
        if (!authChecked && isDataLoading) {
            return;
        }

        if (!user) {
            // Give it a small grace period if just loaded
            if (authChecked) {
                 setIsAdmin(false);
                 setCheckingAdmin(false);
            }
            return;
        }

        // --- BYPASS DE EMERGENCIA INMEDIATO ---
        // Se ejecuta antes de cualquier llamada a la base de datos
        // para asegurar acceso instantáneo a mpceciliotopetecruz@gmail.com
        const currentEmail = user.email ? user.email.toLowerCase().trim() : '';
        if (currentEmail === 'mpceciliotopetecruz@gmail.com') {
            console.log("BYPASS ACTIVATED for:", currentEmail);
            setIsAdmin(true);
            setCheckingAdmin(false); // Detener spinner inmediatamente para este usuario
            // No return here, we still want to fetch the list for display
        }
        // --------------------------------------

        const q = query(collection(db, 'admins'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const emails: string[] = [];
            let currentUserIsAdmin = false;

            snapshot.forEach((doc) => {
                const data = doc.data();
                const email = data.email || doc.id; // Support both ID as email or field
                if (email) {
                    emails.push(email);
                    if (email.toLowerCase() === currentEmail) {
                        currentUserIsAdmin = true;
                    }
                }
            });

            // Re-validar en onSnapshot por si acaso no entró en el bypass inicial
            if (currentEmail === 'mpceciliotopetecruz@gmail.com') {
                currentUserIsAdmin = true;
            }

            setAuthorizedEmails(emails);
            // Solo actualizamos si no somos el super admin, para no causar parpadeos
            // o si queremos actualizar la lista pero mantener el acceso
            if (currentEmail !== 'mpceciliotopetecruz@gmail.com') {
                 setIsAdmin(currentUserIsAdmin);
                 setCheckingAdmin(false);
            } else {
                // Para super admin, ya seteamos true arriba, pero aseguramos
                 setIsAdmin(true);
                 setCheckingAdmin(false);
            }
        }, (error) => {
            console.error("Error fetching admins:", error);
            
            // Re-validar en error también
            if (currentEmail === 'mpceciliotopetecruz@gmail.com') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
            setCheckingAdmin(false);
             toast({
                variant: 'destructive',
                title: 'Error de conexión',
                description: 'No se pudo verificar los permisos de administrador.',
            });
        });

        return () => unsubscribe();
    }, [user, isDataLoading, authChecked, toast]);


    const handleAddEmail = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            toast({
                variant: 'destructive',
                title: 'Correo inválido',
                description: 'Por favor, ingresa una dirección de correo válida.',
            });
            return;
        }
        
        const emailToAdd = newEmail.trim().toLowerCase();

        if (authorizedEmails.some(e => e.toLowerCase() === emailToAdd)) {
            toast({
                variant: 'destructive',
                title: 'Correo duplicado',
                description: 'Este correo ya está en la lista de autorizados.',
            });
            return;
        }

        try {
            // Usamos el email como ID del documento para unicidad y fácil acceso
            await setDoc(doc(db, 'admins', emailToAdd), {
                email: emailToAdd,
                createdAt: serverTimestamp(),
                createdBy: user?.email
            });
            
            setNewEmail('');
            toast({
                title: 'Usuario Autorizado',
                description: `El correo ${emailToAdd} ha sido añadido a la lista de administradores.`,
            });
        } catch (error) {
            console.error("Error adding admin:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo añadir el usuario.',
            });
        }
    };

    const handleRemoveEmail = async (emailToRemove: string) => {
        if (emailToRemove.toLowerCase() === user?.email?.toLowerCase()) {
             toast({
                variant: 'destructive',
                title: 'Acción no permitida',
                description: 'No puedes eliminar tu propio acceso de administrador.',
            });
            return;
        }

        try {
            await deleteDoc(doc(db, 'admins', emailToRemove));
            toast({
                title: 'Acceso Revocado',
                description: `El correo ${emailToRemove} ha sido eliminado de la lista.`,
            });
        } catch (error) {
             console.error("Error removing admin:", error);
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo eliminar el usuario.',
            });
        }
    };

    if (isDataLoading || checkingAdmin) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" /> 
                <span>{checkingAdmin ? 'Verificando permisos...' : 'Cargando datos...'}</span>
            </div>
        );
    }
    
    if (!isAdmin) {
        return (
            <Card className="m-auto mt-12 max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto w-fit rounded-full bg-destructive/10 p-3">
                        <Lock className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="mt-4 text-2xl text-destructive">Acceso Denegado</CardTitle>
                    <CardDescription>
                        No tienes los permisos necesarios para acceder a esta página. Esta sección es exclusiva para el administrador de la aplicación.
                        <br/><br/>
                        <span className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                           Usuario actual: {user?.email || 'No identificado'}
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                     {!user && (
                         <Button onClick={() => window.location.href = '/login'}>
                            Ir a Iniciar Sesión
                         </Button>
                     )}
                     {user && (
                         <Button variant="outline" onClick={() => {
                             // Force logout
                             import('firebase/auth').then(({getAuth, signOut}) => signOut(getAuth()));
                             window.location.reload();
                         }}>
                             Cerrar Sesión y Reintentar
                         </Button>
                     )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck /> Panel de Administrador</h1>
                <p className="text-muted-foreground">
                    Accede a la gestión institucional y controla permisos de acceso.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Gestión de Grupos Oficiales
                        </CardTitle>
                        <CardDescription>
                            Administra grupos institucionales, altas de estudiantes, anuncios y justificaciones.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/admin/official-groups">Abrir Gestión de Grupos Oficiales</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Seguimiento de Inasistencias
                        </CardTitle>
                        <CardDescription>
                            Revisa ausencias, contacto con tutores y acciones de seguimiento.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/admin/absences">Abrir Seguimiento</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Autorizar Nuevo Usuario</CardTitle>
                    <CardDescription>
                        Ingresa el correo electrónico del usuario al que quieres dar acceso. Una vez añadido, podrá crear su cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input 
                            type="email" 
                            placeholder="correo@ejemplo.com"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                        />
                        <Button onClick={handleAddEmail}>
                            <UserPlus className="mr-2" /> Autorizar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Usuarios Autorizados</CardTitle>
                    <CardDescription>
                        Esta es la lista de usuarios que tienen permiso para acceder a esta aplicación.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {authorizedEmails.length > 0 ? (
                            authorizedEmails.map(email => (
                                <div key={email} className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                                    <p className="font-mono text-sm">{email}</p>
                                    <Button variant="ghost" size="icon" 
                                            className="text-destructive hover:text-destructive" 
                                            onClick={() => handleRemoveEmail(email)}
                                            disabled={email.toLowerCase() === user?.email?.toLowerCase()}
                                    >
                                        <UserX className="h-4 w-4" />
                                        <span className="sr-only">Revocar acceso</span>
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No hay usuarios autorizados añadidos.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
