const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle, 
        WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

const colors = {
  primary: "1E3A5F",      // Azul institucional oscuro
  secondary: "2D5A87",    // Azul medio
  accent: "4A90D9",       // Azul acento
  body: "333333",         // Gris oscuro para texto
  lightBg: "F0F7FF",      // Fondo azul muy claro
  tableBg: "E8F4FD",      // Fondo tablas
  promptBg: "F8FAFC",     // Fondo para prompts
  critical: "DC2626",     // Rojo crítico
  high: "D97706",         // Naranja alta
  medium: "059669"        // Verde media
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
      { reference: "bullet-steps", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
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
          children: [new TextRun({ text: "GUÍA DE PROMPTS PARA CONFIGURACIÓN", size: 44, bold: true, color: "FFFFFF" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "AcTR-app", size: 72, bold: true, color: colors.primary })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
          children: [new TextRun({ text: "Instrucciones Técnicas para Equipo de Desarrollo", size: 26, italics: true, color: colors.secondary })]
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
          children: [new TextRun({ text: "Contiene 6 Prompts Técnicos Listos para Usar", size: 22, color: colors.body })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Configuración de Secret Manager, Firebase, Vercel y Correcciones de Código", size: 20, color: colors.secondary })]
        }),
        new Paragraph({ spacing: { before: 1200 }, children: [] }),
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
          children: [new TextRun({ text: "Prompts de Configuración - AcTR-app", size: 18, color: colors.secondary, italics: true })]
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
        // === INTRODUCCIÓN ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Introducción")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Este documento contiene una serie de prompts técnicos diseñados para ser copiados y pegados directamente en herramientas de inteligencia artificial (como ChatGPT, Claude, o Gemini). Cada prompt incluye el contexto necesario, instrucciones específicas y los entregables esperados, permitiendo que el equipo de configuración implemente las correcciones de manera eficiente.", color: colors.body })]
        }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Los prompts están ordenados por prioridad: los primeros tres son de seguridad crítica y deben ejecutarse de inmediato. Los últimos tres corresponden a mejoras de calidad de código.", color: colors.body })]
        }),

        // === TABLA DE PRIORIDADES ===
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Orden de Ejecución Recomendado")] }),
        new Table({
          columnWidths: [1200, 5000, 2800],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({ tableHeader: true, children: [
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "#", bold: true })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prompt", bold: true })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prioridad", bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("1")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Configuración de Google Secret Manager")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRÍTICA", bold: true, color: colors.critical })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("2")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Código Corregido de firebase.ts")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRÍTICA", bold: true, color: colors.critical })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("3")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Variables en Vercel")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRÍTICA", bold: true, color: colors.critical })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("4")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Email de Administrador Seguro")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ALTA", bold: true, color: colors.high })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("5")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Corregir useEffect Dependencies")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ALTA", bold: true, color: colors.high })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("6")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Crear Template .env.example")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MEDIA", bold: true, color: colors.medium })] })] })
            ]})
          ]
        }),
        new Paragraph({ spacing: { before: 100, after: 300 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tabla 1: Orden de ejecución por prioridad", size: 18, italics: true, color: colors.secondary })] }),

        // === PROMPT 1 ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Prompt 1: Configuración de Google Secret Manager")] }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Este prompt configura Google Secret Manager para almacenar las credenciales de Firebase de forma segura. Copia y pega el siguiente contenido:", color: colors.body })]
        }),
        new Paragraph({
          shading: { fill: colors.promptBg, type: ShadingType.CLEAR },
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "CONTEXTO: Aplicación Next.js 14 con Firebase ya desplegada. La API key de Firebase fue filtrada y bloqueada. Necesito migrar a Google Secret Manager.\n\nTAREA: Configurar Google Secret Manager para el proyecto \"academic-tracker-qeoxi\" con los siguientes secrets:\n\n1. FIREBASE_API_KEY\n2. FIREBASE_AUTH_DOMAIN\n3. FIREBASE_PROJECT_ID\n4. FIREBASE_STORAGE_BUCKET\n5. FIREBASE_MESSAGING_SENDER_ID\n6. FIREBASE_APP_ID\n\nINSTRUCCIONES PASO A PASO:\n\nA) Crear secrets en Google Cloud Console:\n   - Ir a Security > Secret Manager\n   - Crear cada secret con el valor correspondiente\n   - Configurar permisos: service account necesita \"Secret Manager Secret Accessor\"\n\nB) Habilitar Secret Manager API para el proyecto\n\nC) Modificar src/lib/firebase.ts para usar secrets:\n   - Usar Google Cloud Secret Manager client library\n   - Implementar caché para evitar llamadas repetidas\n   - Mantener fallback a variables de entorno para desarrollo local\n\nD) Actualizar vercel.json o configuración de despliegue:\n   - Inyectar secrets como variables de entorno en runtime\n   - NO exponer secrets en build time\n\nENTREGABLES ESPERADOS:\n- Código modificado de src/lib/firebase.ts\n- Instrucciones para configurar secrets en Vercel/Cloud Run\n- Archivo .env.example actualizado\n- Pasos para revocar la API key antigua y generar nueva\n\nRESTRICCIONES:\n- La app debe seguir funcionando en desarrollo local\n- Usar async/await para carga de secrets\n- Implementar manejo de errores robusto", size: 20, color: colors.body })]
        }),

        // === PROMPT 2 ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Prompt 2: Código Corregido de firebase.ts")] }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Este prompt genera el código seguro para reemplazar las credenciales expuestas en el archivo de configuración de Firebase:", color: colors.body })]
        }),
        new Paragraph({
          shading: { fill: colors.promptBg, type: ShadingType.CLEAR },
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "CONTEXTO: Archivo actual src/lib/firebase.ts tiene credenciales hardcodeadas que fueron expuestas.\n\nCÓDIGO ACTUAL (PROBLEMÁTICO):\nconst firebaseConfig = {\n  apiKey: \"AIzaSyBliGErw1WiGhY6lZeCSh6WU0Kg2ZK7oa0\", // EXPUESTA\n  authDomain: \"academic-tracker-qeoxi.firebaseapp.com\",\n  projectId: \"academic-tracker-qeoxi\",\n  storageBucket: \"academic-tracker-qeoxi.firebasestorage.app\",\n  messagingSenderId: \"263108580734\",\n  appId: \"1:263108580734:web:316c14f8e71c20aa038f2f\"\n};\n\nTAREA: Reescribir src/lib/firebase.ts con:\n\n1. Carga de configuración desde variables de entorno\n2. Soporte para Google Secret Manager en producción\n3. Fallback a process.env para desarrollo local\n4. Validación de configuración al iniciar\n5. Tipado TypeScript correcto\n\nREQUISITOS:\n- Usar variable de entorno NEXT_PUBLIC_FIREBASE_* para cliente\n- Usar FIREBASE_* (sin prefijo) para secrets de servidor\n- Implementar función getFirebaseConfig() async\n- Exportar configuración tipada como FirebaseConfig\n\nENTREGABLE:\n- Código completo del nuevo archivo src/lib/firebase.ts\n- Contenido del archivo .env.example\n- Instrucciones para configurar en Vercel", size: 20, color: colors.body })]
        }),

        // === PROMPT 3 ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Prompt 3: Configurar Variables en Vercel")] }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Instrucciones para configurar las variables de entorno en el hosting Vercel:", color: colors.body })]
        }),
        new Paragraph({
          shading: { fill: colors.promptBg, type: ShadingType.CLEAR },
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "CONTEXTO: Aplicación desplegada en Vercel. Necesito configurar variables de entorno de forma segura.\n\nTAREA: Proporcionar guía paso a paso para configurar las siguientes variables en Vercel:\n\nVARIABLES NECESARIAS (Producción):\n- NEXT_PUBLIC_FIREBASE_API_KEY=[nueva-api-key]\n- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=academic-tracker-qeoxi.firebaseapp.com\n- NEXT_PUBLIC_FIREBASE_PROJECT_ID=academic-tracker-qeoxi\n- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=academic-tracker-qeoxi.firebasestorage.app\n- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=263108580734\n- NEXT_PUBLIC_FIREBASE_APP_ID=1:263108580734:web:316c14f8e71c20aa038f2f\n\nVARIABLES DE SERVIDOR (Secrets):\n- FIREBASE_ADMIN_PRIVATE_KEY=[clave-privada-service-account]\n- FIREBASE_ADMIN_CLIENT_EMAIL=[email-service-account]\n\nINSTRUCCIONES REQUERIDAS:\n1. Cómo agregar variables en Vercel Dashboard\n2. Diferencia entre \"Encrypted\" y \"Plain\" environment variables\n3. Cómo configurar para Preview, Development y Production\n4. Cómo acceder desde el código Next.js\n5. Verificación de que las variables están disponibles\n\nENTREGABLE:\n- Guía con pasos detallados\n- Comandos de verificación\n- Checklist de configuración completa", size: 20, color: colors.body })]
        }),

        // === PROMPT 4 ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Prompt 4: Email de Administrador Seguro")] }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Mover el email del administrador hardcodeado a una configuración segura:", color: colors.body })]
        }),
        new Paragraph({
          shading: { fill: colors.promptBg, type: ShadingType.CLEAR },
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "CONTEXTO: Archivo src/app/admin/page.tsx línea 305 tiene email hardcodeado:\nconst ADMIN_EMAIL = \"mpceciliotopetecruz@gmail.com\";\n\nTAREA: Mover el email del administrador a una configuración segura y escalable.\n\nSOLUCIÓN PROPUESTA:\n\nOPCIÓN A - Variable de Entorno (Recomendado para admin único):\n- Usar NEXT_PUBLIC_ADMIN_EMAIL en .env\n- Mantener fallback vacío que deniegue acceso si no configurado\n\nOPCIÓN B - Firestore Collection (Recomendado para múltiples admins):\n- Crear colección \"admins\" en Firestore\n- Verificar si el email del usuario está en la colección\n- Permitir gestión de múltiples administradores\n\nREQUISITOS:\n- No exponer emails en código fuente\n- Permitir cambiar admin sin redeployar\n- Mantener logs de acceso denegado\n\nENTREGABLE:\n- Código modificado de admin/page.tsx\n- Si usa Firestore: reglas de seguridad y estructura de datos\n- Archivo .env.example actualizado\n- Instrucciones para agregar nuevos admins", size: 20, color: colors.body })]
        }),

        // === PROMPT 5 ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Prompt 5: Corregir useEffect Dependencies")] }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Corrección del warning de React Hook dependencies:", color: colors.body })]
        }),
        new Paragraph({
          shading: { fill: colors.promptBg, type: ShadingType.CLEAR },
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "CONTEXTO: Archivo src/hooks/use-data.tsx línea 1166 tiene warning de ESLint:\n\"React Hook useEffect has missing dependencies: 'activeGroup.groupName', 'activeGroup.semester', 'activeGroup.students', 'setGroups', and 'toast'\"\n\nTAREA: Analizar y corregir el useEffect problemático sin causar loops infinitos ni comportamientos inesperados.\n\nANÁLISIS REQUERIDO:\n1. Identificar el useEffect específico (línea ~1166)\n2. Determinar qué dependencias son realmente necesarias\n3. Evaluar si usar useCallback para funciones\n4. Decidir entre:\n   - Agregar dependencias faltantes\n   - Usar useRef para valores que no deben disparar re-renders\n   - Extraer lógica a función separada con useCallback\n\nSOLUCIÓN ESPERADA:\n- Código corregido del useEffect\n- Explicación de por qué cada cambio es seguro\n- Verificación de que no causa loops infinitos\n\nRESTRICCIONES:\n- No cambiar la funcionalidad existente\n- Mantener sincronización con Firebase\n- Preservar offline-first behavior", size: 20, color: colors.body })]
        }),

        // === PROMPT 6 ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Prompt 6: Crear Template .env.example")] }),
        new Paragraph({
          spacing: { after: 100, line: 360 },
          children: [new TextRun({ text: "Crear archivo template de variables de entorno para nuevos desarrolladores:", color: colors.body })]
        }),
        new Paragraph({
          shading: { fill: colors.promptBg, type: ShadingType.CLEAR },
          spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "TAREA: Crear archivo .env.example completo para el proyecto AcTR-app.\n\nINCLUIR:\n1. Variables de Firebase (cliente y servidor)\n2. Variables de configuración de la app\n3. Variables de IA/Genkit si aplica\n4. Comentarios explicativos para cada variable\n5. Valores de ejemplo seguros (no reales)\n\nFORMATO REQUERIDO:\n\n# ============================================\n# FIREBASE CONFIGURATION (Client-side)\n# ============================================\n# Get these from Firebase Console > Project Settings\nNEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here\nNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com\n...\n\n# ============================================\n# ADMIN CONFIGURATION\n# ============================================\n# Email of the application administrator\nNEXT_PUBLIC_ADMIN_EMAIL=admin@example.com\n...\n\nENTREGABLE:\n- Contenido completo del archivo .env.example\n- Notas de seguridad importantes\n- Instrucciones de uso para desarrolladores", size: 20, color: colors.body })]
        }),

        // === CHECKLIST ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Checklist de Verificación")] }),
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [new TextRun({ text: "Una vez ejecutados los prompts, verificar que todas las tareas estén completadas:", color: colors.body })]
        }),
        new Table({
          columnWidths: [700, 6000, 2300],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({ tableHeader: true, children: [
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Check", bold: true })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tarea a Verificar", bold: true })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prioridad", bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("☐")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("API Key nueva generada en Firebase Console")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRÍTICA", color: colors.critical, bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("☐")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("API Key antigua revocada completamente")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRÍTICA", color: colors.critical, bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("☐")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Variables configuradas en Vercel/Hosting")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRÍTICA", color: colors.critical, bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("☐")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Archivo .env.local creado (no commiteado)")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRÍTICA", color: colors.critical, bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("☐")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("src/lib/firebase.ts actualizado con env vars")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRÍTICA", color: colors.critical, bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("☐")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Admin email movido a variable de entorno")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ALTA", color: colors.high, bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("☐")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("useEffect dependencies corregido")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ALTA", color: colors.high, bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("☐")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Lint pasa sin warnings")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MEDIA", color: colors.medium, bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("☐")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Build exitoso después de cambios")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MEDIA", color: colors.medium, bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("☐")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("Deploy verificado en producción")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MEDIA", color: colors.medium, bold: true })] })] })
            ]})
          ]
        }),
        new Paragraph({ spacing: { before: 100, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tabla 2: Checklist de verificación post-corrección", size: 18, italics: true, color: colors.secondary })] }),

        // === NOTAS FINALES ===
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("9. Notas Importantes")] }),
        new Paragraph({ numbering: { reference: "bullet-steps", level: 0 }, children: [new TextRun({ text: "Los secrets deben rotarse periódicamente (recomendado cada 90 días)", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-steps", level: 0 }, children: [new TextRun({ text: "Configurar alertas en Google Cloud para accesos no autorizados a secrets", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-steps", level: 0 }, children: [new TextRun({ text: "Documentar el proceso de rotación de API keys para futuras referencias", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "bullet-steps", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Considerar implementar Firebase App Check para protección adicional", color: colors.body })] })
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/z/my-project/download/PROMPTS_CONFIGURACION_AcTR_APP.docx", buffer);
  console.log("Documento generado: /home/z/my-project/download/PROMPTS_CONFIGURACION_AcTR_APP.docx");
});
