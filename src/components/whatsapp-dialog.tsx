
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Phone } from 'lucide-react';

interface WhatsAppDialogProps {
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WhatsAppIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);

export function WhatsAppDialog({ studentName, open, onOpenChange }: WhatsAppDialogProps) {
  const [phone, setPhone] = useState('');
  const { toast } = useToast();

  const handleSend = () => {
    if (!phone.trim()) {
      toast({
        variant: 'destructive',
        title: 'Número requerido',
        description: 'Por favor, ingresa un número de teléfono.',
      });
      return;
    }

    const message = encodeURIComponent(`Hola, le comparto el informe académico de ${studentName}.`);
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${message}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar informe por WhatsApp</DialogTitle>
          <DialogDescription>
            Ingresa el número de teléfono (incluyendo código de país) al que deseas enviar el informe.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
            <Label htmlFor="whatsapp-phone">Número de Teléfono</Label>
            <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="whatsapp-phone" 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 5215512345678"
                    className="pl-8"
                />
            </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSend}>
            <WhatsAppIcon />
            <span className="ml-2">Enviar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
