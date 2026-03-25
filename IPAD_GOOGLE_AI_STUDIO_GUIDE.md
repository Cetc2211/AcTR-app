# GUÍA PARA ABRIR EL PROYECTO EN GOOGLE AI STUDIO (iPad)

## Opción 1: Desde GitHub Directamente

1. **Abrir Safari en iPad**
2. **Navegar a:** https://github.com/Cetc2211/AcTR-app
3. **Google AI Studio detectará automáticamente el proyecto**
4. **Click en "Open in Google AI Studio"** (si aparece el botón)

---

## Opción 2: Configuración Manual en Google AI Studio

### Paso 1: Acceder a Google AI Studio
- URL: https://aistudio.google.com

### Paso 2: Importar Proyecto
1. Click en **"New Project"** o **"Import from GitHub"**
2. Ingresar URL del repositorio:
   ```
   https://github.com/Cetc2211/AcTR-app.git
   ```
3. Seleccionar rama: **main**

### Paso 3: Configurar Variables de Entorno

En Google AI Studio, ir a **Settings > Environment Variables** y agregar:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBliGErw1WiGhY6lZeCSh6WU0Kg2ZK7oa0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=academic-tracker-qeoxi.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=academic-tracker-qeoxi
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=academic-tracker-qeoxi.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=263108580734
NEXT_PUBLIC_FIREBASE_APP_ID=1:263108580734:web:316c14f8e71c20aa038f2f
NEXT_PUBLIC_CLOUD_RUN_ENDPOINT=https://ai-report-service-jjaeoswhya-uc.a.run.app
```

### Paso 4: Instalar Dependencias

En la terminal de Google AI Studio:
```bash
npm install
```

### Paso 5: Ejecutar en Modo Desarrollo

```bash
npm run dev
```

Google AI Studio expondrá el puerto 3000 con una URL pública.

---

## Opción 3: Usar la Aplicación Directamente (Sin Desarrollo)

Si solo necesitas **USAR** la aplicación (no modificar código):

1. **Abrir Safari en iPad**
2. **Navegar a:** https://actr-app.vercel.app
3. **Agregar a Pantalla de Inicio:**
   - Tap en el botón de compartir (cuadrado con flecha)
   - Seleccionar "Añadir a Pantalla de Inicio"

---

## Notas Importantes para iPad

### Limitaciones conocidas:
- El desarrollo directo en iPad tiene limitaciones de memoria
- Se recomienda usar Google AI Studio solo para cambios menores
- Para cambios significativos, usar una computadora

### Funcionalidades que SÍ funcionan en iPad:
- ✅ Ver y editar código
- ✅ Ejecutar el servidor de desarrollo
- ✅ Ver cambios en tiempo real
- ✅ Hacer commits a GitHub

### Funcionalidades LIMITADAS en iPad:
- ⚠️ npm install puede ser lento
- ⚠️ Build de producción puede fallar por memoria
- ⚠️ Algunos atajos de teclado no funcionan

---

## Verificar que el Proyecto Funciona

Una vez ejecutado `npm run dev`, verificar:

1. **Consola sin errores**
2. **Abrir la URL proporcionada** por Google AI Studio
3. **Verificar la conexión a Firebase:**
   - Ir a la página de login
   - Intentar iniciar sesión
   - Si funciona, la configuración es correcta

---

## Solución de Problemas

### Error: "Module not found"
```bash
rm -rf node_modules
npm install
```

### Error: "Firebase: Error (auth/...)"
- Verificar que las variables de entorno estén configuradas
- Verificar que el proyecto Firebase esté activo

### Error: "Cloud Run timeout"
- Verificar conexión a internet
- El servicio puede tardar unos segundos en "despertar"

---

## Contacto y Soporte

- **Repositorio:** https://github.com/Cetc2211/AcTR-app
- **Producción:** https://actr-app.vercel.app
- **Documentación:** Ver archivos `REGLAS_PEDAGOGICAS_IRA.md` y `VERIFICACION_SECRETOS_VERCEL.md`
