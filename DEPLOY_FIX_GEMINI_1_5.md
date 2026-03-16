# Corrección de Error Gemini 1.5 Flash (404 Not Found)

Se han realizado las siguientes correcciones para solucionar el error `404 models/gemini-1.5-flash is not found`:

## Cambios Realizados

1.  **Actualización de Librería (`requirements.txt`)**:
    *   Se actualizó `google-generativeai` de `0.3.0` a `>=0.8.0`.
    *   **Razón**: La versión 0.3.0 es demasiado antigua y no soporta los modelos más recientes como `gemini-1.5-flash` ni la versión correcta de la API.

2.  **Corrección de Modelo (`main.py`)**:
    *   Se cambió el modelo de `gemini-2.5-pro` (que no existe) a `gemini-1.5-flash`.
    *   Se actualizó la versión del servicio a `2.5`.

3.  **Actualización de Referencias (`src/lib/ai-models.ts`)**:
    *   Se actualizó la constante `DEFAULT_MODEL` para reflejar el uso de `gemini-1.5-flash`.

## Pasos para Desplegar la Corrección

Para aplicar estos cambios en Cloud Run, ejecuta el siguiente comando en la terminal:

```bash
./deploy-fix.sh
```

O si prefieres usar el script específico del backend de IA (recomendado si tienes tu API Key a mano):

```bash
./deploy-ai-backend.sh "TU_API_KEY_AQUI"
```

## Verificación

Una vez desplegado, puedes verificar el estado del servicio accediendo a la URL del servicio (endpoint `/`) que debería devolver un JSON con:
```json
{
  "status": "healthy",
  "model": "gemini-1.5-flash",
  "version": "2.5"
}
```
