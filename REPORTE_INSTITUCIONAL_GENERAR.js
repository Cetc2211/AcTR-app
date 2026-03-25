const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle, 
        WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// Paleta institucional - tonos académicos
const colors = {
  primary: "1E3A5F",      // Azul institucional oscuro
  secondary: "2D5A87",    // Azul medio
  accent: "4A90D9",       // Azul acento
  body: "333333",         // Gris oscuro para texto
  lightBg: "F0F7FF",      // Fondo azul muy claro
  headerBg: "1E3A5F",     // Fondo encabezados
  tableBg: "E8F4FD",      // Fondo tablas
  highlight: "059669"     // Verde para destacados
};

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: colors.accent };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: colors.secondary, font: "Times New Roman" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: colors.accent, font: "Times New Roman" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-features", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-benefits", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-access", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [
    // === PORTADA ===
    {
      properties: { page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
      children: [
        new Paragraph({ spacing: { before: 1500 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          shading: { fill: colors.primary, type: ShadingType.CLEAR },
          spacing: { before: 400, after: 400 },
          children: [new TextRun({ text: "SISTEMA DE GESTIÓN ACADÉMICA", size: 48, bold: true, color: "FFFFFF" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "AcTR-app", size: 72, bold: true, color: colors.primary })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "Academic Tracking & Reporting Application", size: 28, italics: true, color: colors.secondary })]
        }),
        new Paragraph({ spacing: { before: 800 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "─────────────────────────────────", size: 24, color: colors.accent })]
        }),
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "REPORTE INSTITUCIONAL", size: 36, bold: true, color: colors.primary })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "Funcionalidades y Guía de Uso para Docentes y Directivos", size: 24, color: colors.secondary })]
        }),
        new Paragraph({ spacing: { before: 1500 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          shading: { fill: colors.lightBg, type: ShadingType.CLEAR },
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "Publicación para Gaceta Institucional", size: 22, color: colors.body })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Enero 2025", size: 22, color: colors.secondary })]
        })
      ]
    },
    // === CONTENIDO PRINCIPAL ===
    {
      properties: { page: { margin: { top: 1800, right: 1440, bottom: 1440, left: 1440 } } },
      headers: {
        default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "AcTR-app | Sistema de Gestión Académica", size: 18, color: colors.secondary, italics: true })
          ]
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Página ", size: 18, color: colors.secondary }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: colors.secondary }),
            new TextRun({ text: " de ", size: 18, color: colors.secondary }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: colors.secondary })
          ]
        })] })
      },
      children: [
        // === 1. INTRODUCCIÓN ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Introducción")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "AcTR-app (Academic Tracking & Reporting Application) es una plataforma web integral diseñada para modernizar y optimizar los procesos de seguimiento académico en las instituciones educativas. Esta herramienta tecnológica permite a los docentes gestionar de manera eficiente la información de sus grupos, registrar asistencia, calificaciones, observaciones de conducta y generar reportes automatizados con apoyo de inteligencia artificial.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "El sistema fue desarrollado utilizando tecnologías de vanguardia como Next.js 14, React y Firebase, garantizando una experiencia de usuario fluida, segura y accesible desde cualquier dispositivo con conexión a internet. Su diseño responsivo permite su uso tanto en computadoras de escritorio como en dispositivos móviles, facilitando el trabajo docente en cualquier momento y lugar.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "La aplicación representa un avance significativo en la digitalización de los procesos académicos, eliminando el uso de papel y centralizando la información en una plataforma segura que cumple con los estándares de protección de datos establecidos por las autoridades educativas.", color: colors.body })]
        }),

        // === 2. OBJETIVOS DEL SISTEMA ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Objetivos del Sistema")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Objetivo General")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Proporcionar a la comunidad educativa una herramienta tecnológica integral que facilite el registro, seguimiento y análisis del desempeño académico de los estudiantes, optimizando los procesos administrativos y fortaleciendo la comunicación entre docentes, tutores y directivos.", color: colors.body })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Objetivos Específicos")] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Digitalizar el registro de asistencia, calificaciones y observaciones de conducta", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Automatizar la generación de reportes parciales y semestrales", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Facilitar la identificación temprana de estudiantes en riesgo académico", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Fortalecer la comunicación con tutores mediante canales digitales", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Proporcionar estadísticas y métricas para la toma de decisiones institucionales", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Garantizar la seguridad y confidencialidad de la información académica", color: colors.body })] }),

        // === 3. FUNCIONALIDADES PRINCIPALES ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Funcionalidades Principales")] }),
        
        // 3.1 Gestión de Grupos
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Gestión de Grupos y Estudiantes")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "El módulo de gestión de grupos permite a los docentes organizar su carga académica de manera eficiente. Cada grupo puede ser configurado con información detallada incluyendo la materia, semestre, turno y lista de estudiantes. La aplicación soporta la creación de múltiples grupos y permite cambiar rápidamente entre ellos para facilitar el trabajo del docente que atiende diferentes asignaturas.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Características principales de este módulo:", bold: true, color: colors.secondary })]
        }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Registro de grupos con datos completos (materia, semestre, periodo escolar)", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Importación de listas de estudiantes desde archivos Excel o CSV", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Ficha de estudiante con información de contacto del tutor", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Configuración de criterios de evaluación personalizados por grupo", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Vinculación con grupos oficiales institucionales", color: colors.body })] }),

        // 3.2 Registro de Asistencia
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 Control de Asistencia")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "El sistema de control de asistencia permite registrar de manera rápida y precisa la presencia de los estudiantes en cada sesión de clase. La interfaz intuitiva presenta una lista de estudiantes con casillas de verificación que pueden ser marcadas con un solo clic. El sistema calcula automáticamente los porcentajes de asistencia y genera alertas cuando un estudiante alcanza el límite de faltas establecido por la institución.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Funcionalidades destacadas:", bold: true, color: colors.secondary })]
        }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Registro diario de asistencia con un solo clic", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Cálculo automático de porcentajes de asistencia por parcial y semestre", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Visualización de historial de asistencia en formato calendario", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Generación de justificaciones de inasistencia", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Sincronización con sistema de reportes para tutores", color: colors.body })] }),

        // 3.3 Sistema de Calificaciones
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 Sistema de Calificaciones")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "El módulo de calificaciones ofrece flexibilidad para adaptarse a diferentes esquemas de evaluación. Los docentes pueden configurar criterios de evaluación personalizados (exámenes, tareas, proyectos, participaciones) con ponderaciones específicas. El sistema calcula automáticamente las calificaciones parciales y finales, aplicando las fórmulas configuradas y generando promedios por grupo y por estudiante.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Opciones de evaluación disponibles:", bold: true, color: colors.secondary })]
        }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Evaluación por criterios configurables con ponderaciones", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Asignación directa de calificaciones por parcial", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Registro de calificaciones de recuperación", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Sistema de méritos y reconocimientos", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Cálculo automático de índice de riesgo académico (IRC)", color: colors.body })] }),

        // 3.4 Bitácora de Observaciones
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.4 Bitácora de Observaciones")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "La bitácora electrónica permite a los docentes registrar observaciones sobre el comportamiento, desempeño y situaciones relevantes de cada estudiante. Este módulo es fundamental para el seguimiento integral del estudiante, ya que documenta tanto aspectos positivos (méritos, reconocimientos) como situaciones que requieren atención especial (problemas de conducta, canalizaciones).", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Tipos de observaciones soportadas:", bold: true, color: colors.secondary })]
        }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Problemas de conducta y episodios emocionales", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Méritos y reconocimientos académicos", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Asesorías académicas brindadas", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Canalizaciones a áreas especializadas (psicología, tutoría, dirección)", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Seguimiento de casos con actualizaciones y cierre", color: colors.body })] }),

        // 3.5 Generación de Reportes con IA
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.5 Generación de Reportes con Inteligencia Artificial")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Una de las innovaciones más significativas de AcTR-app es la integración de inteligencia artificial para la generación de reportes. Utilizando tecnología Google Gemini, el sistema puede analizar automáticamente los datos académicos de un estudiante o grupo y generar reportes narrativos personalizados en cuestión de segundos. Estos reportes incluyen análisis del desempeño, identificación de áreas de oportunidad y recomendaciones pedagógicas.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Tipos de reportes disponibles:", bold: true, color: colors.secondary })]
        }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Reportes parciales con retroalimentación personalizada por estudiante", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Reportes grupales con análisis de tendencias del grupo", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Reportes semestrales consolidados", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Reportes de estudiantes en riesgo académico", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Exportación a PDF para impresión y archivo", color: colors.body })] }),

        // === 4. MÓDULO DE ESTADÍSTICAS ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Módulo de Estadísticas y Dashboard")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "El dashboard principal proporciona una visión general del estado académico de todos los grupos del docente. A través de gráficas interactivas y métricas clave, los usuarios pueden identificar rápidamente tendencias, comparar el desempeño entre grupos y detectar situaciones que requieren atención inmediata. Este módulo es particularmente útil para directivos que necesitan supervisar el rendimiento general de la institución.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Indicadores disponibles:", bold: true, color: colors.secondary })]
        }),

        // Tabla de indicadores
        new Table({
          columnWidths: [3500, 5500],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Indicador", bold: true, size: 22 })] })] }),
                new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Descripción", bold: true, size: 22 })] })] })
              ]
            }),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Promedio general", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Promedio aritmético de calificaciones por grupo", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Porcentaje de asistencia", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Tasa de asistencia global y por parcial", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Estudiantes en riesgo", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Número y lista de estudiantes con bajo rendimiento", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Distribución de calificaciones", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Gráfica de barras mostrando rangos de calificaciones", size: 22 })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Tendencia de rendimiento", size: 22 })] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Evolución del promedio a lo largo del semestre", size: 22 })] })] })
            ]})
          ]
        }),
        new Paragraph({ spacing: { before: 100, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tabla 1: Indicadores del Dashboard", size: 18, italics: true, color: colors.secondary })] }),

        // === 5. COMUNICACIÓN CON TUTORES ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Comunicación con Tutores")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "AcTR-app fortalece el vínculo entre la institución y las familias mediante un sistema integral de comunicación. El módulo de contactos permite acceder rápidamente a la información de los tutores de cada estudiante y establecer comunicación directa a través de WhatsApp o correo electrónico. Esta funcionalidad es especialmente valiosa para informar sobre el desempeño académico, citar a reuniones o dar seguimiento a casos especiales.", color: colors.body })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 Características del Módulo de Comunicación")] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Directorio de tutores con información de contacto actualizada", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Integración con WhatsApp para comunicación instantánea", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Generación de mensajes predefinidos para situaciones comunes", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Registro de comunicaciones realizadas", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Notificaciones automatizadas de reportes generados", color: colors.body })] }),

        // === 6. SEGURIDAD Y PRIVACIDAD ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Seguridad y Privacidad de Datos")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "La protección de la información académica es una prioridad fundamental en AcTR-app. El sistema implementa múltiples capas de seguridad para garantizar la confidencialidad, integridad y disponibilidad de los datos. La infraestructura está construida sobre Firebase, plataforma de Google que cumple con los más altos estándares de seguridad internacionales.", color: colors.body })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 Medidas de Seguridad Implementadas")] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Autenticación segura mediante correo electrónico y contraseña", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Encriptación de datos en tránsito y en reposo (SSL/TLS)", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Control de acceso basado en roles (administrador, docente)", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Respaldo automático de información en la nube", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, children: [new TextRun({ text: "Funcionamiento offline con sincronización automática", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-features", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Cumplimiento con regulaciones de protección de datos personales", color: colors.body })] }),

        // === 7. BENEFICIOS ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Beneficios para la Comunidad Educativa")] }),
        
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.1 Para Docentes")] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Reducción significativa del tiempo dedicado a tareas administrativas", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Acceso a información actualizada desde cualquier dispositivo", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Generación automática de reportes con calidad profesional", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Herramientas para identificar y atender estudiantes en riesgo", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Eliminación del uso de papel y formatos físicos", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.2 Para Directivos")] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Visibilidad en tiempo real del desempeño académico institucional", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Datos estadísticos para la toma de decisiones informadas", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Supervisión del cumplimiento de registros académicos", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Centralización de la información académica", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Generación de reportes institucionales automatizados", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.3 Para Estudiantes y Tutores")] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Comunicación oportuna con docentes", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Retroalimentación personalizada sobre el desempeño académico", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, children: [new TextRun({ text: "Transparencia en el proceso de evaluación", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-benefits", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Atención temprana a situaciones de riesgo académico", color: colors.body })] }),

        // === 8. ACCESO AL SISTEMA ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Acceso al Sistema")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "AcTR-app está disponible como una aplicación web progresiva (PWA), lo que significa que puede ser accedida desde cualquier navegador moderno sin necesidad de instalar software adicional. Los usuarios autorizados pueden ingresar mediante su correo electrónico institucional y contraseña proporcionada por el administrador del sistema.", color: colors.body })]
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.1 Requisitos Técnicos")] }),
        new Paragraph({ numbering: { reference: "bullet-access", level: 0 }, children: [new TextRun({ text: "Navegador web actualizado (Chrome, Firefox, Edge, Safari)", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-access", level: 0 }, children: [new TextRun({ text: "Conexión a internet estable", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-access", level: 0 }, children: [new TextRun({ text: "Cuenta de usuario autorizada", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-access", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Dispositivo compatible (computadora, tablet, smartphone)", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.1 Proceso de Registro")] }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "El acceso a AcTR-app está restringido a personal autorizado. El proceso de registro es el siguiente:", color: colors.body })]
        }),
        new Paragraph({ numbering: { reference: "numbered-steps", level: 0 }, children: [new TextRun({ text: "El docente solicita acceso al administrador del sistema", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-steps", level: 0 }, children: [new TextRun({ text: "El administrador autoriza el correo electrónico institucional", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-steps", level: 0 }, children: [new TextRun({ text: "El docente accede a la página de registro y crea su cuenta", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-steps", level: 0 }, children: [new TextRun({ text: "El sistema valida las credenciales y activa la cuenta", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-steps", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "El docente puede comenzar a utilizar el sistema inmediatamente", color: colors.body })] }),

        // === 9. SOPORTE TÉCNICO ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Soporte Técnico y Capacitación")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "La institución cuenta con recursos de apoyo para facilitar la adopción del sistema. Se han desarrollado materiales de capacitación, guías de usuario y sesiones de formación para garantizar que todos los docentes puedan aprovechar al máximo las funcionalidades de AcTR-app. El soporte técnico está disponible para resolver cualquier incidencia o duda que pueda surgir durante el uso de la aplicación.", color: colors.body })]
        }),

        // === 10. CONCLUSIÓN ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("10. Conclusión")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "AcTR-app representa un paso importante hacia la modernización de los procesos académicos de nuestra institución. La plataforma integra las herramientas necesarias para que los docentes realicen su trabajo de manera más eficiente, los directivos cuenten con información oportuna para la toma de decisiones, y las familias mantengan una comunicación efectiva con la escuela.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "La incorporación de inteligencia artificial para la generación de reportes posiciona a nuestra institución a la vanguardia de la innovación educativa, demostrando nuestro compromiso con la mejora continua y la adopción de tecnologías que benefician a toda la comunidad educativa.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Invitamos a todos los docentes y directivos a utilizar esta herramienta y a proporcionar retroalimentación para su mejora continua. Juntos podemos construir un entorno educativo más eficiente, transparente y centrado en el éxito de nuestros estudiantes.", color: colors.body })]
        }),

        // === FOOTER INFORMATIVO ===
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          shading: { fill: colors.lightBg, type: ShadingType.CLEAR },
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "Para mayor información o solicitud de acceso, contactar a la Coordinación Académica", size: 20, color: colors.secondary, italics: true })]
        })
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/z/my-project/download/REPORTE_INSTITUCIONAL_AcTR_APP.docx", buffer);
  console.log("Documento generado: /home/z/my-project/download/REPORTE_INSTITUCIONAL_AcTR_APP.docx");
});
