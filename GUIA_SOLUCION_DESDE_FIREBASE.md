# Guía de Solución desde Firebase Console

Si puedes ver el proyecto en **Firebase Console** pero tienes problemas para encontrarlo en Google Cloud, sigue estos pasos. Firebase y Google Cloud son lo mismo por detrás, así que podemos acceder a todo desde Firebase.

## Paso 1: Autorizar Dominio para Autenticación (Desde Firebase)

Este paso es fundamental para que el inicio de sesión funcione en tu nueva URL.

1.  Entra a la **Firebase Console** del proyecto antiguo (`actracker-master`):
    *   Enlace directo: [https://console.firebase.google.com/project/actracker-master/authentication/settings](https://console.firebase.google.com/project/actracker-master/authentication/settings)
2.  Ve al menú **Authentication** (Autenticación).
3.  Haz clic en la pestaña **Settings** (Configuración).
4.  Busca la sección **Authorized domains** (Dominios autorizados).
5.  Haz clic en **Add domain** (Agregar dominio).
6.  Escribe el dominio de tu nueva aplicación (donde está alojada ahora).
    *   Ejemplo: `academic-tracker-qeoxi.web.app`
    *   Ejemplo: `academic-tracker-qeoxi.firebaseapp.com`
7.  Haz clic en **Add**.

## Paso 2: Configurar la API Key (El paso crítico)

Aunque no veas el proyecto en la lista principal de Google Cloud, si eres dueño en Firebase, tienes acceso. Usaremos un enlace que te lleva **directamente** a la configuración de la llave dentro del proyecto correcto, sin tener que buscarlo.

1.  Asegúrate de haber iniciado sesión con la misma cuenta que usas en Firebase.
2.  Haz clic en este enlace directo exacto:
    *   [**https://console.cloud.google.com/apis/credentials?project=actracker-master**](https://console.cloud.google.com/apis/credentials?project=actracker-master)
3.  Si te pide seleccionar un proyecto o aceptar términos, hazlo. Este enlace fuerza a Google Cloud a abrir el proyecto `actracker-master`.
4.  En esa lista, verás una clave llamada "Browser key", "API Key", o "Auto created key for Firebase".
    *   Identifícala porque el código comienza con: `AIzaSyCDy...` (igual que en tu archivo `firebase.ts`).
5.  Haz clic en el **lápiz** o en el nombre de esa clave para editarla.
6.  Baja a la sección **Restricciones de aplicaciones** (Application restrictions).
7.  Si está marcado "Ninguna" (None), **no tienes que hacer nada más aquí**.
8.  Si está marcado **Sitios web (Websites)**, verás una lista.
    *   Debes hacer clic en **ADD** (Agregar) y poner la URL de tu nuevo proyecto (`https://academic-tracker-qeoxi.web.app`).
9.  Haz clic en **Guardar**.

## ¿Qué pasa si el enlace del Paso 2 da error?

Si el enlace directo te dice "No tienes permisos" o "No se encuentra el proyecto", significa que tu usuario de Firebase tiene permisos limitados (quizás solo acceso a Firebase y no a la nube completa).

En ese caso, intenta esto desde la consola de Firebase:
1.  Ve a la "tuerca" de configuración (Project Settings).
2.  Ve a la pestaña **Integraciones**.
3.  Busca si hay algún enlace a "Google Cloud Platform".

Pero en el 99% de los casos, el enlace directo del Paso 2 funciona si ya tienes acceso a Firebase.
