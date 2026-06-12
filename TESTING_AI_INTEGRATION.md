# 🧪 PRUEBAS DE INTEGRACIÓN - Cloud Run + IA

## Cómo Ejecutar las Pruebas

### **Opción 1: Test con Node.js (Recomendado - Sin dependencias)**

```bash
# En la raíz del proyecto
node test-ai-integration.js
```

**Ventajas:**
- ✅ No requiere `gcloud` CLI
- ✅ Rápido y directo
- ✅ Prueba real contra el backend
- ✅ Muestra respuestas JSON formateadas

**Ejemplo de salida exitosa:**
```
✓ Health Check EXITOSO
Respuesta:
{
  "status": "healthy",
  "service": "AcTR-IA-Backend",
  "timestamp": "2025-12-03T...",
  "version": "1.0"
}

✓ Generación de retroalimentación EXITOSA
Retroalimentación generada:
Juan Pérez García ha tenido un excelente desempeño en el primer parcial...
```

---

### **Opción 2: Test con Bash (Requiere gcloud y curl)**

```bash
# Hacer executable
chmod +x test-cloud-run.sh

# Ejecutar
./test-cloud-run.sh
```

**Ventajas:**
- ✅ Verifica estado en Google Cloud
- ✅ Muestra detalles de configuración gcloud
- ✅ Útil para debugging avanzado

---

## 🎯 Qué Verifican las Pruebas

### Test 1: Variables de Entorno
- ✓ `.env.local` existe
- ✓ `NEXT_PUBLIC_CLOUD_RUN_ENDPOINT` está configurado
- ✓ Variables de GCP están presentes

### Test 2: Health Check
- ✓ Cloud Run service está RUNNING
- ✓ Backend responde en `/`
- ✓ Status del servicio es "healthy"

### Test 3: Generación de Retroalimentación
- ✓ Endpoint `/generate-report` es accesible
- ✓ Backend procesa datos correctamente
- ✓ Vertex AI genera análisis

### Test 4: Generación de Análisis de Grupo
- ✓ Endpoint `/generate-group-report` es accesible
- ✓ Backend procesa estadísticas del grupo
- ✓ Análisis grupal se genera correctamente

### Test 5: Conectividad de Red
- ✓ Red disponible
- ✓ Acceso a Cloud Run sin problemas

---

## 📊 Resultados Esperados

### ✅ Éxito
```
✓ Health Check EXITOSO
✓ Generación de retroalimentación EXITOSA
✓ Generación de análisis EXITOSA
✓ Red disponible (Status: 200)
```

### ⚠️ Advertencias Comunes

#### "Health Check FALLÓ"
**Causa:** Cloud Run service no está corriendo
**Solución:**
```bash
# Verificar estado
gcloud run services describe backend-service --region=us-central1

# Si está down, redeploy:
cd cloud-run-ai-service-backed
gcloud run deploy backend-service --source . --region=us-central1
```

#### "Generación FALLÓ: Network error"
**Causa:** CORS o firewall bloqueando
**Solución:**
```bash
# Verificar CORS en Cloud Run
gcloud run services describe backend-service --region=us-central1 --format=json | grep -i cors

# Permitir cualquier origen (solo para testing):
gcloud run services update backend-service \
  --region=us-central1 \
  --update-env-vars="ALLOW_ORIGIN=*"
```

---

## 🔄 Flujo de Testing Completo

```
1. Ejecutar pruebas
   ↓
2. Verificar Health Check
   ↓
3. Si OK → Testear generación de informe
   ↓
4. Si falla → Revisar logs
   gcloud run logs read backend-service --region=us-central1
   ↓
5. Corregir y volver a intentar
```

---

## 🐛 Troubleshooting

### Problema: "Connection refused"
```bash
# Verificar que la URL es correcta
echo $NEXT_PUBLIC_CLOUD_RUN_ENDPOINT

# Verificar con curl
curl -X GET https://backend-service-263108580734.us-central1.run.app/
```

### Problema: "Request timeout"
```bash
# Aumentar timeout
timeout 30 node test-ai-integration.js

# O check el servicio manualmente
gcloud run services describe backend-service --region=us-central1
```

### Problema: "Invalid JSON response"
```bash
# Ver respuesta cruda
curl -v -X GET https://backend-service-263108580734.us-central1.run.app/

# Ver logs del backend
gcloud run logs read backend-service --region=us-central1 --limit=20
```

---

## 📈 Después de Pruebas Exitosas

1. **Testear en la UI:**
   ```bash
   npm run dev
   ```
   - Ir a Estudiantes > Generar Retroalimentación
   - Ir a Reportes > Generar Análisis

2. **Monitorear uso de IA:**
   ```bash
   gcloud run logs read backend-service --region=us-central1 --follow
   ```

3. **Monitorear cuota de Vertex AI:**
   - Google Cloud Console > Vertex AI > Usage & Quotas
   - Verificar que no se alcanzó límite diario

---

## 🚀 Próximas Pruebas (Avanzadas)

### Test de Carga
```bash
# Generar múltiples requests
for i in {1..10}; do
  node test-ai-integration.js &
done
wait
```

### Test de Latencia
```bash
# Medir tiempo de respuesta
time node test-ai-integration.js
```

### Test de Errores
```bash
# Enviar payload inválido
curl -X POST https://backend-service-263108580734.us-central1.run.app/generate-report \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

---

## 📝 Notas

- Los tests NO consumen cuota de IA real (solo hacen pruebas de conectividad)
- Los análisis generados en las pruebas SÍ usan cuota de Vertex AI
- Recomendado ejecutar una vez por sesión de trabajo
- Los logs se guardan en Cloud Logging automáticamente

