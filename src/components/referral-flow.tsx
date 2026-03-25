'use client';

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { Label } from "./ui/label";

interface ReferralFlowProps {
    studentName: string;
    diagnosticImpression: string;
}

/**
 * Validates that sensitive data is not included in the referral letter.
 * @param template The letter template to check.
 * @returns boolean - True if the template is clean, false otherwise.
 */
function validateReferralContent(template: string, impression: string): boolean {
    const lowerCaseTemplate = template.toLowerCase();
    const forbiddenTerms = ['bdi', 'bai', 'soap', 'beck depression inventory']; // Terms to exclude
    
    for (const term of forbiddenTerms) {
        if (lowerCaseTemplate.includes(term)) {
            console.log(`VALIDATION FAILED: El término prohibido "${term}" fue encontrado en la carta de referencia.`);
            return false;
        }
    }
    
    // Test de Integridad Documental (Cap. 8): La impresión diagnóstica debe estar presente.
    if (!impression.trim()) {
        console.log("VALIDATION FAILED: La Impresión Diagnóstica Provisional es obligatoria y no fue encontrada.");
        return false;
    }
    
    return true;
}


export default function ReferralFlow({ studentName, diagnosticImpression }: ReferralFlowProps) {
    const [impression, setImpression] = useState(diagnosticImpression);

    const generateTemplate = (currentImpression: string) => `
[MEMBRETE DE LA INSTITUCIÓN]

Fecha: ${new Date().toLocaleDateString('es-MX')}
Para: [Nombre del Especialista / Institución de Salud]
De: [Tu Nombre], Psicólogo(a), CBTA 130

Asunto: Solicitud de Valoración Especializada y Contrarreferencia para el estudiante ${studentName}.

Estimado(a) colega,

Por medio de la presente, se solicita su valiosa colaboración para la valoración especializada del estudiante ${studentName}, quien forma parte de nuestro programa de seguimiento.

Tras la aplicación de los protocolos de detección y evaluación inicial, se ha identificado una Impresión Diagnóstica Provisional que sugiere la necesidad de una valoración más profunda en su área de especialidad.

**Impresión Diagnóstica Provisional (Resumen):**
${currentImpression}

Se adjunta un resumen del expediente con los puntajes relevantes y la formulación funcional del caso para su revisión.

Agradecemos de antemano su atención y quedamos a la espera de la **Contrarreferencia** con sus hallazgos y recomendaciones para poder dar seguimiento coordinado y garantizar la continuidad de la atención del estudiante.

Atentamente,

[Tu Nombre y Cédula Profesional]
Psicólogo(a) del Departamento de Orientación Educativa
CBTA 130
`.trim();

    const [referralLetterTemplate, setReferralLetterTemplate] = useState(generateTemplate(diagnosticImpression));

    const handleImpressionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newImpression = e.target.value;
        setImpression(newImpression);
        setReferralLetterTemplate(generateTemplate(newImpression));
    };
    
    const isContentValid = validateReferralContent(referralLetterTemplate, impression);

    const handleCopy = () => {
         if (isContentValid) {
            navigator.clipboard.writeText(referralLetterTemplate);
            alert("Plantilla copiada al portapapeles. El contenido ha sido validado.");
         } else {
             alert("ERROR DE VALIDACIÓN: No se puede copiar la plantilla. Contiene datos sensibles o le falta información requerida. Revise la consola.");
         }
    };

    const isReadOnly = !!diagnosticImpression;

    return (
        <DialogContent className="max-w-3xl">
             <DialogHeader>
                <DialogTitle>Flujo de Derivación y Contrarreferencia</DialogTitle>
                <DialogDescription>
                    Activación del protocolo de canalización a especialistas externos (Cap. 8.3).
                </DialogDescription>
            </DialogHeader>
             <div className="space-y-4">
                <div>
                  <Label htmlFor="diagnostic-impression-summary" className="font-semibold text-gray-700">
                    Impresión Diagnóstica Provisional (Resumen)
                  </Label>
                  <Textarea
                    id="diagnostic-impression-summary"
                    value={impression}
                    onChange={handleImpressionChange}
                    readOnly={isReadOnly}
                    placeholder={'RESUMIR AQUÍ LOS HALLAZGOS CLAVE: Ej. "Sintomatología ansioso-depresiva severa con ideación suicida activa", "Indicadores de posible TDAH que exceden el ámbito de intervención escolar", etc.'}
                    className={`mt-2 min-h-[100px] ${isReadOnly ? 'bg-gray-100' : ''}`}
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     {isReadOnly 
                        ? "Este campo es de solo lectura y se obtiene de la evaluación clínica." 
                        : "Llene este campo para justificar la derivación espontánea."}
                    </p>
                </div>
                
                <div>
                    <h3 className="text-md font-semibold text-gray-800 mb-2">Plantilla de Carta de Canalización (Datos Sanitizados)</h3>
                    <Textarea
                        value={referralLetterTemplate}
                        readOnly
                        className={`min-h-[350px] bg-gray-50 text-sm font-mono ${!isContentValid ? 'border-red-500 ring-2 ring-red-500' : ''}`}
                    />
                </div>

                {!isContentValid && (
                    <p className="text-sm text-red-600 font-bold">
                        Error de validación: La "Impresión Diagnóstica" no puede estar vacía. La copia está deshabilitada.
                    </p>
                )}
                    <div className="flex justify-end">
                    <Button onClick={handleCopy} disabled={!isContentValid}>
                        Copiar Plantilla Validada
                    </Button>
                </div>
            </div>
        </DialogContent>
    );
}
