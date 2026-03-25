'use client';

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import FichaIdentificacionForm from "./FichaIdentificacionForm";
import ChteForm from "./ChteForm";
import BdiForm from "./BdiForm";
import BaiForm from "./BaiForm";
import Phq9Form from "./Phq9Form";
import Gad7Form from "./Gad7Form";
import HadsForm from "./HadsForm";
import BhsForm from "./BhsForm";
import SsiForm from "./SsiForm";
import ColumbiaForm from "./ColumbiaForm";
import PlutchikForm from "./PlutchikForm";
import IdareForm from "./IdareForm";
import LiraForm from "./LiraForm";
import GocaForm from "./GocaForm";
import IpaForm from "./IpaForm";
import CdfrForm from "./CdfrForm";
import AssistForm from "./AssistForm";
import EbmaForm from "./EbmaForm";
import { NeuroScreeningConsole } from "./NeuroScreeningConsole";
import SOAPNotesForm from "./SOAPNotesForm";

interface ScreeningInstrumentDialogProps {
    instrumentId: string;
    instrumentTitle: string;
    studentId?: string;
}

const InstrumentComponent = ({ id, studentId }: { id: string; studentId?: string }) => {
    switch (id) {
        // Ficha de Identificación
        case 'ficha-id':
            return <FichaIdentificacionForm />;
        
        // Habilidades Académicas
        case 'chte':
            return <ChteForm />;
        case 'neuro-screen':
            return <NeuroScreeningConsole studentId={studentId || "preview"} />;
        case 'lira':
            return <LiraForm studentId={studentId} />;
        case 'goca':
            return <GocaForm studentId={studentId} />;
        case 'ebma':
            return <EbmaForm studentId={studentId} />;
        
        // Socioemocionales
        case 'phq-9':
            return <Phq9Form studentId={studentId} />;
        case 'gad-7':
            return <Gad7Form studentId={studentId} />;
        case 'bdi-ii':
            return <BdiForm studentId={studentId} />;
        case 'bai':
            return <BaiForm studentId={studentId} />;
        case 'hads':
            return <HadsForm studentId={studentId} />;
        case 'idare':
            return <IdareForm studentId={studentId} />;
        case 'bhs':
            return <BhsForm studentId={studentId} />;
        case 'ipa':
            return <IpaForm studentId={studentId} />;
        
        // Riesgo Suicida
        case 'ssi':
            return <SsiForm studentId={studentId} />;
        case 'plutchik':
            return <PlutchikForm studentId={studentId} />;
        case 'columbia':
            return <ColumbiaForm studentId={studentId} />;
        case 'cdfr':
            return <CdfrForm studentId={studentId} />;
        
        // Conductas de Riesgo
        case 'assist':
            return <AssistForm studentId={studentId} />;
        
        // Notas Clínicas
        case 'soap':
            return <SOAPNotesForm studentId={studentId} />;
        
        default:
            return (
                <div className="p-8 text-center">
                    <p className="text-gray-500">Instrumento no disponible para previsualización.</p>
                    <p className="text-sm text-gray-400 mt-2">ID: {id}</p>
                </div>
            );
    }
}

export default function ScreeningInstrumentDialog({ 
    instrumentId, 
    instrumentTitle,
    studentId 
}: ScreeningInstrumentDialogProps) {
    
    return (
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Vista Previa: {instrumentTitle}</DialogTitle>
                <DialogDescription>
                    Este es un ejemplo interactivo del instrumento. Los datos no serán guardados permanentemente.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-4">
                <InstrumentComponent id={instrumentId} studentId={studentId} />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" type="button">Cerrar</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    )
}
