# 🔑 GUÍA: Configuración de Claves API

Esta guía te ayudará a obtener y configurar todas las claves API necesarias para que la aplicación funcione correctamente.

---

## 1️⃣ Google Cloud Project Setup (CRÍTICO)

### Paso 1: Crear un Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Click en el selector de proyectos (arriba a la izquierda)
3. Click en **"NEW PROJECT"**
4. Nombre: `actracker-master` (o similar)
5. Click en **"CREATE"**
6. Espera a que se cree (puede tomar 1-2 minutos)

### Paso 2: Habilitar APIs Necesarias

1. En Google Cloud Console, ve a **APIs & Services > Library**
2. Busca y habilita estas APIs:
   - **Vertex AI API**
   - **Cloud Run API**
   - **Cloud Logging API**

Para cada una:
1. Click en el nombre de la API
2. Click en **"ENABLE"**
3. Espera a que se habilite

### Paso 3: Crear Credenciales (Service Account)

1. Ve a **APIs & Services > Credentials**
2. Click en **"+ CREATE CREDENTIALS"**
3. Selecciona **"Service Account"**
4. Rellena:
   - **Service Account Name:** `actr-backend`
   - **Service Account ID:** (se llena automáticamente)
   - Click **"CREATE AND CONTINUE"**

5. En "Grant this service account access to project":
   - Click en el campo "Select a role"
   - Busca y selecciona: **"Vertex AI Service Agent"**
   - Click **"CONTINUE"**

6. Click **"DONE"**

### Paso 4: Crear y Descargar Clave Privada

1. Ve a **APIs & Services > Service Accounts**
2. Click en el service account que creaste (`actr-backend`)
3. Ve a la pestaña **"KEYS"**
4. Click en **"ADD KEY"** > **"Create new key"**
5. Selecciona **"JSON"**
6. Click **"CREATE"**
7. Se descargará automáticamente un archivo JSON

⚠️ **IMPORTANTE:** Guarda este archivo en un lugar seguro. Lo usarás más adelante.

---

## 2️⃣ Obtener el Project ID

1. En Google Cloud Console, selecciona tu proyecto
2. Ve a **Configuración del Proyecto** (icono de engranaje)
3. Copia el **Project ID** (ej: `actracker-master`)

---

## 3️⃣ Configurar Variables de Entorno Localmente

### En tu máquina local (desarrollo):

1. En la raíz del proyecto, crea/edita `.env.local`:

```bash
# Google Cloud Configuration
NEXT_PUBLIC_CLOUD_RUN_ENDPOINT=https://backend-service-XXXXX.us-central1.run.app
GCP_PROJECT_ID=actracker-master
GCP_REGION=us-central1

# Firebase Configuration (ya existe)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCDy-W8_3sB3WS8gVKZuzV_P6PdG1tBOUc
NEXT_PUBLIC_FIREBASE_PROJECT_ID=actracker-master

# Backend Service Account (opcional - para testing)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**Nota:** Reemplaza `XXXXX` con tu número de proyecto de Cloud Run

---

## 4️⃣ Autenticarse con Google Cloud (gcloud CLI)

### En GitHub Codespaces:

```bash
# 1. Instalar Google Cloud SDK (si no está instalado)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# 2. Autenticarse
gcloud auth login

# 3. Configurar proyecto
gcloud config set project actracker-master

# 4. Ver credenciales configuradas
gcloud auth list
gcloud config list
```

---

## 5️⃣ Verificar que Todo Funciona

### Test 1: Verificar autenticación gcloud
```bash
gcloud auth list
# Debería mostrar tu usuario con ✓
```

### Test 2: Verificar conexión a Cloud Run
```bash
curl https://backend-service-XXXXX.us-central1.run.app/
# Debería retornar JSON con status "healthy"
```

### Test 3: Verificar variables de entorno
```bash
echo $NEXT_PUBLIC_CLOUD_RUN_ENDPOINT
echo $GCP_PROJECT_ID
# Ambas deberían mostrar valores
```

### Test 4: Ejecutar tests de integración
```bash
node test-ai-integration.js
```

---

## 6️⃣ Configurar en Vercel (Producción)

Una vez que todo funciona localmente:

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `AcTR-app`
3. Ve a **Settings > Environment Variables**
4. Agrega estas variables:

```
NEXT_PUBLIC_CLOUD_RUN_ENDPOINT = https://backend-service-XXXXX.us-central1.run.app
GCP_PROJECT_ID = actracker-master
GCP_REGION = us-central1
GOOGLE_APPLICATION_CREDENTIALS = /path/to/credentials.json
```

5. Click en **"Save"**
6. Redeploy el proyecto:
   - Ve a **Deployments**
   - Click en el último deployment
   - Click en **"Redeploy"**

---

## 7️⃣ Solucionar Problemas

### "gcloud command not found"
```bash
# Instalar Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### "Project not set"
```bash
gcloud config set project actracker-master
```

### "Permission denied"
- Ve a Google Cloud Console
- Ve a **IAM & Admin > IAM**
- Asegúrate de que tu usuario tiene rol **Editor** o superior

### "Vertex AI not enabled"
- Ve a **APIs & Services > Library**
- Busca "Vertex AI"
- Click en **"ENABLE"**

---

## 📋 Resumen de Claves Necesarias

| Clave | Ubicación | Tipo | Necesaria |
|-------|-----------|------|-----------|
| `NEXT_PUBLIC_CLOUD_RUN_ENDPOINT` | Google Cloud Console > Cloud Run | URL | ✅ Sí |
| `GCP_PROJECT_ID` | Google Cloud Console > Configuración | String | ✅ Sí |
| `GOOGLE_APPLICATION_CREDENTIALS` | Descargado en Paso 4 | Ruta archivo | ✅ Sí |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Ya configurado en `firebase.ts` | String | ✅ Sí |

---

## 🚀 Próximos Pasos

1. ✅ Obtener claves API
2. ✅ Configurar `.env.local`
3. ✅ Ejecutar `npm run dev`
4. ✅ Probar en `http://localhost:3000/debug/test-ai`
5. ✅ Si todo funciona, configurar en Vercel
6. ✅ Redeploy en Vercel

---

## ❓ ¿Necesitas Ayuda?

Si algo no funciona:

1. Verifica que todas las APIs están habilitadas
2. Verifica que el service account tiene permisos suficientes
3. Verifica que las variables de entorno están configuradas correctamente
4. Revisa los logs:
   ```bash
   gcloud run logs read backend-service --region=us-central1
   ```

