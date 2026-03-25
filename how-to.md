# 🚀 Guía de Trabajo para iPad Pro (M1/M2/M5)

Esta guía está diseñada para que puedas gestionar completamente tu proyecto PIGEC-130 desde un iPad Pro, incluyendo la subida del código a GitHub y la carga de los estímulos a Firebase Storage.

---

## Parte 1: Subir Tu Proyecto a GitHub (Método Manual)

Este método consiste en replicar la estructura de tu proyecto creando cada archivo y carpeta directamente en la interfaz web de GitHub. Es ideal para el iPad porque no requiere consola ni `git`.

### 1. Crea un Nuevo Repositorio en GitHub

*   Abre Safari y ve a [GitHub.com](https://github.com). Inicia sesión.
*   Toca el ícono **+** en la esquina superior derecha y selecciona **New repository**.
*   **Nombre del Repositorio:** `suite-integral-mtss` (o el que prefieras).
*   **Importante:** **NO** marques la casilla "Add a README file" ni ninguna otra. Empezaremos con un repositorio completamente vacío.
*   Toca **Create repository**.

### 2. Replica la Estructura de Archivos

En la página de tu repositorio vacío, toca el enlace que dice **"creating a new file"**.

*   **Para crear un archivo en la raíz (ej. `package.json`):**
    1.  En el campo del nombre, escribe `package.json`.
    2.  Vuelve al entorno de desarrollo, abre el archivo `package.json`, copia todo su contenido.
    3.  Pega el contenido en el editor de GitHub.
    4.  Abajo, escribe un mensaje de confirmación como `"Add package.json"` y toca **Commit new file**.

*   **Para crear una carpeta y un archivo dentro (ej. `src/app/layout.tsx`):**
    1.  En la página principal de tu repositorio, toca **Add file** > **Create new file**.
    2.  En el campo del nombre, escribe la ruta completa: `src/app/layout.tsx`. Al escribir la barra (`/`), GitHub crea la carpeta automáticamente.
    3.  Copia el contenido del archivo `src/app/layout.tsx` del entorno de desarrollo y pégalo.
    4.  Confirma con un mensaje como `"Add layout file"` y toca **Commit new file**.

**Acción:** Repite este proceso para cada archivo y carpeta de tu proyecto. Es un proceso metódico, pero te asegura tener una copia exacta de tu código en GitHub.

---

## Parte 2: Subir Estímulos a Firebase Storage (Método Cloud Shell)

Este es el método más fiable y recomendado para iPad. Se hace todo desde el navegador.

### 1. Comprime tus Estímulos en el iPad

*   Asegúrate de tener una carpeta llamada `stimuli-assets` en tu app "Archivos". Dentro de esta deben estar todas las carpetas de las subpruebas (`C`, `M`, `PV`, etc.).
*   Mantén presionada la carpeta `stimuli-assets` y selecciona **Comprimir**. Esto creará un archivo llamado **`stimuli-assets.zip`**.

### 2. Abre Firebase Cloud Shell

*   En Safari, ve a la [Consola de Firebase](https://console.firebase.google.com/) y selecciona tu proyecto (`academic-tracker-qeoxi`).
*   En la esquina superior derecha, busca y toca el ícono de la terminal **( `>_` )** que dice **"Activar Cloud Shell"**.
*   Espera a que se inicie. Verás una línea de comandos en la parte inferior de tu pantalla.

### 3. Sube el Archivo .zip a Cloud Shell

*   En la barra de herramientas de Cloud Shell (arriba de la terminal), toca el menú de tres puntos (**`⋮`**) y selecciona **Subir**.
*   Elige el archivo **`stimuli-assets.zip`** que creaste en el primer paso. Espera a que la subida finalice.

### 4. Descomprime y Sincroniza con Storage

*   Una vez subido, ejecuta los siguientes comandos en la terminal de Cloud Shell, uno por uno. **Copia y pega cada línea** para evitar errores.

    ```bash
    # Comando 1: Descomprime el archivo. El '-o' sobreescribe si ya existe.
    unzip -o stimuli-assets.zip
    ```

    ```bash
    # Comando 2: Sincroniza la carpeta con tu bucket de Storage.
    # Este es el comando estándar y más robusto de Google Cloud.
    gsutil -m rsync -r stimuli-assets gs://academic-tracker-qeoxi.appspot.com/stimuli
    ```
    *Verás un progreso mientras se copian todos los archivos. El comando `gsutil rsync` es inteligente: solo sube los archivos nuevos o modificados.*

### 5. Verificación Final

*   Cuando el comando termine, ve a la sección de **Storage** en la consola de Firebase. Deberías ver una carpeta `stimuli` con todas tus subcarpetas (`C`, `M`, etc.) y archivos de imagen dentro.

¡Listo! Con estos pasos, tienes control total de tu proyecto y sus recursos directamente desde tu iPad Pro.