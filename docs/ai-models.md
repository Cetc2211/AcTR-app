# Selección de modelos IA y comportamiento de fallback

Resumen

- La aplicación permite a cada usuario configurar su propia clave API de Google AI (se almacena localmente en el navegador usando idb-keyval).
- En Ajustes puedes seleccionar el modelo preferido para las llamadas de IA (ej.: `gemini-2.5-flash`).
- Si la clave del usuario no tiene acceso al modelo preferido, el servidor intentará automáticamente una lista de fallbacks en orden hasta encontrar un modelo disponible.

Fallback order (implementado)

1. modelo solicitado por el usuario (si existe)
2. `gemini-2.5-flash`
3. `gemini-2.0-flash`
4. `gemini-2.0-flash-lite`
5. `gemini-1.5-flash`
6. `gemini-1.5-flash-latest`

Comportamiento

- Cuando generas un informe, el cliente envía `{ prompt, apiKey, model }` a `/api/generate-ia`.
- El servidor intenta el `model` proporcionado; si la respuesta es `NOT_FOUND` o similar, prueba el siguiente modelo de la lista.
- La respuesta JSON contiene `text` y `model` (el modelo que respondió con éxito) para transparencia en la UI.

Seguridad y responsabilidades

- La API key se almacena localmente y se envía al servidor en cada petición para crear instancias per-request de Genkit. No se persiste en servidores ni se comparte entre usuarios.
- Los usuarios son responsables del uso de su propia clave API (costo/uso) y deberían gestionar sus cuotas en Google Cloud / AI Studio.

Cómo obtener una clave API de Google AI

1. Ve a https://aistudio.google.com/app/apikey
2. Crea o selecciona un proyecto en Google Cloud con la API habilitada.
3. Copia la clave y pégala en Ajustes > "API Key de Google AI".

Notas para desarrolladores

- Función central: `src/lib/generate.ts` expone `callGoogleAI` (interno), `generateGroupAnalysis`, `generateFeedback`, `testApiKey`.
- Flujos (`src/ai/flows/*`) fueron refactorizados para reutilizar estos helpers y centralizar manejo de errores y fallbacks.
- Si quieres cambiar el orden de fallback, actualiza el arreglo `fallbackCandidates` en `src/lib/generate.ts`.

Recomendaciones operativas

- Validar en staging con claves que tengan distintos permisos de modelo para confirmar el comportamiento de fallback.
- Registrar (opcional) métricas sobre qué modelos son usados en producción para entender el uso y orientar recomendaciones a usuarios.

