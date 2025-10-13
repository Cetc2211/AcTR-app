
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ThemeSwitcher, themes } from '@/components/theme-switcher';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/hooks/use-data';
import { Upload, Download, RotateCcw, Loader2, KeyRound, PlusCircle, Edit, Trash2, CalendarIcon, Image as ImageIcon, Phone } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Group, Student, StudentObservation, PartialId, SpecialNote, PartialData, AppSettings, AllPartialsData } from '@/lib/placeholder-data';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { NoteDialog } from '@/components/note-dialog';


type ExportData = {
  version: string;
  groups: Group[];
  students: Student[];
  observations: { [studentId: string]: StudentObservation[] };
  specialNotes: SpecialNote[];
  settings: AppSettings;
  partialsData: AllPartialsData; 
};

export default function SettingsPage() {
    const { settings, isLoading, groups, allStudents, allObservations, specialNotes, fetchPartialData, setSettings, resetAllData, importAllData, addSpecialNote, updateSpecialNote, deleteSpecialNote } = useData();
    const [localSettings, setLocalSettings] = useState(settings);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [scheduleImagePreview, setScheduleImagePreview] = useState<string | null>(null);
    const [teacherPhotoPreview, setTeacherPhotoPreview] = useState<string | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    
    useEffect(() => {
        if(!isLoading && settings) {
            setLocalSettings(settings);
            setLogoPreview(settings.logo);
            setSignaturePreview(settings.signature);
            setScheduleImagePreview(settings.scheduleImageUrl);
            setTeacherPhotoPreview(settings.teacherPhoto);
        }
    }, [settings, isLoading]);
    
    const handleSave = async () => {
        setIsSaving(true);
        const newSettings = { 
            ...localSettings, 
            logo: logoPreview || '',
            signature: signaturePreview || '',
            scheduleImageUrl: scheduleImagePreview || '',
            teacherPhoto: teacherPhotoPreview || '',
        };
        
        try {
            await setSettings(newSettings);
            toast({
              title: 'Ajustes Guardados',
              description: 'La información ha sido actualizada.',
            });
        } catch (e) {
          toast({variant: "destructive", title: "Error", description: "No se pudieron guardar los ajustes."})
        } finally {
          setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleImageChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<string | null>>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleThemeChange = (theme: string) => {
        setLocalSettings(prev => ({ ...prev, theme }));
        document.body.className = theme;
    };

    const handleExportData = async () => {
        setIsExporting(true);
        toast({ title: "Exportando datos...", description: "Recopilando toda tu información."});
        try {
            const partialsDataToExport: AllPartialsData = {};
            for (const group of groups) {
                partialsDataToExport[group.id] = {};
                const partials: PartialId[] = ['p1', 'p2', 'p3'];
                for (const pId of partials) {
                    const pData = await fetchPartialData(group.id, pId);
                    if (pData) {
                       // Omit criteria from export as it belongs to group
                       const { criteria, ...dataToSave } = pData;
                       partialsDataToExport[group.id][pId] = dataToSave;
                    }
                }
            }
            
            const exportData: ExportData = {
                version: "2.2.0-granular",
                groups,
                students: allStudents,
                observations: allObservations,
                specialNotes,
                settings,
                partialsData: partialsDataToExport,
            };

            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `academic_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            toast({ title: "Exportación completa", description: "Tus datos han sido guardados." });

        } catch (error) {
            console.error("Export error:", error);
            toast({ variant: 'destructive', title: "Error de exportación", description: "No se pudieron exportar los datos." });
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImportFile(file);
        }
    };
    
    const handleConfirmImport = async () => {
        if (!importFile) return;
        setIsImporting(true);
        toast({ title: 'Importando datos...', description: 'Esto puede tardar un momento y sobreescribirá tus datos actuales.' });

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read");
                
                const data = JSON.parse(text) as ExportData;

                await importAllData(data);

                toast({ title: "Importación exitosa", description: "Tus datos han sido restaurados. La página se recargará." });
                setTimeout(() => window.location.reload(), 2000);

            } catch (error: any) {
                console.error("Import error:", error);
                const errorMessage = error.message && error.message.includes('quota') 
                    ? "La importación falló por exceder la cuota de almacenamiento. El archivo de respaldo es demasiado grande."
                    : error.message || "El archivo puede estar corrupto.";
                toast({ variant: 'destructive', title: "Error de importación", description: errorMessage });
            } finally {
                setIsImporting(false);
                setImportFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(importFile);
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleResetApp = async () => {
       setIsSaving(true);
        toast({ title: 'Restableciendo datos...', description: 'Este proceso es irreversible y puede tardar.' });
        await resetAllData();
        setIsSaving(false);
        setIsResetDialogOpen(false);
    };

    const handleSaveNote = (noteId?: string) => (text: string, dateRange: any) => {
        if (!text || !dateRange?.from || !dateRange?.to) {
            toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Se requiere un mensaje y un rango de fechas.' });
            return;
        }
        const noteData = {
            text,
            startDate: format(dateRange.from, 'yyyy-MM-dd'),
            endDate: format(dateRange.to, 'yyyy-MM-dd'),
        };
        if (noteId) {
            updateSpecialNote(noteId, noteData);
        } else {
            addSpecialNote(noteData);
        }
    };


    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
            </div>
        );
    }
  
    return (
        <div className="flex flex-col gap-6">
        <div>
            <h1 className="text-3xl font-bold">Ajustes</h1>
            <p className="text-muted-foreground">
            Personaliza la aplicación, gestiona tu horario y administra tus datos.
            </p>
        </div>
        <Card>
            <CardHeader>
            <CardTitle>Personalización</CardTitle>
            <CardDescription>
                Actualiza los datos que aparecerán en los informes y en tu dashboard.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="institutionName">Nombre de la Institución</Label>
                <Input
                id="institutionName"
                value={localSettings.institutionName}
                onChange={handleInputChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="facilitatorName">Nombre del Docente</Label>
                <Input
                id="facilitatorName"
                value={localSettings.facilitatorName}
                onChange={handleInputChange}
                placeholder="Ej: Mtro. Juan Pérez"
                />
                 <p className="text-xs text-muted-foreground">
                    Este nombre se usará por defecto al crear nuevos grupos.
                </p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="whatsappContactNumber">Teléfono de Contacto para Inasistencias</Label>
                 <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                        id="whatsappContactNumber"
                        type="tel"
                        value={localSettings.whatsappContactNumber || ''}
                        onChange={handleInputChange}
                        placeholder="Ej: 5215512345678"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Número de WhatsApp a donde se enviarán los reportes de inasistencia. Incluye el código de país.
                </p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="teacherPhoto">Foto del Docente (para avatar)</Label>
                <div className="flex items-center gap-4">
                    <Image
                        src={teacherPhotoPreview || 'https://placehold.co/100x100.png'}
                        alt="Vista previa de la foto del docente"
                        width={64}
                        height={64}
                        className="rounded-full object-cover aspect-square"
                    />
                    <Input id="teacherPhoto" type="file" className="max-w-sm" onChange={(e) => handleImageChange(e, setTeacherPhotoPreview)} accept="image/png, image/jpeg" />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="logo">Logo de la Institución</Label>
                <div className="flex items-center gap-4">
                <div className="relative h-20 w-20">
                    <Image
                    src={logoPreview || 'https://placehold.co/200x200.png'}
                    alt="Logo actual"
                    fill
                    className="rounded-md object-contain"
                    data-ai-hint="school logo"
                    />
                </div>
                <Input id="logo" type="file" className="max-w-sm" onChange={(e) => handleImageChange(e, setLogoPreview)} accept="image/png, image/jpeg" />
                </div>
                <p className="text-xs text-muted-foreground">
                Sube un archivo PNG o JPG. Tamaño recomendado: 200x200px.
                </p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="signature">Firma del Docente</Label>
                <div className="flex items-center gap-4">
                <div className="relative h-20 w-40 bg-muted rounded-md flex items-center justify-center">
                    {signaturePreview ? (
                        <Image
                        src={signaturePreview}
                        alt="Firma actual"
                        fill
                        className="object-contain p-2"
                        />
                    ) : <span className="text-xs text-muted-foreground">Sin firma</span>}
                </div>
                <Input id="signature" type="file" className="max-w-sm" onChange={(e) => handleImageChange(e, setSignaturePreview)} accept="image/png" />
                </div>
                <p className="text-xs text-muted-foreground">
                 Para mejores resultados, sube una imagen de tu firma con fondo transparente (formato PNG).
                </p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="schedule">Horario de Clases</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-48 border rounded-md flex items-center justify-center bg-muted">
                      {scheduleImagePreview ? (
                          <Image
                          src={scheduleImagePreview}
                          alt="Vista previa del horario"
                          fill
                          className="object-contain p-1"
                          />
                      ) : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <Input id="schedule" type="file" className="max-w-sm" onChange={(e) => handleImageChange(e, setScheduleImagePreview)} accept="image/png, image/jpeg, image/webp" />
                </div>
                <p className="text-xs text-muted-foreground">
                 Sube una imagen de tu horario para tenerla a la mano en el dashboard.
                </p>
            </div>
            </CardContent>
            <Separator className="my-4" />
            <CardHeader>
                <CardTitle>Apariencia</CardTitle>
                <CardDescription>
                    Elige un tema para personalizar los colores de la aplicación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ThemeSwitcher selectedTheme={localSettings.theme} onThemeChange={handleThemeChange} />
            </CardContent>
            <Separator className="my-4" />
            <CardHeader>
                <CardTitle>Integración con Inteligencia Artificial</CardTitle>
                <CardDescription>
                    Para usar las funciones de IA, provee tu propia clave API de Google AI (Gemini). La clave se guarda de forma segura en tu navegador.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key de Google AI</Label>
                    <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        <Input
                            id="apiKey"
                            type="password"
                            value={localSettings.apiKey}
                            onChange={handleInputChange}
                            placeholder="Pega tu clave API aquí"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Puedes obtener tu clave desde <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a>.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Guardar Cambios de Personalización
            </Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Consideraciones Especiales del Horario</CardTitle>
                        <CardDescription>
                            Define recordatorios o notas sobre cambios en el horario que aparecerán en el dashboard.
                        </CardDescription>
                    </div>
                    <NoteDialog onSave={handleSaveNote()}>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Nota
                        </Button>
                    </NoteDialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {specialNotes.length > 0 ? (
                        specialNotes.map(note => (
                            <div key={note.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium">{note.text}</p>
                                    <p className="text-sm text-muted-foreground">
                                        <CalendarIcon className="inline h-4 w-4 mr-1" />
                                        {format(parseISO(note.startDate), 'dd MMM', { locale: es })} - {format(parseISO(note.endDate), 'dd MMM yyyy', { locale: es })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <NoteDialog note={note} onSave={handleSaveNote(note.id)}>
                                        <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>
                                    </NoteDialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Eliminar esta nota?</AlertDialogTitle>
                                                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteSpecialNote(note.id)}>Sí, eliminar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-4">No hay consideraciones especiales añadidas.</p>
                    )}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Copia de Seguridad y Restauración</CardTitle>
                <CardDescription>
                    Guarda todos tus datos en un archivo o restaura la aplicación desde uno. La importación sobreescribirá todos los datos actuales.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleExportData} variant="outline" disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Exportar Mis Datos
                </Button>
                <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button onClick={triggerFileSelect}>
                                <Upload className="mr-2 h-4 w-4" />
                                Importar Mis Datos
                            </Button>
                        </AlertDialogTrigger>
                        {importFile && (
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmas la importación?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción sobreescribirá permanentemente TODOS tus datos actuales con los datos del archivo "{importFile.name}". Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setImportFile(null)}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleConfirmImport} disabled={isImporting}>
                                        {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sí, importar y sobreescribir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        )}
                    </AlertDialog>
                <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleImportFileChange}
                />
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Asegúrate de que el archivo de importación haya sido generado por esta aplicación.
                </p>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                <CardDescription>
                    Estas acciones no se pueden deshacer. Úsalas con precaución.
                </CardDescription>
            </CardHeader>
            <CardContent>
                    <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restablecer Mis Datos
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción borrará permanentemente TODOS tus datos de la aplicación, incluyendo grupos, estudiantes, calificaciones y ajustes. La página se recargará.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetApp}>Sí, borrar mis datos</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Esta función eliminará todos tus datos guardados en el navegador.
                </p>
            </CardFooter>
        </Card>
        </div>
    );
}
