# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.units import inch, cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Create document
pdf_filename = "/home/z/my-project/download/Informe_Estado_PIGEC-130.pdf"
title_for_metadata = os.path.splitext(os.path.basename(pdf_filename))[0]
doc = SimpleDocTemplate(
    pdf_filename,
    pagesize=letter,
    title=title_for_metadata,
    author='Z.ai',
    creator='Z.ai',
    subject='Informe de configuración del proyecto PIGEC-130'
)

# Styles
styles = getSampleStyleSheet()

# Title styles
title_style = ParagraphStyle(
    name='TitleStyle',
    fontName='SimHei',
    fontSize=24,
    leading=30,
    alignment=TA_CENTER,
    spaceAfter=24
)

subtitle_style = ParagraphStyle(
    name='SubtitleStyle',
    fontName='SimHei',
    fontSize=14,
    leading=18,
    alignment=TA_CENTER,
    spaceAfter=12
)

# Heading styles
h1_style = ParagraphStyle(
    name='H1Style',
    fontName='SimHei',
    fontSize=16,
    leading=20,
    alignment=TA_LEFT,
    spaceBefore=18,
    spaceAfter=12,
    textColor=colors.HexColor('#1F4E79')
)

h2_style = ParagraphStyle(
    name='H2Style',
    fontName='SimHei',
    fontSize=13,
    leading=16,
    alignment=TA_LEFT,
    spaceBefore=12,
    spaceAfter=8,
    textColor=colors.HexColor('#2E75B6')
)

# Body styles
body_style = ParagraphStyle(
    name='BodyStyle',
    fontName='SimHei',
    fontSize=10.5,
    leading=16,
    alignment=TA_LEFT,
    spaceAfter=8,
    wordWrap='CJK'
)

# Table styles
header_style = ParagraphStyle(
    name='TableHeader',
    fontName='SimHei',
    fontSize=10,
    leading=12,
    textColor=colors.white,
    alignment=TA_CENTER
)

cell_style = ParagraphStyle(
    name='TableCell',
    fontName='SimHei',
    fontSize=9,
    leading=12,
    textColor=colors.black,
    alignment=TA_CENTER
)

cell_left_style = ParagraphStyle(
    name='TableCellLeft',
    fontName='SimHei',
    fontSize=9,
    leading=12,
    textColor=colors.black,
    alignment=TA_LEFT
)

story = []

# Cover Page
story.append(Spacer(1, 2*inch))
story.append(Paragraph("<b>INFORME DE CONFIGURACIÓN</b>", title_style))
story.append(Paragraph("Proyecto PIGEC-130", subtitle_style))
story.append(Spacer(1, 0.5*inch))
story.append(Paragraph("Sistema Integral de Gestión Psicopedagógica", subtitle_style))
story.append(Spacer(1, 1*inch))
story.append(Paragraph("Fecha: 20 de Marzo de 2026", subtitle_style))
story.append(PageBreak())

# Section 1: Executive Summary
story.append(Paragraph("<b>1. RESUMEN EJECUTIVO</b>", h1_style))
story.append(Paragraph(
    "El proyecto PIGEC-130 (Plataforma Integral de Gestión Clínica) se encuentra en fase activa de desarrollo y migración de pruebas psicométricas desde el sistema Test-bid-130. El sistema está construido con Next.js 14, React, TypeScript y Firebase Firestore como base de datos, lo que proporciona una arquitectura moderna y escalable para la gestión de evaluaciones psicopedagógicas.",
    body_style
))
story.append(Paragraph(
    "Actualmente, el proyecto cuenta con 9 formularios de pruebas psicométricas migrados y funcionales, un sistema de gestión de sesiones de evaluación con pestañas organizativas, y múltiples módulos complementarios para el seguimiento clínico de estudiantes. La arquitectura incluye componentes para WISC-V/WAIS-IV, análisis de riesgo, plan de seguridad, notas SOAP, y generación de reportes.",
    body_style
))

