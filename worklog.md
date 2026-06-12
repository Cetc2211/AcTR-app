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
