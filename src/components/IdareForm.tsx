'use client';

import { useState, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Save, RotateCcw } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ============================================
// IDARE/STAI: INVENTARIO DE ANSIEDAD RASGO-ESTADO
// ============================================

// Items Estado (1-20) - ¿Cómo se siente ahora mismo?
const itemsEstado = [
    { id: 'e1', text: '1. Me siento calmado', inverted: true },
    { id: 'e2', text: '2. Me siento seguro', inverted: true },
    { id: 'e3', text: '3. Estoy tenso', inverted: false },
    { id: 'e4', text: '4. Estoy contrariado', inverted: false },
    { id: 'e5', text: '5. Me siento a gusto', inverted: true },
    { id: 'e6', text: '6. Me siento alterado', inverted: false },
    { id: 'e7', text: '7. Estoy preocupado por posibles desgracias', inverted: false },
    { id: 'e8', text: '8. Me siento descansado', inverted: true },
    { id: 'e9', text: '9. Me siento ansioso', inverted: false },
    { id: 'e10', text: '10. Me siento cómodo', inverted: true },
    { id: 'e11', text: '11. Me siento con confianza', inverted: true },
    { id: 'e12', text: '12. Me siento nervioso', inverted: false },
    { id: 'e13', text: '13. Estoy agitado', inverted: false },
    { id: 'e14', text: '14. Me siento a punto de explotar', inverted: false },
    { id: 'e15', text: '15. Me siento relajado', inverted: true },
    { id: 'e16', text: '16. Me siento satisfecho', inverted: true },
    { id: 'e17', text: '17. Estoy preocupado', inverted: false },
    { id: 'e18', text: '18. Me siento aturdido', inverted: false },
    { id: 'e19', text: '19. Me siento alegre', inverted: true },
    { id: 'e20', text: '20. Me siento bien', inverted: true }
];

// Items Rasgo (21-40) - ¿Cómo se siente generalmente?
const itemsRasgo = [
    { id: 'r21', text: '21. Me siento bien', inverted: true },
    { id: 'r22', text: '22. Me canso rápidamente', inverted: false },
    { id: 'r23', text: '23. Siento ganas de llorar', inverted: false },
    { id: 'r24', text: '24. Quisiera ser tan feliz como otros', inverted: false },
    { id: 'r25', text: '25. Pierdo oportunidades por no decidir', inverted: false },
    { id: 'r26', text: '26. Me siento descansado', inverted: true },
    { id: 'r27', text: '27. Soy una persona tranquila', inverted: true },
    { id: 'r28', text: '28. Siento que las dificultades se amontonan', inverted: false },
    { id: 'r29', text: '29. Me preocupo demasiado por cosas sin importancia', inverted: false },
    { id: 'r30', text: '30. Soy feliz', inverted: true },
    { id: 'r31', text: '31. Tomo las cosas muy a pecho', inverted: false },
    { id: 'r32', text: '32. Me falta confianza en mí mismo', inverted: false },
    { id: 'r33', text: '33. Me siento seguro', inverted: true },
    { id: 'r34', text: '34. Trato de evitar enfrentar crisis', inverted: false },
    { id: 'r35', text: '35. Me siento melancólico', inverted: false },
    { id: 'r36', text: '36. Me siento satisfecho', inverted: true },
    { id: 'r37', text: '37. Ideas poco importantes me molestan', inverted: false },
    { id: 'r38', text: '38. Me afectan tanto los desengaños', inverted: false },
    { id: 'r39', text: '39. Soy una persona estable', inverted: true },
    { id: 'r40', text: '40. Me pongo tenso cuando pienso en mis asuntos', inverted: false }
];

// Opciones para Estado
const opcionesEstado = [
    { value: 1, label: 'No' },
    { value: 2, label: 'Poco' },
    { value: 3, label: 'Bastante' },
    { value: 4, label: 'Mucho' }
];

