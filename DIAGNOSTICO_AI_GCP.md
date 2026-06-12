# 📋 DIAGNÓSTICO: Configuración de IA y Google Cloud - AcTR-app

**Fecha del diagnóstico:** 3 de Diciembre de 2025  
**Estado General:** ⚠️ **PARCIALMENTE OPERACIONAL CON PROBLEMAS CRÍTICOS**

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Endpoints de Cloud Run Hardcodeados**
- **Ubicación:** `/src/ai/flows/generate-student-feedback-flow.ts` y `generate-group-report-analysis-flow.ts`
- **Problema:** Las URLs de los servicios están hardcodeadas en el código:
  ```
  https://backend-service-263108580734.us-central1.run.app/generate-report
  https://backend-service-263108580734.us-central1.run.app/generate-group-report
  ```
- **Riesgo:** 
  - Exposición de IDs de proyecto en el código fuente
  - Cambios de URL requieren actualización de código
  - Imposible usar diferentes endpoints por entorno (dev/prod)
- **Recomendación:** Mover a variables de entorno

### 2. **Archivo de Configuración `.env.local` Ausente**
- **Problema:** No existe el archivo de configuración de variables de entorno
- **Variables Faltantes:**
  - `NEXT_PUBLIC_FIREBASE_*` (para inicialización en cliente)
  - `NEXT_PUBLIC_GENKIT_API_KEY` (si se usa)
  - `CLOUD_RUN_ENDPOINT` (endpoints de IA)
  - Cualquier otra clave de API necesaria
- **Impacto:** La aplicación puede fallar en tiempo de ejecución si busca estas variables

### 3. **Genkit.ts está DEPRECADO**
- **Ubicación:** `/src/ai/genkit.ts`
- **Contenido:**
  ```typescript
  // DEPRECATED: This file is no longer used.
  export const ai = null;
  ```
- **Problema:** Código muerto que puede causar confusión
- **Limpieza Necesaria:** Eliminar referencias e importaciones

### 4. **API Endpoint Deprecado No Removido**
- **Ubicación:** `/src/app/api/generate-ia/route.ts`
- **Contenido:** Devuelve error 410 (Gone)
- **Problema:** Código legado que puede confundir desarrolladores
- **Acción:** Remover si no se usa

### 5. **Gestión de Credenciales en Cloud Run - RIESGO DE SEGURIDAD**
- **Ubicación:** `/cloud-run-ai-service-backed/main.py`
- **Problemas Identificados:**
  - ✅ **Bien:** Se usa `DB_PASSWORD` como variable de entorno (no hardcodeada)
  - ⚠️ **Riesgo:** El `GCP_PROJECT_ID` se expone en logs
  - ❌ **Crítico:** `api_key` de Google AI se pasa en requests HTTP (debe ser solo en backend)
  - ❌ **Crítico:** No hay validación de CORS o autenticación en los endpoints

### 6. **Falta de Autenticación en Endpoints IA**
- **Ubicación:** `/cloud-run-ai-service-backed/main.py` (rutas `@app.route`)
- **Problema:** Los endpoints `/generate-report` y `/generate-group-report` no tienen autenticación
- **Riesgo:** Cualquiera puede llamar estos endpoints y consumir cuota de IA
- **Costo Potencial:** Abuso de API y cargos inesperados

### 7. **Falta de Manejo de Errores Completo**
- **Ubicación:** `/src/ai/flows/` (ambos flows)
- **Problema:** Solo capturan errores genéricos; no hay logging detallado
- **Impacto:** Difícil debuggear problemas en producción

---

## 🟡 PROBLEMAS MENORES / MEJORAS PENDIENTES

### 1. **Firebase Configuración Incompleta**
- **Ubicación:** `/src/lib/firebase.ts`
- **Estado:** ✅ Configuración básica presente
- **Falta:** 
  - Autenticación con Google Cloud (Service Account para backend)
  - Configuración de permisos en Firestore

### 2. **Dependencias de Genkit en package.json**
- **Identificado:**
  ```json
  "@genkit-ai/google-genai": "^1.22.0",
  "genkit": "^1.22.0"
  ```
