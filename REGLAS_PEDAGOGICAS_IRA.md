# REGLAS PEDAGÓGICAS DEL SISTEMA IRA v3.1
## Sistema de Intervención y Evaluación para Estudiantes del CBTa 130

**Documento Técnico de Referencia**  
**Fecha de elaboración:** 20 de marzo de 2026  
**Versión:** 3.1 (Solo Factores Académicos)

---

## 1. FUNDAMENTOS DEL SISTEMA

### 1.1 Propósito del Sistema IRA

El Sistema IRA (Índice de Riesgo Académico) es un motor de análisis predictivo diseñado para identificar estudiantes en riesgo de reprobación o deserción escolar. El sistema fue desarrollado específicamente para el contexto educativo del CBTa 130, considerando las particularidades de la educación media superior tecnológica en México.

### 1.2 Principios Rectores

1. **Intervención Preventiva**: El sistema está diseñado para generar alertas tempranas que permitan acciones correctivas antes de que el estudiante falle definitivamente.

2. **Confidencialidad Clínica**: Los factores clínicos (GAD-7, Neuropsi) NO se utilizan para generar alertas de riesgo. Esta información es manejada exclusivamente por el personal clínico de PIGEC-130.

3. **Factor de Confianza Progresivo**: El sistema reconoce que no es justo evaluar el riesgo con datos insuficientes. Las alertas se ajustan automáticamente según la cantidad de información disponible.

4. **Transparencia**: Todas las recomendaciones incluyen justificaciones claras que el docente puede entender y actuar.

---

## 2. MOTOR DE CÁLCULO DE RIESGO

### 2.1 Factores Académicos Considerados

El sistema IRA v3.1 utiliza EXCLUSIVAMENTE cuatro factores académicos:

| Factor | Descripción | Rango | Peso Relativo |
|--------|-------------|-------|---------------|
| **Asistencia** | Tasa de asistencia acumulada | 0-100% | 1.8 |
| **Calificación** | Promedio actual del parcial/semestre | 0-100 | 1.2 (binario) + 0.8 (continuo) |
| **Tasa de Actividades** | Proporción de actividades entregadas | 0-1 | 0.6 |
| **Tasa de Participación** | Proporción de participaciones registradas | 0-1 | 0.4 |

### 2.2 Modelo Matemático

El sistema utiliza regresión logística para calcular la probabilidad de riesgo. La fórmula base es:

```
Z = B0 + B1(x1) + B2(x2) + B3(x3) + B4(x4) + B5(x5)
```

Donde:
- **B0 (Intercepto)**: -3.5 (valor conservador para reducir falsos positivos)
- **B1**: 1.8 × (tasa de inasistencia normalizada)
- **B2**: 1.2 × (1 si calificación ≤ 70, 0 si no)
- **B3**: 0.8 × ((100 - calificación) / 100)
- **B4**: 0.6 × (1 - tasa de actividades)
- **B5**: 0.4 × (1 - tasa de participación)

La probabilidad final se obtiene aplicando la función sigmoide:
```
Probabilidad = 1 / (1 + e^(-Z)) × 100
```

### 2.3 Riesgos Diferenciados

El sistema calcula dos tipos de riesgo independientes:

#### 2.3.1 Riesgo de Reprobación

Fórmula:
```
Z_reprobación = 3.0 + (-0.05 × calificación) + (-2.0 × tasa_actividades) + (-0.8 × tasa_participación)
```

Factores determinantes:
- Calificación actual (peso mayor)
- Entrega de actividades (indicador de compromiso académico)
- Participación en clase

#### 2.3.2 Riesgo de Abandono

Fórmula:
```
Z_abandono = -2.0 + (-0.04 × (asistencia - 70)) + (-1.2 × tasa_participación)
```

Factores determinantes:
- Tasa de asistencia (peso mayor)
- Tendencia de asistencia (pendiente negativa indica deterioro)
- Participación en clase (indicador de conexión con el grupo)

---

## 3. FACTOR DE CONFIANZA PROGRESIVO

