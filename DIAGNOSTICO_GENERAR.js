const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle, 
        WidthType, ShadingType, VerticalAlign, PageNumber } = require('docx');
const fs = require('fs');

const colors = {
  primary: "1E3A5F",
  secondary: "2D5A87",
  accent: "4A90D9",
  body: "333333",
  lightBg: "F0F7FF",
  tableBg: "E8F4FD",
  promptBg: "F8FAFC",
  critical: "DC2626",
  high: "D97706",
  medium: "059669",
  success: "10B981"
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
      { reference: "bullet-issues", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-fixed", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-pending", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-rec", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [
    {
      properties: { page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
      children: [
        new Paragraph({ spacing: { before: 1500 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          shading: { fill: colors.critical, type: ShadingType.CLEAR },
          spacing: { before: 400, after: 400 },
          children: [new TextRun({ text: "DIAGNÓSTICO POST-CAMBIOS", size: 44, bold: true, color: "FFFFFF" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "AcTR-app", size: 72, bold: true, color: colors.primary })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "Revisión de Cambios Recientes y Estado Actual", size: 26, italics: true, color: colors.secondary })]
        }),
        new Paragraph({ spacing: { before: 600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "─────────────────────────────────", size: 24, color: colors.accent })]
        }),
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          shading: { fill: colors.lightBg, type: ShadingType.CLEAR },
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "ESTADO: BUILD FALLIDO - ERRORES CRÍTICOS", size: 24, bold: true, color: colors.critical })]
        }),
        new Paragraph({ spacing: { before: 1000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Marzo 2025", size: 22, color: colors.secondary })]
        })
      ]
    },
    {
      properties: { page: { margin: { top: 1800, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Diagnóstico Post-Cambios - AcTR-app", size: 18, color: colors.secondary, italics: true })]
      })] }) },
      footers: { default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Página ", size: 18, color: colors.secondary }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: colors.secondary }),
          new TextRun({ text: " de ", size: 18, color: colors.secondary }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: colors.secondary })
        ]
      })] }) },
      children: [
        // === RESUMEN EJECUTIVO ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Resumen Ejecutivo")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "El presente diagnóstico revela que el repositorio AcTR-app presenta cambios parciales respecto al análisis anterior. Si bien se han implementado mejoras significativas en el sistema de administración de usuarios, existen errores de sintaxis críticos que impiden la compilación del proyecto. El estado actual es de build fallido, requiriendo intervención inmediata para restaurar la funcionalidad de la aplicación.", color: colors.body })]
        }),

        // === ESTADO GENERAL ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Estado del Proyecto")] }),
        new Table({
          columnWidths: [4000, 5000],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({ tableHeader: true, children: [
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aspecto", bold: true })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Resultado", bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Clonación de repositorio")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "✅ EXITOSO", bold: true, color: colors.success })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Instalación de dependencias")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "✅ EXITOSO", bold: true, color: colors.success })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("TypeScript (tsc --noEmit)")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "❌ 10 ERRORES", bold: true, color: colors.critical })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("ESLint")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "❌ 1 ERROR + 4 WARNINGS", bold: true, color: colors.critical })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Build (next build)")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "❌ FALLIDO", bold: true, color: colors.critical })] })] })
            ]})
          ]
        }),
        new Paragraph({ spacing: { before: 100, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tabla 1: Estado general del proyecto", size: 18, italics: true, color: colors.secondary })] }),

        // === ERRORES CRÍTICOS ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Errores Críticos Detectados")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Error de Sintaxis en admin/page.tsx")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "El archivo src/app/admin/page.tsx presenta errores graves de sintaxis JSX que impiden la compilación. El código está fragmentado a partir de la línea 317, donde falta la estructura completa del componente Card para el 'Registro de Usuarios'.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Errores específicos reportados por TypeScript:", bold: true, color: colors.secondary })]
        }),
        new Paragraph({ numbering: { reference: "bullet-issues", level: 0 }, children: [new TextRun({ text: "Línea 319: Expected corresponding JSX closing tag for 'div'", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-issues", level: 0 }, children: [new TextRun({ text: "Línea 320: ')' expected", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-issues", level: 0 }, children: [new TextRun({ text: "Línea 321: Expression expected", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-issues", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Línea 349: JSX expressions must have one parent element", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 Import Duplicado")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "En las líneas 23 y 24 del mismo archivo existe un import duplicado de useAdmin, lo cual genera confusión y puede causar errores de compilación en algunos entornos.", color: colors.body })]
        }),
        new Paragraph({
          shading: { fill: colors.promptBg, type: ShadingType.CLEAR },
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "Código problemático:\nimport { useAdmin } from '@/hooks/use-admin';  // Línea 23\nimport { useAdmin } from '@/hooks/use-admin';  // Línea 24 - DUPLICADO", size: 20, color: colors.body })]
        }),

        // === CAMBIOS APLICADOS ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Cambios Aplicados (Mejoras)")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Se identificaron las siguientes mejoras implementadas desde el análisis anterior:", color: colors.body })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 Sistema de Administración Dinámico")] }),
        new Paragraph({ numbering: { reference: "bullet-fixed", level: 0 }, children: [new TextRun({ text: "Se eliminó el email del administrador hardcodeado (era: mpceciliotopetecruz@gmail.com)", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-fixed", level: 0 }, children: [new TextRun({ text: "Se implementó colección 'admins' en Firestore para gestión dinámica de administradores", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-fixed", level: 0 }, children: [new TextRun({ text: "Se creó el hook use-admin.ts para verificación de permisos administrativos", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-fixed", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "La interfaz de administración ahora permite agregar/remover administradores en tiempo real", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.2 Sistema de Roles Mejorado")] }),
        new Paragraph({ numbering: { reference: "bullet-fixed", level: 0 }, children: [new TextRun({ text: "Se agregó soporte para 'tracking_managers' (responsables de seguimiento)", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-fixed", level: 0 }, children: [new TextRun({ text: "Los roles ahora se almacenan en Firestore (colección 'app_config/roles')", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-fixed", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Se mantiene sincronización con localStorage para fallback", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.3 Optimizaciones de Firestore")] }),
        new Paragraph({ numbering: { reference: "bullet-fixed", level: 0 }, children: [new TextRun({ text: "Se cambió de persistentMultipleTabManager a persistentSingleTabManager", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-fixed", level: 0 }, children: [new TextRun({ text: "Se agregó experimentalAutoDetectLongPolling para conexiones limitadas", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-fixed", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Se configuró timeoutSeconds en 30 para liberar conexiones", color: colors.body })] }),

        // === PROBLEMAS PENDIENTES ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Problemas Pendientes")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Los siguientes problemas del análisis anterior permanecen sin resolver:", color: colors.body })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 Seguridad Crítica")] }),
        new Paragraph({ numbering: { reference: "bullet-pending", level: 0 }, children: [new TextRun({ text: "API Key de Firebase aún expuesta en src/lib/firebase.ts", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-pending", level: 0 }, children: [new TextRun({ text: "No existe archivo .env o .env.example", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-pending", level: 0 }, children: [new TextRun({ text: "Las credenciales de Firebase permanecen hardcodeadas", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-pending", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "No hay configuración de variables de entorno", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.2 Calidad de Código")] }),
        new Paragraph({ numbering: { reference: "bullet-pending", level: 0 }, children: [new TextRun({ text: "useEffect dependencies warning persiste en use-data.tsx línea 475", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-pending", level: 0 }, children: [new TextRun({ text: "useEffect dependencies warning en main-layout-client.tsx línea 146", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-pending", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Custom font warning persiste en layout.tsx línea 27", color: colors.body })] }),

        // === NUEVO ERROR ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Nuevo Error Introducido")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Durante las modificaciones recientes se introdujo un error crítico que no existía anteriormente. El archivo admin/page.tsx tiene código fragmentado que sugiere una edición incompleta o un problema de merge. Esto ha causado que el proyecto no pueda compilarse, un retroceso respecto al estado anterior donde el build era exitoso.", color: colors.body })]
        }),
        new Paragraph({
          shading: { fill: colors.promptBg, type: ShadingType.CLEAR },
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "Fragmento problemático (líneas 317-319):\n{/* Registro de Usuarios Card */}\n                                Agregar\n                            </Button>", size: 20, color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Este fragmento claramente pertenece a un componente Button pero falta todo el contexto del Card, Input, Label y estructura JSX que debería envolverlo. El código salta directamente del Card de administradores a un fragmento sin contexto, lo que rompe la estructura del componente.", color: colors.body })]
        }),

        // === RECOMENDACIONES ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Recomendaciones de Acción Inmediata")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Se recomienda seguir el siguiente orden de prioridad para restaurar y mejorar el proyecto:", color: colors.body })]
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.1 Acciones Críticas (Hoy)")] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, children: [new TextRun({ text: "Reparar el archivo admin/page.tsx restaurando la estructura JSX completa del Card 'Registro de Usuarios'", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, children: [new TextRun({ text: "Eliminar el import duplicado de useAdmin (líneas 23-24)", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, children: [new TextRun({ text: "Verificar que el build sea exitoso antes de hacer más cambios", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Crear commit con el fix antes de continuar", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.2 Acciones de Alta Prioridad (Esta Semana)")] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, children: [new TextRun({ text: "Mover credenciales de Firebase a variables de entorno", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, children: [new TextRun({ text: "Crear archivo .env.example con template de variables", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, children: [new TextRun({ text: "Configurar variables en el hosting (Vercel)", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Generar nueva API Key de Firebase y revocar la antigua", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.3 Acciones de Media Prioridad (Próximas Semmanas)")] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, children: [new TextRun({ text: "Corregir useEffect dependencies warnings", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, children: [new TextRun({ text: "Implementar pruebas unitarias básicas", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, children: [new TextRun({ text: "Documentar el proceso de configuración", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-rec", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Considerar implementar CI/CD con GitHub Actions", color: colors.body })] }),

        // === CONCLUSIÓN ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Conclusión")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "El proyecto AcTR-app muestra avances parciales en la mejora del sistema de administración y roles. La migración del email de administrador a un sistema dinámico basado en Firestore representa una mejora significativa en flexibilidad y mantenibilidad. Sin embargo, la introducción de errores de sintaxis que impiden la compilación representa un retroceso crítico que debe corregirse de inmediato.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Se recomienda encarecidamente implementar un flujo de trabajo que incluya verificación de build antes de cada commit para evitar que errores de este tipo lleguen al repositorio principal. La implementación de un pipeline CI/CD básico ayudaría a prevenir estos problemas en el futuro.", color: colors.body })]
        }),

        // === FOOTER ===
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          shading: { fill: colors.lightBg, type: ShadingType.CLEAR },
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "Documento generado automáticamente - Diagnóstico Técnico AcTR-app", size: 18, color: colors.secondary, italics: true })]
        })
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/z/my-project/download/DIAGNOSTICO_POST_CAMBIOS_AcTR_APP.docx", buffer);
  console.log("Documento generado: /home/z/my-project/download/DIAGNOSTICO_POST_CAMBIOS_AcTR_APP.docx");
});