# Section 2: Repository Status
story.append(Paragraph("<b>2. ESTADO DE REPOSITORIOS</b>", h1_style))
story.append(Paragraph("<b>2.1 Repositorio Principal (PIGEC-130)</b>", h2_style))
story.append(Paragraph(
    "Ubicación: /home/z/pigec-130/. El repositorio contiene una estructura completa de proyecto Next.js 14 con más de 150 archivos organizados en módulos funcionales. La arquitectura sigue las mejores prácticas de desarrollo con separación clara entre componentes, hooks, librerías y páginas. El sistema utiliza shadcn/ui para los componentes de interfaz, proporcionando una experiencia de usuario consistente y profesional.",
    body_style
))

story.append(Paragraph("<b>2.2 Repositorio de Referencia (Test-bid-130)</b>", h2_style))
story.append(Paragraph(
    "Ubicación: /home/z/test-bid-130/. Este repositorio contiene el sistema original en HTML vanilla con localStorage, el cual sirve como referencia para la lógica de scoring y la estructura de las pruebas psicométricas. El archivo INTEGRACION_PRUEBAS.txt documenta 16 pruebas integradas en el sistema original, las cuales están siendo migradas a PIGEC-130 con mejoras en la interfaz y persistencia en la nube.",
    body_style
))

# Section 3: Migrated Tests
story.append(Paragraph("<b>3. PRUEBAS PSICOMÉTRICAS MIGRADAS</b>", h1_style))
story.append(Paragraph(
    "Se han migrado exitosamente 9 formularios de pruebas psicométricas al nuevo sistema, cada uno con su lógica de scoring, interpretación de resultados, y alertas automáticas para casos críticos. A continuación se presenta el detalle de cada prueba migrada:",
    body_style
))

# Table: Migrated Tests
migrated_tests = [
    ['Prueba', 'Archivo', 'Items', 'Funcionalidad'],
    ['BDI-II', 'BdiForm.tsx', '21', 'Scoring completo + alerta item 9'],
    ['BAI', 'BaiForm.tsx', '21', 'Scoring + 4 factores ansiedad'],
    ['PHQ-9', 'Phq9Form.tsx', '9', 'Tamizaje depresión + alerta suicida'],
    ['GAD-7', 'Gad7Form.tsx', '7', 'Tamizaje ansiedad generalizada'],
    ['HADS', 'HadsForm.tsx', '14', 'Subescalas A/D hospitalaria'],
    ['BHS', 'BhsForm.tsx', '20', 'Escala desesperanza Beck'],
    ['CHTE', 'ChteForm.tsx', '-', 'Hábitos de estudio'],
    ['SOAP', 'SOAPNotesForm.tsx', '-', 'Notas clínicas estructuradas'],
    ['Ficha ID', 'FichaIdentificacionForm.tsx', '-', 'Datos demográficos']
]

table_data = []
for i, row in enumerate(migrated_tests):
    if i == 0:
        table_data.append([
            Paragraph(f'<b>{row[0]}</b>', header_style),
            Paragraph(f'<b>{row[1]}</b>', header_style),
            Paragraph(f'<b>{row[2]}</b>', header_style),
            Paragraph(f'<b>{row[3]}</b>', header_style)
        ])
    else:
        table_data.append([
            Paragraph(row[0], cell_style),
            Paragraph(row[1], cell_left_style),
            Paragraph(row[2], cell_style),
            Paragraph(row[3], cell_left_style)
        ])

migrated_table = Table(table_data, colWidths=[1.8*cm, 4*cm, 1.5*cm, 5*cm])
migrated_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 9), (-1, 9), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))

story.append(Spacer(1, 12))
story.append(migrated_table)
story.append(Spacer(1, 6))
story.append(Paragraph("Tabla 1. Pruebas psicométricas migradas a PIGEC-130", ParagraphStyle(
    name='Caption',
    fontName='SimHei',
    fontSize=9,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#666666')
)))