- **Problema:** Se instalaron pero no se usan en el código actual
- **Recomendación:** Considerar remover si realmente no se necesitan

### 3. **Modelos de IA Limitados**
- **Ubicación:** `/src/lib/ai-models.ts`
- **Modelos Configurados:**
  - `gemini-1.5-pro` (default)
  - `gemini-1.5-flash`
  - `gemini-1.5-flash-8b`
  - `gemini-1.0-pro` (legacy)
- **Recomendación:** Actualizar a modelos más recientes (Gemini 2.0)

### 4. **Servicio de Ingestion SeparadoSin Integración Clara**
- **Ubicación:** `/ingestion-service/`
- **Problemas:**
  - ¿Cuándo se ejecuta?
  - ¿Cómo se dispara desde la app?
  - ¿Qué eventos de Cloud Storage lo activan?
- **Recomendación:** Documentar flujo de integración

---

## ✅ ASPECTOS BIEN CONFIGURADOS

1. **Firebase Autenticación:** Configuración correcta en cliente
2. **Estructura de Flows:** Bien organizado con tipos Zod
3. **Error Handling Básico:** Mensajes de error claros para el usuario
4. **Logging en Backend:** Configurado con niveles de severidad
5. **Docker Configuration:** Ambos servicios tienen Dockerfile válido

---

## 🛠️ PLAN DE ACCIÓN RECOMENDADO

### **INMEDIATO (Crítico - Seguridad)**
1. ⚠️ **Crear `.env.local`** con todas las variables necesarias
2. 🔐 **Mover endpoints a variables de entorno**
3. 🔐 **Agregar autenticación a endpoints IA** (usar Firebase Auth tokens)
4. 🔐 **Validar CORS** en Cloud Run services
5. 🔐 **No pasar api_key en HTTP** - usar solo en backend

### **CORTO PLAZO (Operacional)**
1. 🗑️ Remover `genkit.ts` si no se usa
2. 🗑️ Remover endpoint deprecado
3. 📝 Documentar flujo de ingestion service
4. 🧪 Crear tests para flows de IA
5. 📊 Agregar logging detallado en flows

### **MEDIANO PLAZO (Optimización)**
1. 🚀 Actualizar a Gemini 2.0 models
2. 📈 Implementar circuit breaker para fallbacks
3. 💰 Configurar alertas de cuota en Google Cloud
4. 🔄 Implementar retry logic mejorado
5. 📱 Agregar métricas de uso de IA

---

## 📊 ESTADO DE INTEGRACIONES

| Componente | Estado | Detalles |
|-----------|--------|----------|
| Firebase Auth | ✅ Activo | Configurado en `/src/lib/firebase.ts` |
| Firebase Firestore | ✅ Activo | Conectado, permisos via `firestore.rules` |
| Google Genkit | ❌ Deprecado | Dependencia instalada pero no usada |
| Cloud Run (IA) | ⚠️ Operativo | Funciona pero sin autenticación |
| Cloud Run (Ingestion) | ❓ Desconocido | Configurado pero flujo de integración indefinido |
| Vertex AI | ✅ Presente | Usado en ingestion service |
| Cloud SQL | ⚠️ Parcial | Solo ingestion service la usa |

---

## 📋 CHECKLIST DE CONFIGURACIÓN REQUERIDA

- [ ] Crear archivo `.env.local` con variables necesarias
- [ ] Implementar autenticación en endpoints IA
- [ ] Validar CORS en Cloud Run services
- [ ] Crear variable de entorno `CLOUD_RUN_ENDPOINT`
- [ ] Documentar las keys de API necesarias
- [ ] Crear Service Account en GCP para operaciones backend
- [ ] Configurar Cloud SQL (si se necesita)
- [ ] Documentar flujo de integración con ingestion service
- [ ] Agregar tests de integración con IA
- [ ] Configurar alertas/monitoring de cuota IA

---

## 🚀 SIGUIENTES PASOS SUGERIDOS

1. **Revisar variables de entorno necesarias** en cada servicio
2. **Implementar autenticación robusta** en endpoints de IA
3. **Documentar el flujo end-to-end** de generación de reportes
4. **Configurar alertas** de cuota en Google Cloud
5. **Crear guía de deployment** para producción

