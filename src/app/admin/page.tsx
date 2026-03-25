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

// DECLARACIÓN DEL ADMINISTRADOR
// ¡IMPORTANTE! Cambia esta dirección por tu correo electrónico.
const ADMIN_EMAIL = "mpceciliotopetecruz@gmail.com";

export default function AdminPage() {
    const { user, isLoading } = useData();
    const { toast } = useToast();

    // Este estado será para la lista de usuarios autorizados
    const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');

    const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL, [user]);

    // Simular carga de datos
    useEffect(() => {
        if (isAdmin) {
            // Aquí cargaríamos la lista desde la base de datos en un futuro
            // Por ahora, es una lista simulada.
            const storedEmails = localStorage.getItem('authorized_emails');
            if(storedEmails) {
              setAuthorizedEmails(JSON.parse(storedEmails));
            } else {
              setAuthorizedEmails(['test@example.com', 'demo@example.com']);
            }
        }
    }, [isAdmin]);
    
    useEffect(() => {
        if (isAdmin) {
            localStorage.setItem('authorized_emails', JSON.stringify(authorizedEmails));
        }
    }, [authorizedEmails, isAdmin]);


    const handleAddEmail = () => {
        if (!newEmail || !newEmail.includes('@')) {
            toast({
                variant: 'destructive',
                title: 'Correo inválido',
                description: 'Por favor, ingresa una dirección de correo válida.',
            });
            return;
        }
        if (authorizedEmails.includes(newEmail)) {
            toast({
                variant: 'destructive',
                title: 'Correo duplicado',
                description: 'Este correo ya está en la lista de autorizados.',
            });
            return;
        }

        // Aquí iría la lógica para guardarlo en la base de datos
        setAuthorizedEmails(prev => [...prev, newEmail]);
        setNewEmail('');
        toast({
            title: 'Usuario Autorizado',
            description: `El correo ${newEmail} ahora puede registrarse en la aplicación.`,
        });
    };

    const handleRemoveEmail = (emailToRemove: string) => {
         // Aquí iría la lógica para eliminarlo de la base de datos
        setAuthorizedEmails(prev => prev.filter(email => email !== emailToRemove));
        toast({
            title: 'Acceso Revocado',
            description: `El correo ${emailToRemove} ya no podrá crear una cuenta.`,
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Verificando acceso...
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
                        Esta es la lista de usuarios que tienen permiso para crear una cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {authorizedEmails.length > 0 ? (
                            authorizedEmails.map(email => (
                                <div key={email} className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                                    <p className="font-mono text-sm">{email}</p>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleRemoveEmail(email)}>
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
