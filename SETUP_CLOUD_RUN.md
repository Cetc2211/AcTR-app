# 🚀 GUÍA RÁPIDA DE CONFIGURACIÓN - Cloud Run e IA

## ✅ Cambios Implementados

### 1. **Backend Python - Health Check**
- ✅ Agregado endpoint GET `/` que retorna estado del servicio
- ✅ Agregado `datetime` import para timestamps

**Ubicación:** `/cloud-run-ai-service-backed/main.py`

```python
@app.route('/', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "AcTR-IA-Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0"
    }), 200
```

---

### 2. **Variables de Entorno - `.env.local`**
- ✅ Creado archivo `.env.local` con todas las variables necesarias
- ✅ Actualizado `.gitignore` para proteger archivos sensibles

**Ubicación:** `/workspaces/AcTR-app/.env.local`

```
NEXT_PUBLIC_CLOUD_RUN_ENDPOINT=https://backend-service-263108580734.us-central1.run.app
```

---

### 3. **Frontend - Referencias de URL**
- ✅ `/src/ai/flows/generate-student-feedback-flow.ts` - Usa variable de entorno
- ✅ `/src/ai/flows/generate-group-report-analysis-flow.ts` - Usa variable de entorno
- ✅ `/src/app/settings/actions.ts` - Usa variable de entorno

**Antes:**
```typescript
const response = await fetch('https://backend-service-263108580734.us-central1.run.app/generate-report', {
```

**Después:**
```typescript
const endpoint = process.env.NEXT_PUBLIC_CLOUD_RUN_ENDPOINT || 'https://backend-service-263108580734.us-central1.run.app';
const response = await fetch(`${endpoint}/generate-report`, {
```

---

## 🧪 Cómo Verificar que Funciona

### Test 1: Connectivity Check
```bash
# Verificar que el health check funciona
curl https://backend-service-263108580734.us-central1.run.app/

# Respuesta esperada:
{
  "status": "healthy",
  "service": "AcTR-IA-Backend",
  "timestamp": "2025-12-03T...",
  "version": "1.0"
}
```

### Test 2: Generar Informe de Estudiante
1. Ir a **Estudiantes** > Seleccionar un estudiante
2. Click en botón **"Generar Retroalimentación con IA"** (botón con ✨)
3. Debería generar un análisis en segundos

### Test 3: Generar Análisis de Grupo
1. Ir a **Reportes** > Seleccionar un grupo y parcial
2. Click en **"Generar Análisis"** (botón con ✨)
3. Debería generar un análisis en segundos

---

## 🔍 Troubleshooting

### Problema: "El servicio de ía no está respondiendo"
**Causas posibles:**
1. Cloud Run service está down
2. URL en `.env.local` es incorrecta
3. Network error (firewall, CORS)

**Solución:**
```bash
# Verificar salud del servicio
curl -X GET https://backend-service-263108580734.us-central1.run.app/

# Verificar variable de entorno en el navegador
# Abre la consola (F12) > Network > busca requests a la URL
# Verifica que la URL sea correcta
```

### Problema: "Faltan datos"
**Causas posibles:**
1. No hay calificaciones para el parcial
2. El parcial seleccionado no tiene información
3. Estudiante no tiene criterios de evaluación

**Solución:**
1. Asegúrate de que hay calificaciones registradas
2. Selecciona un parcial con datos
3. Verifica que hay criterios en el grupo

---

## 📝 Próximos Pasos

### Para Mayor Seguridad:
1. [ ] Agregar autenticación Firebase a los endpoints IA
2. [ ] Agregar Rate Limiting en Cloud Run
3. [ ] Validar CORS adecuadamente
4. [ ] Agregar logging de auditoría

### Para Mejor Rendimiento:
1. [ ] Agregar caching de respuestas
2. [ ] Implementar request deduplication
3. [ ] Agregar circuit breaker para fallbacks
4. [ ] Configurar alertas de cuota IA

---

## 📊 Estructura de Arquitectura

```
┌─────────────────────────────────────┐
│   Next.js App (Frontend + Backend)  │
│  (/src/ai/flows/*.ts)               │
│  (.env.local)                        │
└─────────────────┬───────────────────┘
                  │
                  │ HTTP/REST
                  │
        ┌─────────▼──────────┐
        │  Cloud Run Service │
        │ (Python Flask)     │
        │ /generate-report   │
        │ /generate-group... │
        │ /health (GET)      │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────┐
        │  Vertex AI         │
        │  (Gemini 1.5 Pro)  │
        └────────────────────┘
```

---

## 🎯 Flujo de Generación de Informes

```
1. Usuario hace click en "Generar Retroalimentación"
   ↓
2. Cliente valida datos (calificaciones, asistencia)
   ↓
3. Cliente envía request a Cloud Run
   POST /generate-report
   {
     "student_name": "Juan",
     "final_grade": 85.5,
     "criteria": [...],
     ...
   }
   ↓
4. Cloud Run (backend) recibe request
   ↓
5. Backend usa Vertex AI para generar análisis
   ↓
6. Backend retorna texto generado
   ↓
7. Cliente muestra análisis al usuario
   ↓
8. Usuario puede guardar o regenerar
```

---

## 🔐 Variables Protegidas

**Nunca commitear:**
- `.env.local` (privado)
- `GOOGLE_AI_API_KEY_BACKEND` (si se usa)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (si se usa)

**El archivo `.env.local` está en `.gitignore`** ✅

