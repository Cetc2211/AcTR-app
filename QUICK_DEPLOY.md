## ⚡ INSTRUCCIONES RÁPIDAS DE DESPLIEGUE

**Version:** 2.3  
**Tiempo estimado:** 5-10 minutos

---

## 📋 Antes de Empezar

1. ✅ Tener acceso a Google Cloud Console
2. ✅ Tener gcloud CLI instalado y configurado
3. ✅ Tener tu API key de Google AI (de https://aistudio.google.com/app/apikey)

---

## 🚀 PASOS

### Paso 1: Obtener API Key (1 min)
```
1. Ve a: https://aistudio.google.com/app/apikey
2. Copia tu clave (debe empezar con "AIza")
3. Guárdala en un lugar seguro
```

### Paso 2: Verificación Pre-Despliegue (1 min)
```bash
cd /workspaces/AcTR-app
bash verify-before-deploy.sh
```
**Esperado:** ✅ Todas las verificaciones pasaron

### Paso 3: Desplegar (5-7 min)
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

### Paso 4: Esperar Despliegue (2-3 min)
El comando te mostrará el progreso. Cuando termine, verás:
```
Service [ai-report-service] revision [ai-report-service-xyz] has been deployed...
Service URL: https://ai-report-service-xyz.run.app
```

### Paso 5: Monitorear Logs (opcional pero recomendado)
En otra terminal:
```bash
gcloud run logs read ai-report-service \
  --region=us-central1 \
  --limit=50 \
  --follow
```

### Paso 6: Verificar que Funciona (1 min)
```bash
# Obtener URL
SERVICE_URL=$(gcloud run services describe ai-report-service \
  --region=us-central1 \
  --format='value(status.url)')

# Verificar health
curl "$SERVICE_URL/"
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "version": "2.2",
  "model_initialized": true
}
```

---

## ✅ ¡Listo!

Tu servicio IA está desplegado y funcionando.

---

## 🔗 URLs Importantes

- **Google AI API Key:** https://aistudio.google.com/app/apikey
- **Cloud Console:** https://console.cloud.google.com
- **Cloud Run Services:** https://console.cloud.google.com/run

---

## ❓ Si Algo Falla

### Error: "Container exited with code 1"
```bash
# Ver logs detallados
gcloud run logs read ai-report-service --region=us-central1 --limit=100
# Busca "CRITICAL ERROR" para ver el problema
```

### Error: "GOOGLE_AI_API_KEY environment variable is not set!"
- Verifica que pusiste `--set-env-vars="GOOGLE_AI_API_KEY=YOUR_API_KEY"` en el comando
- Asegúrate de reemplazar `YOUR_API_KEY` con tu clave real

### Health Check retorna 500
- Espera 30-60 segundos después del despliegue
- El servicio aún puede estar inicializando

---

## 📚 Documentos de Referencia

- `DEPLOYMENT_COMPLETE_GUIDE.md` - Guía detallada
- `SUMMARY_CHANGES_V2_3.md` - Resumen de cambios
- `README_DEPLOYMENT_V2_3.md` - Visión general

---

**¡Listo para desplegar!** 🚀
