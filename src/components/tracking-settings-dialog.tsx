
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Settings, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface TrackingSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsUpdated: (settings: TrackingSettings) => void;
}

export interface TrackingSettings {
  contactPhones: string;
  tutorMessageTemplate: string;
  studentMessageTemplate?: string; // Future proofing
}

export const DEFAULT_TUTOR_MESSAGE = `Estimado tutor legal de {studentName}, le informamos sobre la inasistencia de la estudiantes el dia de hoy {date} misma que se encuentra sin justificación en el departamento de servicios escolares. Ante tal situación, y por el interés en el bienestar y desarrollo optimo de la estudiante, se hace de su conocimiento. Atentamente CBTa 130. 
Para cualquier aclaración puede comunicarse a los teléfonos: {contactPhones}`;

export function TrackingSettingsDialog({ open, onOpenChange, onSettingsUpdated }: TrackingSettingsDialogProps) {
  const { toast } = useToast();
  const { settings, setSettings } = useData();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Global Settings
  const [contactPhones, setContactPhones] = useState('');
  const [tutorMessageTemplate, setTutorMessageTemplate] = useState(DEFAULT_TUTOR_MESSAGE);

  // Identity Settings (User Profile)
  const [prefectName, setPrefectName] = useState('');
  const [prefectTitle, setPrefectTitle] = useState('');
  const [prefectSignature, setPrefectSignature] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'app_config', 'tracking_settings');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as TrackingSettings;
          setContactPhones(data.contactPhones || '');
          setTutorMessageTemplate(data.tutorMessageTemplate || DEFAULT_TUTOR_MESSAGE);
        } else {
          // Defaults if not set
          setTutorMessageTemplate(DEFAULT_TUTOR_MESSAGE);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los ajustes.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadSettings();
      // Load user identity settings from context
      if (settings) {
        setPrefectName(settings.prefectName || '');
        setPrefectTitle(settings.prefectTitle || '');
        setPrefectSignature(settings.prefectSignature || '');
      }
    }
  }, [open, settings, toast]);

  /* REMOVED loadSettings definition from here */

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save Global Settings
      const globalSettings: TrackingSettings = {
        contactPhones,
        tutorMessageTemplate
      };

      const docRef = doc(db, 'app_config', 'tracking_settings');
      await setDoc(docRef, globalSettings, { merge: true });

      // 2. Save User Identity Settings
      if (settings) {
         await setSettings({
            ...settings,
            prefectName,
            prefectTitle,
            prefectSignature
         });
      }

      toast({
        title: 'Ajustes guardados',
        description: 'La configuración de seguimiento e identidad se ha actualizado correctamente.',
      });
      
      onSettingsUpdated(globalSettings);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron guardar los ajustes.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB limit
         toast({
            variant: 'destructive',
            title: 'Archivo muy grande',
            description: 'La imagen de la firma no debe superar los 500KB.',
         });
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrefectSignature(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    setTutorMessageTemplate(prev => prev + placeholder);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajustes de Seguimiento</DialogTitle>
          <DialogDescription>
            Configura los datos de contacto, mensajes y tu identidad para los informes oficiales.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            
            {/* Sección: Identidad para Informes Oficiales */}
            <div className="border rounded-md p-4 bg-muted/20">
                <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Identidad para Informes Oficiales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="prefectName">Nombre Completo (Responsable)</Label>
                        <Input 
                            id="prefectName" 
                            value={prefectName} 
                            onChange={(e) => setPrefectName(e.target.value)} 
                            placeholder="Ej. Lic. María González"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prefectTitle">Cargo / Puesto</Label>
                        <Input 
                            id="prefectTitle" 
                            value={prefectTitle} 
                            onChange={(e) => setPrefectTitle(e.target.value)} 
                            placeholder="Ej. Prefecta Turno Matutino"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Firma Digital (Imagen)</Label>
                        <div className="flex items-center gap-4">
                            {prefectSignature ? (
                                <div className="relative w-40 h-20 border bg-white rounded flex items-center justify-center overflow-hidden group">
                                    <Image 
                                        src={prefectSignature} 
                                        alt="Firma" 
                                        width={160} 
                                        height={80} 
                                        className="object-contain w-full h-full" 
                                    />
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setPrefectSignature('')}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-40 h-20 border border-dashed rounded flex items-center justify-center text-xs text-muted-foreground bg-muted/10">
                                    Sin firma
                                </div>
                            )}
                            <div className="flex-1">
                                <Input 
                                    id="signature-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleSignatureUpload}
                                    className="text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Sube (PNG/JPG) con fondo transparente preferentemente. Max 500KB.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhones">Teléfonos de contacto (Global)</Label>
              <Input
                id="contactPhones"
                value={contactPhones}
                onChange={(e) => setContactPhones(e.target.value)}
                placeholder="Ej. 618-123-4567, 618-987-6543"
              />
              <p className="text-xs text-muted-foreground">
                Estos números aparecerán en el mensaje de WhatsApp para que los padres puedan comunicarse.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageTemplate">Plantilla de Mensaje (WhatsApp Tutor)</Label>
              <div className="flex gap-2 mb-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => insertPlaceholder('{studentName}')} type="button" className="text-xs h-7">+ Nombre Alumno</Button>
                <Button variant="outline" size="sm" onClick={() => insertPlaceholder('{tutorName}')} type="button" className="text-xs h-7">+ Nombre Tutor</Button>
                <Button variant="outline" size="sm" onClick={() => insertPlaceholder('{date}')} type="button" className="text-xs h-7">+ Fecha</Button>
                <Button variant="outline" size="sm" onClick={() => insertPlaceholder('{contactPhones}')} type="button" className="text-xs h-7">+ Teléfonos</Button>
              </div>
              <Textarea
                id="messageTemplate"
                value={tutorMessageTemplate}
                onChange={(e) => setTutorMessageTemplate(e.target.value)}
                rows={5}
                placeholder="Escriba el mensaje aquí..."
              />
              <p className="text-xs text-muted-foreground">
                Usa los botones o escribe <code>{'{studentName}'}</code>, <code>{'{tutorName}'}</code>, <code>{'{date}'}</code>, <code>{'{contactPhones}'}</code> para insertar datos dinámicos.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
