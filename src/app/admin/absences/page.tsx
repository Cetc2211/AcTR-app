'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Phone, CheckCircle, XCircle, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type AbsenceRecord = {
  id: string;
  groupId: string;
  groupName: string;
  date: string;
  teacherId: string;
  teacherEmail: string;
  absentStudents: { id: string; name: string }[];
  whatsappLink?: string;
  timestamp: string;
};

export default function AbsencesPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAbsences = async (selectedDate: Date) => {
    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'dd/MM/yyyy');
      console.log("Fetching absences for:", formattedDate);
      
      const q = query(
        collection(db, 'absences'),
        where('date', '==', formattedDate)
      );

      const querySnapshot = await getDocs(q);
      const fetchedRecords: AbsenceRecord[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRecords.push({ id: doc.id, ...doc.data() } as AbsenceRecord);
      });

      setRecords(fetchedRecords);
    } catch (error) {
      console.error("Error fetching absences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsences(date);
  }, [date]);

  const totalAbsences = records.reduce((acc, record) => acc + record.absentStudents.length, 0);

  const filteredRecords = records.filter(record => 
    record.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.teacherEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.absentStudents.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Monitor de Asistencias</h1>
          <p className="text-muted-foreground">
            Seguimiento de inasistencias reportadas por los docentes.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={() => fetchAbsences(date)}>
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ausencias</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAbsences}</div>
            <p className="text-xs text-muted-foreground">
              Alumnos reportados hoy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos Reportados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">
              Clases con inasistencias
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por alumno, grupo o profesor..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">Cargando reportes...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/10">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium">Todo en orden</h3>
          <p className="text-muted-foreground">No hay reportes de inasistencias para esta fecha.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{record.groupName}</CardTitle>
                    <CardDescription>Prof. {record.teacherEmail}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-background">
                    {format(new Date(record.timestamp), 'HH:mm')} hrs
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {record.absentStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium">{student.name}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => {
                          if (record.whatsappLink) {
                            const message = `Hola, le informamos que el alumno ${student.name} no asistió a la clase de ${record.groupName} el día de hoy.`;
                            const url = `${record.whatsappLink}?text=${encodeURIComponent(message)}`;
                            window.open(url, '_blank');
                          } else {
                            alert("Este grupo no tiene un enlace de WhatsApp configurado.");
                          }
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Contactar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
