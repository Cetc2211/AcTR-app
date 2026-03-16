
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useData } from '@/hooks/use-data';
import { useState, useMemo } from 'react';
import { Search, Contact as ContactIcon, Mail, Phone, LifeBuoy, Building } from 'lucide-react';
import { Student } from '@/lib/placeholder-data';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type TutorWithStudents = {
    name: string;
    students: (Student & { groupSubject: string })[];
}

export default function ContactPage() {
    const { groups } = useData();
    const [searchQuery, setSearchQuery] = useState('');

    const tutors = useMemo(() => {
        const tutorMap: Map<string, TutorWithStudents> = new Map();

        groups.forEach(group => {
            group.students.forEach(student => {
                if (student.tutorName) {
                    if (!tutorMap.has(student.tutorName)) {
                        tutorMap.set(student.tutorName, { name: student.tutorName, students: [] });
                    }
                    const tutorData = tutorMap.get(student.tutorName)!;
                    
                    if (!tutorData.students.some(s => s.id === student.id)) {
                        tutorData.students.push({ ...student, groupSubject: group.subject });
                    }
                }
            });
        });

        return Array.from(tutorMap.values()).sort((a,b) => a.name.localeCompare(b.name));
    }, [groups]);

    const filteredTutors = useMemo(() => {
        if (!searchQuery) return tutors;
        const lowerCaseQuery = searchQuery.toLowerCase();

        return tutors.filter(tutor => 
            tutor.name.toLowerCase().includes(lowerCaseQuery) ||
            tutor.students.some(student => student.name.toLowerCase().includes(lowerCaseQuery))
        );
    }, [tutors, searchQuery]);

    const getWhatsAppLink = (phone: string | undefined, studentName: string) => {
        if (!phone) return '#';
        const cleanPhone = phone.replace(/\D/g, '');
        const message = encodeURIComponent(`Hola, le contacto en relación al seguimiento académico de ${studentName}.`);
        return `https://wa.me/${cleanPhone}?text=${message}`;
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold">Contacto y Soporte</h1>
                <p className="text-muted-foreground">
                    Directorio de tutores y canal de soporte técnico.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LifeBuoy /> Soporte Técnico</CardTitle>
                        <CardDescription>
                            ¿Necesitas ayuda o encontraste un error? Contáctanos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary"/> <strong>Email:</strong> academictrackermp@gmail.com</p>
                        <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary"/> <strong>Teléfono:</strong> +1 (555) 123-4567</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building /> Ventas y Planes</CardTitle>
                        <CardDescription>
                            Información sobre suscripciones y planes institucionales.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary"/> <strong>Email:</strong> ventas@academictracker.com</p>
                        <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary"/> <strong>Teléfono:</strong> +1 (555) 123-8910</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ContactIcon /> Directorio de Tutores</CardTitle>
                    <CardDescription>Encuentra la información de contacto de los tutores de tus estudiantes.</CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-4.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nombre de tutor o estudiante..." 
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {filteredTutors.length > 0 ? filteredTutors.map(tutor => (
                            <div key={tutor.name}>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    {tutor.name}
                                </h3>
                                <div className="border-l-2 border-muted pl-4 ml-2 mt-2">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Estudiante</TableHead>
                                                <TableHead>Grupo</TableHead>
                                                <TableHead>Contacto del Tutor</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tutor.students.map(student => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="font-medium">
                                                        <Link href={`/students/${student.id}`} className="flex items-center gap-2 hover:underline">
                                                            <Image src={student.photo} alt={student.name} width={32} height={32} className="rounded-full" />
                                                            {student.name}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{student.groupSubject}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            {student.tutorPhone && (
                                                                <a 
                                                                    href={getWhatsAppLink(student.tutorPhone, student.name)}
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 hover:text-primary"
                                                                >
                                                                    <Phone className="h-4 w-4" /> {student.tutorPhone}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No se encontraron tutores que coincidan con tu búsqueda. Registra estudiantes con información de tutor para verlos aquí.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
