
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, KeyRound, Settings, BarChart3, Users, BookCopy, FilePen, Presentation, FileText, AlertTriangle, Contact } from 'lucide-react';
import Link from 'next/link';

export default function ManualPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HelpCircle className="h-8 w-8" />
          Manual de Uso
        </h1>
        <p className="text-muted-foreground">
          Guía de referencia rápida para todas las funcionalidades de Academic Tracker Pro.
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Configuración Inicial (¡Muy Importante!)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pt-2">
                <p>
                  Esta sección, que encuentras en el menú como <strong>Ajustes</strong>, es el primer lugar que debes visitar.
                </p>
                <ul>
                  <li>
                    <strong>Personalización:</strong> Aquí puedes poner el nombre de tu institución y subir su logo. Estos elementos aparecerán en todos los informes que generes, dándoles un aspecto profesional y personalizado. También puedes subir una imagen de tu firma.
                  </li>
                  <li>
                    <strong>Clave API de Google AI:</strong> Este campo es <strong>crucial</strong> para las funciones de Inteligencia Artificial. Sin una clave API válida, los botones &quot;Generar con IA&quot; para crear análisis de grupo o retroalimentación para estudiantes no funcionarán. Puedes obtener tu clave de forma gratuita desde <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a>.
                  </li>
                  <li>
                    <strong>Temas Visuales:</strong> Cambia la paleta de colores de toda la aplicación para que se ajuste a tus preferencias.
                  </li>
                  <li>
                    <strong>Copia de Seguridad y Restauración:</strong> Esta es una función vital para proteger tu trabajo.
                    <ul>
                      <li><strong>Exportar:</strong> Te permite descargar un archivo único (en formato JSON) que contiene absolutamente todos tus datos. Guarda este archivo en un lugar seguro.</li>
                      <li><strong>¿Cuándo es crucial exportar?</strong> Como todos tus datos se guardan en el navegador, es <strong>absolutamente obligatorio</strong> hacer una copia de seguridad antes de limpiar el historial, la caché o los &quot;datos de sitios&quot; de tu navegador, ya que esa acción <strong>borrará toda tu información de la aplicación.</strong> También es indispensable si planeas usar la aplicación en un nuevo ordenador.</li>
                      <li><strong>Importar:</strong> Si necesitas restaurar tu información, simplemente usa la opción de &quot;Importar&quot; y selecciona el archivo que guardaste. Esta acción reemplazará todos los datos actuales con los del archivo de respaldo.</li>
                    </ul>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <BookCopy className="h-5 w-5 text-primary" />
                  <span>Grupos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pt-2">
                <p>
                  Es el núcleo de la organización. Un &quot;grupo&quot; representa una clase, materia o asignatura que impartes.
                </p>
                <ul>
                    <li>
                        <strong>Creación:</strong> Crea nuevos grupos especificando el nombre de la asignatura, semestre y facilitador.
                    </li>
                    <li>
                        <strong>Gestión de Estudiantes:</strong> La función &quot;Agregar Estudiantes&quot; te permite pegar listas de datos (nombres, correos, etc.) directamente desde una hoja de cálculo para registrar a múltiples estudiantes de una sola vez, ahorrándote mucho tiempo.
                    </li>
                    <li>
                        <strong>Gestión de Parciales:</strong> Usa las pestañas en la parte superior (Primer, Segundo, Tercer Parcial) para cambiar el contexto de toda la información. Las calificaciones, asistencia y riesgo se ajustan al parcial seleccionado.
                    </li>
                    <li>
                        <strong>Acciones Rápidas:</strong> Desde la vista del grupo, tienes acceso directo para tomar asistencia, registrar calificaciones, y más.
                    </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <FilePen className="h-5 w-5 text-primary" />
                  <span>Calificaciones y Criterios</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pt-2">
                <p>
                  Aquí defines cómo se evaluará a tus estudiantes y registras sus resultados.
                </p>
                <ul>
                    <li>
                        <strong>Criterios de Evaluación:</strong> Antes de calificar, debes ir a &quot;Gestionar Criterios&quot;. Aquí defines los rubros (Ej. Examen, Actividades, Proyecto), su peso porcentual (la suma no debe exceder 100) y el valor esperado (Ej. 10 tareas, 100 puntos en el examen).
                    </li>
                     <li>
                        <strong>Criterios Automáticos:</strong> Los criterios &quot;Actividades&quot;, &quot;Portafolio&quot; y &quot;Participación&quot; se calculan solos basados en los registros que hagas en sus respectivas secciones. No necesitas ponerles un valor esperado.
                    </li>
                    <li>
                        <strong>Registro de Calificaciones:</strong> Una vez definidos los criterios, ve a &quot;Registrar Calificaciones&quot;. En la tabla, solo ingresa el valor &quot;logrado&quot; por el estudiante en los criterios manuales. El sistema calculará el porcentaje ganado y la calificación final del parcial en tiempo real.
                    </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
             <AccordionItem value="item-4">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Asistencia, Participaciones y Actividades</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pt-2">
                <p>
                  Módulos para el seguimiento diario. Funcionan con una matriz de estudiantes vs. fechas.
                </p>
                <ul>
                    <li>
                        <strong>Asistencia:</strong> Haz clic en &quot;Registrar Asistencia de Hoy&quot; para añadir la columna del día actual. Luego, marca las casillas de los estudiantes presentes.
                    </li>
                    <li>
                        <strong>Participaciones:</strong> Funciona igual que la asistencia. El sistema no te dejará registrar una participación si el estudiante tiene una inasistencia ese mismo día.
                    </li>
                    <li>
                        <strong>Actividades:</strong> Primero crea una actividad con su nombre y fecha de entrega. Luego, marca la casilla de los estudiantes que cumplieron con la entrega.
                    </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span>Informes (con IA)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pt-2">
                <p>
                  Genera reportes profesionales y detallados.
                </p>
                <ul>
                    <li>
                        <strong>Reporte General del Grupo:</strong> Crea un PDF para un parcial específico con estadísticas clave. Aquí puedes usar el botón de IA para generar un análisis narrativo profesional sobre el rendimiento del grupo.
                    </li>
                    <li>
                        <strong>Reporte de Riesgo:</strong> Analiza a los estudiantes con riesgo alto o medio y genera fichas individuales con el desglose de su rendimiento.
                    </li>
                    <li>
                        <strong>Informe Individual por Estudiante:</strong> Genera un perfil completo en PDF para un estudiante. Incluye sus datos, calificaciones y bitácora. También cuenta con un botón de IA para generar una retroalimentación constructiva y personalizada.
                    </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="item-6">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Otras Secciones</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none pt-2">
                <ul>
                    <li><strong>Dashboard:</strong> Tu pantalla de inicio. Te da un resumen rápido de estudiantes, grupos, alertas de riesgo y un buscador rápido.</li>
                    <li><strong>Bitácora:</strong> Un diario digital para registrar eventos importantes (conducta, méritos, etc.) de cada estudiante.</li>
                    <li><strong>Evaluación Semestral:</strong> Muestra una tabla con las calificaciones de los tres parciales y calcula el promedio semestral final de cada estudiante.</li>
                     <li><strong>Estadísticas:</strong> Gráficas visuales sobre el riesgo, aprobación, asistencia y los mejores estudiantes del grupo activo.</li>
                    <li><strong>Contacto y Soporte:</strong> Un directorio de los tutores de tus estudiantes y la información de contacto del soporte de la aplicación.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