### 3.1 Justificación Pedagógica

Un problema detectado en versiones anteriores era que con pocas clases registradas, una sola falta podía generar alertas severas injustificadas. Por ejemplo: con 4 clases, 1 falta = 25% de inasistencia, lo cual disparaba alertas de "alto riesgo" cuando el estudiante simplemente tuvo una ausencia aislada.

### 3.2 Umbrales de Confianza

El sistema implementa tres umbrales mínimos:

| Tipo de Dato | Mínimo para Confianza | Observaciones |
|--------------|----------------------|---------------|
| Clases | 8 clases (~2 semanas) | Base para calcular riesgo de abandono |
| Actividades | 3 actividades | Base para calcular riesgo de reprobación |
| Participaciones | 3 registros | Complementa ambos riesgos |

### 3.3 Cálculo del Factor de Confianza

```
Factor_Clases = min(1, total_clases / 20)
Factor_Actividades = min(1, total_actividades / 5)
Factor_Participaciones = min(1, total_participaciones / 5)

Factor_Confianza = (Factor_Clases × 0.5 + Factor_Actividades × 0.3 + Factor_Participaciones × 0.2) / 1.0
```

### 3.4 Aplicación del Factor

- **En inicio de curso** (datos insuficientes):
  - El riesgo máximo se limita al nivel MEDIO
  - Se muestra indicador visual: "[Inicio de curso - monitorear evolución]"
  - El riesgo calculado se multiplica por un factor mínimo de 0.2

- **Con datos suficientes**:
  - El riesgo se ajusta gradualmente: `Riesgo × (0.3 + 0.7 × Factor_Confianza)`

---

## 4. NIVELES DE RIESGO Y RESPUESTAS

### 4.1 Umbrales de Clasificación

| Nivel | IRA Score | Riesgo Reprobación | Riesgo Abandono |
|-------|-----------|-------------------|-----------------|
| **BAJO** | < 40% | < 40% | < 40% |
| **MEDIO** | 40-69% | 40-69% | 40-69% |
| **ALTO** | ≥ 70% | ≥ 70% | ≥ 70% |

### 4.2 Respuestas por Nivel

#### Nivel BAJO
**Justificación típica:** "Sin factores de riesgo académico detectados"
**Recomendación:** "Mantener monitoreo preventivo."
**Acción:** Seguimiento ordinario, sin intervención especial.

#### Nivel MEDIO
**Justificaciones típicas:**
- "Inasistencias acumuladas (X%)"
- "Promedio en riesgo (X.X)"
- "Actividades pendientes (X%)"
- "Baja participación en clase"

**Recomendaciones:**
- Si asistencia < 85%: "Monitorear asistencia. Considerar plática con el estudiante."
- Si calificación < 70%: "Refuerzo académico recomendado. Ofrecer apoyo adicional."
- En inicio de curso: "Seguimiento preventivo. Monitorear evolución en las próximas semanas."
- General: "Aplicar apoyos focalizados: retroalimentación personalizada."

#### Nivel ALTO
**Requiere:** Activación del protocolo de seguimiento institucional.

**Si Riesgo de Abandono > Riesgo de Reprobación:**
```
"ALERTA DE DESERCIÓN: Iniciar protocolo de seguimiento. Contactar tutor y documentar en Bitácora."
```
Acción prioritaria: Localizar al estudiante, contactar tutor legal, verificar situación familiar.

**Si Riesgo de Reprobación > Riesgo de Abandono:**
```
"RIESGO DE REPROBACIÓN: Implementar plan de apoyo académico. Revisar actividades pendientes."
```
Acción prioritaria: Identificar materias en riesgo, establecer compromisos de entrega, ofrecer asesorías.

---

## 5. SISTEMA DE BANDERAS (FLAGS)

### 5.1 Tipos de Banderas

El sistema puede asignar las siguientes banderas de alerta:

