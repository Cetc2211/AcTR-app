
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
import { Loader2, Shield, PlusCircle, Trash2, Eye, Users, ArrowRight } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase'; // Added db
import { notFound, useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Added Firestore imports
import { useData } from '@/hooks/use-data';

const ADMIN_EMAIL = "mpceciliotopetecruz@gmail.com";

export default function AdminPage() {
    const [user, isLoading] = useAuthState(auth);
    const { toast } = useToast();
    const router = useRouter();
    const { officialGroups } = useData();

    const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
    const [trackingManagers, setTrackingManagers] = useState<string[]>([]); // New State
    
    const [newEmail, setNewEmail] = useState('');
    const [newTrackingEmail, setNewTrackingEmail] = useState(''); // New State

    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);

    // Fetch config from Firestore
    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoadingConfig(true);
            try {
                const docRef = doc(db, 'app_config', 'roles');
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.authorized_emails && Array.isArray(data.authorized_emails)) {
                        setAuthorizedEmails(data.authorized_emails);
                    }
                     if (data.tracking_managers && Array.isArray(data.tracking_managers)) {
                        setTrackingManagers(data.tracking_managers);
                    }
                } else {
                    // Fallback to localStorage for authorized_emails migration if Firestore is empty
                    const storedEmails = localStorage.getItem('authorized_emails');
                    if (storedEmails) {
                        try {
                            const parsedEmails = JSON.parse(storedEmails);
                            if (Array.isArray(parsedEmails)) {
                                setAuthorizedEmails(parsedEmails);
                                // Save to Firestore immediately to migrate
                                await setDoc(docRef, { authorized_emails: parsedEmails }, { merge: true });
                            }
                        } catch (e) {
                            console.error("Error migrating local storage:", e);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching admin config:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la configuración.' });
            } finally {
                setIsLoadingConfig(false);
            }
        };

        fetchConfig();
    }, [toast]);

    const saveConfig = async (newAuthorized: string[], newTracking: string[]) => {
        setIsSaving(true);
        try {
            const docRef = doc(db, 'app_config', 'roles');
            await setDoc(docRef, {
                authorized_emails: newAuthorized,
                tracking_managers: newTracking
            }, { merge: true });
            
            setAuthorizedEmails(newAuthorized);
            setTrackingManagers(newTracking);
            
            // Also update localStorage for fallback/redundancy for authorized_emails
            localStorage.setItem('authorized_emails', JSON.stringify(newAuthorized));

            toast({ title: 'Configuración actualizada', description: 'Los cambios han sido guardados en la base de datos.' });
        } catch (e) {
            console.error("Error saving config:", e);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la configuración.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddEmail = () => {
        if (!newEmail.trim() || !newEmail.includes('@')) {
            toast({ variant: 'destructive', title: 'Correo inválido', description: 'Por favor, ingresa un correo electrónico válido.' });
            return;
        }
        const emailToAdd = newEmail.toLowerCase().trim();
        if (authorizedEmails.includes(emailToAdd) || emailToAdd === ADMIN_EMAIL) {
            toast({ variant: 'destructive', title: 'Correo duplicado', description: 'Este correo ya está en la lista.' });
            return;
        }
        saveConfig([...authorizedEmails, emailToAdd], trackingManagers);
        setNewEmail('');
    };

    const handleRemoveEmail = (emailToRemove: string) => {
        if (emailToRemove.toLowerCase() === ADMIN_EMAIL) {
            toast({ variant: 'destructive', title: 'Acción no permitida', description: 'No puedes eliminar al administrador principal.' });
            return;
        }
        saveConfig(authorizedEmails.filter(email => email.toLowerCase() !== emailToRemove.toLowerCase()), trackingManagers);
    };

    const handleAddTrackingManager = () => {
        if (!newTrackingEmail.trim() || !newTrackingEmail.includes('@')) {
            toast({ variant: 'destructive', title: 'Correo inválido', description: 'Por favor, ingresa un correo electrónico válido.' });
            return;
        }
        const emailToAdd = newTrackingEmail.toLowerCase().trim();
        if (trackingManagers.includes(emailToAdd)) {
             toast({ variant: 'destructive', title: 'Correo duplicado', description: 'Este correo ya es responsable de seguimiento.' });
             return;
        }
        saveConfig(authorizedEmails, [...trackingManagers, emailToAdd]);
        setNewTrackingEmail('');
    };

    const handleRemoveTrackingManager = (emailToRemove: string) => {
        saveConfig(authorizedEmails, trackingManagers.filter(email => email.toLowerCase() !== emailToRemove.toLowerCase()));
    };


    if (isLoading || isLoadingConfig) {
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
                    Gestiona los usuarios y roles de la aplicación.
                </p>
            </div>
            
            {/* Tracking Managers Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Responsables de Seguimiento</CardTitle>
                    <CardDescription>
                        Usuarios autorizados para ver el monitor de inasistencias (Reportes de Seguimiento).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="new-tracking-email">Añadir Responsable</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="new-tracking-email"
                                type="email"
                                placeholder="responsable@ejemplo.com"
                                value={newTrackingEmail}
                                onChange={(e) => setNewTrackingEmail(e.target.value)}
                            />
                            <Button onClick={handleAddTrackingManager}>
                                <Eye className="mr-2 h-4 w-4" />
                                Añadir Permiso
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Usuarios con Acceso</Label>
                        <div className="space-y-2 p-3 border rounded-md max-h-60 overflow-y-auto">
                            {trackingManagers.length > 0 ? (
                                trackingManagers.map(email => (
                                    <div key={email} className="flex justify-between items-center bg-background p-2 rounded">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm">{email}</span>
                                        </div>
                                        <Button size="icon" variant="ghost" onClick={() => handleRemoveTrackingManager(email)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No hay responsables asignados (solo Admin).</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Registro de Usuarios</CardTitle>
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

            {/* Gestión de Grupos Oficiales (Fase 1) */}
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Gestión de Grupos Oficiales
                    </CardTitle>
                    <CardDescription>
                        Administración centralizada de listas de estudiantes y asignación de grupos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="space-y-1">
                         <p className="text-sm font-medium">Grupos activos en el sistema</p>
                         <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {officialGroups ? officialGroups.length : 0}
                         </p>
                    </div>
                    <Button 
                        onClick={() => router.push('/admin/official-groups')}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Aperturar / Gestionar Grupos
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
