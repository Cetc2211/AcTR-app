'use client';

import ScreeningManagement from '@/components/screening-management';
import { useSession } from '@/context/SessionContext';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ScreeningPage() {
    const { role } = useSession();

    if (role === 'loading') {
        return <div className="p-8">Cargando...</div>;
    }

    if (role !== 'Clinico') {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Acceso Denegado</AlertTitle>
                    <AlertDescription>
                        Este módulo es exclusivo para el Rol Clínico.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Módulo de Aplicación de Pruebas (Rol Clínico)</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Generación de enlaces de aplicación para instrumentos clínicos especializados (Nivel 3).
                </p>
            </div>
            
            <ScreeningManagement />
        </div>
    );
}
