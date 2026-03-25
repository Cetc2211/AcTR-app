'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCheck, Lightbulb, Users, ArrowUpRightFromSquare, Pin } from "lucide-react";
import { getEvidenceRepository } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function ToolsPage() {
  const evidence = getEvidenceRepository();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">
        Repositorio de Evidencia (Cap. 9)
      </h1>
      <p className="mb-8 text-sm text-gray-600">
        Base de conocimiento de referencias bibliográficas que respaldan las intervenciones del modelo MTSS.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {evidence.map((ref) => (
          <Card key={ref.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl flex items-start gap-3 pr-4">
                  <BookCheck className="text-blue-600 mt-1 flex-shrink-0" />
                  {ref.titulo}
                </CardTitle>
                <Badge variant="secondary" className="flex-shrink-0">{ref.modeloIntervencion}</Badge>
              </div>
              <CardDescription className="flex items-center gap-2 pt-2">
                <Users className="h-4 w-4"/>
                <span className="font-semibold">{ref.autor} ({ref.ano})</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-2"><Pin className="h-4 w-4"/>Estrategias Clave</h4>
                  <div className="space-y-2">
                    {ref.estrategias.map(estrategia => {
                      const linkDirecto = `${ref.fileUrl}#page=${estrategia.pagina}`;
                      return (
                        <div key={estrategia.nombre} className="flex justify-between items-center bg-gray-50 p-2 rounded-md border">
                          <span className="text-sm text-gray-800">{estrategia.nombre}</span>
                          <Button asChild variant="outline" size="sm">
                            <Link href={linkDirecto} target="_blank">
                              Pág. {estrategia.pagina}
                              <ArrowUpRightFromSquare className="ml-2 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Separator className="mb-4" />
                <h4 className="font-semibold text-sm mb-2">Etiquetas</h4>
                <div className="flex flex-wrap gap-2">
                    {ref.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
