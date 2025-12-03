# 🔐 RECOMENDACIONES DE SEGURIDAD - IA y Google Cloud

Análisis detallado de vulnerabilidades identificadas y soluciones recomendadas.

---

## 🚨 VULNERABILIDADES CRÍTICAS

### 1. **Endpoints sin Autenticación (CRÍTICO - Riesgo Financiero)**

**Ubicación:** `/cloud-run-ai-service-backed/main.py`  
**Rutas Afectadas:** 
- `POST /generate-report`
- `POST /generate-group-report`
- `POST /ingest-event` (si aplica)

**Problema:**
```python
@app.route('/generate-report', methods=['POST'])
def generate_report():
    # ❌ NO hay validación de identidad del llamador
    # Cualquiera en internet puede llamar este endpoint infinitas veces
```

**Riesgo:**
- 💰 Abuso de API - costos ilimitados
- 🔴 DDoS vulnerabilidad
- 🔴 Extracción de datos de estudiantes

**Solución:**
```python
from flask import request
from firebase_admin import auth as firebase_auth
import firebase_admin
from firebase_admin import credentials
import os

# Inicializar Firebase Admin
if not firebase_admin.get_app():
    cred = credentials.Certificate(json.loads(os.environ['FIREBASE_SERVICE_ACCOUNT']))
    firebase_admin.initialize_app(cred)

def verify_firebase_token():
    """Middleware para verificar token de Firebase"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header[7:]  # Remover "Bearer "
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return None

@app.route('/generate-report', methods=['POST'])
def generate_report():
    # ✅ Verificar autenticación
    user = verify_firebase_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    # ✅ Verificar que el usuario puede acceder a ese estudiante
    requested_student_id = request.json.get('student_id')
    # ... validar que user.uid tiene acceso a este estudiante
```

---

### 2. **Exposición de IDs de Proyecto en Código (ALTO)**

**Ubicación:** `/src/ai/flows/generate-student-feedback-flow.ts`  
```typescript
const response = await fetch(
  'https://backend-service-263108580734.us-central1.run.app/generate-report',
  // ❌ ID de proyecto expuesto: 263108580734
);
```

**Riesgo:**
- 🔴 Información de infraestructura visible en GitHub
- 🔴 Facilita ataques dirigidos
- 🔴 Exposición de arquitectura interna

**Solución:**
```typescript
// ✅ Usar variable de entorno
const endpoint = process.env.NEXT_PUBLIC_CLOUD_RUN_AI_ENDPOINT || '';
const response = await fetch(`${endpoint}/generate-report`, {...});
```

**En `.env.local`:**
```
NEXT_PUBLIC_CLOUD_RUN_AI_ENDPOINT=https://your-backend-service.run.app
```

---

### 3. **API Key en Request HTTP (MUY ALTO - Exposición Directa)**

**Ubicación:** `/src/ai/flows/generate-student-feedback-flow.ts`  
```typescript
body: JSON.stringify({
  grades: gradesDescription,
  api_key: apiKey || undefined  // ❌ Pasar la clave en el body
})
```

**Problema:**
```
POST /generate-report HTTP/1.1
Content-Type: application/json

{
  "student_name": "Juan",
  "api_key": "sk-proj-abc123xyz..."  // ❌ EXPUESTO en red
}
```

**Riesgo:**
- 🔴 Si logs se exponen, las claves están visibles
- 🔴 Proxy/MITM puede interceptar
- 🔴 Logs de Cloud Run pueden retener las claves

**Solución - Opción 1: Backend maneja la clave**
```typescript
// ✅ Cliente NO envía API key
const response = await fetch(`${endpoint}/generate-report`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseToken}`,  // ✅ Token de usuario
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    studentName: studentName,
    grades: gradesDescription,
    // ❌ NO incluir api_key aquí
  })
});
```

**Backend (Python):**
```python
@app.route('/generate-report', methods=['POST'])
def generate_report():
    user = verify_firebase_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    # ✅ Leer API key desde variable de entorno del servidor
    api_key = os.environ.get('GOOGLE_AI_API_KEY')
    
    # ✅ Backend usa su propia clave para llamar a Google AI
    response = client.message.create(
        model="gemini-1.5-pro",
        api_key=api_key,  # ✅ Nunca viaja por red
        ...
    )
```

---

### 4. **Sin Validación de CORS (MEDIO)**

**Ubicación:** `/cloud-run-ai-service-backed/main.py`  
```python
@app.route('/generate-report', methods=['POST'])
def generate_report():
    # ❌ Sin headers CORS - permite cualquier origen
    request.json  # Acepta requests de cualquier lugar