| Bandera | Código | Criterio de Activación |
|---------|--------|----------------------|
| Riesgo de Asistencia | `RIESGO_ASISTENCIA` | Abandono > 60% O Asistencia < 85% |
| Riesgo Académico | `RIESGO_ACADEMICO` | Reprobación > 60% |
| Riesgo Ejecutivo | `RIESGO_EJECUTIVO` | Tasa de actividades < 60% |
| Riesgo Conductual | `RIESGO_CONDUCTUAL` | Palabras clave en observaciones |

### 5.2 Palabras Clave para Riesgo Conductual

El sistema detecta automáticamente patrones en las observaciones de bitácora:
- Aislamiento: "aislado", "aislamiento"
- Irritabilidad: "irritable", "irritabilidad"
- Conflicto: "conflictivo", "agresivo"
- Atención: "distraído", "instrucciones", "duerme", "sueño"
- Estado de ánimo: "desmotivado", "triste", "ansiedad", "llanto"

---

## 6. INTEGRACIÓN CON PIGEC-130

### 6.1 Principio de Privacidad

Los datos clínicos (GAD-7, Neuropsi, BDI-2) son manejados EXCLUSIVAMENTE por el personal clínico de la plataforma PIGEC-130. El Sistema IRA NO utiliza estos datos para cálculos de riesgo.

### 6.2 Flujo de Información

```
┌─────────────────┐        ┌─────────────────┐
│   PIGEC-130     │        │  Sistema IRA    │
│  (Clínico)      │        │  (Académico)    │
├─────────────────┤        ├─────────────────┤
│ Tamizajes       │        │ Asistencia      │
│ GAD-7, Neuropsi │        │ Calificaciones  │
│ Diagnósticos    │        │ Actividades     │
└────────┬────────┘        └────────┬────────┘
         │                          │
         │  Estrategias Pedagógicas │
         │  (sin datos diagnósticos)│
         └──────────────────────────┘
                    │
                    ▼
         ┌─────────────────┐
         │   Bitácora del  │
         │   Estudiante    │
         └─────────────────┘
```

### 6.3 Tipo de Inyección PIGEC

PIGEC-130 puede inyectar "estrategias pedagógicas" en la bitácora del estudiante. Estas aparecen como observaciones de tipo "Pedagógico" con el prefijo "Sugerencia:".

Ejemplos:
- "Sugerencia: Proporcionar instrucciones por escrito y segmentar tareas complejas para reducir la carga cognitiva."
- "Sugerencia: Uso de organizadores gráficos y recordatorios visuales para fortalecer la planeación."
- "Sugerencia: Ubicación preferencial al frente del aula y claves gestuales para redirigir la atención."

### 6.4 Impacto en el Riesgo

Cuando se detecta una inyección de PIGEC, el sistema automáticamente:
1. Eleva el nivel de riesgo a ALTO
2. Muestra mensaje: "Riesgo detectado por vulnerabilidad externa. Consultar Bitácora para estrategias de apoyo."
3. El docente NO ve el diagnóstico clínico, solo las estrategias sugeridas.

---

## 7. PROTOCOLOS DE INTERVENCIÓN

### 7.1 Tipos de Acción de Seguimiento

El sistema permite registrar las siguientes acciones de intervención:

| Código | Tipo de Acción | Uso Recomendado |
|--------|---------------|-----------------|
| `call_tutor` | Llamada a Tutor | Primer contacto por inasistencias |
| `call_student` | Llamada a Estudiante | Verificación directa |
| `whatsapp_tutor` | WhatsApp Tutor | Comunicación informal inicial |
| `whatsapp_student` | WhatsApp Estudiante | Recordatorios |
| `home_visit` | Visita Domiciliaria | Casos de abandono confirmado |
| `citatorio` | Citatorio | Requisito administrativo |
| `other` | Otro | Cualquier otra acción |

### 7.2 Resultados de Intervención

| Código | Resultado | Significado |
|--------|-----------|-------------|
| `no_answer` | Sin respuesta | No se pudo contactar |
| `justified` | Justificado | La ausencia tiene justificación válida |
| `agreement` | Acuerdo / Compromiso | Se estableció compromiso con el estudiante/tutor |
| `continuing_monitor` | En seguimiento | Requiere seguimiento continuo |
| `student_found` | Estudiante contactado | Comunicación exitosa |

