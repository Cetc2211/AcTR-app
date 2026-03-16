# Finalización de Migración a Academic Tracker Qeoxi

He actualizado exitosamente el archivo `src/lib/firebase.ts` con la configuración de tu proyecto `academic-tracker-qeoxi`.

Ahora tu aplicación está unificada:
- **Frontend:** Academic Tracker Qeoxi
- **Base de Datos:** Academic Tracker Qeoxi (Firestore)
- **Autenticación:** Academic Tracker Qeoxi
- **IA Backend:** Academic Tracker Qeoxi

## Pasos para aplicar el cambio

Para que este cambio se refleje en tu aplicación en vivo, necesitas desplegar una nueva versión.

### Opción 1: Despliegue Manual (Recomendado)

Ejecuta el siguiente comando en tu terminal para subir los cambios a Firebase Hosting:

```bash
firebase deploy --only hosting
```

*(Si usas GitHub Actions o Vercel para desplegar automáticamente, solo necesitas hacer commit y push)*:

```bash
git add src/lib/firebase.ts
git commit -m "fix: update firebase config to use qeoxi project"
git push origin main
```

## Verificación

Una vez desplegado:
1. Abre tu aplicación en el navegador (posiblemente necesites limpiar caché o abrir en incógnito).
2. Inicia sesión (ahora usarás los usuarios registrados en `qeoxi`, si no tienes ninguno, regístrate de nuevo).
3. Verifica que la información cargue correctamente.

¡Ahora todo debería funcionar fluido y sin errores de permisos!
