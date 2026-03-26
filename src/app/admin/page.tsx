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
import { Loader2, ShieldCheck, UserX, UserPlus, Lock } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminPage() {
    const { user, isLoading: isDataLoading } = useData();
    const { toast } = useToast();

    // Estado para verificar si el usuario es administrador
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [checkingAdmin, setCheckingAdmin] = useState(true);

    // Lista de correos autorizados (admins)
    const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');

    // Verificar permisos y cargar lista
    useEffect(() => {
        if (!user) {
            setIsAdmin(false);
            setCheckingAdmin(false);
            return;
        }

        const q = query(collection(db, 'admins'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const emails: string[] = [];
            let currentUserIsAdmin = false;

            snapshot.forEach((doc) => {
                const data = doc.data();
                const email = data.email || doc.id; // Support both ID as email or field
                if (email) {
                    emails.push(email);
                    if (email.toLowerCase() === user.email?.toLowerCase()) {
                        currentUserIsAdmin = true;
                    }
                }
            });

            if (user.email?.toLowerCase() === 'mpceciliotopetecruz@gmail.com') {
                currentUserIsAdmin = true;
            }

            setAuthorizedEmails(emails);
            setIsAdmin(currentUserIsAdmin);
            setCheckingAdmin(false);
        }, (error) => {
            console.error("Error fetching admins:", error);
            if (user.email?.toLowerCase() === 'mpceciliotopetecruz@gmail.com') {
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
    }, [user, toast]);


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
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck /> Panel de Administrador</h1>
                <p className="text-muted-foreground">
                    Gestiona los usuarios autorizados para registrarse en la aplicación.
                </p>
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
