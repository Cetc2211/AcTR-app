## 🚀 COMANDO DE DESPLIEGUE - VERSIÓN FINAL

**Versión:** 2.3 (Fail-Loud Initialization)  
**Fecha:** 2025-12-07  
**Status:** Listo para despliegue

---

## ⚠️ IMPORTANTE: Antes de Ejecutar

La API key ya no debe pasarse en el comando. Debe existir previamente en Google Cloud Secret Manager con el nombre `GOOGLE_AI_API_KEY`.

---

## 🎯 Comando de Despliegue Simplificado

```bash
gcloud run deploy ai-report-service \
  --source=cloud-run-ai-service-backed \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=academic-tracker-qeoxi" \
  --set-secrets="GOOGLE_AI_API_KEY=GOOGLE_AI_API_KEY:latest" \
  --service-account=cloud-run-ai-invoker@academic-tracker-qeoxi.iam.gserviceaccount.com \
  --project=academic-tracker-qeoxi
```

---

## 📋 Cambios en esta Versión (2.3)

✅ **Fail-Loud Initialization**
- La aplicación Flask ahora **falla inmediatamente** si `GOOGLE_AI_API_KEY` no está configurada
- Esto hace que los errores sean **visibles en Cloud Run logs** en lugar de fallar silenciosamente
- Usa `sys.exit(1)` para forzar la salida del contenedor

✅ **Validación de API Key**
- Verifica que la API key comience con `AIza` (formato estándar)
- Registra el prefijo de la key en los logs para validación

✅ **Health Check Mejorado**
- Retorna `200 OK` si el modelo está inicializado
- Retorna `500` si hay problemas
- Campo `model_initialized` indica el estado real

✅ **Logging Mejorado**
- Usa `flush=True` para asegurar que los logs aparezcan en Cloud Run
- Niveles de log apropriados (INFO, ERROR)
- Timestamps en todos los mensajes

---

## 📊 Qué Sucede Durante el Despliegue

1. **Cloud Build** compila el Dockerfile
2. **Dockerfile** instala dependencias de `requirements.txt`
3. **main.py** inicia y valida:
   - ✅ Variable de entorno `GOOGLE_AI_API_KEY`
   - ✅ Formato de la API key
   - ❌ Si falla algo → `sys.exit(1)` → Container exits → Error visible en logs
4. **Cloud Run** inicia el servicio
5. **Health Check** responde en `GET /`

---

## 🔍 Monitorear los Logs

Una vez iniciado el despliegue:

```bash
# Seguir logs en tiempo real
gcloud run logs read ai-report-service \
  --region=us-central1 \
  --limit=50 \
  --follow

# O simplemente los últimos 100 logs
gcloud run logs read ai-report-service \
  --region=us-central1 \
  --limit=100
```

---

## ✨ Diferencias vs Versión Anterior

| Aspecto | v2.2 | v2.3 |
|---|---|---|
| **Init Failure** | Silenciosa | Ruidosa (sys.exit(1)) |
| **Logging** | Sin flush | Con flush=True |
| **Health Check** | Solo 200 | 200 o 500 según estado |
| **API Key Validation** | No | Sí (formato AIza...) |
| **Error Visibility** | Media | Alta |

---

## 🎯 Próximos Pasos

1. ✅ Copiar tu API key de Google AI
2. ✅ Reemplazar `YOUR_API_KEY` en el comando
3. ✅ Ejecutar comando de despliegue
4. ✅ Monitorear logs para ver inicialización
5. ✅ Verificar health check: `curl https://<service-url>/`
6. ✅ Probar endpoints de generación

---

**¿Necesitas ayuda?** Contacta con soporte técnico.
