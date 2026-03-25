# -*- coding: utf-8 -*-
"""
Informe Ejecutivo - Estado del Proyecto AcTR-app y Cierre de Firebase Studio
"""

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os
from datetime import datetime

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))

# Register font families for bold support
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Create document
pdf_filename = "/home/z/my-project/download/Informe_Ejecutivo_AcTR-app_Firebase_Studio.pdf"
title_for_metadata = os.path.splitext(os.path.basename(pdf_filename))[0]

doc = SimpleDocTemplate(
    pdf_filename,
    pagesize=letter,
    title=title_for_metadata,
    author='Z.ai',
    creator='Z.ai',
    subject='Informe sobre el estado del proyecto y cierre de Firebase Studio'
)

# Styles
styles = getSampleStyleSheet()

# Custom styles
cover_title_style = ParagraphStyle(
    name='CoverTitle',
    fontName='SimHei',
    fontSize=28,
    leading=36,
    alignment=TA_CENTER,
    spaceAfter=24
)

cover_subtitle_style = ParagraphStyle(
    name='CoverSubtitle',
    fontName='SimHei',
    fontSize=16,
    leading=24,
    alignment=TA_CENTER,
    spaceAfter=18
)

heading1_style = ParagraphStyle(
    name='Heading1CN',
    fontName='SimHei',
    fontSize=16,
    leading=22,
    alignment=TA_LEFT,
    spaceAfter=12,
    spaceBefore=18
)

heading2_style = ParagraphStyle(
    name='Heading2CN',
    fontName='SimHei',
    fontSize=13,
    leading=18,
    alignment=TA_LEFT,
    spaceAfter=8,
    spaceBefore=12
)

body_style = ParagraphStyle(
    name='BodyCN',
    fontName='SimHei',
    fontSize=10.5,
    leading=16,
    alignment=TA_LEFT,
    wordWrap='CJK',
    spaceAfter=8
)

bullet_style = ParagraphStyle(
    name='BulletCN',
    fontName='SimHei',
    fontSize=10.5,
    leading=16,
    alignment=TA_LEFT,
    wordWrap='CJK',
    leftIndent=20,
    spaceAfter=4
)

# Table header style
header_style = ParagraphStyle(
    name='TableHeader',
    fontName='SimHei',
    fontSize=10,
    textColor=colors.white,
    alignment=TA_CENTER
)

# Table cell style
cell_style = ParagraphStyle(
    name='TableCell',
    fontName='SimHei',
    fontSize=9.5,
    textColor=colors.black,
    alignment=TA_CENTER
)

cell_left_style = ParagraphStyle(
    name='TableCellLeft',
    fontName='SimHei',
    fontSize=9.5,
    textColor=colors.black,
    alignment=TA_LEFT
)

story = []

# ==================== COVER PAGE ====================
story.append(Spacer(1, 120))
story.append(Paragraph("<b>INFORME EJECUTIVO</b>", cover_title_style))
story.append(Spacer(1, 24))
story.append(Paragraph("Estado del Proyecto AcTR-app", cover_subtitle_style))
story.append(Paragraph("y Cierre de Firebase Studio", cover_subtitle_style))
story.append(Spacer(1, 48))
story.append(Paragraph(f"Fecha: {datetime.now().strftime('%d de %B de %Y')}", cover_subtitle_style))
story.append(Spacer(1, 24))
story.append(Paragraph("Preparado por: Z.ai", cover_subtitle_style))
story.append(PageBreak())

# ==================== RESUMEN EJECUTIVO ====================
story.append(Paragraph("<b>1. RESUMEN EJECUTIVO</b>", heading1_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    "El presente informe documenta el estado actual del proyecto AcTR-app (Academic Tracker) y analiza el impacto "
    "del cierre anunciado de Firebase Studio. Tras una revision exhaustiva del codigo, configuracion y servicios "
    "utilizados, se concluye que el proyecto no enfrenta riesgos operativos por el cierre de Firebase Studio, "
    "ya que los servicios criticos de Firebase (Firestore, Authentication, Cloud Run) continuaran funcionando "
    "normalmente. El codigo fuente esta seguro en GitHub y el despliegue se realiza mediante Vercel.",
    body_style
))
story.append(Spacer(1, 18))

# ==================== ESTADO DEL PROYECTO ====================
story.append(Paragraph("<b>2. ESTADO ACTUAL DEL PROYECTO</b>", heading1_style))
story.append(Spacer(1, 12))

# Repository status table
story.append(Paragraph("<b>2.1 Estado del Repositorio</b>", heading2_style))
story.append(Spacer(1, 6))

repo_data = [
    [Paragraph('<b>Aspecto</b>', header_style), Paragraph('<b>Estado</b>', header_style), Paragraph('<b>Detalle</b>', header_style)],
    [Paragraph('Codigo en GitHub', cell_left_style), Paragraph('Sincronizado', cell_style), Paragraph('github.com/Cetc2211/AcTR-app', cell_left_style)],
    [Paragraph('Ultimo commit', cell_left_style), Paragraph('Reciente', cell_style), Paragraph('Sistema IRA v3.1 implementado', cell_left_style)],
    [Paragraph('Rama activa', cell_left_style), Paragraph('main', cell_style), Paragraph('Produccion', cell_left_style)],
    [Paragraph('Compilacion', cell_left_style), Paragraph('Exitosa', cell_style), Paragraph('Sin errores', cell_left_style)],
]

repo_table = Table(repo_data, colWidths=[150, 80, 200])
repo_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(repo_table)
story.append(Spacer(1, 18))

# Services status
story.append(Paragraph("<b>2.2 Servicios en Uso</b>", heading2_style))
story.append(Spacer(1, 6))

