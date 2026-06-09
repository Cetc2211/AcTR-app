# Instrucciones para Z.ai - Ecosistema

## Objetivo
Trabajar solo sobre el mini app del ecosistema y evitar cambios accidentales en la app madre.

## Alcance permitido
- `src/app/ecosistema/**`
- `src/components/ecosistema/**`
- `src/hooks/use-ecosistema.ts`
- `src/lib/firebase-admin.ts`
- `src/app/layout-provider.tsx`
- `src/app/main-layout-client.tsx`
- `src/app/page.tsx`
- `src/app/api/ecosistema/descargar/route.ts`

## No tocar
- `.env.local`
- cualquier secreto o JSON de service account
- `.next/`, `node_modules/`, `.firebase/`, `Build/`
- archivos de recuperación o temporales
- documentación histórica que no esté relacionada con el flujo del ecosistema

## Tareas a validar
1. Verificar que `/ecosistema/login` no redirige a la app madre.
2. Confirmar que `/ecosistema` queda aislado del layout global.
3. Revisar acceso por perfil y allowlist de admin.
4. Probar rutas de estaciones y capítulos.
5. Confirmar que la descarga firmada usa la variable de service account específica del ecosistema.

## Variables relevantes
- `FIREBASE_SERVICE_ACCOUNT_JSON_ECOSISTEMA`
- `NEXT_PUBLIC_ECOSISTEMA_ADMIN_EMAILS`
- `NEXT_PUBLIC_ECOSISTEMA_ADMIN_EMAIL`

## Criterios de aceptación
- El mini app funciona sin romper la navegación de la app madre.
- No se agregan secretos al repo.
- Los cambios quedan limitados al ecosistema y a su configuración asociada.
