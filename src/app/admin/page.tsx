
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
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2, Shield, PlusCircle, Trash2 } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { notFound } from 'next/navigation';

const ADMIN_EMAIL = "mpceciliotopetecruz@gmail.com";

export default function AdminPage() {
    const [user, isLoading] = useAuthState(auth);
    const { toast } = useToast();

    const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const storedEmails = localStorage.getItem('authorized_emails');
        if (storedEmails) {
            try {
                const parsedEmails = JSON.parse(storedEmails);
                if (Array.isArray(parsedEmails)) {
                    setAuthorizedEmails(parsedEmails);
                }
            } catch (e) {
                console.error("Error al cargar correos autorizados:", e);
            }
        }
    }, []);

    const saveEmails = (emails: string[]) => {
        setIsSaving(true);
        try {
            const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase().trim()))];
            localStorage.setItem('authorized_emails', JSON.stringify(uniqueEmails));
            setAuthorizedEmails(uniqueEmails);
            toast({ title: 'Lista actualizada', description: 'La lista de correos autorizados ha sido guardada.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la lista de correos.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddEmail = () => {
        if (!newEmail.trim() || !newEmail.includes('@')) {
            toast({ variant: 'destructive', title: 'Correo inválido', description: 'Por favor, ingresa un correo electrónico válido.' });
            return;
        }
        if (authorizedEmails.includes(newEmail.toLowerCase().trim()) || newEmail.toLowerCase().trim() === ADMIN_EMAIL) {
            toast({ variant: 'destructive', title: 'Correo duplicado', description: 'Este correo ya está en la lista.' });
            return;
        }
        saveEmails([...authorizedEmails, newEmail]);
        setNewEmail('');
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        if (emailToRemove.toLowerCase() === ADMIN_EMAIL) {
            toast({ variant: 'destructive', title: 'Acción no permitida', description: 'No puedes eliminar al administrador principal.' });
            return;
        }
        saveEmails(authorizedEmails.filter(email => email.toLowerCase() !== emailToRemove.toLowerCase()));
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
            </div>
        );
    }
    
    if (user?.email?.toLowerCase() !== ADMIN_EMAIL) {
        return notFound();
    }
  
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold">Panel de Administración</h1>
                <p className="text-muted-foreground">
                    Gestiona los usuarios autorizados para registrarse en la aplicación.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Usuarios Autorizados</CardTitle>
                    <CardDescription>
                        Solo los correos electrónicos en esta lista (y el administrador principal) podrán crear una cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin-email">Administrador Principal</Label>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            <Shield className="h-5 w-5 text-primary" />
                            <span className="font-mono text-sm">{ADMIN_EMAIL}</span>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="new-email">Añadir Nuevo Correo Autorizado</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="new-email"
                                type="email"
                                placeholder="usuario@ejemplo.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                            <Button onClick={handleAddEmail}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Agregar
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Lista de Correos Autorizados</Label>
                        <div className="space-y-2 p-3 border rounded-md max-h-60 overflow-y-auto">
                            {authorizedEmails.length > 0 ? (
                                authorizedEmails.map(email => (
                                    <div key={email} className="flex justify-between items-center bg-background p-2 rounded">
                                        <span className="text-sm">{email}</span>
                                        <Button size="icon" variant="ghost" onClick={() => handleRemoveEmail(email)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No hay correos autorizados adicionales.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground">
                        Los cambios se guardan automáticamente al agregar o eliminar correos.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
