# PIGEC-130 - FASE 2: Plan de Implementación
## Fecha: 2026-03-25

---

## 🎯 OBJETIVOS FASE 2

1. **Crear sección unificada de Expedientes** en el menú principal
2. **Mover funcionalidad del dashboard antiguo** a la nueva sección
3. **Conectar con datos reales de Firestore** (eliminar dependencia de store.ts)
4. **Mantener formato y funciones** de los 4 expedientes de ejemplo
5. **Crear nuevos expedientes** con el mismo formato

---

## 📊 ANÁLISIS DE LO EXISTENTE

### Sidebar actual:
```typescript
{ href: '/dashboard', label: 'Dashboard de Riesgo', roles: ['Clinico', 'Orientador'] },
{ href: '/admin/expedientes', label: 'Expedientes', roles: ['Clinico', 'Orientador'] },
```

### Estado actual:
| Página | Ubicación | Datos | Estado |
|--------|-----------|-------|--------|
| Dashboard de Riesgo | `/dashboard` | `store.ts` (S001-S004) | ⚠️ Simulados |
| Expedientes | `/admin/expedientes` | Firestore | ✅ Reales |
| Expediente Clínico | `/clinica/expediente/[id]` | `store.ts` | ⚠️ Simulados |

---

## 🔧 CAMBIOS A REALIZAR

### 1. MODIFICAR SIDEBAR
- Cambiar "Dashboard de Riesgo" a "Panel de Control"
- Mantener "Expedientes" como sección principal de expedientes
- Agregar "Nuevo Expediente" como opción

### 2. MODIFICAR DASHBOARD
- Convertir en panel de control con estadísticas
- Mostrar resumen de expedientes por estado
- Mostrar alertas de riesgo
- Enlaces rápidos a expedientes recientes

### 3. MEJORAR PÁGINA DE EXPEDIENTES
- Agregar botón "Nuevo Expediente"
- Agregar vista de expediente clínico completo (ficha, evaluaciones, tratamiento)
- Mantener funcionalidad de ver resultados

### 4. CREAR COMPONENTE DE NUEVO EXPEDIENTE
- Formulario de ficha de identificación
- Asignación automática de matrícula
- Vinculación con grupos existentes

### 5. MODIFICAR EXPEDIENTE CLÍNICO
- Cambiar de `store.ts` a Firestore
- Buscar por `matricula` en lugar de `studentId`
- Cargar resultados de `test_results`

---

## 📁 ARCHIVOS A MODIFICAR/CREAR

### Modificar:
1. `/src/components/sidebar.tsx` - Actualizar menú
2. `/src/app/(protected)/dashboard/page.tsx` - Nuevo panel de control
3. `/src/app/(protected)/admin/expedientes/page.tsx` - Mejorar existente
4. `/src/app/(protected)/clinica/expediente/[id]/page.tsx` - Usar Firestore

### Crear:
1. `/src/components/NuevoExpedienteDialog.tsx` - Diálogo para crear expediente
2. `/src/components/ExpedienteClinicoCompleto.tsx` - Vista completa del expediente
3. `/src/lib/expediente-service.ts` - Servicio para manejar expedientes
4. `/src/app/api/expedientes/route.ts` - API para crear/actualizar expedientes

---

## 🗺️ FLUJO PROPUESTO

```
┌─────────────────────────────────────────────────────────────┐
│                      SIDEBAR                                 │
├─────────────────────────────────────────────────────────────┤
│ 🏠 Panel de Control (/dashboard)                            │
│    └─ Estadísticas, alertas, resumen                         │
│                                                              │
│ 📋 Expedientes (/admin/expedientes)                         │
│    ├─ Lista de expedientes (Firestore)                      │
│    ├─ [+ Nuevo Expediente]                                   │
│    └─ Ver detalle → Expediente completo                     │
│                                                              │
│ 📝 Gestión de Pruebas (/screening)                          │
│    └─ Generar enlaces, enviar pruebas                       │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ TAREAS ESPECÍFICAS

### Tarea 2.1: Crear servicio de expedientes
- [ ] Crear `/src/lib/expediente-service.ts`
- [ ] Funciones: crear, buscar, actualizar, eliminar
- [ ] Integración con matriculas_estudiantes

### Tarea 2.2: Crear diálogo de nuevo expediente
- [ ] Formulario de ficha de identificación
- [ ] Selección de grupo
- [ ] Generación/vinculación de matrícula

### Tarea 2.3: Modificar página de expedientes
- [ ] Agregar botón "Nuevo Expediente"
- [ ] Agregar vista detallada con tabs
- [ ] Integrar resultados de pruebas

### Tarea 2.4: Modificar dashboard
- [ ] Convertir en panel de estadísticas
- [ ] Mostrar métricas de expedientes
- [ ] Alertas de riesgo

### Tarea 2.5: Modificar expediente clínico
- [ ] Usar Firestore en lugar de store.ts
- [ ] Cargar datos por matrícula
- [ ] Mostrar resultados de evaluaciones

---

## 🧪 PRUEBAS A REALIZAR

1. **Crear nuevo expediente** desde la interfaz
2. **Ver expediente** con todos los datos
3. **Editar expediente** (ficha de identificación)
4. **Ver resultados de pruebas** en el expediente
5. **Eliminar expediente** con confirmación
6. **Buscar expedientes** por nombre/matrícula
7. **Filtrar por grupo**

---

*Plan generado para FASE 2 de PIGEC-130*
