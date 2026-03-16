## 🎯 GUÍA COMPLETA DE DESPLIEGUE - AcTR IA Backend v2.3

**Versión:** 2.3 (Fail-Loud Initialization)  
**Fecha:** 2025-12-07  
**Estado:** ✅ LISTO PARA PRODUCCIÓN

---

## 📋 Checklist Pre-Despliegue

- [x] `main.py` actualizado a v2.3 con falla ruidosa
- [x] Validación de API key en formato `AIza...`
- [x] Health check retorna 200/500 según estado
- [x] Dockerfile con `EXPOSE 8080` y Gunicorn `0.0.0.0:8080`
- [x] `requirements.txt` sin `google-generativeai` (usa REST API)
- [x] Logging mejorado con `flush=True`
- [x] Endpoints verifican `model_initialized`

---

## 🚀 PASO 1: Verificación Pre-Despliegue

```bash
bash verify-before-deploy.sh
```

**Esperado:** ✅ Todas las verificaciones pasaron

---

## 🔑 PASO 2: Obtener tu API Key de Google AI

1. Ve a: https://aistudio.google.com/app/apikey
2. Copia tu clave (debe empezar con `AIza`)
3. Guárdala en un lugar seguro

---

## 📡 PASO 3: Ejecutar Despliegue

Reemplaza `YOUR_API_KEY` con tu clave real:

```bash
gcloud run deploy ai-report-service \
  --source=cloud-run-ai-service-backed \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_AI_API_KEY=YOUR_API_KEY,GCP_PROJECT_ID=academic-tracker-qeoxi" \
  --service-account=cloud-run-ai-invoker@academic-tracker-qeoxi.iam.gserviceaccount.com \
  --project=academic-tracker-qeoxi
```

**El proceso:**
1. Cloud Build compila la imagen Docker
2. Imagen se sube a Container Registry
3. Cloud Run crea el servicio
4. main.py inicia y valida la API key
5. Si todo está bien → 🟢 Service Ready
6. Si hay error → 🔴 Container Exited (logs mostrarán el error)

---

## 📊 PASO 4: Monitorear Logs (CRÍTICO)

Mientras se despliega o después:

```bash
# Ver logs en tiempo real
gcloud run logs read ai-report-service \
  --region=us-central1 \
  --limit=50 \
  --follow
```

**Qué buscar:**

✅ **Si TODO está bien:**
```
GOOGLE_AI_API_KEY loaded from environment
API key validated. Key prefix: AIza...
Model initialization check passed. Application ready.
Running on 0.0.0.0:8080
```

❌ **Si hay error de API Key:**
```
CRITICAL ERROR: GOOGLE_AI_API_KEY environment variable is not set!
```

❌ **Si hay error de formato:**
```
CRITICAL ERROR: Invalid API key format. Expected to start with 'AIza', got: ...
```

---

## ✅ PASO 5: Verificar Servicio Desplegado

```bash
# Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe ai-report-service \
  --region=us-central1 \
  --format='value(status.url)')

# Hacer health check
curl "$SERVICE_URL/"
```

**Respuesta esperada (200 OK):**
```json
{
  "service": "AcTR-IA-Backend",
  "status": "healthy",
  "version": "2.2",
  "model": "gemini-1.0-pro",
  "model_initialized": true,
  "api_key_configured": true,
  "base_url": "https://generativelanguage.googleapis.com/v1beta/models"
}
```

---

## 🧪 PASO 6: Probar Endpoints

### Test 1: Generar Reporte de Grupo

```bash
SERVICE_URL="https://tu-servicio.run.app"

curl -X POST "$SERVICE_URL/generate-group-report" \
  -H "Content-Type: application/json" \
  -d '{
    "group_name": "Matemáticas 101",
    "partial": "Primer Parcial",
    "stats": {
      "totalStudents": 30,
      "approvedCount": 24,
      "failedCount": 6,
      "groupAverage": 78.5,
      "attendanceRate": 92,
      "atRiskStudentCount": 3
    }
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "report": "Análisis detallado del grupo...",
  "group": "Matemáticas 101",
  "partial": "Primer Parcial"
}
```

### Test 2: Generar Feedback de Estudiante

```bash
curl -X POST "$SERVICE_URL/generate-student-feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Juan Pérez",
    "subject": "Matemáticas",
    "grades": [85, 78, 92],
    "attendance": 95,
    "observations": "Estudiante dedicado"
  }'
```

---

## 🔧 Troubleshooting

### Problema: "Container exited with code 1"

**Causa:** Error en inicialización  
**Solución:**
```bash
gcloud run logs read ai-report-service --region=us-central1 --limit=100
# Busca "CRITICAL ERROR" en los logs
```

### Problema: "GOOGLE_AI_API_KEY environment variable is not set"

**Causa:** No configuraste la variable de entorno  
**Solución:**
1. Verifica que el comando tiene `--set-env-vars="GOOGLE_AI_API_KEY=YOUR_API_KEY"`
2. Asegúrate de reemplazar `YOUR_API_KEY` con tu clave real
3. Re-despliega

### Problema: "Invalid API key format"

**Causa:** Tu API key no es válida  
**Solución:**
1. Genera una nueva en https://aistudio.google.com/app/apikey
2. Verifica que empiece con `AIza`
3. Re-despliega con la nueva clave

### Problema: Health check retorna 500

**Causa:** El servicio no está listo  
**Solución:**
```bash
# Espera 30-60 segundos después del despliegue
# Luego intenta de nuevo
curl https://tu-servicio.run.app/
```

---

## 📈 Monitoreo en Producción

```bash
# Ver métricas
gcloud run services describe ai-report-service \
  --region=us-central1

# Ver logs con filtro
gcloud run logs read ai-report-service \
  --region=us-central1 \
  --filter='severity="ERROR"'

# Ver solo 10 últimos logs
gcloud run logs read ai-report-service \
  --region=us-central1 \
  --limit=10
```

---

## 📚 Documentos de Referencia

- `MAIN_PY_CHANGES_V2_3.md` - Cambios específicos en main.py
- `DEPLOYMENT_COMMAND_FINAL.md` - Comando de despliegue
- `DEPLOYMENT_VERIFICATION_FINAL.md` - Verificación de configuración

---

## ✨ Resumen de Cambios v2.3

| Componente | Cambio | Beneficio |
|---|---|---|
| **Initialization** | `sys.exit(1)` si error | Falla visible inmediatamente |
| **Logging** | `flush=True` | Logs aparecen en Cloud Run |
| **Validation** | API key `AIza...` | Detecta errores de formato |
| **Health Check** | 200 o 500 | Estado honesto del servicio |
| **Endpoints** | Verifican estado | No llamas si no está listo |

---

## 🎯 Próximas Acciones

1. ✅ Obtener API key
2. ✅ Ejecutar `verify-before-deploy.sh`
3. ✅ Desplegar con comando `gcloud run deploy...`
4. ✅ Monitorear logs
5. ✅ Probar health check
6. ✅ Probar endpoints

---

**¿Preguntas o problemas?** Revisa los logs con:
```bash
gcloud run logs read ai-report-service --region=us-central1 --limit=100
```

**Ready para producción** 🚀
