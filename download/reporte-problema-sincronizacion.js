const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, 
        PageNumber, ShadingType, VerticalAlign, LevelFormat, TableOfContents, PageBreak } = require('docx');
const fs = require('fs');

// Colores estilo "Midnight Code"
const colors = {
    primary: "020617",      // Midnight Black
    body: "1E293B",         // Deep Slate Blue
    secondary: "64748B",    // Cool Blue-Gray
    accent: "94A3B8",       // Steady Silver
    tableBg: "F8FAFC",      // Glacial Blue-White
    warning: "DC2626",      // Red for warnings
    success: "16A34A"       // Green for success
};

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: colors.accent };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
    styles: {
        default: { document: { run: { font: "SimSun", size: 21 } } },
        paragraphStyles: [
            { id: "Title", name: "Title", basedOn: "Normal",
                run: { size: 44, bold: true, color: colors.primary, font: "SimHei" },
                paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER } },
            { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 32, bold: true, color: colors.primary, font: "SimHei" },
                paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
            { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 28, bold: true, color: colors.body, font: "SimHei" },
                paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
            { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 24, bold: true, color: colors.secondary, font: "SimHei" },
                paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
        ]
    },
    numbering: {
        config: [
            { reference: "bullet-list",
                levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
            { reference: "numbered-problems",
                levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
            { reference: "numbered-actions",
                levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
            { reference: "numbered-solutions",
                levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
        ]
    },
    sections: [{
        properties: {
            page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
        },
        headers: {
            default: new Header({ children: [new Paragraph({ 
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "Reporte de Problem\u00e1tica - AcTR-app", size: 18, color: colors.secondary })]
            })] })
        },
        footers: {
            default: new Footer({ children: [new Paragraph({ 
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "P\u00e1gina ", size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 }), new TextRun({ text: " de ", size: 18 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 })]
            })] })
        },
        children: [
            // Título
            new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Reporte de Problem\u00e1tica de Sincronizaci\u00f3n Firebase")] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [
                new TextRun({ text: "Aplicaci\u00f3n AcTR-app (Academic Tracker)", size: 22, color: colors.secondary })
            ]}),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [
                new TextRun({ text: "Fecha: 20 de marzo de 2026", size: 20, color: colors.accent })
            ]}),

            // Resumen Ejecutivo
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Resumen Ejecutivo")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("El presente documento detalla la problem\u00e1tica de sincronizaci\u00f3n de datos entre dispositivos que afecta la aplicaci\u00f3n AcTR-app. El problema principal radica en que los datos correctos almacenados en la aplicaci\u00f3n de escritorio no se sincronizan correctamente con Firebase Firestore, mientras que otros dispositivos (celular y navegador web) muestran datos obsoletos e incompletos. Esta situaci\u00f3n ha impedido el uso efectivo de la aplicaci\u00f3n en m\u00faltiples dispositivos, comprometiendo la funcionalidad principal del sistema de seguimiento acad\u00e9mico.")
            ]}),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("El an\u00e1lisis revela que el problema tiene m\u00faltiples capas: fragmentaci\u00f3n de datos en Firebase, existencia de dos cuentas de usuario duplicadas, problemas con el WebChannel del SDK de Firebase, y limitaciones en el sistema de listeners que no detectan datos fragmentados. A lo largo de varias sesiones de trabajo, se han implementado diversas soluciones que no han logrado resolver completamente el problema debido a que la aplicaci\u00f3n se reinicia durante los procesos de subida prolongados.")
            ]}),

            // Descripción del Problema
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Descripci\u00f3n Detallada del Problema")] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 S\u00edntomas Observados")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("La aplicaci\u00f3n presenta una discrepancia significativa entre los datos visibles en diferentes dispositivos. En la aplicaci\u00f3n de escritorio, el usuario visualiza correctamente tres grupos activos del semestre actual: Humanidades III del Grupo TO, Humanidades III del Grupo TSPP, y Conciencia Hist\u00f3rica del Grupo IV TAEA. Estos grupos contienen aproximadamente 62 estudiantes activos con sus respectivos registros de asistencia y evaluaciones.")
            ]}),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("Sin embargo, cuando el mismo usuario accede desde su dispositivo m\u00f3vil o mediante un navegador web, observa cuatro grupos diferentes que corresponden a datos antiguos de semestres anteriores. Esta discrepancia indica que la sincronizaci\u00f3n bidireccional entre Firebase y los dispositivos no est\u00e1 funcionando correctamente. Los datos locales correctos de la aplicaci\u00f3n de escritorio no se han subido a Firebase, y los dispositivos secundarios est\u00e1n descargando informaci\u00f3n obsoleta.")
            ]}),

            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Estructura de Datos Esperada vs. Actual")] }),
            
            // Tabla de comparación
            new Table({
                columnWidths: [4680, 4680],
                margins: { top: 100, bottom: 100, left: 180, right: 180 },
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Datos Correctos (Escritorio)", bold: true, size: 22 })] })] }),
                            new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Datos Incorrectos (Celular/Navegador)", bold: true, size: 22 })] })] })
                        ]
                    }),
                    new TableRow({ children: [
                        new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("3 grupos activos")] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("4 grupos antiguos")] })] })
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("~62 estudiantes activos")] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Datos de semestres anteriores")] })] })
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Semestre actual (2026)")] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Semestres anteriores")] })] })
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Almacenados en IndexedDB local")] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 4680, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Descargados de Firebase")] })] })
                    ]})
                ]
            }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Tabla 1: Comparaci\u00f3n de datos entre dispositivos", size: 18, color: colors.secondary, italics: true })] }),

            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.3 Problemas Identificados en Firebase")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("El an\u00e1lisis de la base de datos Firebase revel\u00f3 varios problemas estructurales que contribuyen a la falla de sincronizaci\u00f3n. En primer lugar, se identific\u00f3 la existencia de dos cuentas de usuario duplicadas con identificadores diferentes: '5aVFWuV3EYZex7wKN8jFyxKNTZi1' e 'I2leuzr51YbohBtpkMnypFnYvCh1'. Esta duplicaci\u00f3n ha causado que los datos se fragmenten entre ambas cuentas, dificultando la consolidaci\u00f3n de la informaci\u00f3n.")
            ]}),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("En segundo lugar, se observ\u00f3 que los datos almacenados en Firebase aparecen fragmentados en m\u00faltiples documentos con sufijos como '_meta', '_chunk_0', '_chunk_1', etc. Este sistema de fragmentaci\u00f3n, dise\u00f1ado originalmente para manejar datos grandes, no est\u00e1 siendo procesado correctamente por los listeners de la aplicaci\u00f3n, que solo escuchan documentos normales sin considerar los fragmentos.")
            ]}),

            // Análisis Técnico
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. An\u00e1lisis T\u00e9cnico del Problema")] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Sistema de Fragmentaci\u00f3n de Datos")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("La aplicaci\u00f3n implementa un sistema de fragmentaci\u00f3n (chunking) para subir datos grandes a Firebase Firestore. Este sistema divide los datos en fragmentos de aproximadamente 30KB cada uno, almacen\u00e1ndolos en documentos separados con un documento de metadatos que indica el n\u00famero total de fragmentos. Aunque esta arquitectura permite manejar conjuntos de datos que exceden el l\u00edmite de tama\u00f1o de documento de Firestore (1MB), introduce complejidad en la lectura de datos.")
            ]}),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("El problema fundamental es que los listeners onSnapshot configurados en la aplicaci\u00f3n solo est\u00e1n suscritos a la colecci\u00f3n de documentos principales ('app_groups'), pero no detectan ni procesan los documentos fragmentados. Como resultado, cuando los datos se suben fragmentados, otros dispositivos no pueden reconstruirlos autom\u00e1ticamente, quedando con datos obsoletos o incompletos.")
            ]}),

            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 Problemas con Firebase WebChannel")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("El SDK de Firebase para web utiliza WebChannel como mecanismo de transporte para la comunicaci\u00f3n en tiempo real. Este protocolo presenta problemas conocidos en conexiones intermitentes, redes con firewalls restrictivos, y conexiones m\u00f3viles inestables. Los s\u00edntomas incluyen timeouts silenciosos, p\u00e9rdida de conexi\u00f3n sin reconexi\u00f3n autom\u00e1tica, y operaciones que quedan pendientes indefinidamente.")
            ]}),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("Para mitigar estos problemas, se implement\u00f3 un sistema de subida basado exclusivamente en REST API, evitando completamente el SDK WebChannel. Este sistema, denominado 'ULTRA REST UPLOAD', realiza peticiones HTTP directas a los endpoints de Firestore, proporcionando mayor estabilidad en conexiones problem\u00e1ticas. Sin embargo, incluso este sistema mejorado ha experimentado fallos durante operaciones prolongadas.")
            ]}),

            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 Reinicio de la Aplicaci\u00f3n")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("Un problema recurrente durante las sesiones de trabajo ha sido el reinicio espont\u00e1neo de la aplicaci\u00f3n durante procesos de subida de datos prolongados. Este comportamiento sugiere que las operaciones de larga duraci\u00f3n agotan recursos del sistema o activan mecanismos de protecci\u00f3n del navegador que terminan el proceso. El problema es particularmente evidente cuando se intentan subir m\u00e1s de 200 estudiantes con sus fotograf\u00edas en base64.")
            ]}),

            // Acciones Intentadas
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Acciones Intentadas y Resultados")] }),

            // Tabla de acciones
            new Table({
                columnWidths: [2000, 4000, 3360],
                margins: { top: 100, bottom: 100, left: 180, right: 180 },
                rows: [
                    new TableRow({
                        tableHeader: true,
                        children: [
                            new TableCell({ borders: cellBorders, width: { size: 2000, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Acci\u00f3n", bold: true, size: 20 })] })] }),
                            new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Descripci\u00f3n", bold: true, size: 20 })] })] }),
                            new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Resultado", bold: true, size: 20 })] })] })
                        ]
                    }),
                    new TableRow({ children: [
                        new TableCell({ borders: cellBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Sistema ULTRA REST Upload", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Sistema de subida usando REST API directamente, evitando WebChannel del SDK", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Los datos se subieron fragmentados; no se pueden leer en otros dispositivos", size: 20, color: "DC2626" })] })] })
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ borders: cellBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Herramienta de Migraci\u00f3n de Usuarios", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "P\u00e1gina /admin/migrate-users para consolidar datos de dos cuentas de usuario", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Proceso incompleto; la app se reinici\u00f3 durante la operaci\u00f3n", size: 20, color: "DC2626" })] })] })
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ borders: cellBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Herramienta de Diagn\u00f3stico", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "P\u00e1gina /admin/data-diagnostic para analizar estado de datos", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Exitoso; permiti\u00f3 identificar datos fragmentados", size: 20, color: "16A34A" })] })] })
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ borders: cellBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Herramienta de Defragmentaci\u00f3n", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "P\u00e1gina /admin/defragment-data para subir datos limpios sin fragmentar", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Fallo; la app se reinicia antes de completar el proceso", size: 20, color: "DC2626" })] })] })
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ borders: cellBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Subida sin fotos", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Eliminar fotos base64 de estudiantes para reducir tama\u00f1o de datos", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Reduce tama\u00f1o pero el problema de reinicio persiste", size: 20, color: "F59E0B" })] })] })
                    ]}),
                    new TableRow({ children: [
                        new TableCell({ borders: cellBorders, width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Batch Operations", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 4000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Subir datos en lotes peque\u00f1os con pausas entre operaciones", size: 20 })] })] }),
                        new TableCell({ borders: cellBorders, width: { size: 3360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Mejora estabilidad pero no resuelve el problema completamente", size: 20, color: "F59E0B" })] })] })
                    ]})
                ]
            }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 }, children: [new TextRun({ text: "Tabla 2: Resumen de acciones intentadas y sus resultados", size: 18, color: colors.secondary, italics: true })] }),

            // Impacto en otros usuarios
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Impacto en Otros Usuarios")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("Una consideraci\u00f3n importante que surge del an\u00e1lisis es el impacto potencial de las modificaciones realizadas en otros usuarios del sistema. Las herramientas de administraci\u00f3n desarrolladas (migraci\u00f3n, diagn\u00f3stico, defragmentaci\u00f3n) est\u00e1n dise\u00f1adas para operar exclusivamente sobre los datos del usuario autenticado, lo que limita el riesgo de afectar a otros usuarios. Sin embargo, existen consideraciones importantes que deben tenerse en cuenta.")
            ]}),

            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 Modificaciones al Sistema de Sincronizaci\u00f3n")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("Los cambios realizados en los archivos de sincronizaci\u00f3n (sync-client.ts, ultra-rest-upload.ts, chunked-upload.ts) afectan a todos los usuarios de la aplicaci\u00f3n. Estos archivos modifican c\u00f3mo se suben y descargan los datos de Firebase. Si bien las modificaciones fueron dise\u00f1adas para mejorar la estabilidad, es posible que introduzcan comportamientos diferentes en usuarios que previamente no ten\u00edan problemas. Por esta raz\u00f3n, es importante considerar un rollback a una versi\u00f3n funcional antes de realizar cambios adicionales.")
            ]}),

            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.2 Datos Existentes en Firebase")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("Se ha identificado que existen grupos anteriores en Firebase que contienen fotograf\u00edas de estudiantes. Estos datos hist\u00f3ricos podr\u00edan estar ocupando espacio significativo y potencialmente causando problemas de rendimiento. La existencia de estos datos sugiere que el sistema de carga de grupos funcionaba correctamente en alg\u00fan momento anterior, lo que valida la hip\u00f3tesis de que el problema actual fue introducido por cambios posteriores o por cambios en la infraestructura de Firebase.")
            ]}),

            // Respuestas a las preguntas del usuario
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Respuestas a Preguntas Espec\u00edficas")] }),

            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 \u00bfEs posible subir datos sin fragmentaci\u00f3n?")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("S\u00ed, es t\u00e9cnicamente posible subir datos sin fragmentaci\u00f3n a Firebase Firestore. La fragmentaci\u00f3n se implement\u00f3 como una soluci\u00f3n para manejar datos que exceden el l\u00edmite de 1MB por documento. Para evitar la fragmentaci\u00f3n, es necesario: (1) mantener el tama\u00f1o de cada documento por debajo de 1MB, (2) eliminar las fotograf\u00edas en base64 de los datos de estudiantes, y (3) utilizar el modo de subida directa en lugar del modo fragmentado.")
            ]}),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("El sistema ultra-rest-upload.ts implementa esta l\u00f3gica: si los datos son menores a 50KB y la conexi\u00f3n es estable, realiza una subida directa sin fragmentar. Para el caso espec\u00edfico del usuario, con aproximadamente 62 estudiantes sin fotograf\u00edas, el tama\u00f1o de los datos deber\u00eda ser manejable sin fragmentaci\u00f3n. El problema actual es que la aplicaci\u00f3n se reinicia antes de completar cualquier operaci\u00f3n de subida prolongada.")
            ]}),

            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.2 \u00bfC\u00f3mo se recombinan los datos fragmentados?")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("La recombinaci\u00f3n de datos fragmentados requiere un proceso espec\u00edfico que no est\u00e1 implementado en los listeners actuales. El proceso deber\u00eda ser: (1) detectar la existencia de un documento '_meta' que indica fragmentaci\u00f3n, (2) leer el n\u00famero total de fragmentos del documento meta, (3) descargar secuencialmente cada fragmento '_chunk_N', (4) concatenar las cadenas JSON de cada fragmento en orden, y (5) parsear el JSON resultante para obtener los datos originales.")
            ]}),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("Actualmente, la funci\u00f3n 'downloadWithChunks' en chunked-upload.ts implementa esta l\u00f3gica. Sin embargo, esta funci\u00f3n no es invocada autom\u00e1ticamente por los listeners onSnapshot, que solo escuchan documentos normales. Para que otros dispositivos puedan leer datos fragmentados, ser\u00eda necesario modificar el sistema de carga inicial de datos para que verifique y procese documentos fragmentados adem\u00e1s de los documentos normales.")
            ]}),

            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.3 \u00bfEs posible volver a una versi\u00f3n funcional?")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("S\u00ed, es posible revertir a una versi\u00f3n anterior del c\u00f3digo mediante el sistema de control de versiones Git. Sin embargo, el repositorio local actual solo muestra un \u00fanico commit inicial, lo que indica que los cambios realizados durante las sesiones de trabajo no se han guardado en el repositorio remoto de GitHub. Para identificar el momento en que se introdujo el problema, ser\u00eda necesario acceder al historial completo de commits del repositorio remoto.")
            ]}),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("La estrategia recomendada es: (1) clonar el repositorio remoto para obtener el historial completo, (2) identificar commits donde el sistema de sincronizaci\u00f3n funcionaba correctamente bas\u00e1ndose en los grupos existentes en Firebase, (3) crear una rama de prueba desde ese commit, y (4) verificar si la sincronizaci\u00f3n funciona correctamente en esa versi\u00f3n. Esto permitir\u00eda aislar el cambio que introdujo el problema actual.")
            ]}),

            // Recomendaciones
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Recomendaciones")] }),

            new Paragraph({ numbering: { reference: "numbered-solutions", level: 0 }, spacing: { after: 100 }, children: [
                new TextRun({ text: "Recuperar historial completo del repositorio: ", bold: true }),
                new TextRun("Configurar el remote de Git correctamente y obtener el historial completo del repositorio GitHub para identificar versiones funcionales anteriores.")
            ]}),
            new Paragraph({ numbering: { reference: "numbered-solutions", level: 0 }, spacing: { after: 100 }, children: [
                new TextRun({ text: "Implementar sistema de lectura de datos fragmentados: ", bold: true }),
                new TextRun("Modificar el c\u00f3digo de carga inicial para que detecte y procese documentos fragmentados, permitiendo que otros dispositivos lean datos subidos en fragmentos.")
            ]}),
            new Paragraph({ numbering: { reference: "numbered-solutions", level: 0 }, spacing: { after: 100 }, children: [
                new TextRun({ text: "Consolidar cuentas de usuario duplicadas: ", bold: true }),
                new TextRun("Antes de realizar cualquier operaci\u00f3n masiva, consolidar los datos de las dos cuentas de usuario identificadas en una sola cuenta para evitar fragmentaci\u00f3n de datos.")
            ]}),
            new Paragraph({ numbering: { reference: "numbered-solutions", level: 0 }, spacing: { after: 100 }, children: [
                new TextRun({ text: "Implementar subida resiliente con puntos de reanudaci\u00f3n: ", bold: true }),
                new TextRun("Dise\u00f1ar un sistema que guarde el progreso de la subida y pueda reanudarse desde el \u00faltimo punto exitoso si la aplicaci\u00f3n se reinicia.")
            ]}),
            new Paragraph({ numbering: { reference: "numbered-solutions", level: 0 }, spacing: { after: 100 }, children: [
                new TextRun({ text: "Mover fotograf\u00edas a Firebase Storage: ", bold: true }),
                new TextRun("Implementar un sistema donde las fotograf\u00edas se almacenen en Firebase Storage en lugar de Firestore, reduciendo dr\u00e1sticamente el tama\u00f1o de los documentos y eliminando la necesidad de fragmentaci\u00f3n.")
            ]}),
            new Paragraph({ numbering: { reference: "numbered-solutions", level: 0 }, spacing: { after: 100 }, children: [
                new TextRun({ text: "Realizar pruebas en ambiente controlado: ", bold: true }),
                new TextRun("Antes de implementar cambios en producci\u00f3n, crear un ambiente de pruebas con datos de ejemplo para verificar que las modificaciones no afectan a otros usuarios.")
            ]}),

            // Conclusión
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Conclusi\u00f3n")] }),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("El problema de sincronizaci\u00f3n de la aplicaci\u00f3n AcTR-app es multifac\u00e9tico y requiere un enfoque sistem\u00e1tico para su resoluci\u00f3n. Los intentos anteriores de soluci\u00f3n han abordado s\u00edntomas espec\u00edficos pero no han logrado resolver el problema ra\u00edz debido a limitaciones t\u00e9cnicas del entorno de ejecuci\u00f3n (reinicio de la aplicaci\u00f3n durante operaciones prolongadas) y a la falta de un sistema de lectura de datos fragmentados en los dispositivos receptores.")
            ]}),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("La estrategia m\u00e1s prometedora consiste en volver a una versi\u00f3n funcional del c\u00f3digo, identificar el cambio que introdujo el problema, y luego implementar las correcciones necesarias de manera incremental. Esto minimizar\u00eda el riesgo para otros usuarios y permitir\u00eda validar cada cambio antes de su implementaci\u00f3n definitiva.")
            ]}),
            new Paragraph({ indent: { firstLine: 480 }, spacing: { after: 150 }, children: [
                new TextRun("El pr\u00f3ximo paso inmediato recomendado es configurar correctamente el repositorio Git con el remote de GitHub y obtener el historial completo de commits para identificar versiones anteriores funcionales del sistema de sincronizaci\u00f3n.")
            ]})
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync("/home/z/my-project/download/Reporte_Problema_Sincronizacion_Firebase.docx", buffer);
    console.log("Documento generado exitosamente: /home/z/my-project/download/Reporte_Problema_Sincronizacion_Firebase.docx");
});