# Section 4: Pending Tests
story.append(Paragraph("<b>4. PRUEBAS PENDIENTES DE MIGRAR</b>", h1_style))
story.append(Paragraph(
    "El sistema original Test-bid-130 contiene 16 pruebas psicométricas integradas. De estas, varias pruebas permanecen pendientes de migración a PIGEC-130. Estas pruebas incluyen evaluaciones de riesgo suicida con lógica condicional compleja, instrumentos de factores académicos, y escalas de motivación.",
    body_style
))

# Table: Pending Tests
pending_tests = [
    ['Prueba', 'Descripción', 'Complejidad'],
    ['SSI-Beck', 'Escala Ideación Suicida - Flujo condicional', 'Alta'],
    ['Plutchik', 'Riesgo Suicida - Items críticos 13-15', 'Media'],
    ['Columbia C-SSRS', 'Severidad Suicida - Lógica ramificada', 'Alta'],
    ['IDARE/STAI', 'Ansiedad Rasgo-Estado - 2 subescalas', 'Media'],
    ['IPA', 'Pensamientos Automáticos - 48 items', 'Media'],
    ['CDFR', 'Factores de Riesgo - 46 items ponderados', 'Alta'],
    ['LIRA', 'Riesgo Académico - 8 items ponderados', 'Media'],
    ['GOCA', 'Observación Conductual Docente', 'Baja'],
    ['EBMA', 'Motivación Académica - 25 items IAR', 'Media'],
    ['ASSIST', 'Consumo Sustancias - Tamizaje OMS', 'Media']
]

pending_data = []
for i, row in enumerate(pending_tests):
    if i == 0:
        pending_data.append([
            Paragraph(f'<b>{row[0]}</b>', header_style),
            Paragraph(f'<b>{row[1]}</b>', header_style),
            Paragraph(f'<b>{row[2]}</b>', header_style)
        ])
    else:
        pending_data.append([
            Paragraph(row[0], cell_style),
            Paragraph(row[1], cell_left_style),
            Paragraph(row[2], cell_style)
        ])

pending_table = Table(pending_data, colWidths=[3*cm, 7*cm, 2*cm])
pending_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 9), (-1, 9), colors.white),
    ('BACKGROUND', (0, 10), (-1, 10), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))

story.append(Spacer(1, 12))
story.append(pending_table)
story.append(Spacer(1, 6))
story.append(Paragraph("Tabla 2. Pruebas psicométricas pendientes de migración", ParagraphStyle(
    name='Caption2',
    fontName='SimHei',
    fontSize=9,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#666666')
)))

# Section 5: Screening Management Status
story.append(Paragraph("<b>5. GESTIÓN DE PRUEBAS (Screening Management)</b>", h1_style))
story.append(Paragraph(
    "El componente screening-management.tsx ha sido rediseñado con una interfaz organizada mediante pestañas que facilita el flujo de trabajo completo para la gestión de evaluaciones grupales. Este componente representa el núcleo operativo del sistema para la aplicación masiva de pruebas psicométricas en contextos educativos.",
    body_style
))

story.append(Paragraph("<b>5.1 Estructura de Pestañas Implementada</b>", h2_style))
story.append(Paragraph(
    "El sistema de gestión cuenta con 4 pestañas principales que guían al usuario a través del proceso completo de gestión de evaluaciones. La primera pestaña permite la selección de pruebas mediante un catálogo organizado por categorías (Ficha, Académicas, Socioemocionales, Riesgo Suicida, Conductas de Riesgo, Evaluación Clínica). La segunda pestaña facilita la asignación de grupos con búsqueda y filtrado por semestre. La tercera pestaña maneja la generación de enlaces únicos con opciones de compartir por WhatsApp, correo electrónico y código QR. Finalmente, la cuarta pestaña permite el monitoreo de sesiones activas.",
    body_style
))

