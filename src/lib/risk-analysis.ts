import { Student, PartialData, EvaluationCriteria, RiskFlag } from './placeholder-data';

export type RiskAnalysisResult = {
    studentId: string;
    studentName: string;
    currentGrade: number; // Calificación normalizada (0-100) basada en lo evaluado hasta hoy
    projectedGrade: number;
    currentAttendance: number;
    projectedAttendance: number;
    missedActivitiesCount: number;
    lowParticipation: boolean;
    failingRisk: number; // Probabilidad 0-100% (Modelo Logístico)
    dropoutRisk: number; // Probabilidad 0-100% (Modelo Logístico)
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    predictionMessage: string;
    pigecFlags: RiskFlag[];
    isRecovery?: boolean;
};

// Palabras clave para riesgo conductual (PIGEC-130 Nivel 1)
const BEHAVIORAL_RISK_KEYWORDS = [
    'aislado', 'aislamiento', 'irritable', 'irritabilidad', 'conflictivo', 'agresivo',
    'distraído', 'instrucciones', 'duerme', 'sueño', 'desmotivado', 'triste', 'ansiedad', 'llanto'
];

/**
 * Función Sigmoide para regresión logística simplificada.
 * Convierte un valor 'z' (suma ponderada de factores) en una probabilidad entre 0 y 1.
 */
const sigmoid = (z: number): number => {
    return 1 / (1 + Math.exp(-z));
};

export const calculatePIGECFlags = (
    failingProbability: number,
    dropoutProbability: number,
    activityCompletionRate: number,
    attendanceRate: number,
    observations: string[]
): RiskFlag[] => {
    const flags: RiskFlag[] = [];

    // Usamos las probabilidades calculadas en lugar de cortes duros simples
    if (dropoutProbability > 60 || attendanceRate < 85) {
        flags.push('RIESGO_ASISTENCIA');
    }

    if (failingProbability > 60) {
        flags.push('RIESGO_ACADEMICO');
    }

    // Riesgo Ejecutivo: Falla en entregar tareas (Planificación/Memoria)
    if (activityCompletionRate < 0.6) {
        flags.push('RIESGO_EJECUTIVO');
    }

    const hasBehavioralKeywords = observations.some(obs => 
        BEHAVIORAL_RISK_KEYWORDS.some(keyword => obs.toLowerCase().includes(keyword))
    );
    if (hasBehavioralKeywords) {
        flags.push('RIESGO_CONDUCTUAL');
    }

    return flags;
};

