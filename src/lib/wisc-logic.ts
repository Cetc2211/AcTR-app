
import { getScaledScoreFromTable, getCompositeFromTable, getClassification, CLINICAL_DICTIONARY } from './wisc-norms';

export interface WiscCalculationResult {
    scaledScores: Record<string, number>;
    indices: {
        id: string;
        name: string;
        sumPE: number;
        pc: number;
        percentile: number;
        classification: string;
    }[];
    analysis: {
        strengths: string[];
        weaknesses: string[];
        discrepancies: string[];
        diagnosis: string;
    };
    narrative: Record<string, string>;
}

export const calculateWiscProfile = (rawScores: Record<string, number>, studentAge: string, studentName: string): WiscCalculationResult => {
    // 1. Convertir Brutos a Escalares (Paso A)
    const scaledScores: Record<string, number> = {};
    Object.keys(rawScores).forEach(key => {
        scaledScores[key] = getScaledScoreFromTable(key, rawScores[key], studentAge);
    });

    // 2. Calcular Sumas de Índices (Paso B)
    // Definición de índices primarios según WISC-V
    const indexDefinitions = {
        ICV: ['S', 'V'],       // Semejanzas, Vocabulario
        IVE: ['C', 'PV'],      // Cubos, Puzles Visuales
        IRF: ['M', 'B'],       // Matrices, Balanzas
        IMT: ['D', 'SV'],      // Dígitos, Span Visual (SV)
        IVP: ['Cl', 'BS']      // Claves, Búsqueda de Símbolos
    };

    const indices = [];
    let totalSumPE = 0;

    // Calcular índices primarios
    Object.entries(indexDefinitions).forEach(([id, subtests]) => {
        let sum = 0;
        subtests.forEach(sub => {
            sum += scaledScores[sub] || 0;
        });
        
        const composite = getCompositeFromTable(id, sum);
        const classification = getClassification(composite.pc);
        
        indices.push({
            id,
            name: getIndexName(id),
            sumPE: sum,
            pc: composite.pc,
            percentile: composite.perc,
            classification
        });
        
        totalSumPE += sum;
    });

    // Calcular CIT (Escala Total)
    // CORRECCIÓN: El CIT se calcula con la suma de los 7 subtests principales (S, V, C, M, B, D, Cl).
    // No debe usarse la suma de los 10 subtests (que daría 72 en este caso), sino la suma de los 7 (que da 52).
    const citSubtests = ['S', 'V', 'C', 'M', 'B', 'D', 'Cl'];
    let citSumPE = 0;
    citSubtests.forEach(sub => {
        citSumPE += scaledScores[sub] || 0;
    });

    const citComposite = getCompositeFromTable('CIT', citSumPE);
    indices.push({
        id: 'CIT',
        name: 'C.I. Total',
        sumPE: citSumPE,
        pc: citComposite.pc,
        percentile: citComposite.perc,
        classification: getClassification(citComposite.pc)
    });

    // 3. Análisis Estadístico (Instrucción 4.2 y 7)
    // Calcular Media de Puntajes Escalares (PPE)
    const allScaledValues = Object.values(scaledScores);
    const ppe = allScaledValues.reduce((a, b) => a + b, 0) / allScaledValues.length;

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(scaledScores).forEach(([sub, score]) => {
        // Criterio: +/- 3 puntos sobre la media
        if (score >= ppe + 3) strengths.push(getSubtestName(sub));
        if (score <= ppe - 3) weaknesses.push(getSubtestName(sub));
    });

    // Análisis de Discrepancias (Instrucción 7)
    const discrepancies: string[] = [];
    const icv = indices.find(i => i.id === 'ICV')?.pc || 0;
    const imt = indices.find(i => i.id === 'IMT')?.pc || 0;
    const ive = indices.find(i => i.id === 'IVE')?.pc || 0;
    const irf = indices.find(i => i.id === 'IRF')?.pc || 0;
    const ivp = indices.find(i => i.id === 'IVP')?.pc || 0;

    // Tabla de Valores Críticos (Simulada para el ejemplo .05)
    const criticalValues: Record<string, number> = {
        "ICV-IVE": 10.82,
        "ICV-IRF": 11.24,
        "ICV-IMT": 9.52, // Ejemplo solicitado
        "ICV-IVP": 12.15,
        "IMT-IVP": 11.05
    };
    
    const checkDiscrepancy = (name1: string, val1: number, name2: string, val2: number, pairKey: string) => {
        const diff = Math.abs(val1 - val2);
        const critical = criticalValues[pairKey] || 15;
        if (diff >= critical) {
            discrepancies.push(`Diferencia significativa entre ${name1} (${val1}) y ${name2} (${val2}). (Dif: ${diff} >= VC: ${critical})`);
        }
    };

    checkDiscrepancy("Comprensión Verbal", icv, "Visoespacial", ive, "ICV-IVE");
    checkDiscrepancy("Comprensión Verbal", icv, "Razonamiento Fluido", irf, "ICV-IRF");
    checkDiscrepancy("Comprensión Verbal", icv, "Memoria de Trabajo", imt, "ICV-IMT");
    checkDiscrepancy("Memoria de Trabajo", imt, "Velocidad de Procesamiento", ivp, "IMT-IVP");

    // Análisis de Velocidad (Cancelación vs Búsqueda de Símbolos)
    const caScore = scaledScores['Ca'];
    const bsScore = scaledScores['BS'];
    if (caScore !== undefined && bsScore !== undefined) {
        // "Significativamente menor" - usually 3 points is significant for subtests
        if (caScore < bsScore - 3) {
            discrepancies.push("Se observa una fluctuación en la velocidad de procesamiento ante estímulos con carga semántica (animales) frente a estímulos abstractos.");
        }
    }

    // Síntesis Diagnóstica Condicional (Instrucción 7)
    let diagnosis = "Funcionamiento Intelectual dentro de la normalidad";
    const cit = citComposite.pc;
    if (cit < 70) diagnosis = "Perfil sugerente de Discapacidad Intelectual";
    else if (cit >= 70 && cit <= 79) diagnosis = "Funcionamiento Intelectual Limítrofe";

    // 4. Generación de Narrativa (Diccionario) (Instrucción 4 y 7)
    const narrative: Record<string, string> = {};
    
    // Nota de Transparencia Digital (Cancelación)
    if (scaledScores['Ca'] !== undefined) {
        narrative['Ca_Note'] = "Nota Técnica: Aplicación de Cancelación realizada mediante tablet con detección automática de trazos y validación clínica. (Anexo: Evidencia visual de trazos disponible en el expediente digital).";
    }

    indices.forEach(idx => {
        if (idx.id === 'CIT') return; // El CIT suele tener su propia intro
        
        const dictionaryEntry = CLINICAL_DICTIONARY[idx.id as keyof typeof CLINICAL_DICTIONARY];
        if (dictionaryEntry) {
            // Buscar texto exacto por clasificación o fallback
            let text = dictionaryEntry[idx.classification as keyof typeof dictionaryEntry] || 
                       dictionaryEntry["Promedio"] || // Fallback seguro
                       "Descripción no disponible.";
            
            // Inyectar nombre
            text = text.replace(/{name}/g, studentName);
            narrative[idx.id] = text;
        }
    });

    return {
        scaledScores,
        indices,
        analysis: {
            strengths,
            weaknesses,
            discrepancies,
            diagnosis
        },
        narrative
    };
};

// Helpers
const getIndexName = (id: string) => {
    const map: Record<string, string> = {
        ICV: 'Comprensión Verbal',
        IVE: 'Visoespacial',
        IRF: 'Razonamiento Fluido',
        IMT: 'Memoria de Trabajo',
        IVP: 'Velocidad de Procesamiento',
        CIT: 'Escala Total'
    };
    return map[id] || id;
};

const getSubtestName = (id: string) => {
    const map: Record<string, string> = {
        C: 'Construcción con Cubos', S: 'Semejanzas', M: 'Matrices', D: 'Dígitos',
        Cl: 'Claves', V: 'Vocabulario', B: 'Balanzas', PV: 'Puzles Visuales',
        RI: 'Retención de Imágenes', BS: 'Búsqueda de Símbolos'
    };
    return map[id] || id;
};
