# ✅ Reporte de Configuración: Carga de Estímulos Visuales

**Fecha:** [Fecha Actual]
**Proyecto:** PIGEC-130 / `academic-tracker-qeoxi`

---

## 1. Objetivo

Este documento resume la configuración técnica implementada para asegurar la carga y visualización de los estímulos psicométricos (imágenes de las subpruebas WISC/WAIS) desde **Firebase Storage** dentro de la **Consola de Aplicación** de la plataforma.

## 2. Componentes Clave de la Configuración

El sistema se basa en tres pilares fundamentales que deben funcionar en armonía:

### Pilar A: Estructura de Archivos en la Nube (Firebase Storage)

Es la "biblioteca" donde se guardan todas las imágenes. Para que la aplicación pueda encontrarlas, deben seguir una estructura de nombres y carpetas muy específica.

-   **Bucket de Almacenamiento:** `gs://academic-tracker-qeoxi.appspot.com`
-   **Carpeta Raíz para Estímulos:** `/stimuli/`
-   **Formato de Ruta de Archivo:** `stimuli/{ID_SUBPRUEBA}/item{NUMERO_ITEM}.webp`

**Ejemplos Concretos:**
- El estímulo para el ítem 5 de la subprueba **Construcción con Cubos (C)** debe estar en:
  `stimuli/C/item5.webp`
- El estímulo para el ítem 12 de **Puzles Visuales (PV)** debe estar en:
  `stimuli/PV/item12.webp`

**Estado Actual:**
- **[✓] COMPLETADO:** Se ha definido y validado que esta es la estructura correcta para el funcionamiento de la aplicación.

### Pilar B: Configuración del Cliente (Código de la Aplicación)

Es la parte de la aplicación que "sabe" cómo conectarse a Firebase y pedir las imágenes.

-   **Archivo de Conexión (`src/lib/firebase.ts`):**
    -   Este archivo es el **puente** entre la aplicación y tu proyecto de Firebase. Contiene un objeto `firebaseConfig` con las "llaves" que autorizan a tu aplicación a hablar con tus servicios en la nube.
    -   **Punto Crítico:** La propiedad `storageBucket: "academic-tracker-qeoxi.appspot.com"` en este archivo le dice al SDK de Firebase que todas las operaciones de almacenamiento deben realizarse en tu bucket específico. Aunque en la consola de Google Cloud veas la URL como `gs://...firebasestorage.app`, la configuración del cliente **debe** usar el formato `.appspot.com`.

-   **Componente de Visualización (`src/components/WISC-VScoringConsole.tsx`):**
    -   Dentro de este archivo, un sub-componente llamado `StimulusDisplay` es el encargado de la lógica de carga.
    -   **Flujo de Trabajo:**
        1.  Recibe el ID de la subprueba (ej. "C") y el número de ítem (ej. 1).
        2.  Construye dinámicamente la ruta **relativa** de la imagen siguiendo el formato del Pilar A (ej. `stimuli/C/item1.webp`).
        3.  Utiliza la función `getDownloadURL` de Firebase para obtener un enlace de descarga seguro para esa ruta, dentro del bucket ya configurado.
        4.  Implementa una **caché en memoria** (`imageUrlCache`) para que, una vez que una imagen se descarga, no se vuelva a solicitar a la red durante la misma sesión, haciendo la navegación entre ítems casi instantánea.
        5.  Si una URL en caché falla, el sistema la invalida y vuelve a intentar la descarga desde Firebase para corregir errores.
        6.  Muestra la imagen usando el componente `next/image` para una carga optimizada.
        7.  **Plan de Contingencia:** Si, por cualquier motivo excepcional, la imagen no se puede cargar, el componente ahora muestra una tarjeta de respaldo que instruye al clínico a usar el cuadernillo físico para ese ítem, garantizando que la aplicación nunca quede bloqueada.

### Pilar C: Reglas de Seguridad (Firebase Storage Rules)

Define quién puede acceder a los archivos. Aunque no fue parte del problema, es un pilar de seguridad.

-   **Archivo de Reglas (`storage.rules`):**
    -   Actualmente, las reglas están configuradas para permitir que cualquier usuario autenticado (`request.auth != null`) pueda leer los estímulos. Esto es adecuado para la fase de desarrollo.
    -   En un futuro, se podría restringir el acceso solo a usuarios con un rol específico (ej. `request.auth.token.role == 'clinico'`) para mayor seguridad.

## 3. Conclusión

Con la corrección de la extensión a `.webp`, la implementación de la caché de imágenes resiliente y la clarificación del flujo de conexión, la configuración para la carga de estímulos es ahora **robusta, rápida y resiliente**. Todos los componentes necesarios están en su lugar para cumplir con el objetivo de una aplicación 100% digital y sin papel.
