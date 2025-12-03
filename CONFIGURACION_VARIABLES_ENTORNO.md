# 🔧 GUÍA DE CONFIGURACIÓN - Estructura de Variables de Entorno

Este archivo describe todas las variables de entorno necesarias para que la aplicación funcione correctamente con IA y Google Cloud.

---

## 📝 Archivo `.env.local` (CREAR EN LA RAÍZ DEL PROYECTO)

```bash
# ============================================================================
# FIREBASE CONFIGURATION (Cliente - Información Pública)
# ============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCDy-W8_3sB3WS8gVKZuzV_P6PdG1tBOUc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=actracker-master.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=actracker-master
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=actracker-master.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=660718374201
NEXT_PUBLIC_FIREBASE_APP_ID=1:660718374201:web:4889a6d15d8aee23ddace8

# ============================================================================
# IA Y CLOUD RUN CONFIGURATION
# ============================================================================
# URL del servicio de IA en Cloud Run
NEXT_PUBLIC_CLOUD_RUN_AI_ENDPOINT=https://backend-service-263108580734.us-central1.run.app

# Clave API de Google AI (si se usa Google AI API directamente - NO RECOMENDADO)
# Mejor: Pasar a través del backend y no exponer en cliente
NEXT_PUBLIC_GOOGLE_AI_API_KEY=

# ============================================================================
# GOOGLE CLOUD CONFIGURATION (Backend solamente)
# ============================================================================
# Proyecto GCP
GCP_PROJECT_ID=actracker-master

# Región
GCP_REGION=us-central1

# ============================================================================
# CLOUD SQL CONFIGURATION (Solo si se usa Cloud SQL)
# ============================================================================
# Nombre de conexión de Cloud SQL (instance connection name)
DB_INSTANCE_CONNECTION_NAME=academic-tracker-qeoxi:us-central1:ingestion-academic-db

# Credenciales de base de datos
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=academic_db

# ============================================================================
# VERTEX AI CONFIGURATION
# ============================================================================
# Modelo por defecto (opcional - se puede sobrescribir en runtime)
DEFAULT_AI_MODEL=gemini-1.5-pro

# ============================================================================
# SEGURIDAD - CLAVES DE API (CONFIDENCIAL)
# ============================================================================
# Esta clave NUNCA debe exponerse en el cliente
# Solo usar en el servidor Next.js o Cloud Run backend
GOOGLE_AI_API_KEY_BACKEND=your_backend_api_key_here

# Firebase Service Account (para operaciones de administrador en backend)
# Copiar el contenido completo del archivo JSON de la Service Account
FIREBASE_SERVICE_ACCOUNT_JSON={}

# ============================================================================
# DESARROLLO Y DEBUGGING
# ============================================================================
# Nivel de logging
LOG_LEVEL=info

# Modo de depuración (true/false)
DEBUG_MODE=false
```

---

## 🔐 VARIABLES QUE DEBE PROTEGER

**NUNCA commitear a Git:**
- `DB_PASSWORD`
- `GOOGLE_AI_API_KEY_BACKEND`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `NEXT_PUBLIC_FIREBASE_API_KEY` (técnicamente pública pero aún sensible)

**Use:** `.env.local` (agregado a `.gitignore`) o Vercel Environment Variables

---

## 📍 Dónde Obtener Cada Valor

### Firebase (Ya configurado en `firebase.ts`)
```typescript
// Los valores ya están en: /src/lib/firebase.ts
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCDy-W8_3sB3WS8gVKZuzV_P6PdG1tBOUc
// Copiar tal como aparecen
```

### Google Cloud Project ID
```bash
# En Google Cloud Console:
# 1. Ir a: https://console.cloud.google.com
# 2. Project selector (arriba a la izquierda)
# 3. Copiar el ID del proyecto
# Para este caso: actracker-master
```

### Cloud Run Endpoint
```bash
# En Cloud Console > Cloud Run:
# 1. Seleccionar el servicio "backend-service"
# 2. Copiar la URL que aparece en "Trigger"
# Ejemplo: https://backend-service-263108580734.us-central1.run.app
```

### Google AI API Key
```bash
# En Google Cloud Console:
# 1. Ir a: APIs & Services > Credentials
# 2. Create API Key (o usar existente)
# 3. Restringir a "Google AI API"
# 4. Copiar la clave
```

### Cloud SQL Connection Name
```bash
# En Cloud Console > Cloud SQL > tu instancia:
# 1. Buscar "Connection name"
# Formato: PROJECT_ID:REGION:INSTANCE_NAME
# Ejemplo: academic-tracker-qeoxi:us-central1:ingestion-academic-db
```

### Firebase Service Account
```bash
# En Firebase Console > Project Settings > Service Accounts:
# 1. Ir a pestaña "Service Accounts"
# 2. Click "Generate New Private Key"
# 3. Descarga el archivo JSON
# 4. El contenido completo va en FIREBASE_SERVICE_ACCOUNT_JSON
```

---

## ✅ Checklist de Configuración

```bash
# 1. Crear el archivo en la raíz
touch .env.local

# 2. Llenar todas las variables
# 3. Verificar que .env.local está en .gitignore
grep ".env.local" .gitignore

# 4. Verificar que el archivo no está commiteado
git status .env.local  # Debe mostrar "nothing to commit" o no aparecer

# 5. Reiniciar el servidor de desarrollo
npm run dev

# 6. Verificar en los logs que no hay errores de variables faltantes
```

---

## 🧪 Verificar Configuración en Tiempo de Ejecución

Agregar este código temporal en una página para testear:

```typescript
// Ejemplo en /src/app/debug/page.tsx (temporal)
export default function DebugPage() {
  return (
    <div>
      <h1>Configuración de Variables</h1>
      <pre>
        {JSON.stringify({
          firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          cloudRunEndpoint: process.env.NEXT_PUBLIC_CLOUD_RUN_AI_ENDPOINT,
          gcpProjectId: process.env.GCP_PROJECT_ID || '(backend-only)',
          hasBackendApiKey: !!process.env.GOOGLE_AI_API_KEY_BACKEND,
          hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        }, null, 2)}
      </pre>
    </div>
  );
}
```

---

## 🚀 Para Despliegue en Vercel

1. **En Vercel Dashboard:**
   - Ir a Project Settings > Environment Variables
   - Agregar cada variable manualmente
   - Usar el mismo nombre que en `.env.local`

2. **Para variables NEXT_PUBLIC_:**
   - Aparecerán en el cliente (visible en browser)
   - OK para credenciales no-sensibles

3. **Para variables privadas:**
   - No incluir `NEXT_PUBLIC_` prefix
   - Solo accesibles en servidor

---

## 🔒 Seguridad en Producción

**Recomendaciones:**
1. ✅ Usar Google Cloud Secret Manager en lugar de variables hardcodeadas
2. ✅ Implementar Cloud Armor para proteger Cloud Run endpoints
3. ✅ Agregar autenticación (Firebase Auth) a todos los endpoints
4. ✅ Validar CORS estrictamente
5. ✅ Usar Service Accounts con permisos mínimos
6. ✅ Habilitar logging y monitoring en Cloud Run
7. ✅ Rotar claves API regularmente

