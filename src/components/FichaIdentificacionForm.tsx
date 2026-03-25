'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function FichaIdentificacionForm() {

    return (
        <form className="space-y-8 p-1">
            {/* SECCIÓN I: DATOS DEL ESTUDIANTE */}
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">I. Datos del Estudiante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="full-name">Nombre Completo</Label>
                        <Input id="full-name" name="full-name" placeholder="Ej. Ana María Pérez López" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="birth-date">Fecha de Nacimiento</Label>
                        <Input id="birth-date" name="birth-date" type="date" />
                    </div>
                    <div className="space-y-2">
                        <Label>Sexo</Label>
                         <RadioGroup name="sexo" className="flex gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="femenino" id="sex-fem" /><Label htmlFor="sex-fem">Femenino</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="masculino" id="sex-masc" /><Label htmlFor="sex-masc">Masculino</Label></div>
                        </RadioGroup>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gender-identity">Identidad de Género</Label>
                        <Input id="gender-identity" name="gender-identity" placeholder="Ej. Mujer, Hombre, No-binario..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="group">Grupo</Label>
                        <Input id="group" name="group" placeholder="Ej. 5B" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="semester">Semestre</Label>
                        <Input id="semester" name="semester" type="number" placeholder="Ej. 5" />
                    </div>
                </div>
            </div>

            <Separator />
            
            {/* SECCIÓN II: DATOS DE CONTACTO */}
            <div>
                 <h3 className="text-lg font-semibold text-gray-700 mb-4">II. Datos de Contacto del Estudiante</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="domicilio">Domicilio</Label>
                        <Textarea id="domicilio" name="domicilio" placeholder="Calle, Número, Colonia, Municipio, Estado, C.P."/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="celular">Número Celular</Label>
                        <Input id="celular" name="celular" type="tel" placeholder="Ej. 55-1234-5678"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp (si es diferente)</Label>
                        <Input id="whatsapp" name="whatsapp" type="tel" placeholder="Ej. 55-8765-4321"/>
                    </div>
                     <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" name="email" type="email" placeholder="ejemplo@correo.com"/>
                    </div>
                 </div>
            </div>

            <Separator />

            {/* SECCIÓN III: DATOS SOCIOFAMILIARES */}
            <div>
                <h3 className="text-lg font.semibold text-gray-700 mb-4">III. Datos Sociofamiliares</h3>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Label>¿Con quién vives actualmente?</Label>
                         <RadioGroup name="living-with" className="flex flex-wrap gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="ambos" id="lw-1" /><Label htmlFor="lw-1">Ambos Padres</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="mama" id="lw-2" /><Label htmlFor="lw-2">Solo Mamá</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="papa" id="lw-3" /><Label htmlFor="lw-3">Solo Papá</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="abuelos" id="lw-4" /><Label htmlFor="lw-4">Abuelos</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="otro" id="lw-5" /><Label htmlFor="lw-5">Otro</Label></div>
                        </RadioGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="mother-name">Nombre de la Madre o Tutor(a)</Label>
                            <Input id="mother-name" name="mother-name" placeholder="Nombre completo"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mother-phone">Teléfono de la Madre o Tutor(a)</Label>
                            <Input id="mother-phone" name="mother-phone" type="tel" placeholder="Ej. 55-1111-2222"/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="father-name">Nombre del Padre o Tutor</Label>
                            <Input id="father-name" name="father-name" placeholder="Nombre completo"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="father-phone">Teléfono del Padre o Tutor</Label>
                            <Input id="father-phone" name="father-phone" type="tel" placeholder="Ej. 55-3333-4444"/>
                        </div>
                    </div>
                </div>
            </div>
            
            <Separator />

            {/* SECCIÓN IV: ANTECEDENTES */}
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">IV. Antecedentes Personales Relevantes</h3>
                 <div className="space-y-2">
                    <Label htmlFor="background-info">Describe brevemente si has recibido atención psicológica o psiquiátrica previa, o si hay alguna condición médica relevante.</Label>
                    <Textarea id="background-info" name="background-info" placeholder="Ej. 'Asistí a terapia por ansiedad hace 2 años', 'Tengo diagnóstico de TDAH', 'Sufro de migrañas frecuentes'..." />
                </div>
            </div>
        </form>
    );
}