export const analyzeStudentRisk = (
    student: Student,
    partialData: PartialData,
    criteria: EvaluationCriteria[],
    totalClassesSoFar: number,
    // totalActivitiesSoFar ya no se pasa fijo, se calcula dinámicamente según fechas
    recentObservations: string[] = [],
    semesterGradeOverride?: number
): RiskAnalysisResult => {
    
    const now = new Date();

    // -------------------------------------------------------------------------
    // 1. Análisis de Asistencia (Tendencia Lineal)
    // -------------------------------------------------------------------------
    const attendanceDays = Object.keys(partialData.attendance || {}).sort();
    const attendedDays = attendanceDays.filter(d => partialData.attendance[d][student.id]).length;
    
    // Si no hay días registrados, asumimos 100% de asistencia (beneficio de la duda al inicio)
    // En lugar de usar totalClassesSoFar (que es teórico), usamos attendanceDays.length (real registrado)
    const totalRegisteredDays = attendanceDays.length;
    const currentAttendance = totalRegisteredDays > 0 ? (attendedDays / totalRegisteredDays) * 100 : 100;
    
    // Regresión lineal simple para la pendiente de asistencia
    // x = tiempo, y = asistencia (1 o 0)
    let attendanceSlope = 0;
    if (attendanceDays.length >= 3) {
        const n = attendanceDays.length;
        // Tomamos los últimos 10 registros para la tendencia reciente
        const recentDays = attendanceDays.slice(-10); 
        const x = Array.from({length: recentDays.length}, (_, i) => i);
        const y = recentDays.map(d => partialData.attendance[d][student.id] ? 1 : 0);
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a: number, b: number) => a + b, 0);
        const sumXY = x.reduce((a: number, b, i) => a + b * y[i], 0);
        const sumXX = x.reduce((a: number, b) => a + b * b, 0);
        
        const denominator = (n * sumXX - sumX * sumX);
        if (denominator !== 0) {
            attendanceSlope = (n * sumXY - sumX * sumY) / denominator;
        }
    }

    // Proyección: Si la pendiente es negativa, penalizamos la proyección
    let projectedAttendance = currentAttendance;
    if (attendanceSlope < 0) {
        // Ejemplo: Si la pendiente es -0.1 (pierde asistencia cada 10 días), proyectamos caída
        projectedAttendance += (attendanceSlope * 20); // Proyección a futuro corto
    }
    projectedAttendance = Math.max(0, Math.min(100, projectedAttendance));

    // -------------------------------------------------------------------------
    // 2. Análisis Académico Progresivo (Solo lo vencido/evaluado)
    // -------------------------------------------------------------------------
    let totalWeightedEarned = 0;
    let totalWeightEvaluatedSoFar = 0; // El divisor dinámico
    
    let totalActivitiesDue = 0;
    let deliveredActivitiesCount = 0;

    criteria.forEach(c => {
        if (c.name === 'Actividades' || c.name === 'Portafolio') {
            const allActivities = partialData.activities || [];
            
            // Filtramos actividades que YA VECIERON o que el alumno YA ENTREGÓ
            // Esto evita que actividades futuras cuenten como "no entregadas"
            const relevantActivities = allActivities.filter(act => {
                // Si no hay fecha, asumimos que no ha vencido a menos que ya esté entregada
                if (!act.dueDate) return partialData.activityRecords?.[student.id]?.[act.id];
                
                const isPastDue = new Date(act.dueDate) <= now;
                const isDelivered = partialData.activityRecords?.[student.id]?.[act.id];
                return isPastDue || isDelivered;
            });

            const totalActsInScope = relevantActivities.length;
            totalActivitiesDue += totalActsInScope;

            if (totalActsInScope > 0) {
                // Contamos solo las relevantes
                const delivered = relevantActivities.filter(act => partialData.activityRecords?.[student.id]?.[act.id]).length;
                deliveredActivitiesCount += delivered;
                
                const ratio = delivered / totalActsInScope;
                totalWeightedEarned += ratio * c.weight;
                totalWeightEvaluatedSoFar += c.weight;
            }
            // Nota: Si no hay actividades vencidas, no sumamos al weightEvaluatedSoFar, 
            // así el promedio no se va a cero.
            
        } else if (c.name === 'Participación') {
            const totalParts = Object.keys(partialData.participations || {}).length;
            if (totalParts > 0) {
                const studentParts = Object.values(partialData.participations).filter((day: any) => day[student.id]).length;
                const ratio = studentParts / totalParts;
                totalWeightedEarned += ratio * c.weight;
                totalWeightEvaluatedSoFar += c.weight;
            }
        } else {
             // Exámenes / Proyectos
             const gradeDetail = partialData.grades?.[student.id]?.[c.id];
             
             // Solo contamos si hay una calificación registrada (diferente de null)
             // O si sabemos positivamente que ya pasó la fecha (aunque aquí no tenemos fecha por criterio, asumimos null = no evaluado aún)
             if (gradeDetail && gradeDetail.delivered !== null && gradeDetail.delivered !== undefined) {
                 const ratio = gradeDetail.delivered / c.expectedValue;
                 totalWeightedEarned += ratio * c.weight;
                 totalWeightEvaluatedSoFar += c.weight;
             }
        }
    });

    // Cálculo del promedio actual NORMALIZADO a 100
    // Si no se ha evaluado nada (inicio de parcial), el promedio es 100 (beneficio de la duda) o N/A
    let currentGrade = totalWeightEvaluatedSoFar > 0 
        ? (totalWeightedEarned / totalWeightEvaluatedSoFar) * 100 
        : 100;

    let isRecovery = false;

    // OVERRIDE: Si se proporciona un promedio semestral, lo usamos directamente
    if (semesterGradeOverride !== undefined) {
        currentGrade = semesterGradeOverride;
    } else {
        // VERIFICACIÓN DE RECUPERACIÓN (Solo si no hay override)
        // Si el estudiante tiene una calificación de recuperación aplicada, usamos esa calificación
        // para el cálculo de riesgo y visualización, en lugar del promedio reprobatorio.
        const recoveryData = partialData.recoveryGrades?.[student.id];
        if (recoveryData && recoveryData.applied && recoveryData.grade !== null) {
            currentGrade = recoveryData.grade;
            isRecovery = true;
        }
    }

    const missedActivitiesCount = totalActivitiesDue - deliveredActivitiesCount;
    const activityCompletionRate = totalActivitiesDue > 0 ? deliveredActivitiesCount / totalActivitiesDue : 1;

    // -------------------------------------------------------------------------
    // 3. Análisis Probabilístico (Regresión Logística Heurística)
    // -------------------------------------------------------------------------
    
    // --- Modelo de Riesgo de Reprobación (Failing Risk) ---
    // z = w0 + w1(Grade) + w2(ActivityRate) + w3(MissedCount)
    // w0 (Intercepto): 2.5 (Base baja probabilidad)
    // w1 (Grade): -0.08 (Cada punto de calificación reduce el riesgo significativamente)
    // w2 (ActivityRate): -3.0 (Baja entrega dispara riesgo)
    
    // Normalizamos grade a escala 0-100.
    // Si grade es 100 -> z baja mucho. Si grade es 50 -> z sube.
    const failingIntercept = 4.0; 
    const wGrade = -0.08; 
    const wActivity = -3.5; 

    // Ajuste: Si apenas empezamos (weightEvaluated < 10%), el modelo es menos agresivo
    const confidenceFactor = Math.min(1, totalWeightEvaluatedSoFar / 20); // Requiere al menos 20% evaluado para confianza total

    const zFailing = failingIntercept + (wGrade * currentGrade) + (wActivity * activityCompletionRate);
    
    // CORRECCIÓN: Si no hay datos evaluados, el riesgo debe ser 0, no 50% (sigmoid(0))
    let failingRisk = 0;
    if (totalWeightEvaluatedSoFar > 0) {
        failingRisk = sigmoid(zFailing * confidenceFactor) * 100;
    } else {
        // Si no hay nada evaluado, asumimos riesgo mínimo
        failingRisk = 0;
    }
    
    // Ajuste manual para casos críticos obvios
    if (currentGrade < 60 && totalWeightEvaluatedSoFar > 20) failingRisk = Math.max(failingRisk, 85);


    // --- Modelo de Riesgo de Abandono (Dropout Risk) ---
    // Factores: Asistencia (crítico), Pendiente de asistencia, Participación baja
    const dropoutIntercept = -2.0; // Base baja
    const wAttendance = -0.05; // 100% asistencia baja mucho el riesgo
    const wSlope = -10.0; // Pendiente negativa fuerte (-0.1) aumenta mucho el riesgo (-(-1) = +1)
    
    const totalParticipations = Object.keys(partialData.participations || {}).length;
    const studentParticipations = Object.values(partialData.participations || {}).filter((day: any) => day[student.id]).length;
    const participationRate = totalParticipations > 0 ? studentParticipations / totalParticipations : 1;
    const lowParticipation = participationRate < 0.3;

    const zDropout = dropoutIntercept + (wAttendance * (currentAttendance - 70)) + (wSlope * attendanceSlope);
    // (currentAttendance - 70) centra el efecto: >70 baja riesgo, <70 sube riesgo rápido
    
    let dropoutRisk = sigmoid(zDropout) * 100;
    
    // CORRECCIÓN: Si no hay asistencias registradas, el riesgo de abandono es 0
    if (attendanceDays.length === 0) {
        dropoutRisk = 0;
    }

    // Penalización extra por baja participación (indicador de desconexión)
    // Solo si ya hay participaciones registradas
    if (lowParticipation && totalParticipations > 0) dropoutRisk += 15;
    if (dropoutRisk > 100) dropoutRisk = 99;


    // -------------------------------------------------------------------------
    // 4. Determinar Nivel y Mensajes
    // -------------------------------------------------------------------------
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (dropoutRisk > 60 || failingRisk > 70) riskLevel = 'high';
    else if (dropoutRisk > 30 || failingRisk > 40) riskLevel = 'medium';

    const riskFactors = [];
    if (currentAttendance < 85) riskFactors.push(`Inasistencias críticas (${(100-currentAttendance).toFixed(0)}%)`);
    if (activityCompletionRate < 0.6) riskFactors.push(`Baja entrega de actividades (${(activityCompletionRate*100).toFixed(0)}%)`);
    if (attendanceSlope < -0.05) riskFactors.push('Tendencia de asistencia negativa');
    if (currentGrade < 60 && totalWeightEvaluatedSoFar > 10) riskFactors.push(`Promedio actual reprobatorio (${currentGrade.toFixed(1)})`);
    if (lowParticipation) riskFactors.push('Desconexión en clase (Baja participación)');

    let predictionMessage = "Rendimiento dentro de parámetros esperados.";
    if (riskLevel === 'high') {
        if (dropoutRisk > failingRisk) {
            predictionMessage = `ALERTA DE DESERCIÓN (${dropoutRisk.toFixed(0)}%): El patrón de inasistencias sugiere riesgo inminente de abandono.`;
        } else {
            predictionMessage = `RIESGO ACADÉMICO CRÍTICO (${failingRisk.toFixed(0)}%): Proyección de reprobación alta si no mejora entrega de actividades.`;
        }
    } else if (riskLevel === 'medium') {
        predictionMessage = "Se detectan señales tempranas de riesgo. Se recomienda intervención preventiva.";
    }

    // PIGEC-130 Flags integration
    const pigecFlags = calculatePIGECFlags(failingRisk, dropoutRisk, activityCompletionRate, currentAttendance, recentObservations);

    return {
        studentId: student.id,
        studentName: student.name,
        currentGrade,
        projectedGrade: currentGrade, // Por ahora igual, podría usarse la tendencia académica luego
        currentAttendance,
        projectedAttendance,
        missedActivitiesCount,
        lowParticipation,
        failingRisk,
        dropoutRisk,
        riskLevel,
        riskFactors,
        predictionMessage,
        pigecFlags,
        isRecovery
    };
};
