---
Task ID: 1
Agent: main
Task: Cambio 1 + Cambio 2 — agregar notificación de registro a WordPress

Work Log:
- Leído ecosistema-login-page.tsx actual del repo local
- Agregado `const nombreLimpio = registroNombre.trim();` antes del try en handleRegistro
- Reemplazado `registroNombre` por `nombreLimpio` en el setDoc
- Agregado `void fetch('/api/ecosistema/notificar-registro', ...)` después del setDoc exitoso
- Creado directorio `src/app/api/ecosistema/notificar-registro/`
- Creado `route.ts` con POST (valida nombre/email, crea suscriptor WP, retorna {ok:true}) y GET (405)
- Ejecutado `git add` de ambos archivos
- Commit: `36da7fe feat: registro en app crea suscriptor en WordPress automáticamente`
- Push falló: no hay credenciales GitHub (sin SSH, sin gh CLI, sin credential helper)

Stage Summary:
- Commit local listo: `36da7fe`
- Archivos modificados/creados: 2 (login-page + route.ts nuevo)
- Push pendiente: requiere PAT o acceso SSH desde otra máquina

---
Task ID: 1
Agent: main
Task: Crear script re-subir-storage.mjs y explicar flujo de trabajo para cuadernillos interactivos

Work Log:
- Revisé scripts existentes: hacer-cuadernillos-interactivos.mjs y subir-materiales.mjs
- Identifiqué que subir-materiales.mjs no sirve para re-subir (omite existentes en Firestore)
- Creé scripts/re-subir-storage.mjs que solo sobrescribe HTMLs en Storage sin tocar Firestore
- Expliqué el flujo de 4 pasos al usuario

Stage Summary:
- Script re-subir-storage.mjs creado en /home/z/my-project/scripts/
- Flujo: materiales-temp/ → transformar → materiales-temp-interactivos/ → re-subir a Storage
- Esperando que el usuario coloque los archivos HTML originales en materiales-temp/
