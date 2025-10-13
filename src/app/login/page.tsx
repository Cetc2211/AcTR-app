'use client';

import { useState } from 'react';
import { useSignInWithEmailAndPassword, useSendPasswordResetEmail } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AuthError } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInWithEmailAndPassword, user, loading, error] = useSignInWithEmailAndPassword(auth);
  const [sendPasswordResetEmail, sending, resetError] = useSendPasswordResetEmail(auth);
  const { toast } = useToast();
  const router = useRouter();
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleSignIn = async () => {
    try {
      const result = await signInWithEmailAndPassword(email, password);
      if (result) {
        toast({
          title: 'Inicio de sesión exitoso',
          description: 'Bienvenido de nuevo.',
        });
        router.push('/dashboard');
      } else if (error) {
        let errorMessage = 'Las credenciales proporcionadas no son válidas. Por favor, inténtalo de nuevo.';
        // Check if the error object has a 'code' property, which is typical for Firebase Auth errors.
        if (typeof error === 'object' && error !== null && 'code' in error) {
          const authError = error as { code: string };
          switch (authError.code) {
            case 'auth/user-not-found':
              errorMessage = 'Este correo electrónico no está registrado. Por favor, crea una cuenta.';
              break;
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
               errorMessage = 'Contraseña incorrecta. Por favor, inténtalo de nuevo.';
               break;
            case 'auth/invalid-email':
              errorMessage = 'El formato del correo electrónico no es válido.';
              break;
            default:
              console.error('Firebase Auth Error:', error);
          }
        }
         toast({
          variant: 'destructive',
          title: 'Error al iniciar sesión',
          description: errorMessage,
        });
      }
    } catch (e: any) {
       toast({
        variant: 'destructive',
        title: 'Error inesperado',
        description: 'Ocurrió un error al intentar iniciar sesión. Por favor, revisa la consola para más detalles.',
      });
    }
  };
  
  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ variant: 'destructive', title: 'Correo requerido', description: 'Por favor, ingresa tu correo electrónico.' });
        return;
    }
    try {
        const success = await sendPasswordResetEmail(resetEmail);
        if (success) {
            toast({ title: 'Correo enviado', description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.' });
            setIsResetDialogOpen(false);
        } else {
            let errorMessage = 'No se pudo enviar el correo de recuperación. Inténtalo de nuevo.';
            if (resetError && typeof resetError === 'object' && 'code' in resetError) {
                const authError = resetError as { code: string; message: string };
                switch (authError.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Este correo electrónico no está registrado. No se puede enviar el correo.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'El formato del correo electrónico no es válido.';
                        break;
                    default:
                        errorMessage = authError.message;
                }
            }
            toast({ variant: 'destructive', title: 'Error al enviar correo', description: errorMessage });
        }
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un problema al enviar el correo de recuperación.' });
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Restablecer Contraseña</AlertDialogTitle>
                <AlertDialogDescription>
                    Ingresa tu correo electrónico y te enviaremos un enlace para que puedas restablecer tu contraseña.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Label htmlFor="reset-email">Correo Electrónico</Label>
                <Input 
                    id="reset-email"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                />
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handlePasswordReset} disabled={sending}>
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Enviar Correo
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tu correo y contraseña para acceder a tu panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>
          <div className="grid gap-2">
             <div className="flex items-center">
              <Label htmlFor="password">Contraseña</Label>
               <Button variant="link" className="ml-auto inline-block text-sm p-0 h-auto" onClick={() => { setResetEmail(email); setIsResetDialogOpen(true); }}>
                    ¿Olvidaste tu contraseña?
                </Button>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleSignIn} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Iniciar Sesión
          </Button>
          <div className="text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
   
