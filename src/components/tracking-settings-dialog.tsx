
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Settings } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [contactPhones, setContactPhones] = useState('');
  const [tutorMessageTemplate, setTutorMessageTemplate] = useState(DEFAULT_TUTOR_MESSAGE);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings: TrackingSettings = {
        contactPhones,
        tutorMessageTemplate
      };

      const docRef = doc(db, 'app_config', 'tracking_settings');
      await setDoc(docRef, settings, { merge: true });

      toast({
        title: 'Ajustes guardados',
        description: 'La configuración de seguimiento se ha actualizado correctamente.',
      });
      
      onSettingsUpdated(settings);
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

  const insertPlaceholder = (placeholder: string) => {
    setTutorMessageTemplate(prev => prev + placeholder);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajustes de Seguimiento</DialogTitle>
          <DialogDescription>
            Configura los datos de contacto y mensajes predeterminados para el área de seguimiento.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="contactPhones">Teléfonos de contacto</Label>
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
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={() => insertPlaceholder('{studentName}')} type="button" className="text-xs h-7">+ Nombre Alumno</Button>
                <Button variant="outline" size="sm" onClick={() => insertPlaceholder('{date}')} type="button" className="text-xs h-7">+ Fecha</Button>
                <Button variant="outline" size="sm" onClick={() => insertPlaceholder('{contactPhones}')} type="button" className="text-xs h-7">+ Teléfonos</Button>
              </div>
              <Textarea
                id="messageTemplate"
                value={tutorMessageTemplate}
                onChange={(e) => setTutorMessageTemplate(e.target.value)}
                rows={8}
                placeholder="Escriba el mensaje aquí..."
              />
              <p className="text-xs text-muted-foreground">
                Usa los botones o escribe <code>{'{studentName}'}</code>, <code>{'{date}'}</code>, <code>{'{contactPhones}'}</code> para insertar datos dinámicos.
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
