# ⚠️ IMPORTANTE: Pasos para Configurar la Clave API en Cloud Run

El error que viste es porque:
1. Usaste `AIzaSy...` (placeholder) en lugar de tu clave real
2. El proyecto es `academic-tracker-qeoxi`, no `actracker-master`

## 📝 Paso 1: Obtener tu Clave API Real

### Opción A: Google AI Studio (Recomendado - Más Fácil)

1. Ve a: https://aistudio.google.com/apikey
2. Si no estás logueado, haz login con tu cuenta Google
3. Verás un botón azul **"Get API Key"** o tus claves existentes
4. Si no tienes ninguna, click en **"Create API Key"**
5. Selecciona proyecto: **academic-tracker-qeoxi**
6. Click en **"Create API Key"**
7. **Copia la clave completa** (algo como: `AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

⚠️ **IMPORTANTE:** Guarda esta clave en un lugar seguro. La necesitarás en el siguiente paso.

### Opción B: Google Cloud Console

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Verifica que estés en proyecto: `academic-tracker-qeoxi`
3. Click en **"+ CREATE CREDENTIALS"** > **"API Key"**
4. Se creará una clave automáticamente
5. Cópiala (aparecerá en una ventana emergente)

---

## 🚀 Paso 2: Configurar en Cloud Run

### Opción A: Desde Google Cloud Console (MÁS FÁCIL - Recomendado)

1. Ve a: https://console.cloud.google.com/run
2. Verifica que estés en proyecto: `academic-tracker-qeoxi`
3. Haz click en el servicio: **backend-service**
4. En la parte superior, haz click en **"EDIT & DEPLOY NEW REVISION"**
5. Desplázate hacia abajo hasta **"Runtime settings"**
6. Expande la sección de **"Runtime environment variables"**
7. Haz click en **"ADD VARIABLE"**
8. Rellena:
   - **Name:** `GOOGLE_AI_API_KEY`
   - **Value:** `AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx` (tu clave completa)
9. Haz click en **"DEPLOY"**
10. Espera a que termine (puede tomar 2-3 minutos)

### Opción B: Desde Terminal (Si `gcloud` está funcionando)

```bash
# 1. Primero, asegúrate de estar en el proyecto correcto
gcloud config set project academic-tracker-qeoxi

# 2. Obtén tu clave API y guárdala en una variable
# (Reemplaza AIzaSy... con tu clave REAL)
export API_KEY="AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 3. Redeploy con la variable
gcloud run deploy backend-service \
  --source=cloud-run-ai-service-backed \
  --region=us-central1 \
  --set-env-vars="GOOGLE_AI_API_KEY=${API_KEY}"
```

---

## ✅ Verificar que Funcionó

### Verificación 1: Desde Google Cloud Console

1. Ve a Cloud Run > backend-service
2. Click en la URL del servicio (algo como: `https://backend-service-xxxxx.us-central1.run.app`)
3. Debería abrirse una página con JSON:
   ```json
   {
     "status": "healthy",
     "service": "AcTR-IA-Backend",
     "timestamp": "2025-12-03T...",
     "version": "1.0"
   }
   ```

### Verificación 2: Desde Terminal

```bash
# Reemplaza la URL con tu URL real de Cloud Run
curl https://backend-service-xxxxx.us-central1.run.app/
```

Debería responder con JSON similar al anterior.

---

## 🧪 Probar que la IA Funciona

Una vez configurado:

1. Vuelve a la aplicación y **recarga la página** (Ctrl+R o Cmd+R)
2. Ve a **Reportes** (Reports)
3. Selecciona un grupo y un parcial
4. Haz click en **"✨ Generar Análisis"**
5. Debería generar un análisis en 5-10 segundos (sin errores)

---

## ❌ Si Algo Sigue Fallando

### Problema: "Build failed"
```
gcloud run deploy backend-service \
  --source=cloud-run-ai-service-backed \
  --region=us-central1 \
  --set-env-vars="GOOGLE_AI_API_KEY=AIzaSy..."
```

**Soluciones:**
1. ✅ Asegúrate de usar tu clave REAL (no el placeholder `AIzaSy...`)
2. ✅ Verifica que estés en el proyecto correcto: `academic-tracker-qeoxi`
3. ✅ Si `gcloud` no funciona, usa Google Cloud Console (Opción A arriba)

### Problema: "Error 500: No se pudo obtener la clave API"
1. Verifica en Google Cloud Console > Cloud Run > backend-service
2. Revisa que la variable `GOOGLE_AI_API_KEY` está configurada
3. Haz click en **"EDIT & DEPLOY NEW REVISION"** nuevamente para verificar
4. Si falta, agrégala (paso 7-8 de la Opción A arriba)

### Problema: "Error: Unauthorized"
La clave API es inválida:
1. Ve a https://aistudio.google.com/apikey
2. Genera una NUEVA clave
3. Cópiala completa (sin espacios)
4. Actualiza en Cloud Run > backend-service

---

## 🔐 Notas de Seguridad

- ⚠️ **NUNCA** compartas tu `GOOGLE_AI_API_KEY` públicamente
- ⚠️ **NUNCA** la guardes en GitHub o repositorios de código
- ✅ Solo guárdala en Cloud Run como variable de entorno
- ✅ Para máxima seguridad, usa Google Cloud Secret Manager (para producción)

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:

1. **Verifica el proyecto:** `gcloud config get-value project` (debería ser `academic-tracker-qeoxi`)
2. **Verifica los logs:** Ve a Google Cloud Console > Cloud Run > backend-service > Logs
3. **Revisa las variables:** Google Cloud Console > Cloud Run > backend-service > Edit & Deploy
4. **Prueba manualmente:** Abre la URL del servicio en el navegador