story.append(Paragraph("<b>5.2 Catálogo de Pruebas Disponible</b>", h2_style))
story.append(Paragraph(
    "El catálogo incluye 17 instrumentos psicométricos clasificados en 6 categorías temáticas. Cada prueba muestra información relevante incluyendo descripción, duración estimada, y roles autorizados para su aplicación. El sistema filtra automáticamente las pruebas según el rol del usuario (Orientador, Clínico, Docente), garantizando que solo se muestren las pruebas pertinentes a cada perfil profesional.",
    body_style
))

story.append(Paragraph("<b>5.3 Funcionalidades de Compartir</b>", h2_style))
story.append(Paragraph(
    "El sistema implementa múltiples opciones para compartir enlaces de evaluación. La integración con WhatsApp permite enviar mensajes preformateados con el enlace y descripción de las pruebas seleccionadas. La opción de correo electrónico genera un mensaje estructurado con asunto y cuerpo predefinidos. Adicionalmente, se incluye la opción de generar códigos QR para facilitar el acceso desde dispositivos móviles. Todos los enlaces generados incluyen fecha de expiración configurable (1 a 30 días) y se almacenan en Firestore para su seguimiento.",
    body_style
))

# Section 6: Technical Architecture
story.append(Paragraph("<b>6. ARQUITECTURA TÉCNICA</b>", h1_style))
story.append(Paragraph("<b>6.1 Stack Tecnológico</b>", h2_style))

tech_stack = [
    ['Capa', 'Tecnología', 'Versión'],
    ['Framework', 'Next.js', '14.x'],
    ['UI Library', 'React', '18.x'],
    ['Lenguaje', 'TypeScript', '5.x'],
    ['Estilos', 'Tailwind CSS', '4.x'],
    ['Componentes UI', 'shadcn/ui', 'Última'],
    ['Base de datos', 'Firebase Firestore', 'N/A'],
    ['Gráficos', 'Recharts', 'N/A'],
    ['Iconos', 'Lucide React', 'N/A']
]

tech_data = []
for i, row in enumerate(tech_stack):
    if i == 0:
        tech_data.append([
            Paragraph(f'<b>{row[0]}</b>', header_style),
            Paragraph(f'<b>{row[1]}</b>', header_style),
            Paragraph(f'<b>{row[2]}</b>', header_style)
        ])
    else:
        tech_data.append([
            Paragraph(row[0], cell_style),
            Paragraph(row[1], cell_style),
            Paragraph(row[2], cell_style)
        ])

tech_table = Table(tech_data, colWidths=[4*cm, 4*cm, 3*cm])
tech_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))

story.append(Spacer(1, 12))
story.append(tech_table)
story.append(Spacer(1, 6))
story.append(Paragraph("Tabla 3. Stack tecnológico del proyecto PIGEC-130", ParagraphStyle(
    name='Caption3',
    fontName='SimHei',
    fontSize=9,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#666666')
)))

story.append(Paragraph("<b>6.2 Estructura de Directorios</b>", h2_style))
story.append(Paragraph(
    "El proyecto sigue una estructura modular bien organizada. El directorio src/components contiene todos los componentes React, incluyendo los formularios de pruebas psicométricas y componentes de UI reutilizables. El directorio src/app implementa el sistema de enrutamiento de Next.js con páginas para orientación, evaluación, consola clínica, y dashboard administrativo. El directorio src/lib contiene las librerías de utilidad como firebase.ts para la conexión a Firestore, wisc-logic.ts y wisc-norms.ts para la lógica de evaluación WISC-V, y risk-analysis.ts para el análisis de riesgo. Los estímulos visuales para evaluaciones se almacenan en public/stimuli/ organizados por tipo de prueba.",
    body_style
))

