'use client';
























echo "You can view these logs in GCP Console > Logging > Logs Explorer"echo "Note: Firebase Auth automatically logs authentication events to GCP Cloud Logging"fi    exit 1    echo "❌ Failed to enable audit logs"else    echo "Failed login attempts will now be logged to Cloud Storage"    echo "✅ Audit logs for authentication events enabled"if [ $? -eq 0 ]; then  --project=$PROJECT_ID  --log-filter='resource.type="firebaseauth.googleapis.com/Project" AND (protoPayload.methodName="google.firebase.auth.v1.AuthenticationService.SignInWithPassword" OR protoPayload.methodName="google.firebase.auth.v1.AuthenticationService.SignInWithEmailLink")' \  storage.googleapis.com/academic-tracker-audit-logs \gcloud logging sinks create auth-audit-logs \# Enable Data Access audit logs for Firebase Authenticationecho "Enabling Cloud Audit Logs for Firebase Authentication..."PROJECT_ID="academic-tracker-qeoxi"# This enables logging of authentication events including failed login attempts# Script to enable Cloud Audit Logs for Firebase Authenticationimport { useState } from 'react';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
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
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const SignupFormSchema = z.object({
  email: z.string().email({ message: 'Por favor, ingresa un email válido.' }),
  password: z.string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
    .regex(/[A-Z]/, { message: 'La contraseña debe contener al menos una letra mayúscula.' })
    .regex(/[a-z]/, { message: 'La contraseña debe contener al menos una letra minúscula.' })
    .regex(/[0-9]/, { message: 'La contraseña debe contener al menos un número.' })
    .regex(/[^A-Za-z0-9]/, { message: 'La contraseña debe contener al menos un carácter especial.' }),
  confirmPassword: z.string(),
  accessCode: z.string().min(1, { message: 'El código de institución es requerido.' })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
}).refine((data) => data.accessCode === "ACTRACKER_TEACHER_2025", {
  message: "Código de institución inválido. Solicítalo a la administración.",
  path: ["accessCode"],
});


export default function SignupPage() {
  const [createUserWithEmailAndPassword, user, loading, error] = useCreateUserWithEmailAndPassword(auth);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof SignupFormSchema>>({
    resolver: zodResolver(SignupFormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      accessCode: '',
    },
  });

  const handleSignUp = async (values: z.infer<typeof SignupFormSchema>) => {
    try {
      const newUser = await createUserWithEmailAndPassword(values.email, values.password);
      if (newUser) {
        toast({
          title: 'Cuenta creada exitosamente',
          description: 'Ahora puedes iniciar sesión.',
        });
        router.push('/login');
      } else if (error) {
        throw error;
      }
    } catch (e: any) {
        const errorMessage = e.code === 'auth/email-already-in-use'
            ? 'Este correo electrónico ya está en uso.'
            : 'Ocurrió un error al crear la cuenta.';
      toast({
        variant: 'destructive',
        title: 'Error al registrarse',
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>
            Ingresa tus datos para registrarte.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignUp)}>
                <CardContent className="grid gap-4">
                    <FormField
                        control={form.control}
                        name="accessCode"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Código de Institución</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Código proporcionado por dirección" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Correo Electrónico</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="nombre@ejemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Confirmar Contraseña</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        Registrarse
                    </Button>
                     <div className="text-center text-sm">
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/login" className="underline">
                        Iniciar Sesión
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  );
}
