# API_INTEGRATION_SPECS.md

## 1. Objetivo y Alcance
Este documento define la interfaz de comunicación entre el sistema de gestión académica (Academic Tracker) y el ecosistema de salud mental (PIGEC-130). El objetivo es automatizar la detección de riesgo educativo y facilitar la canalización clínica bajo un modelo de Blindaje Ético y Confidencialidad Unidireccional.

## 2. Definición de Tipos (TypeScript)
Para asegurar la integridad de los datos, ambos sistemas deben implementar estas interfaces:

```typescript
// Tipos compartidos para la integración
export type RiskFlag = 'RIESGO_ASISTENCIA' | 'RIESGO_ACADEMICO' | 'RIESGO_EJECUTIVO' | 'RIESGO_CONDUCTUAL';

export interface StudentReferral {
  student_id: string;        // ID de Firestore (Academic Tracker)
  timestamp: string;         // ISO 8601
  academic_data: {
    average: number;         // Riesgo si < 6.0
    attendance_rate: number; // Alerta si < 85%
    completion_rate: number; // Actividades < 60% indica falla ejecutiva
  };
  flags: RiskFlag[];
  log_summary: string[];     // Últimas observaciones de bitácora
}

// Respuesta esperada de PIGEC-130 tras una canalización exitosa
export interface IntakeResponse {
  clinical_status: 'pendiente' | 'en_seguimiento' | 'concluido';
  pedagogical_instructions?: string;
  last_update: string;
}
```

## 3. Diccionario de Banderas de Riesgo (Protocolo CBTA-130)

| Flag | Condición Disparadora | Fundamento Metodológico |
|---|---|---|
| **RIESGO_ASISTENCIA** | Inasistencia > 15% en el parcial. | Predictor de abandono y desmotivación. |
| **RIESGO_ACADEMICO** | Promedio < 6.0 o caída de 2 pts. | Indicador de crisis de adaptación o familiar. |
| **RIESGO_EJECUTIVO** | Entrega de tareas < 60%. | Sugiere déficit en Planificación y Memoria de Trabajo (Funciones Ejecutivas). |
| **RIESGO_CONDUCTUAL** | IA detecta palabras clave en bitácora. | "Aislamiento", "Irritabilidad", "Somnolencia", "Conflicto". |

## 4. Flujo de Comunicación (Endpoints)

### A. Canalización (Academic Tracker -> PIGEC-130)
*   **Propósito:** Enviar datos de un estudiante identificado en riesgo para iniciar su expediente clínico.
*   **Método:** `POST`
*   **Endpoint:** `/api/v1/clinical/intake`
*   **Seguridad:** `Bearer Token` (JWT generado por Firebase Auth).
*   **Payload:** Ver interfaz `StudentReferral`.

### B. Retroalimentación Pedagógica (PIGEC-130 -> Academic Tracker)
*   **Propósito:** Actualizar el estado de seguimiento y dar pautas al docente sin revelar datos clínicos.
*   **Método:** `PATCH` (o webhook)
*   **Endpoint:** `/api/academic/student-status` (Endpoint a crear en Academic Tracker)
*   **Blindaje Ético:** El payload **SOLO** puede contener:
    *   Estatus del semáforo (Pendiente, En Proceso, Concluido).
    *   Recomendaciones de aula (ej. "Técnicas de estudio sugeridas", "Ubicación preferencial").
    *   **NUNCA** diagnósticos clínicos (ej. TDAH, Depresión).

## 5. Manejo de Errores

*   **Error 401 (Unauthorized):** El token de Firebase ha expirado o no es válido. Requiere re-autenticación del servicio.
*   **Error 403 (Forbidden):** Intento de acceso a datos clínicos desde una cuenta no autorizada (ej. entorno docente intentando leer detalles clínicos). Bloquear IP y generar log de seguridad.
*   **Error 422 (Unprocessable Entity):** El `student_id` no corresponde a un alumno válido o faltan datos obligatorios en el payload.

## 6. Próximos Pasos para Implementación

1.  **Definición de Interfaces:** Incorporar `StudentReferral` y `RiskFlag` en `src/lib/definitions.ts`.
2.  **Lógica de Detección:** Crear `src/lib/risk-analysis.ts` para calcular los flags automáticamente basados en los datos del parcial actual.
3.  **Integración UI:** Añadir botón "Derivar a Orientación" en `src/app/students/[studentId]/page.tsx` (protegido por rol/feature flag).
