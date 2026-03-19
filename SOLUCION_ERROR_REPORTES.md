# Solución: Error al Enviar Reporte de Faltas

El error "No se pudo enviar el reporte a la base de datos" ocurre porque, al cambiar al nuevo proyecto (`academic-tracker-qeoxi`), las **Reglas de Seguridad de la Base de Datos** en la nube probablemente no están configuradas para permitir guardar los reportes de asistencia.

Por defecto, Firebase bloquea las escrituras si no se configuran las reglas explícitamente.

## Pasos para Solucionar

Tienes que actualizar las reglas de seguridad en la Consola de Firebase del nuevo proyecto.

1.  Ve a la **Firebase Console** de `academic-tracker-qeoxi`:
    *   [https://console.firebase.google.com/project/academic-tracker-qeoxi/firestore/rules](https://console.firebase.google.com/project/academic-tracker-qeoxi/firestore/rules)
2.  Asegúrate de estar en la pestaña **Cloud Firestore** -> **Reglas** (Rules).
3.  Borra lo que haya ahí y pega exactamente este código:

```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regla para datos de usuario (calificaciones, grupos, etc.)
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regla CRÍTICA para reportes de asistencia
    // Esta es la que falta o está bloqueada actualmente
    match /absences/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4.  Haz clic en **Publicar** (Publish).

## Paso Adicional: Verificar Sesión

Después de publicar las reglas:
1.  En tu aplicación (iPad/Web), **Cierra Sesión** y vuelve a entrar.
2.  Intenta enviar el reporte de nuevo.

Esto debería solucionar el error inmediatamente.