// Opciones para Rasgo
const opcionesRasgo = [
    { value: 1, label: 'Casi Nunca' },
    { value: 2, label: 'A veces' },
    { value: 3, label: 'Frecuentemente' },
    { value: 4, label: 'Casi Siempre' }
];

function interpretIDARE(score: number): { level: string; color: string; description: string } {
    // Rango: 20-80 para cada subescala
    if (score <= 30) return { level: 'Ansiedad baja', color: 'bg-green-500', description: 'Nivel bajo de ansiedad. Sin indicadores significativos.' };
    if (score <= 45) return { level: 'Ansiedad moderada', color: 'bg-yellow-500', description: 'Presencia de ansiedad moderada. Monitoreo recomendado.' };
    if (score <= 60) return { level: 'Ansiedad alta', color: 'bg-orange-500', description: 'Nivel alto de ansiedad. Se recomienda intervención.' };
    return { level: 'Ansiedad severa', color: 'bg-red-500', description: 'Ansiedad severa. Requiere atención clínica.' };
}

interface IdareFormProps {
    studentId?: string;
    onComplete?: (result: { scoreEstado: number; scoreRasgo: number; interpretation: string }) => void;
}

export default function IdareForm({ studentId, onComplete }: IdareFormProps) {
    const [responsesEstado, setResponsesEstado] = useState<Record<string, number>>({});
    const [responsesRasgo, setResponsesRasgo] = useState<Record<string, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<{
        scoreEstado: number;
        scoreRasgo: number;
        interpretationEstado: { level: string; color: string; description: string };
        interpretationRasgo: { level: string; color: string; description: string };
    } | null>(null);

    const handleResponseEstado = useCallback((itemId: string, value: number) => {
        setResponsesEstado(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const handleResponseRasgo = useCallback((itemId: string, value: number) => {
        setResponsesRasgo(prev => ({ ...prev, [itemId]: value }));
    }, []);

    const answeredEstado = Object.keys(responsesEstado).length;
    const answeredRasgo = Object.keys(responsesRasgo).length;
    const totalAnswered = answeredEstado + answeredRasgo;
    const progress = (totalAnswered / 40) * 100;

    const calculateResult = useCallback(() => {
        // Calcular Estado (items 1-20)
        let scoreEstado = 0;
        itemsEstado.forEach(item => {
            const rawValue = responsesEstado[item.id];
            if (rawValue !== undefined) {
                // Si es invertido: 5 - valor
                scoreEstado += item.inverted ? (5 - rawValue) : rawValue;
            }
        });

        // Calcular Rasgo (items 21-40)
        let scoreRasgo = 0;
        itemsRasgo.forEach(item => {
            const rawValue = responsesRasgo[item.id];
            if (rawValue !== undefined) {
                scoreRasgo += item.inverted ? (5 - rawValue) : rawValue;
            }
        });

        return {
            scoreEstado,
            scoreRasgo,
            interpretationEstado: interpretIDARE(scoreEstado),
            interpretationRasgo: interpretIDARE(scoreRasgo)
        };
    }, [responsesEstado, responsesRasgo]);

    const handleSubmit = async () => {
        if (totalAnswered < 40) {
            alert(`Por favor, responda todas las preguntas (${totalAnswered}/40).`);
            return;
        }

        const calculatedResult = calculateResult();
        setResult(calculatedResult);
        setIsSubmitted(true);

        if (onComplete) {
            onComplete({
                scoreEstado: calculatedResult.scoreEstado,
                scoreRasgo: calculatedResult.scoreRasgo,
                interpretation: `${calculatedResult.interpretationEstado.level} / ${calculatedResult.interpretationRasgo.level}`
            });
        }

        if (studentId && db) {
            try {
                setIsSaving(true);
                await addDoc(collection(db, 'test_results'), {
                    studentId,
                    testType: 'IDARE-STAI',
                    date: Timestamp.now(),
                    scoreEstado: calculatedResult.scoreEstado,
                    scoreRasgo: calculatedResult.scoreRasgo,
                    interpretationEstado: calculatedResult.interpretationEstado.level,
                    interpretationRasgo: calculatedResult.interpretationRasgo.level,
                    responsesEstado,
                    responsesRasgo
                });
            } catch (error) {
                console.error('Error guardando:', error);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleReset = () => {
        setResponsesEstado({});
        setResponsesRasgo({});
        setIsSubmitted(false);
        setResult(null);
    };

    // Render de resultado
    if (isSubmitted && result) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        Resultados IDARE
                    </CardTitle>
                    <CardDescription>Inventario de Ansiedad Rasgo-Estado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Ansiedad Estado</p>
                            <p className="text-4xl font-bold text-gray-800">{result.scoreEstado}</p>
                            <p className="text-xs text-gray-400">(20-80)</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Ansiedad Rasgo</p>
                            <p className="text-4xl font-bold text-gray-800">{result.scoreRasgo}</p>
                            <p className="text-xs text-gray-400">(20-80)</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-lg ${result.interpretationEstado.color} text-white text-center`}>
                            <p className="font-semibold">{result.interpretationEstado.level}</p>
                            <p className="text-xs opacity-90">{result.interpretationEstado.description}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${result.interpretationRasgo.color} text-white text-center`}>
                            <p className="font-semibold">{result.interpretationRasgo.level}</p>
                            <p className="text-xs opacity-90">{result.interpretationRasgo.description}</p>
                        </div>
                    </div>

                    <Button onClick={handleReset} variant="outline" className="w-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Nueva Evaluación
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>IDARE - Inventario de Ansiedad Rasgo-Estado</CardTitle>
                <CardDescription>
                    Lea cada frase y marque la opción que indique cómo se siente.
                </CardDescription>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progreso total</span>
                        <span>{totalAnswered}/40</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="estado" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="estado">
                            Estado ({answeredEstado}/20)
                        </TabsTrigger>
                        <TabsTrigger value="rasgo">
                            Rasgo ({answeredRasgo}/20)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="estado" className="space-y-4">
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                            <strong>PARTE 1:</strong> ¿Cómo se siente AHORA MISMO?
                        </p>
                        {itemsEstado.map(item => (
                            <div key={item.id} className="p-3 border rounded-lg bg-gray-50">
                                <p className="font-medium text-sm mb-2">{item.text}</p>
                                <RadioGroup
                                    value={responsesEstado[item.id]?.toString() || ''}
                                    onValueChange={(value) => handleResponseEstado(item.id, parseInt(value))}
                                    className="flex gap-4 flex-wrap"
                                >
                                    {opcionesEstado.map(opt => (
                                        <div key={opt.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={opt.value.toString()} id={`${item.id}-${opt.value}`} />
                                            <Label htmlFor={`${item.id}-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="rasgo" className="space-y-4">
                        <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                            <strong>PARTE 2:</strong> ¿Cómo se siente GENERALMENTE?
                        </p>
                        {itemsRasgo.map(item => (
                            <div key={item.id} className="p-3 border rounded-lg bg-gray-50">
                                <p className="font-medium text-sm mb-2">{item.text}</p>
                                <RadioGroup
                                    value={responsesRasgo[item.id]?.toString() || ''}
                                    onValueChange={(value) => handleResponseRasgo(item.id, parseInt(value))}
                                    className="flex gap-4 flex-wrap"
                                >
                                    {opcionesRasgo.map(opt => (
                                        <div key={opt.value} className="flex items-center space-x-2">
                                            <RadioGroupItem value={opt.value.toString()} id={`${item.id}-${opt.value}`} />
                                            <Label htmlFor={`${item.id}-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        ))}
                    </TabsContent>
                </Tabs>

                <Button
                    onClick={handleSubmit}
                    className="w-full mt-6"
                    disabled={totalAnswered < 40 || isSaving}
                    size="lg"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Guardando...' : 'Finalizar Evaluación'}
                </Button>
            </CardContent>
        </Card>
    );
}
