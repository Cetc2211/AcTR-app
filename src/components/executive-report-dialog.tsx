import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ExecutiveReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    startDate: Date | undefined;
    setStartDate: (date: Date | undefined) => void;
    endDate: Date | undefined;
    setEndDate: (date: Date | undefined) => void;
    onGenerate: () => void;
    isGenerating: boolean;
}

export function ExecutiveReportDialog({
    open,
    onOpenChange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    onGenerate,
    isGenerating
}: ExecutiveReportDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generar Reporte de Gestión</DialogTitle>
                    <DialogDescription>
                        Selecciona el periodo para generar el informe ejecutivo de actividades y resultados de prefectura.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha Inicio</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "P", { locale: es }) : <span>Seleccionar</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha Fin</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "P", { locale: es }) : <span>Seleccionar</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
                        <p className="font-semibold mb-1">Este informe incluirá:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Total de inasistencias reportadas en el periodo.</li>
                            <li>Estadísticas de intervenciones (llamadas, visitas).</li>
                            <li>Efectividad de localización y acuerdos.</li>
                            <li>Firma digital del responsable actual.</li>
                        </ul>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={onGenerate} disabled={isGenerating}>
                        {isGenerating ? <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" /> : <Download className="mr-2 h-4 w-4" />}
                        Generar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
