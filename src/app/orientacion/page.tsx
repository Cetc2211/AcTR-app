
'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ClipboardList, FolderKanban, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function OrientadorDashboard() {
    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Panel de Orientación Educativa</h1>
                <p className="text-md text-gray-600">Gestión de Nivel 1 (Detección Universal) y Nivel 2 (Intervención Focalizada).</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Tarjeta 1: Gestión de Estudiantes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users />
                            Gestión de Estudiantes
                        </CardTitle>
                        <CardDescription>
                            Administre listas de grupos, y dé de alta nuevos estudiantes en el sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button asChild variant="outline" className="w-full">
                           <Link href="/admin">Ver/Editar Grupos</Link>
                        </Button>
                         <Button asChild>
                            <Link href="/admin">
                                <PlusCircle className="mr-2" />
                                Registrar Nuevo Estudiante
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Tarjeta 2: Aplicación de Tamizaje */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList />
                            Aplicación de Tamizaje Nivel 1
                        </CardTitle>
                        <CardDescription>
                            Genere enlaces para la aplicación masiva (grupal) o individual de los instrumentos educativos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button asChild variant="default" className="w-full bg-blue-600 hover:bg-blue-700">
                           <Link href="/educativa/evaluacion">Generar Sesión Grupal</Link>
                        </Button>
                         <Button asChild variant="secondary" className="w-full">
                               <Link href="/educativa/evaluacion">Aplicar a Estudiante Específico</Link>
                        </Button>
                    </CardContent>
                </Card>
                
                {/* Tarjeta 3: Expedientes y PIEI */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FolderKanban />
                            Expedientes y PIEI
                        </CardTitle>
                        <CardDescription>
                           Consulte los expedientes educativos, de seguimiento y los Planes de Intervención.
                        </CardDescription>
                    </CardHeader>
                     <CardContent>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/dashboard">Ver Todos los Expedientes</Link>
                        </Button>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
