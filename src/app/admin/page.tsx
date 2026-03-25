'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, RefreshCw, UserCog } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';


// Función que guarda en Firestore
async function addNewStudent(data: { studentId: string; studentName: string; group: string; dualRelationship: string; }) {
    console.log("Iniciando guardado de nuevo estudiante en Firestore...");
    
    const batch = writeBatch(db);

    // 1. Referencia a la colección de estudiantes (datos generales)
    const studentRef = doc(db, 'students', data.studentId);
    batch.set(studentRef, {
        id: data.studentId,
        name: data.studentName,
        demographics: {
            group: data.group,
            age: 0, 
            semester: 0,
        },
        academicData: {
            gpa: 0,
            absences: 0,
        },
        suicideRiskLevel: 'Bajo', // Valor por defecto
        dualRelationshipNote: data.dualRelationship, 
    });

    // 2. Referencia a la subcolección clínica (datos sensibles)
    const clinicalRecordRef = doc(db, 'students', data.studentId, 'clinical_records', 'initial_assessment');
    batch.set(clinicalRecordRef, {
        studentId: data.studentId,
        createdAt: new Date().toISOString(),
        emergencyContact: {
            name: '',
            phone: '',
        },
        // Aquí se inicializan los campos clínicos que se llenarán después
        bdi_ii_score: null,
        bai_score: null,
        impresion_diagnostica: 'Expediente recién creado, pendiente de evaluación inicial.',
    });
    
    await batch.commit();
    
    console.log("Datos guardados en Firestore para el estudiante:", data.studentId);
    return { success: true, studentId: data.studentId };
}


function AddNewStudentForm() {
    const [studentId, setStudentId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [group, setGroup] = useState('');
    const [dualRelationship, setDualRelationship] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setFeedback(null);

        if (!studentId || !studentName || !group) {
            setFeedback({ type: 'error', message: 'Los campos de ID, Nombre y Grupo son obligatorios.' });
            setIsLoading(false);
            return;
        }

        try {
            const result = await addNewStudent({ studentId, studentName, group, dualRelationship });
            if (result.success) {
                setFeedback({ type: 'success', message: `Estudiante "${studentName}" ingresado con éxito. ID: ${result.studentId}` });
                setStudentId('');
                setStudentName('');
                setGroup('');
                setDualRelationship('');
            } else {
                 setFeedback({ type: 'error', message: 'Ocurrió un error al guardar el estudiante.' });
            }
        } catch (error) {
             setFeedback({ type: 'error', message: 'Ocurrió un error inesperado al conectar con la base de datos.' });
             console.error("Error al guardar en Firestore:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-6 w-6" />
                    Ingresar Nuevo Estudiante
                </CardTitle>
                <CardDescription>
                    Crea un nuevo expediente digital en la base de datos (Firestore).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="student-id">ID del Estudiante (Matrícula)</Label>
                        <Input id="student-id" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Ej. 2024001" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="student-name">Nombre Completo del Estudiante</Label>
                        <Input id="student-name" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Ej. Juan Pérez López" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="group">Grupo</Label>
                        <Input id="group" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Ej. 5B" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dual-relationship">Trazabilidad de Relación Dual (Cap. 4.3)</Label>
                        <Textarea id="dual-relationship" value={dualRelationship} onChange={(e) => setDualRelationship(e.target.value)} placeholder="¿Existe relación académica o familiar directa con el tutor/clínico asignado? Documentar aquí." />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            {isLoading ? 'Guardando...' : 'Crear Expediente'}
                        </Button>
                    </div>
                </form>

                {feedback && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {feedback.message}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RoleManagementCard() {
    const [users, setUsers] = useState([
        { uid: 'user001', email: 'psic.martinez@example.com', role: 'Clinico' },
        { uid: 'user002', email: 'orientador.gomez@example.com', role: 'Orientador' },
        { uid: 'user003', email: 'nuevo.docente@example.com', role: 'none' },
    ]);

    const handleRoleChange = (uid: string, newRole: string) => {
        setUsers(users.map(user => user.uid === uid ? { ...user, role: newRole } : user));
    };
    
    const handleSaveChanges = () => {
        console.log("--- SIMULACIÓN: Guardando Cambios de Roles ---");
        console.log("Estos datos serían enviados a una Cloud Function para establecer Custom Claims en Firebase Auth.");
        console.log(users);
        alert("Simulación de guardado de roles completada. Revisa la consola para más detalles.");
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-6 w-6" />
                    Gestión de Roles de Usuario
                </CardTitle>
                <CardDescription>
                    Asigne los roles de 'Clinico' u 'Orientador' a los usuarios del sistema.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {users.map(user => (
                        <div key={user.uid} className="flex items-center justify-between p-2 border rounded-md">
                            <span className="text-sm font-medium">{user.email}</span>
                            <Select value={user.role} onValueChange={(newRole) => handleRoleChange(user.uid, newRole)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Clinico">Clínico</SelectItem>
                                    <SelectItem value="Orientador">Orientador</SelectItem>
                                    <SelectItem value="none">Sin Rol</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end mt-6">
                    <Button onClick={handleSaveChanges}>Guardar Cambios de Roles</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Módulo de Administración
            </h1>
            <p className="mb-8 text-sm text-gray-600">
                Gestión de expedientes, usuarios y roles del sistema MTSS.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <AddNewStudentForm />
                <RoleManagementCard />
            </div>
        </div>
    );
}
