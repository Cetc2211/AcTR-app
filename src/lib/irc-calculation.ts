
// Motor de Cálculo (Lógica Matemática Pura) - v2 Improved
// Implementa Regresión Logística para el Índice de Riesgo Compuesto (IRC)

export interface IRCParams {
  attendance: number; // 0-100
  grade: number;      // 0-100
  anxietyScore: number; // GAD-7 (0-21)
}

export const calculateIRC = (params: IRCParams): number => {
  // 1. Normalización de Variables (Escala 0 a 1)
  const x1_asistencia = (100 - params.attendance) / 100;
  // x2: Indicador de bajo rendimiento (1 si <= 70, 0 si > 70)
  const x2_rendimiento = params.grade <= 70 ? 1 : 0; 
  // x3: Ansiedad normalizada (0-1) from GAD-7
  const x3_ansiedad = params.anxietyScore / 21;

  // 2. Coeficientes del Modelo Antigravity
  const B0 = -3.0; // Intercepto
  const B1 = 1.5;  // Peso Asistencia
  const B2 = 1.0;  // Peso Rendimiento
  const B3 = 0.8;  // Peso Salud Mental

  // 3. Ecuación Logística: Z = β0 + β1x1 + β2x2 + β3x3
  const Z = B0 + (B1 * x1_asistencia) + (B2 * x2_rendimiento) + (B3 * x3_ansiedad);

  // 4. Función Sigmoide para obtener probabilidad (0 a 1)
  const probability = 1 / (1 + Math.exp(-Z));
  
  // Retorna el Índice de Riesgo Compuesto (IRC) en porcentaje (0-100)
  return probability * 100;
};

export interface IRCAnalysis {
    score: number; // 0-100
    riskLevel: 'bajo' | 'medio' | 'alto';
    justification: string;
    recommendation: string;
    shouldRefer: boolean;
}

export const analyzeIRC = (attendance: number, grade: number, gad7Score: number, neuropsiScore: number): IRCAnalysis => {
    // If scores are missing, assume 0 for safe defaults
    const params: IRCParams = {
        attendance: attendance,
        grade: grade,
        anxietyScore: gad7Score || 0
    };

    const irc = calculateIRC(params); // 0-100
    
    // Niveles (Brújula Pedagógica)
    // Bajo < 15%
    // Medio 15-24%
    // Alto >= 25%

    let riskLevel: 'bajo' | 'medio' | 'alto' = 'bajo';
    if (irc >= 15 && irc < 25) riskLevel = 'medio';
    if (irc >= 25) riskLevel = 'alto';

    let justification = [];
    if (attendance < 85) justification.push(`Inasistencia (${(100 - attendance).toFixed(1)}%)`);
    if (grade <= 70) justification.push(`Descenso académico (${grade.toFixed(1)})`);
    if (gad7Score >= 10) justification.push(`Ansiedad moderada/severa (GAD-7: ${gad7Score})`);
    if (neuropsiScore > 0 && neuropsiScore < 70) justification.push(`Neuropsi bajo (${neuropsiScore})`);

    let recommendation = "Mantener monitoreo preventivo."; // Nivel 1.

    if (riskLevel === 'medio') {
        recommendation = "Aplicar apoyos focalizados en aula (checklists, pausas).";
    } else if (riskLevel === 'alto') {
        recommendation = "Derivación inmediata a evaluación profunda (WISC-V).";
    }

    return {
        score: irc, // 0-100
        riskLevel,
        justification: `Causa: ${justification.join(" + ")}` || "Sin factores de riesgo detectados",
        recommendation,
        shouldRefer: irc >= 25
    };
};
