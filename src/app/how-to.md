# Cómo Subir Tu Proyecto a GitHub

Esta guía contiene dos métodos para subir tu proyecto a GitHub. Elige el que mejor se adapte a tu dispositivo:

1.  **Método Manual (Ideal para iPad):** No requiere consola ni descargas.
2.  **Método con Consola y Git (Laptop):** El método estándar y más eficiente para desarrolladores.

---

## Método 1: Manual sin Consola (Ideal para iPad)

Este método consiste en replicar la estructura de tu proyecto creando cada archivo y carpeta directamente en la interfaz web de GitHub y copiando el contenido. Funciona perfectamente desde el navegador de un iPad o cualquier computadora.

### 1. Crea un Nuevo Repositorio en GitHub

*   Ve a [GitHub](https://github.com) e inicia sesión.
*   Haz clic en el ícono **+** en la esquina superior derecha y selecciona **New repository**.
*   Dale un nombre (ej., `suite-integral-mtss`).
*   **Importante:** NO marques la casilla "Add a README file" esta vez. Empezaremos con un repositorio completamente vacío para evitar conflictos.
*   Haz clic en **Create repository**.

### 2. Sube tus Archivos y Carpetas Manualmente

Un repositorio vacío te mostrará una página de configuración. Busca y haz clic en el enlace que dice **"creating a new file"**.

*   **Para crear un archivo en la raíz:**
    *   **Nombre del archivo:** Escribe el nombre, por ejemplo: `package.json`.
    *   **Contenido:** Vuelve a este entorno, abre `package.json`, copia TODO su contenido y pégalo en el editor de GitHub.
    *   **Confirmar (Commit):** Escribe un mensaje como `"Add package.json"` y haz clic en **Commit new file**.

*   **Para crear una carpeta y un archivo dentro:**
    *   En la página principal de tu repositorio, haz clic en **Add file** > **Create new file**.
    *   En el campo del nombre, escribe la ruta completa. Por ejemplo, para crear la carpeta `src` y `app` con el archivo `layout.tsx` dentro, escribirías: `src/app/layout.tsx`. Al escribir la barra `/`, GitHub automáticamente crea las carpetas.
    *   **Contenido:** Copia el contenido del archivo `src/app/layout.tsx` de este entorno y pégalo en GitHub.
    *   **Confirmar:** Escribe un mensaje (ej., `"Add layout file"`) y haz clic en **Commit new file**.

Repite este proceso para cada archivo y carpeta de tu proyecto. Es un proceso sistemático, pero te asegura tener una copia exacta de tu código en GitHub.

---

## Método 2: Con Consola y Git (Laptop)

Este es el método profesional. Primero replicarás los archivos en tu laptop y luego usarás `git` para subirlos todos de golpe.

### 1. Prepara tu Laptop

*   **Instala Git:** Si no lo tienes, descárgalo desde [git-scm.com](https://git-scm.com/downloads).
*   **Instala un editor de código:** [VS Code](https://code.visualstudio.com/) es el estándar y tiene una terminal integrada.

### 2. Replica el Proyecto en tu Laptop

1.  **Crea una carpeta:** En tu escritorio o donde prefieras, crea una nueva carpeta. Dale el mismo nombre que tu proyecto (ej. `suite-integral-mtss`).
2.  **Abre la carpeta en VS Code:** Lanza VS Code y ve a `File > Open Folder...` para abrir la carpeta que acabas de crear.
3.  **Crea los archivos y carpetas:** Usando el explorador de archivos de VS Code, recrea la misma estructura de archivos y carpetas que ves en este entorno.
4.  **Copia el contenido:** Para cada archivo, copia el código desde este entorno y pégalo en el archivo correspondiente en VS Code. Guarda cada archivo.

Al final de este paso, tendrás una copia local exacta de tu proyecto en tu laptop.

### 3. Sube el Proyecto con la Consola (Terminal)

1.  **Abre la Consola en VS Code:** Ve al menú `Terminal > New Terminal`. Esto abrirá un panel de consola directamente en tu editor, ya ubicado en la carpeta de tu proyecto.

2.  **Crea un Repositorio en GitHub:** Ve a GitHub.com, crea un **nuevo repositorio vacío** (SIN README ni .gitignore). Después de crearlo, GitHub te mostrará una página con comandos. Busca la sección que empieza con `…or push an existing repository from the command line`.

3.  **Ejecuta los Comandos Git:** Copia y pega los siguientes comandos en tu terminal de VS Code, uno por uno, presionando `Enter` después de cada uno.

    ```bash
    # Inicializa un repositorio Git en tu carpeta local
    git init

    # Añade todos los archivos que creaste para ser "rastreados"
    git add .

    # Crea tu primer "commit" (una instantánea de tu código)
    git commit -m "Primer commit: subida inicial del proyecto"

    # Nombra la rama principal como "main" (estándar actual)
    git branch -M main

    # Conecta tu repositorio local con el de GitHub (reemplaza la URL)
    git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

    # Sube (push) tu código a GitHub
    git push -u origin main
    ```

    **Importante:** Reemplaza `https://github.com/TU_USUARIO/TU_REPOSITORIO.git` con la URL que te proporciona GitHub en la página de tu repositorio.

¡Y listo! Con estos comandos, todo tu proyecto se habrá subido a GitHub. A partir de ahora, cada vez que hagas cambios, solo necesitarás usar `git add .`, `git commit -m "mensaje"`, y `git push`.

---

## 🛠️ Guía: Subir Estímulos a Firebase Storage

Para que la Consola de Evaluación WISC/WAIS funcione, es necesario subir las imágenes de los estímulos (puzles, matrices, etc.) a Firebase Storage. Aquí tienes dos métodos.

### Método 1: Usando Firebase Cloud Shell (Recomendado para iPad)

Este método es el más recomendado porque se hace todo desde el navegador, sin instalar nada en tu dispositivo.

1.  **Comprime tus Archivos:**
    *   En tu iPad, asegúrate de tener una carpeta `stimuli-assets` que contenga todas las subcarpetas de imágenes (`C`, `M`, `PV`, etc.).
    *   Mantén presionada la carpeta `stimuli-assets` y selecciona **Comprimir**. Esto creará un archivo llamado **`stimuli-assets.zip`**.

2.  **Abre Firebase Cloud Shell:**
    *   Ve a la [Consola de Firebase](https://console.firebase.google.com/) y selecciona tu proyecto (`academic-tracker-qeoxi`).
    *   En la esquina superior derecha, busca y haz clic en el ícono de la terminal **( `>_` )** que dice **"Activar Cloud Shell"**.
    *   Espera a que se inicie el entorno. Verás una línea de comandos en la parte inferior de tu pantalla.

3.  **Sube el Archivo .zip:**
    *   En la barra de herramientas de Cloud Shell, haz clic en el menú de tres puntos (**`⋮`**) y selecciona **Subir**.
    *   Elige el archivo **`stimuli-assets.zip`** que creaste en el primer paso.

4.  **Descomprime y Sube a Storage (Comandos Infalibles):**
    *   Una vez que termine de subirse, ejecuta los siguientes comandos en la terminal de Cloud Shell, uno por uno. Cópialos y pégalos para evitar errores.

    ```bash
    # 1. Descomprime el archivo. El '-o' sobreescribe si ya existe.
    unzip -o stimuli-assets.zip

    # 2. Sincroniza la carpeta con Storage. Este es el comando más robusto.
    gsutil -m rsync -r stimuli-assets gs://academic-tracker-qeoxi.appspot.com/stimuli
    ```
    *Al ejecutar el segundo comando, verás una barra de progreso mientras se copian todos los archivos a la nube.*

5.  **Verificación Final:**
    *   Una vez que el comando termine, ve a la sección de **Storage** en tu consola de Firebase. Deberías ver una carpeta nueva llamada `stimuli` con todas tus imágenes adentro.

### Método 2: Usando una Terminal Local (Alternativa para Laptop)

Este método requiere una terminal en tu dispositivo (como la terminal integrada en una laptop).

1.  **Prepara una Carpeta de Trabajo:**
    *   Crea una carpeta temporal vacía, por ejemplo, `firebase-upload`.
    *   Mueve o copia tu carpeta `stimuli-assets` para que quede **dentro** de `firebase-upload`.
    La estructura final debe ser: `tu-dispositivo/firebase-upload/stimuli-assets/`.

2.  **Prepara la Terminal:**
    *   **Instala Firebase CLI:** Si no lo tienes, ejecuta: `npm install -g firebase-tools`
    *   **Inicia Sesión:** Autentícate con tu cuenta de Google: `firebase login`

3.  **Sube las Imágenes:**
    *   Navega a tu carpeta de trabajo: `cd ruta/a/firebase-upload`
    *   Una vez **dentro** de `firebase-upload`, ejecuta el comando universal:
    ```bash
    gsutil -m rsync -r stimuli-assets gs://academic-tracker-qeoxi.appspot.com/stimuli
    ```

¡Y listo! Con cualquiera de estos dos métodos, tus estímulos estarán en la nube, listos para ser usados por la aplicación.
