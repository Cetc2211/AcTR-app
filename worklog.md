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
---
Task ID: 2
Agent: main
Task: Incorporar estaciones PFH2 y PFH3 al ecosistema

Work Log:
- Renombrado titulo PFH2 → "Lo que somos mientras decidimos" en ecosistema-page.tsx y seed script
- Renombrado titulo PFH3 → "Lo que hacemos con lo que sabemos" en ecosistema-page.tsx y seed script
- Agregadas reglas Firestore para ecosistema_materiales_pfh2 y ecosistema_materiales_pfh3
- Actualizado comentario en storage.rules documentando PFH2 y PFH3
- Commit y push de todos los cambios (remote corregido a Cetc2211/AcTR-app)
- Ejecutado seed-pfh2-materiales.js: 24 documentos creados en ecosistema_materiales_pfh2
- Ejecutado seed-pfh3-materiales.js: 24 documentos creados en ecosistema_materiales_pfh3
- Deploy de reglas Firestore via Admin SDK (releaseFirestoreRulesetFromSource)
- Deploy de reglas Storage via Admin SDK (releaseStorageRulesetFromSource, bucket: academic-tracker-qeoxi.firebasestorage.app)

Stage Summary:
- PFH2 y PFH3 completamente operativos: Firestore docs, reglas deployadas, Storage ya accesible
- 3 commits pushados: c488b62, fee2606, 82579cf, cd6eeb4
- Remote corregido: github.com/Cetc2211/AcTR-app.git
---
Task ID: 3
Agent: main
Task: Implementar distinción estudiante/docente para PFH + articulaciones PFH1/PFH2

Work Log:
- Modificado activar-acceso/route.ts: ACCESOS_POR_PRODUCTO ahora agrega pfhN_estudiante o pfhN_docente según la variante de producto
- Agregado mapeo EDD_PRICE_ACCESOS con 6 price_ids: 475_0/1 (PFH1), 748_0/1 (PFH2), 751_0/1 (PFH3)
- Ruta ahora acepta download_id + price_id además de producto string
- Nuevo usuario incluye campos pfhN_estudiante/pfhN_docente en schema de accesos
- Modificado descargar/route.ts: filtro 403 para archivos *-guia.html en estaciones PFH sin acceso docente
- Lee ecosistema_usuarios/{uid} para verificar accesos antes de generar signed URL
- Modificado use-ecosistema.ts: 6 campos explícitos (pfh1_estudiante/docente, etc.) en EcosistemaAccessMap
- Fallback admin incluye todos los campos nuevos
- Modificado pagina-estacion.tsx: guías bloqueadas visualmente para estudiantes PFH ("Solo docente")
- Modificado ecosistema-nav.tsx: DocumentoLink soporta url externa y estacionStorage
- Agregadas articulaciones PFH1 y PFH2 al sidebar de Pensamiento Filosófico
- Creada ruta /api/ecosistema/articulacion/route.ts: genera signed URLs para archivos de articulación PFH en Storage
- Sincronizada Cloud Function: NIVELES_VALIDOS, ACCESOS_INICIALES, PRODUCTO_ACCESOS con nuevos campos PFH
- Build exitoso sin errores, commit 0eba230, push a Cetc2211/AcTR-app

Stage Summary:
- Distinción estudiante/docente completamente implementada en backend y frontend
- Estudiante PFH: novela + cuadernillo (guía bloqueada con "Solo docente")
- Docente PFH: novela + cuadernillo + guía
- Mapeo de 6 price_ids EDD configurado (475_0/1, 748_0/1, 751_0/1)
- Articulaciones PFH1/PFH2 en sidebar (via Storage signed URLs)
- CS no afectada — sigue funcionando igual