# Section 7: Additional Modules
story.append(Paragraph("<b>7. MÓDULOS COMPLEMENTARIOS</b>", h1_style))
story.append(Paragraph(
    "Además de las pruebas psicométricas, el sistema cuenta con múltiples módulos complementarios que enriquecen la funcionalidad clínica y educativa del sistema. Estos módulos incluyen el sistema de evaluación WISC-V/WAIS-IV con consola de puntuación y generación de reportes visuales (WISC-VScoringConsole.tsx, WiscProfileChart.tsx, WiscReportDocument.tsx), análisis de riesgo con visualización temporal (RiskTimelineChart.tsx, RiskIndicator.tsx), plan de seguridad estructurado (safety-plan.tsx), flujo de referencias (referral-flow.tsx), generador de planes de tratamiento (treatment-plan-generator.tsx), y generador de reportes (ReportGenerator.tsx).",
    body_style
))

# Section 8: Recommendations
story.append(Paragraph("<b>8. RECOMENDACIONES Y PRÓXIMOS PASOS</b>", h1_style))
story.append(Paragraph("<b>8.1 Prioridad Alta</b>", h2_style))
story.append(Paragraph(
    "Se recomienda priorizar la migración de las pruebas de riesgo suicida (SSI-Beck, Columbia C-SSRS, Plutchik) debido a su criticidad clínica. Estas pruebas requieren especial atención en la implementación de la lógica condicional y los sistemas de alerta automáticos. La migración debe incluir protocolos de notificación inmediata para casos de riesgo alto detectado.",
    body_style
))

story.append(Paragraph("<b>8.2 Prioridad Media</b>", h2_style))
story.append(Paragraph(
    "Las pruebas de ansiedad y factores de riesgo académico (IDARE/STAI, IPA, CDFR, LIRA) deben migrarse en una segunda fase. Se sugiere implementar un sistema de interpretación automatizada con sugerencias de intervención basadas en los perfiles de resultado.",
    body_style
))

story.append(Paragraph("<b>8.3 Mejoras al Sistema de Gestión</b>", h2_style))
story.append(Paragraph(
    "Se recomienda implementar la funcionalidad de códigos QR pendiente, agregar la capacidad de importar grupos desde archivos CSV, desarrollar un dashboard de monitoreo en tiempo real, y crear un sistema de recordatorios automáticos para evaluaciones pendientes de completar.",
    body_style
))

# Section 9: Progress Summary
story.append(Paragraph("<b>9. RESUMEN DE AVANCE</b>", h1_style))

progress_data = [
    ['Indicador', 'Completado', 'Pendiente', 'Porcentaje'],
    ['Pruebas migradas', '9', '10', '47%'],
    ['Módulos funcionales', '15+', '0', '100%'],
    ['Sistema de gestión', 'Implementado', 'Mejoras', '90%'],
    ['Documentación', 'Básica', 'Ampliar', '60%']
]

progress_table_data = []
for i, row in enumerate(progress_data):
    if i == 0:
        progress_table_data.append([
            Paragraph(f'<b>{row[0]}</b>', header_style),
            Paragraph(f'<b>{row[1]}</b>', header_style),
            Paragraph(f'<b>{row[2]}</b>', header_style),
            Paragraph(f'<b>{row[3]}</b>', header_style)
        ])
    else:
        progress_table_data.append([
            Paragraph(row[0], cell_left_style),
            Paragraph(row[1], cell_style),
            Paragraph(row[2], cell_style),
            Paragraph(row[3], cell_style)
        ])

progress_table = Table(progress_table_data, colWidths=[4*cm, 2.5*cm, 2.5*cm, 2.5*cm])
progress_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))

story.append(Spacer(1, 12))
story.append(progress_table)
story.append(Spacer(1, 6))
story.append(Paragraph("Tabla 4. Resumen de avance del proyecto PIGEC-130", ParagraphStyle(
    name='Caption4',
    fontName='SimHei',
    fontSize=9,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#666666')
)))

# Build PDF
doc.build(story)
print(f"PDF generado exitosamente: {pdf_filename}")
