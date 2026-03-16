# Guía de Solución: Conexión a Base de Datos Antigua desde Nuevo Despliegue

Actualmente, tu aplicación está configurada para usar la base de datos del proyecto antiguo (`actracker-master`), pero está desplegada o alojada bajo el paraguas del nuevo proyecto (`academic-tracker-qeoxi`).

El problema de que "no carga la información" en un equipo diferente (o más específicamente, desde el dominio desplegado) se debe casi con seguridad a restricciones de seguridad en Google Cloud y Firebase.

Para arreglar esto y permitir que tu nueva aplicación acceda a la base de datos antigua, debes realizar los siguientes cambios en la consola del proyecto **ANTIGUO** (`actracker-master`).

## Paso 1: Autorizar el Dominio en la API Key (Google Cloud Console)

Las API Keys de Firebase suelen tener restricciones para que solo puedan usarse desde dominios específicos.

1.  Ve a la **Google Cloud Console** del proyecto antiguo: [https://console.cloud.google.com/apis/credentials?project=actracker-master](https://console.cloud.google.com/apis/credentials?project=actracker-master)
2.  Busca la clave de API que estás usando (el valor de `apiKey` en `src/lib/firebase.ts`: `AIzaSyCDy-W8...`).
3.  Haz clic en el icono de lápiz o en el nombre para editarla.
4.  Busca la sección **Restricciones de aplicaciones** (Application restrictions).
5.  Si está marcada como "Sitios web" (Websites), verás una lista de dominios permitidos.
6.  **AÑADE** el dominio de tu nueva aplicación. Por ejemplo:
    *   `academic-tracker-qeoxi.web.app`
    *   `academic-tracker-qeoxi.firebaseapp.com`
    *   Cualquier dominio personalizado que estés usando (ej. `tu-app.com`).
7.  Guarda los cambios.

*Nota: Los cambios pueden tardar unos minutos en propagarse.*

## Paso 2: Autorizar el Dominio en Firebase Authentication (Firebase Console)

Aunque uses Email/Password, es buena práctica y a veces necesario para ciertas funciones de seguridad tener el dominio autorizado.

1.  Ve a la **Firebase Console** del proyecto antiguo: [https://console.firebase.google.com/project/actracker-master/authentication/settings](https://console.firebase.google.com/project/actracker-master/authentication/settings)
2.  Ve a la pestaña **Settings** (Configuración) y luego a **Authorized domains** (Dominios autorizados).
3.  Haz clic en **Add domain** (Agregar dominio).
4.  Escribe el dominio de tu nueva aplicación (ej. `academic-tracker-qeoxi.web.app`).
5.  Haz clic en **Add**.

## Paso 3: Verificar Reglas de CORS (Opcional pero posible)

Si estás realizando llamadas directas a Cloud Functions o Storage, podrías necesitar configurar CORS, pero para Firestore y Auth estándar, los pasos 1 y 2 suelen ser suficientes.

## Resumen Técnico

La configuración en `src/lib/firebase.ts` apunta correctamente al proyecto antiguo:

```typescript
const firebaseConfig = {
    "projectId": "actracker-master",
    // ...
};
```

Al mantener esta configuración, tu aplicación (sin importar dónde esté alojada) intentará hablar con `actracker-master`. Al autorizar el nuevo dominio en la consola de `actracker-master`, permites que estas peticiones sean aceptadas.