```

**Riesgo:**
- 🟡 Cross-Origin attacks
- 🟡 Sitios maliciosos pueden llamar el endpoint

**Solución:**
```python
from flask_cors import CORS

app = Flask(__name__)

# ✅ Permitir CORS solo desde tu dominio
CORS(app, origins=['https://tudominio.com', 'https://app.tudominio.com'])

# O configurar manualmente por ruta
@app.route('/generate-report', methods=['POST'])
def generate_report():
    response = make_response(...)
    response.headers['Access-Control-Allow-Origin'] = 'https://tudominio.com'
    return response
```

---

## ⚠️ VULNERABILIDADES MEDIAS

### 5. **Sin Rate Limiting (MEDIO)**

**Problema:**
```
Un atacante puede hacer 1000 requests/segundo
Cada request genera $0.10 de costo
= $100 en 1000 segundos = costo ilimitado
```

**Solución - Opción 1: Cloud Run Requests**
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/generate-report', methods=['POST'])
@limiter.limit("10 per minute per user")
def generate_report():
    ...
```

**Solución - Opción 2: Cloud Run Traffic Management**
```bash
# En Google Cloud Console > Cloud Run > tu servicio:
# Settings > Ingress settings > "Internal and Cloud Load Balancing"
# Usar Cloud Armor para limitar requests
```

---

### 6. **Sin Logging Detallado de Auditoría (MEDIO)**

**Problema:** No hay registro de quién usó qué

**Solución:**
```python
import logging
from datetime import datetime

# Logging estructurado
logger = logging.getLogger(__name__)

@app.route('/generate-report', methods=['POST'])
def generate_report():
    user = verify_firebase_token()
    
    # ✅ Logging de auditoría
    logger.info(json.dumps({
        "action": "generate_report",
        "user_id": user.get('uid'),
        "timestamp": datetime.utcnow().isoformat(),
        "student_id": request.json.get('student_id'),
        "status": "success"
    }))
    
    try:
        # ... generar reporte
        logger.info("Report generation completed")
    except Exception as e:
        logger.error(json.dumps({
            "action": "generate_report",
            "user_id": user.get('uid'),
            "status": "error",
            "error": str(e)
        }))
        return {"error": "Generation failed"}, 500
```

---

## 🟢 MEJORAS RECOMENDADAS (Importante pero no crítico)

### 7. **Sin Versionamiento de API (BAJO)**

```python
# ❌ Actual
@app.route('/generate-report', methods=['POST'])

# ✅ Mejor
@app.route('/v1/generate-report', methods=['POST'])

# Permite desplegar v2 sin romper clientes antiguos
```

---

### 8. **Sin Health Check para Monitoring (BAJO)**

```python
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }), 200
```

---

## 📋 PLAN DE REMEDIACIÓN (Prioridad)

### **INMEDIATO (Esta semana)**
- [ ] Agregar autenticación Firebase a todos los endpoints
- [ ] Mover IDs de proyecto a variables de entorno
- [ ] NO pasar API keys en HTTP request body
- [ ] Agregar CORS validation

### **CORTO PLAZO (1-2 semanas)**
- [ ] Implementar Rate Limiting
- [ ] Agregar Logging de Auditoría
- [ ] Habilitar Cloud Logging en Cloud Run
- [ ] Crear alertas de cuota de IA

### **MEDIANO PLAZO (1 mes)**
- [ ] Implementar versionamiento de API
- [ ] Agregar health checks
- [ ] Configurar Cloud Armor
- [ ] Implementar circuit breaker

---

## 🔒 Checklist de Seguridad para Producción

```bash
# Antes de desplegar a producción:

[ ] Todos los endpoints requieren autenticación
[ ] No hay credenciales en el código
[ ] CORS está configurado correctamente
[ ] Rate limiting está activo
[ ] Logging de auditoría está configurado
[ ] Errores no exponen detalles internos
[ ] Cloud SQL está en VPC (no pública)
[ ] Backups de base de datos están configurados
[ ] Monitoring y alertas están activos
[ ] Plan de respuesta a incidentes está documentado

# Verificar que se cumplan estas políticas:
[ ] Rotación de keys cada 90 días
[ ] Acceso a credenciales solo para admins
[ ] Todos los logs están centralizados
[ ] Auditoría de acceso está activa
```

---

## 🚨 Contacto de Soporte

Si identificas una vulnerabilidad de seguridad:
1. **NO** reportarla públicamente
2. Contactar al equipo de seguridad
3. Proporcionar detalle técnico
4. Permitir tiempo para remediación (5 días hábiles)

