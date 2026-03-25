'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Copy,
  MessageSquare,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  obtenerMatriculasGrupo,
  generarTextoListaMatriculas,
  type ListaMatriculasGrupo,
  type MatriculaRegistro
} from '@/lib/matricula-service';

interface ListaMatriculasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grupoId: string;
  grupoNombre: string;
}

export function ListaMatriculasDialog({
  open,
  onOpenChange,
  grupoId,
  grupoNombre
}: ListaMatriculasDialogProps) {
  const [lista, setLista] = useState<ListaMatriculasGrupo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (open && grupoId) {
      cargarLista();
    }
  }, [open, grupoId]);

  const cargarLista = async () => {
    setLoading(true);
    const data = await obtenerMatriculasGrupo(grupoId);
    setLista(data);
    setLoading(false);
  };

  const copiarAlPortapapeles = () => {
    if (!lista) return;
    const texto = generarTextoListaMatriculas(lista);
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarPorWhatsApp = () => {
    if (!lista) return;
    const texto = generarTextoListaMatriculas(lista);
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const descargarPDF = () => {
    // TODO: Implementar generación de PDF
    alert('Función de PDF en desarrollo. Use copiar/pegar por ahora.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lista de Matrículas - {grupoNombre}
          </DialogTitle>
          <DialogDescription>
            Distribuya estas matrículas a los estudiantes para que puedan acceder a las evaluaciones.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : lista ? (
          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-700">{lista.resumen.total}</p>
                  <p className="text-xs text-blue-600">Total</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  <p className="text-2xl font-bold text-green-700">{lista.resumen.evaluados}</p>
                  <p className="text-xs text-green-600">Evaluados</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-1 text-amber-600" />
                  <p className="text-2xl font-bold text-amber-700">{lista.resumen.pendientes}</p>
                  <p className="text-xs text-amber-600">Pendientes</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-700">{lista.resumen.sinExpediente}</p>
                  <p className="text-xs text-purple-600">Sin Expediente</p>
                </CardContent>
              </Card>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={copiarAlPortapapeles}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copiado ? '¡Copiado!' : 'Copiar Lista'}
              </Button>
              <Button
                onClick={enviarPorWhatsApp}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Enviar por WhatsApp
              </Button>
              <Button
                onClick={descargarPDF}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </Button>
            </div>

            {/* Tabla de matrículas */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-32">Matrícula</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead className="w-24 text-center">Estado</TableHead>
                    <TableHead className="w-24 text-center">Evaluaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.estudiantes.map((est) => (
                    <TableRow key={est.matricula} className="hover:bg-gray-50">
                      <TableCell className="font-mono font-medium">
                        {est.matricula}
                      </TableCell>
                      <TableCell>{est.nombreCompleto}</TableCell>
                      <TableCell className="text-center">
                        {est.evaluacionesCompletadas > 0 ? (
                          <Badge className="bg-green-100 text-green-800">
                            ✅ Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            ⏳ Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {est.evaluacionesCompletadas}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Instrucciones */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">📌 Instrucciones para distribución:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Entregue a cada estudiante su matrícula correspondiente</li>
                <li>El estudiante ingresará su matrícula al acceder al enlace de evaluación</li>
                <li>Si pierde su matrícula, puede consultarse en esta lista</li>
                <li>Comparta esta lista con los tutores de grupo para seguimiento</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No hay matrículas generadas para este grupo.</p>
            <p className="text-sm mt-2">Genere las matrículas desde la pestaña de configuración.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
