#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.lib.units import inch
import os

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Output path
output_path = "/home/z/my-project/download/Reporte_Problematica_AcTR-app.pdf"

# Create document
doc = SimpleDocTemplate(
    output_path,
    pagesize=letter,
    title="Reporte_Problematica_AcTR-app",
    author='Z.ai',
    creator='Z.ai',
    subject='Diagnostico y acciones realizadas para resolver problemas de sincronizacion Firebase'
)

# Styles
styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    name='TitleStyle',
    fontName='Microsoft YaHei',
    fontSize=24,
    leading=30,
    alignment=TA_CENTER,
    spaceAfter=20
)

heading1_style = ParagraphStyle(
    name='Heading1Style',
    fontName='Microsoft YaHei',
    fontSize=16,
    leading=22,
    alignment=TA_LEFT,
    spaceBefore=20,
    spaceAfter=12,
    textColor=colors.HexColor('#1F4E79')
)

heading2_style = ParagraphStyle(
    name='Heading2Style',
    fontName='Microsoft YaHei',
    fontSize=13,
    leading=18,
    alignment=TA_LEFT,
    spaceBefore=15,
    spaceAfter=8,
    textColor=colors.HexColor('#2E75B6')
)

body_style = ParagraphStyle(
    name='BodyStyle',
    fontName='SimHei',
    fontSize=10.5,
    leading=18,
    alignment=TA_LEFT,
    wordWrap='CJK'
)

code_style = ParagraphStyle(
    name='CodeStyle',
    fontName='Times New Roman',
    fontSize=9,
    leading=12,
    alignment=TA_LEFT,
    backColor=colors.HexColor('#F5F5F5')
)

# Table styles
header_style = ParagraphStyle(
    name='TableHeader',
    fontName='Microsoft YaHei',
    fontSize=10,
    textColor=colors.white,
    alignment=TA_CENTER
)

cell_style = ParagraphStyle(
    name='TableCell',
    fontName='SimHei',
    fontSize=9,
    textColor=colors.black,
    alignment=TA_CENTER,
    wordWrap='CJK'
)

cell_left_style = ParagraphStyle(
    name='TableCellLeft',
    fontName='SimHei',
    fontSize=9,
    textColor=colors.black,
    alignment=TA_LEFT,
    wordWrap='CJK'
)

story = []

# Title
story.append(Paragraph("Reporte de Problematica - AcTR-app", title_style))
story.append(Paragraph("Diagnostico y Acciones Realizadas", ParagraphStyle(
    name='Subtitle',
    fontName='SimHei',
    fontSize=14,
    leading=18,
    alignment=TA_CENTER,
    textColor=colors.grey
)))
story.append(Spacer(1, 30))

# Date
story.append(Paragraph("Fecha: 20 de marzo de 2026", body_style))
story.append(Paragraph("Aplicacion: Academic Tracker (AcTR-app)", body_style))
story.append(Paragraph("Usuario afectado: I2leuzr51YbohBtpkMnypFnYvCh1", body_style))
story.append(Spacer(1, 20))

# Section 1: Context
story.append(Paragraph("1. Contexto y Problematica Inicial", heading1_style))

story.append(Paragraph(
    "El usuario reporto que los datos de la aplicacion AcTR-app no se sincronizaban correctamente entre diferentes dispositivos. "
    "Especificamente, los grupos y estudiantes creados en la aplicacion de escritorio no aparecian en el navegador web ni en el dispositivo movil, "
    "a pesar de que la consola indicaba que la subida a Firebase se habia realizado correctamente.",
    body_style
))

story.append(Paragraph("1.1 Sintomas Reportados", heading2_style))

symptoms_data = [
    [Paragraph('<b>Sintoma</b>', header_style), Paragraph('<b>Dispositivo</b>', header_style), Paragraph('<b>Detalle</b>', header_style)],
    [Paragraph('Grupos incorrectos', cell_style), Paragraph('Celular/Navegador', cell_style), Paragraph('4 grupos antiguos en lugar de 3 actuales', cell_left_style)],
    [Paragraph('WebChannel errors', cell_style), Paragraph('Consola iPad', cell_style), Paragraph('transport errored status:1', cell_left_style)],
    [Paragraph('Datos fragmentados', cell_style), Paragraph('Firebase Console', cell_style), Paragraph('Chunks _chunk_0 a _chunk_14', cell_left_style)],
    [Paragraph('Discrepancia de estudiantes', cell_style), Paragraph('IndexedDB', cell_style), Paragraph('234 estudiantes vs 62 activos', cell_left_style)],
]

