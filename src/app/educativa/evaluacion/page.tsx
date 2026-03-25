'use client';

import ScreeningManagement from "@/components/screening-management";
import { useSession } from "@/context/SessionContext";

export default function EducationalAssessmentPage() {
    const { role } = useSession();
    
    // El rol 'loading' se maneja en el provider, pero una comprobación aquí es segura.
    if (role === 'loading') {
        return <div className="p-8">Cargando...</div>
    }
    
    // Ambos roles, 'Clinico' y 'Orientador', tienen acceso a esta página según la barra lateral.
    // No se necesita una redirección para el clínico.

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto space-y-12">
                 <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">Evaluación Educativa (Nivel 1 y 2)</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Este módulo permite la aplicación masiva de instrumentos de tamizaje (CHTE, Neuropsicológico, etc.) para ingestar datos automáticamente al sistema. Cree un proceso de tamizaje, genere un enlace y asígnelo a un grupo o estudiante.
                    </p>
                </div>
                <ScreeningManagement />
            </div>
        </div>
    );
}
