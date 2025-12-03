# 🚀 EJECUTAR PRUEBAS DE IA - Guía Rápida

## Opción 1: Prueba Visual en la App (Recomendado)

### Paso 1: Iniciar la aplicación
```bash
npm run dev
```

### Paso 2: Ir a la página de testing
Abre en tu navegador:
```
http://localhost:3000/debug/test-ai
```

### Paso 3: Ejecutar pruebas
Haz click en el botón **"Iniciar Pruebas"**

### Resultado esperado:
```
✓ Todas las pruebas pasaron

Total: 3
Exitosas: 3
Fallos: 0
Errores: 0
```

---

## Opción 2: Prueba desde Terminal (Node.js)

```bash
node test-ai-integration.js
```

### Resultado esperado:
```
✓ Health Check EXITOSO
✓ Generación de retroalimentación EXITOSA
✓ Generación de análisis EXITOSA
✓ Red disponible
```

---

## Opción 3: Prueba Manual con curl

### Health Check
```bash
curl https://backend-service-263108580734.us-central1.run.app/
```

### Generar Retroalimentación
```bash
curl -X POST https://backend-service-263108580734.us-central1.run.app/generate-report \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Juan",
    "subject": "Test",
    "grades": "Calificación: 85/100"
  }'
```

---

## 📊 Qué Hace Cada Prueba

| Prueba | Qué Verifica | Esperado |
|--------|-------------|----------|
| Health Check | ¿Cloud Run está activo? | `status: "healthy"` |
| Student Feedback | ¿Se genera retroalimentación? | JSON con `report` |
| Group Report | ¿Se genera análisis de grupo? | JSON con `report` |

---

## ✅ Si Todo Funciona

Verás:
- ✓ Badges verdes
- ✓ Status "PASS" en todas las pruebas
- ✓ Mensajes de éxito
- ✓ Contenido de reportes generados

Luego puedes:
1. Ir a **Estudiantes**
2. Seleccionar un estudiante
3. Hacer click en **✨ Generar Retroalimentación**
4. Debería generar un análisis automáticamente

---

## ❌ Si Algo Falla

### "Health Check FALLÓ"
```bash
# Verificar que Cloud Run está corriendo
gcloud run services describe backend-service --region=us-central1

# Si está down, redeploy:
cd cloud-run-ai-service-backed
gcloud run deploy backend-service --source . --region=us-central1
```

### "Generación FALLÓ"
- Verifica que Vertex AI está habilitado en GCP
- Revisa los logs: `gcloud run logs read backend-service --region=us-central1`
- Verifica cuota disponible en Google Cloud Console

### "Network Error"
- Verifica conexión a internet
- Verifica que la URL es correcta en `.env.local`
- Comprueba CORS en Cloud Run

---

## 🎯 Próximo Paso

Una vez que las pruebas pasen:

```bash
# Inicia la app
npm run dev

# Prueba generando informes desde la UI:
# 1. Estudiantes → Seleccionar uno → "Generar Retroalimentación"
# 2. Reportes → Seleccionar grupo → "Generar Análisis"
```

---

## 📝 Notas

- Las pruebas son **no-destructivas** (no guardan nada)
- Usan datos de prueba
- Pueden consumir cuota de Vertex AI
- Se recomienda ejecutar 1-2 veces por sesión

