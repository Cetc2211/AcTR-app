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
  medium: "059669"
};

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: colors.accent };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 52, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: colors.secondary, font: "Times New Roman" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-issues", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [
    {
      properties: { page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } } },
      children: [
        new Paragraph({ spacing: { before: 1200 }, children: [] }),
        new Paragraph({ alignment: AlignmentType.CENTER, shading: { fill: colors.high, type: ShadingType.CLEAR }, spacing: { before: 400, after: 400 },
          children: [new TextRun({ text: "DIAGNOSTICO DE SINCRONIZACION", size: 44, bold: true, color: "FFFFFF" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 },
          children: [new TextRun({ text: "Problemas de Offline y Consistencia de Datos", size: 36, bold: true, color: colors.primary })] }),
        new Paragraph({ spacing: { before: 800 }, children: [] }),
        new Paragraph({ alignment: AlignmentType.CENTER, shading: { fill: colors.lightBg, type: ShadingType.CLEAR }, spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "AcTR-app | Marzo 2025", size: 22, color: colors.body })] })
      ]
    },
    {
      properties: { page: { margin: { top: 1800, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "Diagnostico - AcTR-app", size: 18, color: colors.secondary, italics: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Pagina ", size: 18, color: colors.secondary }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: colors.secondary }),
          new TextRun({ text: " de ", size: 18, color: colors.secondary }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: colors.secondary })] })] }) },
      children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Problemas Identificados")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1 Rendimiento Offline Degradado")] }),
        new Paragraph({ spacing: { after: 200, line: 360 }, children: [new TextRun({ text: "La aplicacion presenta lentitud significativa cuando no hay conexion a internet. Esto ocurre porque el sistema tiene DUALES mecanismos de persistencia que compiten entre si: idb-keyval (manual) y Firestore Persistent Cache (automatico). Ambos intentan sincronizar simultaneamente, causando bloqueos.", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.2 Inconsistencias entre Dispositivos")] }),
        new Paragraph({ spacing: { after: 200, line: 360 }, children: [new TextRun({ text: "Los grupos no se sincronizan correctamente entre equipos porque firebase.ts usa persistentSingleTabManager, diseñado para UNA sola pestaña. Cuando se usa en multiples navegadores o dispositivos, no coordina la sincronizacion correctamente, causando perdida de datos.", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Causas Tecnicas")] }),
        new Table({
          columnWidths: [1500, 5000, 2500],
          margins: { top: 100, bottom: 100, left: 180, right: 180 },
          rows: [
            new TableRow({ tableHeader: true, children: [
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Linea", bold: true })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Problema", bold: true })] })] }),
              new TableCell({ borders: cellBorders, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Severidad", bold: true })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("28")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("persistentSingleTabManager no soporta multi-dispositivo")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CRITICO", bold: true, color: colors.critical })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("478-607")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("onSnapshot listeners sin verificacion de conflicto")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ALTO", bold: true, color: colors.high })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("321-366")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("syncKey usa reemplazo en vez de merge")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ALTO", bold: true, color: colors.high })] })] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun("631-702")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun("createSetterWithStorage duplica persistencia")] })] }),
              new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MEDIO", bold: true, color: colors.medium })] })] })
            ]})
          ]
        }),
        new Paragraph({ spacing: { before: 100, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tabla 1: Errores identificados", size: 18, italics: true, color: colors.secondary })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Soluciones")] }),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Correccion Inmediata: firebase.ts")] }),
        new Paragraph({ spacing: { after: 200, line: 360 }, children: [new TextRun({ text: "Cambiar persistentSingleTabManager por persistentMultipleTabManager:", color: colors.body })] }),
        new Paragraph({ shading: { fill: colors.promptBg, type: ShadingType.CLEAR }, spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: "// ANTES:\nlocalCache: persistentLocalCache({\n    tabManager: persistentSingleTabManager()\n})\n\n// DESPUES:\nlocalCache: persistentLocalCache({\n    tabManager: persistentMultipleTabManager()\n})", size: 20, color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 Plan de Implementacion")] }),
        new Paragraph({ numbering: { reference: "numbered-steps", level: 0 }, children: [new TextRun({ text: "Cambiar a persistentMultipleTabManager en firebase.ts", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-steps", level: 0 }, children: [new TextRun({ text: "Agregar try-catch robusto en operaciones offline", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-steps", level: 0 }, children: [new TextRun({ text: "Implementar indicador de estado de conexion", color: colors.body })] }),
        new Paragraph({ numbering: { reference: "numbered-steps", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "Considerar eliminar idb-keyval y usar solo Firestore", color: colors.body })] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Codigo Corregido")] }),
        new Paragraph({ shading: { fill: colors.promptBg, type: ShadingType.CLEAR }, spacing: { before: 100, after: 200 },
          children: [new TextRun({ text: `// src/lib/firebase.ts - VERSION CORREGIDA
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, 
         persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "...",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "...",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "...",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "...",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "...",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "..."
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

import { Firestore } from 'firebase/firestore';
let db: Firestore;

try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()  // CORREGIDO
        }),
        experimentalAutoDetectLongPolling: true,
        experimentalLongPollingOptions: {
            timeoutSeconds: 30
        }
    });
} catch (e) {
    console.log("Firestore already initialized");
    db = getFirestore(app);
}

export { app, auth, db };`, size: 18, color: colors.body })] })
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/z/my-project/download/DIAGNOSTICO_SINCRONIZACION_AcTR_APP.docx", buffer);
  console.log("Documento generado: /home/z/my-project/download/DIAGNOSTICO_SINCRONIZACION_AcTR_APP.docx");
});
