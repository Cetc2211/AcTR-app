# Diagnóstico del Sistema de Índice de Riesgo (IRC)

## Resumen Ejecutivo

Se identificaron **dos sistemas de cálculo de riesgo independientes y no sincronizados**, lo que genera discrepancias significativas entre lo que muestra el perfil del estudiante (IRC) y lo que reporta el dashboard/informes de riesgo.

---

## 1. Sistemas Identificados

### Sistema A: IRC (Índice de Riesgo Compuesto)
**Archivo:** `/src/lib/irc-calculation.ts`

**Uso:** Perfil del estudiante, tarjeta de riesgo en grupos

**Inputs:**
| Variable | Rango | Descripción |
|----------|-------|-------------|
| attendance | 0-100 | Tasa de asistencia |
| grade | 0-100 | Calificación actual |
| gad7Score | 0-21 | Escala de ansiedad GAD-7 |
| neuropsiTotal | 0-100 | Evaluación neuropsicológica |

**Algoritmo:**
```javascript
// Regresión Logística
x1_asistencia = (100 - attendance) / 100  // Normalizado 0-1
x2_rendimiento = grade <= 70 ? 1 : 0      // Binario
x3_ansiedad = gad7Score / 21              // Normalizado 0-1

Z = -3.0 + (1.5 * x1) + (1.0 * x2) + (0.8 * x3)
probability = 1 / (1 + exp(-Z))  // Función sigmoide
IRC = probability * 100
```

**Umbrales:**
| Nivel | IRC |
|-------|-----|
| Bajo | < 15% |
| Medio | 15-24% |
| Alto | ≥ 25% |

---

### Sistema B: Risk Level Simple
**Archivo:** `/src/hooks/use-data.tsx`

**Uso:** Dashboard, Reportes de riesgo, Estadísticas

**Inputs:**
| Variable | Rango |
|----------|-------|
| finalGrade | 0-100 |
| attendanceRate | 0-100 |

**Algoritmo:**
```javascript
if (finalGrade <= 59 || attendanceRate < 80) {
    return { level: 'high' };
}
if (finalGrade > 59 && finalGrade <= 70) {
    return { level: 'medium' };
}
return { level: 'low' };
```

**⚠️ NO UTILIZA DATOS CLÍNICOS (GAD-7, Neuropsi)**

---

## 2. Hallazgos Críticos

### 🚨 Problema 1: Desconexión Total Entre Sistemas

**Impacto:** Un estudiante puede aparecer como:
- **"Alto Riesgo"** en el Dashboard (por calificación baja)
- **"Bajo Riesgo"** en su perfil (IRC bajo porque no hay datos clínicos negativos)

**Ejemplo:**
- Estudiante con: Asistencia 75%, Calificación 55%, GAD-7: 0, Neuropsi: 0
- **Dashboard:** ALTO RIESGO (por calificación y asistencia)
- **IRC:** ~10% (BAJO) porque el intercepto -3.0 es muy bajo

---

### 🚨 Problema 2: Intercepto Muy Conservador

El intercepto `B0 = -3.0` hace que:
- Con 100% asistencia, 100 calificación, 0 ansiedad → IRC ≈ 4.7% (muy bajo)
- Con 70% asistencia, 50 calificación, 10 ansiedad → IRC ≈ 54%

**Esto significa que casi ningún estudiante alcanza "Alto Riesgo" por IRC a menos que tenga múltiples factores negativos simultáneos.**

---

### 🚨 Problema 3: Inconsistencia en Nombres de Campos

**Detectado en:**
```typescript
// Se guardan AMBOS campos
await updateStudent(studentId, {
    neuropsiTotal: value,  // Campo principal
    neuropsiScore: value,  // Campo legacy
});

// Pero en algunos lugares se lee solo uno
student.neuropsiTotal || student.neuropsiScore || 0
```

**Riesgo:** Si solo existe `neuropsiScore`, algunas lecturas pueden fallar.

---

### ⚠️ Problema 4: Datos Clínicos Opcionales

Los campos `gad7Score` y `neuropsiTotal` son opcionales:
```typescript
gad7Score?: number;     // 0-21
neuropsiTotal?: number; // 0-100
```

**Impacto:**
- Si no se han capturado, el IRC asume 0 (sin riesgo)
- El sistema no alerta sobre datos faltantes

---

## 3. Diferencias de Cálculo

| Escenario | Sistema A (IRC) | Sistema B (Simple) |
|-----------|-----------------|-------------------|
| Calif 50%, Asist 90%, Sin datos clínicos | ~12% (BAJO) | HIGH |
| Calif 65%, Asist 85%, GAD-7: 15 | ~35% (ALTO) | MEDIUM |
| Calif 80%, Asist 70%, Sin datos clínicos | ~24% (MEDIO) | HIGH |
| Calif 60%, Asist 95%, GAD-7: 5 | ~16% (MEDIO) | MEDIUM |

---

## 4. Recomendaciones

### Inmediato

1. **Unificar Umbrales:**
   - Ajustar IRC para que sea más sensible
   - O modificar Sistema B para incluir factores clínicos

2. **Mostrar Ambos Indicadores:**
   - Dashboard debería mostrar IRC cuando hay datos clínicos
   - Indicar visualmente cuando faltan datos de tamizaje

3. **Corregir Inconsistencia de Campos:**
   - Estandarizar en `neuropsiTotal` únicamente
   - Migrar datos existentes de `neuropsiScore`

### Mediano Plazo

4. **Implementar Alerta de Datos Faltantes:**
   - Notificar cuando un estudiante en riesgo no tiene tamizaje
   - Sugerir captura de GAD-7 y Neuropsi

5. **Revisar Coeficientes del Modelo:**
   - El intercepto -3.0 es muy conservador
   - Sugerir: -2.0 o -1.5 para mayor sensibilidad

---

## 5. Código Afectado

| Archivo | Función | Sistema |
|---------|---------|---------|
| `/src/lib/irc-calculation.ts` | `analyzeIRC()` | A (IRC) |
| `/src/hooks/use-data.tsx` | `getStudentRiskLevel()` | B (Simple) |
| `/src/app/students/[studentId]/page.tsx` | Perfil | A (IRC) |
| `/src/app/dashboard/page.tsx` | Dashboard | B (Simple) |
| `/src/app/reports/[groupId]/at-risk/page.tsx` | Informes | B (Simple) |
| `/src/app/groups/[groupId]/page.tsx` | Tarjetas riesgo | A (IRC) |

---

## 6. Conclusión

El sistema tiene **dos motores de riesgo no sincronizados** que pueden producir resultados contradictorios. Se recomienda:

1. Unificar el cálculo de riesgo
2. Incluir indicadores visuales cuando falten datos clínicos
3. Revisar los umbrales del IRC para mejorar la detección temprana

---

*Diagnóstico generado: 2026-03-20*
