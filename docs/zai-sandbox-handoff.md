# Sandbox aislado para Z.ai

Se creo un espacio de trabajo aislado fuera del repositorio principal para recibir codigo experimental sin afectar `AcTR-app`.

Ubicacion del sandbox:
- `/workspaces/zai-isolated-space`

Archivos preparados en el sandbox:
- `README.md`
- `AGENT_INSTRUCTIONS.md`
- `notes/handoff-template.md`
- `incoming/`
- `patches/`

## Mensaje para enviar a Z.ai

Trabaja solo en `/workspaces/zai-isolated-space`.
No escribas ni modifiques nada en `/workspaces/AcTR-app`.

Si tienes acceso shell en el codespace:
1. entra al directorio del sandbox
2. inicializa un repo Git local
3. crea la rama `zai-sandbox`
4. coloca el codigo en `incoming/`
5. documenta objetivo, dependencias y pruebas en `notes/handoff.md`
6. realiza commit solo en ese repo aislado

Si no tienes acceso shell:
1. deja todos los archivos en `incoming/`
2. crea `notes/handoff.md`
3. si hace falta, agrega un parche en `patches/actr-app.patch`

Contenido obligatorio de `notes/handoff.md`:
- objetivo funcional
- archivos principales
- dependencias nuevas
- variables de entorno
- comando de arranque o build
- pasos de validacion
- riesgos conocidos

## Nota
No fue posible inicializar Git automaticamente desde este agente porque la ejecucion de terminal contra este workspace esta fallando a nivel de herramienta. La carpeta aislada ya existe y esta lista para que Z.ai la use.
