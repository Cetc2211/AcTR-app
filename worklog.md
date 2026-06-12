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

---
Task ID: 1
Agent: main
Task: Implementar acceso preview a estaciones para usuarios free

Work Log:
- Analicé el flujo de acceso: AuthGuard en pagina-estacion requería estacion_csX → bloqueaba preview users
- Reescribí pagina-estacion.tsx con lógica dual: accesoCompleto vs esPreview
- AuthGuard ahora requiere "preview_cap1" (umbral mínimo) en lugar de config.claveAcceso
- Preview users: auto-expanden cap1, ven demás caps como cajas grises bloqueadas con 🔒
- Agregué banner informativo "Estás viendo el capítulo 1 como vista previa"
- Actualicé ecosistema-page.tsx: eliminé pills de preview, reemplacé por texto "Entra para ver el cap1"
- Footer de tarjeta muestra "○ Vista previa · Cap. 1" para preview users
- Commit local listo, push falla por autenticación GitHub

Stage Summary:
- 2 archivos modificados: pagina-estacion.tsx, ecosistema-page.tsx
- Commit b5b8156: feat: acceso preview a estaciones
- Usuario necesita hacer git push desde su terminal local