symptoms_table = Table(symptoms_data, colWidths=[2*inch, 1.5*inch, 3.5*inch])
symptoms_table.setStyle(TableStyle([
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
story.append(symptoms_table)
story.append(Spacer(1, 15))

# Section 2: Diagnostics
story.append(Paragraph("2. Diagnostico Realizado", heading1_style))

story.append(Paragraph("2.1 Duplicidad de Usuarios en Firebase", heading2_style))
story.append(Paragraph(
    "Se identifico que existian DOS cuentas de usuario diferentes en Firebase Authentication con datos fragmentados entre ellas:",
    body_style
))

users_data = [
    [Paragraph('<b>User ID</b>', header_style), Paragraph('<b>Datos</b>', header_style), Paragraph('<b>Estado</b>', header_style)],
    [Paragraph('5aVFWuV3EYZex7wKN8jFyxKNTZi1', cell_style), Paragraph('10 grupos (incluye archivados)', cell_style), Paragraph('Cuenta antigua', cell_style)],
    [Paragraph('I2leuzr51YbohBtpkMnypFnYvCh1', cell_style), Paragraph('3 grupos (cuenta actual)', cell_style), Paragraph('Cuenta activa', cell_style)],
]

users_table = Table(users_data, colWidths=[2.5*inch, 2.5*inch, 2*inch])
users_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(users_table)
story.append(Spacer(1, 12))

story.append(Paragraph("2.2 Fragmentacion de Datos (Chunks)", heading2_style))
story.append(Paragraph(
    "El sistema de subida implementado fragmentaba los datos en multiples documentos (chunks) para evitar limites de tamaño de Firestore. "
    "Sin embargo, los listeners (onSnapshot) que escuchan cambios en tiempo real solo monitorean el documento principal (app_groups), "
    "no los documentos fragmentados (app_groups_chunk_0, app_groups_chunk_1, etc.). Esto causaba que los dispositivos no recibieran "
    "las actualizaciones cuando los datos se subian fragmentados.",
    body_style
))

story.append(Paragraph("2.3 Datos Fantasma", heading2_style))
story.append(Paragraph(
    "Se detectaron 234 estudiantes en IndexedDB local, pero solo 62 correspondian a grupos activos. "
    "Los 172 estudiantes adicionales eran datos historicos de semestres anteriores que no fueron eliminados correctamente "
    "y permanecian en la base de datos local ocupando espacio y causando confusion.",
    body_style
))

# Section 3: Actions
story.append(PageBreak())
story.append(Paragraph("3. Acciones Intentadas y Resultados", heading1_style))

actions_data = [
    [Paragraph('<b>#</b>', header_style), 
     Paragraph('<b>Accion</b>', header_style), 
     Paragraph('<b>Resultado</b>', header_style),
     Paragraph('<b>Estado</b>', header_style)],
    [Paragraph('1', cell_style), 
     Paragraph('Sistema ULTRA REST UPLOAD', cell_left_style), 
     Paragraph('Subida exitosa pero datos fragmentados no se leen en otros dispositivos', cell_left_style),
     Paragraph('Parcial', cell_style)],
    [Paragraph('2', cell_style), 
     Paragraph('Herramienta de migracion de usuarios', cell_left_style), 
     Paragraph('Creada para fusionar datos entre cuentas. No utilizada aun.', cell_left_style),
     Paragraph('Pendiente', cell_style)],
    [Paragraph('3', cell_style), 
     Paragraph('Herramienta de diagnostico de datos', cell_left_style), 
     Paragraph('Identifica discrepancias entre datos normales y fragmentados.', cell_left_style),
     Paragraph('Disponible', cell_style)],
    [Paragraph('4', cell_style), 
     Paragraph('Herramienta de defragmentacion V1', cell_left_style), 
     Paragraph('La app se reinicio durante el proceso (timeout).', cell_left_style),
     Paragraph('Fallido', cell_style)],
    [Paragraph('5', cell_style), 
     Paragraph('Herramienta de defragmentacion V2 (REST API)', cell_left_style), 
     Paragraph('La app se reinicio durante el proceso.', cell_left_style),
     Paragraph('Fallido', cell_style)],
    [Paragraph('6', cell_style), 
     Paragraph('Herramienta de defragmentacion V3 (Batch)', cell_left_style), 
     Paragraph('Version simplificada con subidas escalonadas. Pendiente de prueba.', cell_left_style),
     Paragraph('Pendiente', cell_style)],
]

actions_table = Table(actions_data, colWidths=[0.5*inch, 2.5*inch, 2.5*inch, 1.5*inch])
actions_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(actions_table)
story.append(Spacer(1, 15))

story.append(Paragraph("3.1 Detalle de Problemas Tecnicos", heading2_style))

story.append(Paragraph(
    "<b>WebChannel Transport Errors:</b> El SDK de Firebase utiliza WebChannel para comunicacion en tiempo real. "
    "En conexiones inestables (iPad en escuela), este canal falla con status:1, causando que las operaciones "
    "de escritura se completen pero los datos no se propaguen correctamente.",
    body_style
))

story.append(Paragraph(
    "<b>Reinicio de la Aplicacion:</b> Los intentos de subida masiva de datos causan que la aplicacion de escritorio "
    "se reinicie automaticamente. Esto probablemente se debe a limitaciones de memoria o timeouts del navegador "
    "Electron al procesar grandes cantidades de datos.",
    body_style
))

# Section 4: Tools Created
story.append(Paragraph("4. Herramientas Desarrolladas", heading1_style))

tools_data = [
    [Paragraph('<b>Herramienta</b>', header_style), 
     Paragraph('<b>URL</b>', header_style), 
     Paragraph('<b>Funcion</b>', header_style)],
    [Paragraph('Migrar Usuarios', cell_style), 
     Paragraph('/admin/migrate-users', cell_style), 
     Paragraph('Fusiona datos entre dos cuentas de usuario', cell_left_style)],
    [Paragraph('Diagnostico de Datos', cell_style), 
     Paragraph('/admin/data-diagnostic', cell_style), 
     Paragraph('Detecta discrepancias y fragmentacion', cell_left_style)],
    [Paragraph('Defragmentar Datos', cell_style), 
     Paragraph('/admin/defragment-data', cell_style), 
     Paragraph('Sube datos locales limpios a Firebase', cell_left_style)],
    [Paragraph('Debug Console', cell_style), 
     Paragraph('/admin/debug', cell_style), 
     Paragraph('Monitorea procesos en tiempo real', cell_left_style)],
]

tools_table = Table(tools_data, colWidths=[2*inch, 2*inch, 3*inch])
tools_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(tools_table)
story.append(Spacer(1, 15))

# Section 5: Current Status
story.append(Paragraph("5. Estado Actual", heading1_style))

status_data = [
    [Paragraph('<b>Componente</b>', header_style), 
     Paragraph('<b>Estado</b>', header_style), 
     Paragraph('<b>Observacion</b>', header_style)],
    [Paragraph('App Escritorio', cell_style), 
     Paragraph('Funcional', cell_style), 
     Paragraph('3 grupos correctos: TO, TSPP, IV TAEA', cell_left_style)],
    [Paragraph('Celular/Navegador', cell_style), 
     Paragraph('Desactualizado', cell_style), 
     Paragraph('Muestra 4 grupos antiguos', cell_left_style)],
    [Paragraph('Firebase', cell_style), 
     Paragraph('Datos fragmentados', cell_style), 
     Paragraph('Chunks no se recombinan automaticamente', cell_left_style)],
    [Paragraph('Sincronizacion', cell_style), 
     Paragraph('No funcional', cell_style), 
     Paragraph('Los listeners no detectan chunks', cell_left_style)],
]

status_table = Table(status_data, colWidths=[2*inch, 1.5*inch, 3.5*inch])
status_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(status_table)
story.append(Spacer(1, 15))

# Section 6: Recommendations
story.append(Paragraph("6. Recomendaciones", heading1_style))

story.append(Paragraph("6.1 Solucion a Corto Plazo", heading2_style))
story.append(Paragraph(
    "1. Probar la herramienta de defragmentacion V3 desde la app de escritorio. Si la app se reinicia nuevamente, "
    "se requerira una solucion alternativa.",
    body_style
))
story.append(Paragraph(
    "2. Si el problema persiste, implementar un API route en el backend que procese la subida de datos "
    "desde el servidor en lugar del cliente, evitando las limitaciones de Electron.",
    body_style
))

story.append(Paragraph("6.2 Solucion a Mediano Plazo", heading2_style))
story.append(Paragraph(
    "1. Modificar el sistema de subida para que siempre escriba en el documento principal (app_groups) "
    "ademas de los chunks, permitiendo que los listeners funcionen correctamente.",
    body_style
))
story.append(Paragraph(
    "2. Implementar un sistema de limpieza automatica de datos inactivos para evitar la acumulacion "
    "de estudiantes y grupos archivados.",
    body_style
))
story.append(Paragraph(
    "3. Unificar las dos cuentas de usuario detectadas, eliminando la cuenta antigua despues de "
    "verificar que todos los datos fueron migrados correctamente.",
    body_style
))

story.append(Paragraph("6.3 Mejoras Arquitectonicas", heading2_style))
story.append(Paragraph(
    "1. Implementar un sistema de sincronizacion basado en Cloud Functions que procese cambios "
    "del lado del servidor, reduciendo la carga en el cliente.",
    body_style
))
story.append(Paragraph(
    "2. Agregar un sistema de historico de grupos que permita archivar grupos antiguos sin "
    "eliminar los datos completamente.",
    body_style
))
story.append(Paragraph(
    "3. Mejorar el manejo de errores de WebChannel con reintentos automaticos y fallback a REST API.",
    body_style
))

# Section 7: Commits
story.append(Paragraph("7. Commits Realizados", heading1_style))

commits_data = [
    [Paragraph('<b>Commit</b>', header_style), 
     Paragraph('<b>Descripcion</b>', header_style)],
    [Paragraph('c5ffbc4', cell_style), 
     Paragraph('Implement ULTRA ROBUST REST upload system - bypasses WebChannel', cell_left_style)],
    [Paragraph('9be2af1', cell_style), 
     Paragraph('Fix access control and improve Firebase resilience', cell_left_style)],
    [Paragraph('a3a6a8c', cell_style), 
     Paragraph('Add user data migration tool for merging fragmented accounts', cell_left_style)],
    [Paragraph('5788a83', cell_style), 
     Paragraph('Add data diagnostic tool to detect fragmentation and discrepancies', cell_left_style)],
    [Paragraph('0b1b72c', cell_style), 
     Paragraph('Add defragment-data tool to sync local IndexedDB to Firebase', cell_left_style)],
    [Paragraph('31701fe', cell_style), 
     Paragraph('Add data tools buttons to admin panel for easy access', cell_left_style)],
    [Paragraph('2493387', cell_style), 
     Paragraph('Improve defragment tool to filter only active students', cell_left_style)],
    [Paragraph('acbf996', cell_style), 
     Paragraph('Fix defragment tool with REST API upload for reliability', cell_left_style)],
    [Paragraph('4e313e8', cell_style), 
     Paragraph('Simplify defragment tool with batched uploads', cell_left_style)],
]

commits_table = Table(commits_data, colWidths=[1.5*inch, 5.5*inch])
commits_table.setStyle(TableStyle([
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
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(commits_table)

# Build PDF
doc.build(story)

# Add metadata
from pypdf import PdfReader, PdfWriter

reader = PdfReader(output_path)
writer = PdfWriter()

for page in reader.pages:
    writer.add_page(page)

title = os.path.splitext(os.path.basename(output_path))[0]
writer.add_metadata({
    '/Title': title,
    '/Author': 'Z.ai',
    '/Subject': 'Diagnostico y acciones realizadas para resolver problemas de sincronizacion Firebase en AcTR-app',
    '/Creator': 'Z.ai'
})

with open(output_path, "wb") as output:
    writer.write(output)

print(f"PDF generado: {output_path}")
