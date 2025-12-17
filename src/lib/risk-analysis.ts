import { Student, PartialData, EvaluationCriteria, AttendanceRecord, ActivityRecord, Grades, ParticipationRecord } from './placeholder-data';

export type RiskAnalysisResult = {
    studentId: string;
    studentName: string;
    currentGrade: number;
    projectedGrade: number;
    currentAttendance: number;
    projectedAttendance: number;
    missedActivitiesCount: number;
    lowParticipation: boolean;
    failingRisk: number; // 0-100 Probability
    dropoutRisk: number; // 0-100 Probability
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    predictionMessage: string;
};

export const analyzeStudentRisk = (
    student: Student,
    partialData: PartialData,
    criteria: EvaluationCriteria[],
    totalClassesSoFar: number,
    totalActivitiesSoFar: number
): RiskAnalysisResult => {
    
    // 1. Attendance Analysis
    const attendanceDays = Object.keys(partialData.attendance || {});
    const attendedDays = attendanceDays.filter(d => partialData.attendance[d][student.id]).length;
    const currentAttendance = totalClassesSoFar > 0 ? (attendedDays / totalClassesSoFar) * 100 : 100;
    
    // Simple Linear Regression for Attendance Trend (if enough data)
    // We map dates to indices 0, 1, 2...
    // y = mx + b (y = 1 for present, 0 for absent)
    let attendanceSlope = 0;
    if (attendanceDays.length >= 3) {
        const n = attendanceDays.length;
        const x = Array.from({length: n}, (_, i) => i);
        const y: number[] = attendanceDays.map(d => partialData.attendance[d][student.id] ? 1 : 0);
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumXX = x.reduce((a, b) => a + b * b, 0);
        
        const denominator = (n * sumXX - sumX * sumX);
        if (denominator !== 0) {
            attendanceSlope = (n * sumXY - sumX * sumY) / denominator;
        }
    }

    // Project Attendance (Heuristic: continue trend or current average)
    // If slope is negative, attendance is declining.
    let projectedAttendance = currentAttendance;
    if (attendanceSlope < 0) {
        projectedAttendance += (attendanceSlope * 100); // Penalize projection by slope magnitude
    }
    
    // 2. Academic Analysis (Grades & Activities)
    let totalEarned = 0;
    let totalPossibleCurrent = 0;
    let missedActivitiesCount = 0;

    // Calculate current performance based on APPLICABLE criteria only
    criteria.forEach(c => {
        if (c.name === 'Actividades' || c.name === 'Portafolio') {
            const totalActs = partialData.activities?.length ?? 0;
            if (totalActs > 0) {
                const studentActs = Object.values(partialData.activityRecords?.[student.id] || {});
                const delivered = studentActs.filter(Boolean).length;
                missedActivitiesCount = totalActs - delivered;
                
                const ratio = delivered / totalActs;
                totalEarned += ratio * c.weight;
                totalPossibleCurrent += c.weight;
            }
        } else if (c.name === 'Participación') {
            const totalParts = Object.keys(partialData.participations || {}).length;
            if (totalParts > 0) {
                const studentParts = Object.values(partialData.participations).filter((day: any) => day[student.id]).length;
                const ratio = studentParts / totalParts;
                totalEarned += ratio * c.weight;
                totalPossibleCurrent += c.weight;
            }
        } else {
             // Exams/Projects
             const gradeDetail = partialData.grades?.[student.id]?.[c.id];
             if (gradeDetail && gradeDetail.delivered !== null) {
                 const ratio = gradeDetail.delivered / c.expectedValue;
                 totalEarned += ratio * c.weight;
                 totalPossibleCurrent += c.weight;
             }
        }
    });

    const currentGrade = totalPossibleCurrent > 0 ? (totalEarned / totalPossibleCurrent) * 100 : 100;
    
    // Project Grade: Assume current performance continues, but penalize for missing trend
    // If missed activities are increasing (recent ones missed), risk is higher.
    // For simplicity, we use currentGrade as the base projection.
    let projectedGrade = currentGrade;

    // 3. Risk Calculation (Inverse Regression / Probability)
    
    // Dropout Risk Model
    // Factors: Attendance < 85%, Negative Attendance Slope, Low Participation
    let dropoutRisk = 0;
    if (currentAttendance < 85) dropoutRisk += 40;
    if (currentAttendance < 70) dropoutRisk += 30;
    if (attendanceSlope < -0.1) dropoutRisk += 20; // Declining attendance
    
    // Participation Factor
    const totalParticipations = Object.keys(partialData.participations || {}).length;
    const studentParticipations = Object.values(partialData.participations || {}).filter((day: any) => day[student.id]).length;
    const participationRate = totalParticipations > 0 ? studentParticipations / totalParticipations : 1;
    const lowParticipation = participationRate < 0.3;
    if (lowParticipation) dropoutRisk += 10;

    // Failing Risk Model
    // Factors: Grade < 60, Missed Activities > 30%
    let failingRisk = 0;
    if (currentGrade < 60) failingRisk += 50;
    else if (currentGrade < 70) failingRisk += 30;
    
    const activityRate = totalActivitiesSoFar > 0 ? (totalActivitiesSoFar - missedActivitiesCount) / totalActivitiesSoFar : 1;
    if (activityRate < 0.7) failingRisk += 20;
    if (activityRate < 0.5) failingRisk += 20;

    // Cap risks
    dropoutRisk = Math.min(100, Math.max(0, dropoutRisk));
    failingRisk = Math.min(100, Math.max(0, failingRisk));

    // Determine Overall Level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (dropoutRisk > 60 || failingRisk > 60) riskLevel = 'high';
    else if (dropoutRisk > 30 || failingRisk > 30) riskLevel = 'medium';

    // Factors List
    const riskFactors = [];
    if (currentAttendance < 80) riskFactors.push(`Inasistencias críticas (${(100-currentAttendance).toFixed(0)}%)`);
    if (missedActivitiesCount > 2) riskFactors.push(`Actividades no entregadas (${missedActivitiesCount})`);
    if (lowParticipation) riskFactors.push('Baja participación');
    if (currentGrade < 60) riskFactors.push(`Promedio reprobatorio (${currentGrade.toFixed(1)})`);

    // Inverse Prediction Message
    let predictionMessage = "Rendimiento estable.";
    if (riskLevel === 'high') {
        if (dropoutRisk > failingRisk) {
            predictionMessage = `Alta probabilidad de abandono (${dropoutRisk}%). Tendencia de asistencia negativa.`;
        } else {
            predictionMessage = `Riesgo de reprobación (${failingRisk}%). Se requiere mejorar entrega de actividades.`;
        }
    } else if (riskLevel === 'medium') {
        predictionMessage = "Se observan señales de riesgo temprano.";
    }

    return {
        studentId: student.id,
        studentName: student.name,
        currentGrade,
        projectedGrade,
        currentAttendance,
        projectedAttendance,
        missedActivitiesCount,
        lowParticipation,
        failingRisk,
        dropoutRisk,
        riskLevel,
        riskFactors,
        predictionMessage
    };
};