### 7.3 Documentación Requerida

Toda intervención debe documentarse con:
1. Fecha y hora
2. Tipo de acción
3. Resultado obtenido
4. Notas adicionales (detalles de la conversación, acuerdos)

---

## 8. GENERACIÓN DE INFORMES

### 8.1 Retroalimentación Individual (IA)

El sistema utiliza Gemini 1.5 Flash (vía Cloud Run) para generar retroalimentación personalizada para cada estudiante. El prompt incluye:
- Nombre del estudiante
- Período evaluado
- Calificación final
- Tasa de asistencia
- Desglose por criterios de evaluación
- Observaciones de bitácora

### 8.2 Análisis Grupal (IA)

Para reportes de grupo, el sistema genera:
- Resumen estadístico (aprobados, reprobados, promedio)
- Análisis de tendencias de asistencia
- Identificación de patrones de riesgo
- Recomendaciones pedagógicas generales

### 8.3 Informe de Seguimiento (PDF)

El sistema puede generar documentos PDF que incluyen:
- Resumen de inasistencias (total, mes, semana)
- Nivel de riesgo calculado
- Historial de intervenciones
- Firma digital del responsable

---

## 9. CONFIGURACIÓN DEL SISTEMA

### 9.1 Variables de Entorno Requeridas

| Variable | Propósito | Configurada en |
|----------|-----------|----------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Autenticación Firebase | Vercel |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación | Vercel |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto | Vercel |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Almacenamiento | Vercel |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Mensajería | Vercel |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID de aplicación | Vercel |
| `NEXT_PUBLIC_CLOUD_RUN_ENDPOINT` | Servicio de IA | Vercel |

### 9.2 Servicios Dependientes

1. **Firebase Firestore**: Base de datos principal
2. **Firebase Authentication**: Gestión de usuarios
3. **Cloud Run**: Servicio de IA (Gemini)
4. **Vercel**: Plataforma de despliegue

---

## 10. MANTENIMIENTO Y EVOLUCIÓN

### 10.1 Ajustes Recomendados

- Los coeficientes del modelo pueden ajustarse según datos históricos reales del plantel.
- Los umbrales de confianza pueden modificarse según la duración real de los parciales.
- Las palabras clave de riesgo conductual pueden expandirse según observaciones de los docentes.

### 10.2 Métricas de Validación

Se recomienda monitorear:
- Falsos positivos (alertas que no resultaron en reprobación/abandono)
- Falsos negativos (casos no detectados que resultaron en reprobación/abandono)
- Tiempo promedio entre alerta e intervención

### 10.3 Historial de Versiones

| Versión | Fecha | Cambios Principales |
|---------|-------|---------------------|
| 1.0 | 2024 | Sistema IRC original con factores clínicos |
| 2.0 | 2025 | Agregado factor de riesgo ejecutivo |
| 3.0 | Mar 2026 | Separación de riesgos (reprobación/abandono), deprecación de factores clínicos |
| 3.1 | Mar 2026 | Factor de confianza progresivo, umbrales más conservadores |

---

## 11. REFERENCIAS TÉCNICAS

### 11.1 Archivos Fuente

- `src/lib/irc-calculation.ts` - Motor de cálculo IRA
- `src/lib/risk-analysis.ts` - Análisis de riesgo extendido
- `src/components/student-tracking-dialog.tsx` - Interfaz de seguimiento
- `src/app/admin/risk-diagnostic/page.tsx` - Diagnóstico del sistema

### 11.2 Colecciones Firestore

- `groups` - Grupos/materias
- `students` - Perfiles de estudiantes
- `tracking_logs` - Registro de intervenciones
- `student_observations` - Bitácora de observaciones
- `absences` - Registro de inasistencias
- `pedagogical_strategies` - Estrategias PIGEC

---

**Documento elaborado como parte del Sistema de Alerta Temprana del CBTa 130**  
**Para uso del personal docente y administrativo**
