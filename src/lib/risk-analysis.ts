/**
 * Define los coeficientes ponderados (Betas) para las variables predictoras (Xi).
 * NOTA: Estos coeficientes son simulados y deben ajustarse con la investigación real del Cap. 5.1.1.
 */
interface RiskCoefficients {
    B0_intercepto: number;
    B1_ausentismo: number;
    B2_bajo_rendimiento: number;
    B3_ansiedad_clinica: number;
}

const DEFAULT_COEFFICIENTS: RiskCoefficients = {
    B0_intercepto: -3.0, // Base line (ajuste)
    B1_ausentismo: 1.5, // Fuerte predictor (más peso)
    B2_bajo_rendimiento: 1.0, // Predictor moderado
    B3_ansiedad_clinica: 0.8, // Predictor clínico
};

/**
 * Define los datos necesarios para el cálculo de riesgo.
 * La Ansiedad (X3) se asume normalizada de 0 a 1 (0 = baja, 1 = alta).
 */
interface RiskData {
    // Academic Tracker Inputs
    ausentismo_norm: number; // X1: Porcentaje de faltas (0 a 1.0)
    bajo_rendimiento_bin: 0 | 1; // X2: 1 si GPA < 7.0; 0 si no.

    // Clinical Screening Input (from MTSS Expediente)
    ansiedad_norm: number; // X3: Puntuación normalizada de GAD-7/BAI (0 a 1.0)
}

/**
 * Calcula el Índice de Riesgo Compuesto (IRC) y determina el nivel de riesgo (Semáforo).
 * @param data Datos del estudiante, ya procesados y normalizados.
 * @returns IRC (0-100) y Nivel de Riesgo (Bajo, Medio, Alto).
 */
export function calculateRisk(data: RiskData) {
    const { B0_intercepto, B1_ausentismo, B2_bajo_rendimiento, B3_ansiedad_clinica } = DEFAULT_COEFFICIENTS;

    // 1. Cálculo del puntaje lineal (Z)
    const Z = B0_intercepto +
        (B1_ausentismo * data.ausentismo_norm) +
        (B2_bajo_rendimiento * data.bajo_rendimiento_bin) +
        (B3_ansiedad_clinica * data.ansiedad_norm);

    // 2. Aplicación de la Ecuación Logística: P = 1 / (1 + e^(-Z))
    const probabilidadRiesgo = 1 / (1 + Math.exp(-Z));

    // 3. Normalizar a porcentaje
    const IRC = parseFloat((probabilidadRiesgo * 100).toFixed(1));

    // 4. Lógica del Semáforo (Cap. 5.2.3)
    let nivelRiesgo: 'Bajo (Verde)' | 'Medio (Amarillo)' | 'Alto (Rojo)';
    let color: 'green' | 'yellow' | 'red';

    if (IRC >= 60) {
        nivelRiesgo = 'Alto (Rojo)';
        color = 'red';
    } else if (IRC >= 30) {
        nivelRiesgo = 'Medio (Amarillo)';
        color = 'yellow';
    } else {
        nivelRiesgo = 'Bajo (Verde)';
        color = 'green';
    }

    return {
        IRC,
        nivelRiesgo,
        color,
    };
}

/**
 * Alias para calculateRisk para compatibilidad
 */
export function analyzeStudentRisk(data: RiskData) {
    return calculateRisk(data);
}
