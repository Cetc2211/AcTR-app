# Informe de Avance v2.4 - Sistema de Seguimiento e Identidad Oficial

**Fecha:** 15 de Enero, 2026
**Estatus:** Completado ✅

## Resumen de Cambios
Se ha implementado la nueva lógica de persistencia y generación de informes oficiales dentro del módulo de Seguimiento.

### 1. Evolución del Almacenamiento (Persistencia Dual)
- **Global:** `contactPhones` y `tutorMessageTemplate` se mantienen en `app_config/tracking_settings`.
- **Individual (Nuevo):** La identidad del responsable (`prefectName`, `prefectTitle`, `prefectSignature`) se guarda ahora en el perfil del usuario (`users/{uid}/userData/settings`), permitiendo que múltiples prefectos usen el sistema con sus propias firmas.

### 2. Generador de Informes Oficiales (PDF)
Se ha integrado un motor de generación de PDF en `StudentTrackingDialog.tsx` que incluye:
- **Cabecera Institucional:** Logo y nombre de la escuela.
- **Gráfica de Inasistencias:** Generada vectorialmente (barras) dentro del PDF.
- **Resumen Ejecutivo:** Texto autogenerado basado en estadísticas y bitácora.
- **Limpieza Ética:** Filtro automático que sustituye diagnósticos clínicos (Ansiedad/Neuropsi) por la etiqueta administrativa: *"Estudiante bajo protocolo de apoyo institucional"*.
- **Firma Dinámica:** Inclusión de imagen de firma, nombre y cargo del responsable al calce.

### 3. Interfaz de Usuario
- **Panel de Ajustes:** Nuevos campos para "Identidad para Informes Oficiales" con carga de firma (convertida a Base64).
- **Panel de Seguimiento:** Nuevo botón **"Informe PDF"** junto al indicador de riesgo, para descargar el expediente administrativo al instante.

## Archivos Modificados
- `src/lib/placeholder-data.ts`: Actualización de tipo `AppSettings`.
- `src/components/tracking-settings-dialog.tsx`: Lógica de persistencia dual y carga de firma.
- `src/components/student-tracking-dialog.tsx`: Motor de PDF y botón de descarga.

---
**Siguientes Pasos:**
- Probar la carga de firma y generación de PDF con datos reales.
- Verificar que los roles de usuario (Admin vs Prefecto) carguen sus propios ajustes.