services_data = [
    [Paragraph('<b>Servicio</b>', header_style), Paragraph('<b>Estado</b>', header_style), Paragraph('<b>Afectado por cierre</b>', header_style)],
    [Paragraph('Firebase Firestore', cell_left_style), Paragraph('Operativo', cell_style), Paragraph('NO', cell_style)],
    [Paragraph('Firebase Authentication', cell_left_style), Paragraph('Operativo', cell_style), Paragraph('NO', cell_style)],
    [Paragraph('Cloud Run (Backend IA)', cell_left_style), Paragraph('Operativo', cell_style), Paragraph('NO', cell_style)],
    [Paragraph('Vercel (Hosting)', cell_left_style), Paragraph('Operativo', cell_style), Paragraph('NO', cell_style)],
    [Paragraph('GitHub (Repositorio)', cell_left_style), Paragraph('Operativo', cell_style), Paragraph('NO', cell_style)],
]

services_table = Table(services_data, colWidths=[140, 80, 120])
services_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(services_table)
story.append(Spacer(1, 18))

# ==================== IMPACTO DEL CIERRE ====================
story.append(Paragraph("<b>3. IMPACTO DEL CIERRE DE FIREBASE STUDIO</b>", heading1_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    "Google ha anunciado el cierre de Firebase Studio para el 22 de marzo de 2027. Es importante entender que "
    "Firebase Studio era un IDE de desarrollo web, NO un servicio de infraestructura. El cierre solo afecta "
    "el acceso al editor web, pero los servicios de backend de Firebase continuan operando normalmente.",
    body_style
))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>3.1 Cronograma de Cierre</b>", heading2_style))
story.append(Spacer(1, 6))

timeline_data = [
    [Paragraph('<b>Fecha</b>', header_style), Paragraph('<b>Evento</b>', header_style)],
    [Paragraph('19 Marzo 2026', cell_left_style), Paragraph('Firebase Studio entra en fase de cierre. Disponible boton "Transfer to AI Studio"', cell_left_style)],
    [Paragraph('22 Junio 2026', cell_left_style), Paragraph('Ultimo dia para crear nuevos workspaces o cuentas nuevas', cell_left_style)],
    [Paragraph('22 Marzo 2027', cell_left_style), Paragraph('DEADLINE FINAL - Firebase Studio completamente inaccesible', cell_left_style)],
]

timeline_table = Table(timeline_data, colWidths=[100, 330])
timeline_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(timeline_table)
story.append(Spacer(1, 18))

# ==================== CONCLUSIONES ====================
story.append(Paragraph("<b>4. CONCLUSIONES</b>", heading1_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>4.1 Elementos NO Afectados</b>", heading2_style))
story.append(Spacer(1, 6))

story.append(Paragraph("- Base de datos Firestore: Continuara funcionando normalmente", bullet_style))
story.append(Paragraph("- Sistema de autenticacion: Operativo sin cambios", bullet_style))
story.append(Paragraph("- Backend de IA (Cloud Run): No requiere migracion", bullet_style))
story.append(Paragraph("- Despliegue en Vercel: Funciona de forma independiente", bullet_style))
story.append(Paragraph("- Codigo fuente en GitHub: Seguro y accesible", bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>4.2 Elementos Afectados</b>", heading2_style))
story.append(Spacer(1, 6))

story.append(Paragraph("- Acceso al IDE web de Firebase Studio: No disponible despues del cierre", bullet_style))
story.append(Paragraph("- Historial de chat con agentes: No es migrable (guardar si es necesario)", bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>4.3 Veredicto Final</b>", heading2_style))
story.append(Spacer(1, 6))

story.append(Paragraph(
    "<b>NO HAY RIESGOS INMEDIATOS</b>. El proyecto AcTR-app esta desplegado en Vercel y utiliza servicios de Firebase "
    "que NO se ven afectados por el cierre de Firebase Studio. El desarrollo puede continuar desde cualquier IDE "
    "local (VS Code, Google Antigravity, etc.) y los cambios se sincronizan automaticamente con GitHub.",
    body_style
))
story.append(Spacer(1, 18))

# ==================== RECOMENDACIONES ====================
story.append(Paragraph("<b>5. RECOMENDACIONES</b>", heading1_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>5.1 Acciones Inmediatas (Antes del 19 de Marzo 2026)</b>", heading2_style))
story.append(Spacer(1, 6))

story.append(Paragraph("- Descargar backup adicional del codigo (ZIP) como medida de seguridad", bullet_style))
story.append(Paragraph("- Guardar historial de chat importante si es necesario conservarlo", bullet_style))
story.append(Paragraph("- Verificar acceso a Firebase Console y Google Cloud Console", bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>5.2 Migracion de IDE (Recomendado)</b>", heading2_style))
story.append(Spacer(1, 6))

story.append(Paragraph("- Usar el boton 'Transfer to AI Studio' cuando este disponible", bullet_style))
story.append(Paragraph("- Alternativa: Configurar el proyecto en VS Code con las extensiones de Firebase", bullet_style))
story.append(Paragraph("- Alternativa: Usar Google Antigravity para desarrollo de escritorio", bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph("<b>5.3 Gestion de Secrets</b>", heading2_style))
story.append(Spacer(1, 6))

story.append(Paragraph("- Mover GOOGLE_AI_API_KEY a Google Secret Manager", bullet_style))
story.append(Paragraph("- Verificar que los secrets de Cloud Run esten configurados correctamente", bullet_style))
story.append(Paragraph("- Documentar todas las variables de entorno necesarias en un lugar seguro", bullet_style))

# Build document
doc.build(story)
print(f"PDF generado exitosamente: {pdf_filename}")
