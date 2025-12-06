# 🔧 GUÍA: Configurar Variables de Entorno en Cloud Run

El error `"Error de configuración: No se pudo obtener la clave API"` significa que el servicio de Cloud Run no tiene las variables de entorno configuradas correctamente.

## 🚀 Pasos para Configurar Cloud Run

### 1. Obtener tu Google AI API Key

1. Ve a [Google AI Studio](https://aistudio.google.com/apikey)
2. Click en "Get API Key"
3. Selecciona tu proyecto: `actracker-master`
4. Click en "Create API Key"
5. Copia la clave (será algo como `AIzaSy...`)

### 2. Configurar Variables en Cloud Run

#### Opción A: Desde Google Cloud Console (Recomendado)

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto: `actracker-master`
3. Ve a **Cloud Run** > **backend-service**
4. Click en **"EDIT & DEPLOY NEW REVISION"**
5. En la sección **"sRuntime settings"**, expande **"Runtime, build, connections and security"**
6. Bajo **"Runtime environment variables"**, agrega:

| Variable | Valor |
|----------|-------|
| `GCP_PROJECT_ID` | `actracker-master` |
| `GCP_REGION` | `us-central1` |
| `GOOGLE_AI_API_KEY` | `AIzaSy...` (tu clave API) |

7. Click en **"DEPLOY"**

#### Opción B: Desde Terminal (gcloud CLI)

```bash
# Primero, configura tu proyecto
gcloud config set project actracker-master

# Luego, redeploy con las variables de entorno
gcloud run deploy backend-service \
  --source=cloud-run-ai-service-backed \
  --region=us-central1 \
  --set-env-vars="GCP_PROJECT_ID=actracker-master,GCP_REGION=us-central1,GOOGLE_AI_API_KEY=AIzaSy..."
```

**Reemplaza `AIzaSy...` con tu clave API real**

### 3. Verificar que Funciona

1. Ve a Cloud Run > backend-service
2. Click en la URL del servicio
3. Debería abrirse una página con JSON: `{"status": "healthy", ...}`
4. Si ves un error, revisa los logs:

```bash
gcloud run logs read backend-service --region=us-central1 --limit=20
```

### 4. Probar la Aplicación

Una vez configurado:

1. Vuelve a la app (recarga la página)
2. Ve a **Reportes** > Selecciona un grupo
3. Click en **"Generar Análisis"**
4. Debería funcionar sin errores

---

## ❓ Solución de Problemas

### "Error 500: No se pudo obtener la clave API"
**Causa:** Variable `GOOGLE_AI_API_KEY` no está configurada
**Solución:** 
- Verifica que agregaste la variable en Cloud Run
- Asegúrate de que no tiene espacios extra
- Redeploy el servicio

### "Error: Unauthorized"
**Causa:** La clave API es inválida o expirada
**Solución:**
- Genera una nueva clave en [Google AI Studio](https://aistudio.google.com/apikey)
- Actualiza la variable en Cloud Run

### "Error: Quota exceeded"
**Causa:** Excediste el límite de la API
**Solución:**
- Ve a [Google Cloud Console](https://console.cloud.google.com)
- En Vertex AI > Cuotas, verifica los límites
- Espera a que se resetee (generalmente cada 24 horas)

---

## 📋 Variables Necesarias en Cloud Run

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `GCP_PROJECT_ID` | ID de tu proyecto GCP | `actracker-master` |
| `GCP_REGION` | Región de Cloud Run | `us-central1` |
| `GOOGLE_AI_API_KEY` | Clave API de Google AI | `AIzaSyDummyKeyExample...` |

---

## 🔐 Seguridad

⚠️ **IMPORTANTE:**
- Nunca compartas tu `GOOGLE_AI_API_KEY` públicamente
- No la guardes en repositorios de código
- Usa Secret Manager de Google Cloud para mayor seguridad (recomendado para producción)

Para usar Secret Manager:
```bash
# 1. Crear el secreto
echo -n "AIzaSy..." | gcloud secrets create google-ai-api-key --data-file=-

# 2. Referenciar en Cloud Run
gcloud run deploy backend-service \
  --set-env-vars="GOOGLE_AI_API_KEY_SECRET=google-ai-api-key"
```

---

## ✅ Verificación Final

Una vez configurado, ejecuta en tu terminal:

```bash
# Verificar que Cloud Run tiene las variables
gcloud run services describe backend-service --region=us-central1

# Probar health check
curl https://backend-service-XXXXX.us-central1.run.app/

# Debería responder con:
# {"status": "healthy", "service": "AcTR-IA-Backend", ...}
```

Si todo funciona, ¡la aplicación debería estar lista! 🎉

