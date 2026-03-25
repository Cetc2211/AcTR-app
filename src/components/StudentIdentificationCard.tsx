'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Home, Phone, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Student } from "@/lib/store";

interface StudentIdentificationCardProps {
    student: Student;
}

const DataField = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex items-start">
        <div className="w-8 pt-1 text-gray-500">{icon}</div>
        <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-base font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);

export default function StudentIdentificationCard({ student }: StudentIdentificationCardProps) {

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <User className="h-6 w-6 text-blue-600"/>
                    Ficha de Identificación
                </CardTitle>
                <CardDescription>
                    Datos demográficos y de contacto del estudiante.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6">
                
                {/* SECCIÓN I: DATOS GENERALES */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">I. Datos Generales del Estudiante</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DataField icon={<User />} label="Nombre Completo" value={student.name} />
                        <DataField icon={<Shield />} label="Edad" value={`${student.demographics.age} años`} />
                        <DataField icon={<Home />} label="Grupo" value={student.demographics.group} />
                        <DataField icon={<Home />} label="Semestre" value={student.demographics.semester} />
                    </div>
                </div>

                <Separator />

                {/* SECCIÓN II: CONTACTO DE EMERGENCIA */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">II. Contacto Primario de Emergencia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DataField icon={<User />} label="Nombre del Contacto" value={student.emergencyContact.name} />
                        <DataField icon={<Phone />} label="Teléfono" value={student.emergencyContact.phone} />
                    </div>
                </div>
                
                {student.dualRelationshipNote && (
                    <>
                        <Separator />
                        {/* SECCIÓN III: NOTA DE TRAZABILIDAD */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">III. Trazabilidad de Relación Dual (Cap. 4.3)</h3>
                             <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-md">
                                <p className="text-sm text-yellow-800">{student.dualRelationshipNote}</p>
                            </div>
                        </div>
                    </>
                )}

            </CardContent>
        </Card>
    );
}
