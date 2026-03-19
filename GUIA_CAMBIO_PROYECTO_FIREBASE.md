# Guía de Migración de Configuración Firebase

Actualmente tu aplicación está configurada para conectarse a `actracker-master`, pero has descubierto que la base de datos real está en `academic-tracker-qeoxi`.

Para solucionar esto, debemos actualizar el archivo de configuración `src/lib/firebase.ts` con las credenciales correctas del proyecto nuevo.

## Paso 1: Obtener la Configuración del Nuevo Proyecto

1.  Ve a la **Firebase Console** del proyecto `academic-tracker-qeoxi`:
    *   [https://console.firebase.google.com/project/academic-tracker-qeoxi/settings/general](https://console.firebase.google.com/project/academic-tracker-qeoxi/settings/general)
2.  Baja hasta la sección **"Tus apps"**.
3.  Si ya hay una app web creada, haz clic en el icono de engranaje o en "SDK setup and configuration".
4.  Si no hay app, haz clic en el icono `</>` (Web) para registrar una nueva.
5.  Copia el objeto `firebaseConfig` que se ve así:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "academic-tracker-qeoxi.firebaseapp.com",
  projectId: "academic-tracker-qeoxi",
  storageBucket: "academic-tracker-qeoxi.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

## Paso 2: Actualizar el Código

Una vez tengas esos datos, edita el archivo `src/lib/firebase.ts` y reemplaza la configuración antigua con la nueva.

```typescript
// src/lib/firebase.ts
// ... imports ...

const firebaseConfig = {
    // PEGA AQUÍ TU NUEVA CONFIGURACIÓN
    "projectId": "academic-tracker-qeoxi",
    // ... resto de campos
};

// ... resto del archivo
```

## Paso 3: Desplegar el Cambio

Después de guardar el archivo, necesitas volver a desplegar la aplicación para que los cambios surtan efecto en la nube.

```bash
./deploy-fix-v2.sh
```
