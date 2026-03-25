'use client';
// --- Tipos de Datos (Schemas de la Base de Datos) ---

export type SuicideRiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Crítico';

export interface Student {
    id: string; // PK: ID_Estudiante
    name: string;
    demographics: {
        age: number;
        group: string; // ej. "3B"
        semester: number; // Semestre actual
    };
    emergencyContact: {
        name: string;
        phone: string;
    };
    suicideRiskLevel: SuicideRiskLevel; // Campo restringido
    academicData: {
        gpa: number; // Promedio general
        absences: number; // Porcentaje de ausencias
    };
    dualRelationshipNote?: string; // Campo para trazabilidad de relación dual (Cap. 4.3)
    // Este campo es para simulación, se puede quitar después
    ansiedadScore?: number;
}


export interface Evaluation {
    id: string; // PK
    studentId: string; // FK a Estudiantes
    type: 'GAD-7' | 'PHQ-9' | 'OTRO';
    score: number;
    date: Date;
}


// --- NUEVOS TIPOS PARA DATOS DE SEGUIMIENTO ---
export interface ClinicalAssessment {
    studentId: string;
    fecha_evaluacion: string;
    bdi_ii_score: number;
    bai_score: number;
    riesgo_suicida_beck_score: number;
    neuro_mt_score: number;
    neuro_as_score: number;
    neuro_vp_score: number;
    contexto_carga_cognitiva: string;
    assist_result: string;
    conducta_autolesiva_score: number;
    impresion_diagnostica: string;
}

export interface FunctionalAnalysis {
    studentId: string;
    session_number: number;
    fecha_sesion: string;
    analisis_funcional: {
        antecedente_principal: string;
        conducta_problema: string;
        funcion_mantenimiento: string;
        creencia_esquema: string;
    }
}

export interface TreatmentPlan {
    studentId: string;
    fecha_aprobacion: string;
    plan_narrativo_final: string;
}

export interface ProgressRecord {
    studentId: string;
    semana_numero: number;
    fecha_registro: string;
ideacion_suicida_score: number;
    suds_score: number;
    logro_tarea_score: number;
}

// Tipo para el componente de gráfico
export interface ProgressData {
    week: number;
    suicidalIdeation: number;
    suds: number;
    taskAchievement: number;
}


// --- TIPOS PARA LA EVALUACIÓN EDUCATIVA ---
// Actualizado según Fase 2 para reflejar las 5 áreas del IHE
export interface ChteScores {
    lugar: number;
    planificacion: number;
    atencion: number;
    metodo: number;
    actitud: number;
}


export interface NeuropsychScreening {
    atencionPercentil: number;
    memoriaTrabajoPercentil: number;
    controlInhibitorioPercentil: number;
}

export interface EducationalAssessment {
    studentId: string; // FK
    fecha_evaluacion: string;
    chteScores: ChteScores;
    totalScore: number;
    interpretation: 'Bajo' | 'Medio' | 'Alto';
    neuropsychScreening: NeuropsychScreening;
}

// --- TIPO PARA EL REPOSITORIO DE EVIDENCIA (ACTUALIZADO) ---
export interface EvidenceReference {
    id: string;
    titulo: string;
    autor: string;
    ano: number;
    modeloIntervencion: 'TCC' | 'AC' | 'DBT' | 'Adaptación Educativa';
    fileUrl: string; // URL al PDF en Cloud Storage
    estrategias: {
        nombre: string;
        pagina: number;
    }[];
    tags: string[];
}


export interface NeuroScreeningResult {
  studentId: string;
  date: Date;
  scores: {
    attention: number; // Aciertos
    workingMemory: number; // Span
    inhibitoryControl: number; // Errores de comisión
  };
  percentiles: {
    attention: number; // Calculado vía manual
    workingMemory: number;
    inhibitoryControl: number;
  };
  status: 'Normal' | 'Alerta' | 'Riesgo'; // Basado en < P25
}


// --- Simulación de la Base de Datos (Firestore) en Memoria ---

const studentsDB: Student[] = [
    { 
        id: 'S001', name: 'Ana M. Pérez (Caso: Riesgo Crítico)', 
        demographics: { age: 17, group: '5A', semester: 5 },
        emergencyContact: { name: 'Mariana López', phone: '5512345678' },
        suicideRiskLevel: 'Crítico',
        academicData: { gpa: 6.2, absences: 35 },
        ansiedadScore: 21, // Puntuación máxima para forzar riesgo alto
        dualRelationshipNote: 'Sin relación dual reportada.'
    },
    { 
        id: 'S002', name: 'Carlos V. Ruiz (Riesgo Medio)', 
        demographics: { age: 16, group: '3B', semester: 3 },
        emergencyContact: { name: 'Juan Mendoza', phone: '5587654321' },
        suicideRiskLevel: 'Medio',
        academicData: { gpa: 7.8, absences: 15 },
        ansiedadScore: 10,
    },
    { 
        id: 'S003', name: 'Laura J. García (Riesgo Bajo)', 
        demographics: { age: 18, group: '5A', semester: 6 },
        emergencyContact: { name: 'Lucía Jiménez', phone: '5555555555' },
        suicideRiskLevel: 'Bajo',
        academicData: { gpa: 9.1, absences: 5 },
        ansiedadScore: 4,
    },
     { 
        id: 'S004', name: 'Esteban Hernandarias (Caso de Prueba)', 
        demographics: { age: 14, group: '1C', semester: 1 },
        emergencyContact: { name: 'Susana Ramírez', phone: '5544332211' },
        suicideRiskLevel: 'Medio',
        academicData: { gpa: 7.5, absences: 20 },
        ansiedadScore: 15,
        dualRelationshipNote: 'Primo del orientador asignado al grupo 2B, no hay conflicto directo.'
    },
];

const evaluationsDB: Evaluation[] = [
    { id: 'eval-01', studentId: 'S001', type: 'GAD-7', score: 21, date: new Date('2024-05-01') },
    { id: 'eval-02', studentId: 'S002', type: 'GAD-7', score: 10, date: new Date('2024-05-10') },
    { id: 'eval-03', studentId: 'S003', type: 'GAD-7', score: 4, date: new Date('2024-05-12') },
    { id: 'eval-04', studentId: 'S004', type: 'GAD-7', score: 15, date: new Date('2024-05-13') },
];

const educationalAssessmentsDB: EducationalAssessment[] = [
    {
        studentId: 'S001',
        fecha_evaluacion: '2024-05-18',
        chteScores: { lugar: 8, planificacion: 7, atencion: 6, metodo: 8, actitud: 7 }, // Total: 36
        totalScore: 36,
        interpretation: 'Bajo',
        neuropsychScreening: { atencionPercentil: 55, memoriaTrabajoPercentil: 20, controlInhibitorioPercentil: 60 }
    },
    {
        studentId: 'S002',
        fecha_evaluacion: '2024-05-20',
        chteScores: { lugar: 10, planificacion: 10, atencion: 9, metodo: 9, actitud: 10 }, // Total: 48
        totalScore: 48,
        interpretation: 'Medio',
        neuropsychScreening: { atencionPercentil: 70, memoriaTrabajoPercentil: 65, controlInhibitorioPercentil: 75 }
    }
];

// --- DATOS SIMULADOS PARA LOS CASOS ---
const clinicalAssessmentsDB: ClinicalAssessment[] = [
    {
        studentId: 'S001',
        fecha_evaluacion: '2024-05-15',
        bdi_ii_score: 35, // Puntuación elevada
        bai_score: 28, // Puntuación elevada
        riesgo_suicida_beck_score: 15, // Puntuación elevada
        neuro_mt_score: 82,
        neuro_as_score: 88,
        neuro_vp_score: 79,
        contexto_carga_cognitiva: 'Presión por exámenes finales y conflicto con su pareja. Expresa desesperanza.',
        assist_result: 'Negativo',
        conducta_autolesiva_score: 8, // Frecuencia alta
        impresion_diagnostica: 'Sintomatología depresiva y ansiosa severa, con ideación suicida activa y planificada. El rendimiento cognitivo parece afectado por la carga emocional. La conducta problema parece mantenida por evitación del malestar. Criterio de Riesgo Vital (Código Rojo) activado.',
    },
    {
        studentId: 'S004',
        fecha_evaluacion: '2020-04-05',
        bdi_ii_score: 18,
        bai_score: 15,
        riesgo_suicida_beck_score: 2,
        // Puntajes brutos del caso de prueba
        neuro_mt_score: 12, // Corresponde a Dígitos
        neuro_as_score: 20, // Corresponde a Span Visual (RI)
        neuro_vp_score: 38, // Corresponde a Claves
        contexto_carga_cognitiva: 'Dificultades de adaptación al nuevo entorno escolar. Reporta sentirse abrumado por la carga académica.',
        assist_result: 'Negativo',
        conducta_autolesiva_score: 0,
        impresion_diagnostica: 'El perfil cognitivo muestra una discrepancia significativa entre la comprensión verbal (promedio) y las habilidades de memoria de trabajo y velocidad de procesamiento (muy bajas). Esto, combinado con sintomatología ansiosa, puede explicar las dificultades académicas. Sugerente de un posible trastorno del aprendizaje a explorar.',
    }
];

const functionalAnalysesDB: FunctionalAnalysis[] = [
    {
        studentId: 'S001',
        session_number: 1,
        fecha_sesion: '2024-05-16',
        analisis_funcional: {
            antecedente_principal: 'Recibir una tarea académica que percibe como difícil.',
            conducta_problema: 'Procrastinar la tarea, aislarse y rumiar sobre el fracaso.',
            funcion_mantenimiento: 'Refuerzo Negativo (Trampa de Evitación/Escape)',
            creencia_esquema: '"Soy incompetente y no puedo con la presión, es mejor no intentarlo."',
        }
    }
];

const treatmentPlansDB: TreatmentPlan[] = [
    {
        studentId: 'S001',
        fecha_aprobacion: '2024-05-17',
        plan_narrativo_final: `
Párrafo 1 (Estabilización y Activación Conductual):
El objetivo inicial es la estabilización y reducción del riesgo. Se priorizará la psicoeducación sobre el modelo de Activación Conductual (AC) para romper el ciclo de evitación. Se creará una jerarquía de actividades placenteras y de dominio, comenzando con tareas de baja dificultad (ej. "Organizar el escritorio por 10 minutos") para generar momentum y autoeficacia. El monitoreo será diario.

Párrafo 2 (Intervención Cognitiva y Regulación Emocional):
Se introducirán técnicas de Mindfulness para la observación de pensamientos sin juicio. Se trabajará en la identificación de distorsiones cognitivas asociadas a la creencia de "incompetencia". Se usarán registros de pensamiento para desafiar la evidencia a favor y en contra de pensamientos como "nunca lo lograré".

Párrafo 3 (Monitoreo y Prevención de Recaídas):
El progreso se medirá con SUDS, BDI-II semanal y el logro de tareas de AC. Se establecerá un plan de manejo de crisis que incluya contacto de emergencia y técnicas de auto-calma. La intervención se mantendrá en Nivel 3 (Intensivo) con reevaluación en 4 semanas.
        `.trim(),
    }
];

const progressTrackingDB: { [studentId: string]: ProgressData[] } = {
    'S001': [
        { week: 1, suicidalIdeation: 8, suds: 80, taskAchievement: 3 },
        { week: 2, suicidalIdeation: 7, suds: 75, taskAchievement: 5 },
        { week: 3, suicidalIdeation: 5, suds: 60, taskAchievement: 7 },
        { week: 4, suicidalIdeation: 4, suds: 50, taskAchievement: 8 },
    ]
};

// --- NUEVA COLECCIÓN: REPOSITORIO DE EVIDENCIA (DATOS ACTUALIZADOS) ---
const evidenceRepositoryDB: EvidenceReference[] = [
    {
        id: 'ref_ac_01',
        titulo: 'Guía práctica de activación conductual para la depresión',
        autor: 'Lejuez, C. W., Hopko, D. R., & Hopko, S. D.',
        ano: 2001,
        modeloIntervencion: 'AC',
        fileUrl: 'https://storage.googleapis.com/example-bucket/Lejuez_Activacion_Conductual.pdf',
        estrategias: [
            { nombre: 'Jerarquía de Actividades', pagina: 45 },
            { nombre: 'Monitoreo de Actividades', pagina: 52 }
        ],
        tags: ['activacion-conductual', 'depresion']
    },
    {
        id: 'ref_tcc_01',
        titulo: 'Terapia Cognitiva: Conceptos Básicos y Profundización',
        autor: 'Beck, J. S.',
        ano: 2011,
        modeloIntervencion: 'TCC',
        fileUrl: 'https://storage.googleapis.com/example-bucket/Beck_Terapia_Cognitiva.pdf',
        estrategias: [
            { nombre: 'Registro de Pensamientos Disfuncionales', pagina: 112 },
            { nombre: 'Experimentos Conductuales', pagina: 180 }
        ],
        tags: ['tcc', 'reestructuracion-cognitiva']
    },
    {
        id: 'ref_dbt_01',
        titulo: 'Manual de Entrenamiento en Habilidades DBT (2ª Ed.)',
        autor: 'Linehan, M. M.',
        ano: 2014,
        modeloIntervencion: 'DBT',
        fileUrl: 'https://storage.googleapis.com/example-bucket/Linehan_Habilidades_DBT.pdf',
        estrategias: [
            { nombre: 'Habilidad TIP (Tolerancia al Malestar)', pagina: 250 },
            { nombre: 'Mindfulness Qués y Cómos', pagina: 78 }
        ],
        tags: ['dbt', 'regulacion-emocional']
    },
    {
        id: 'ref_edu_01',
        titulo: 'Fomentando el aprendizaje autorregulado en el aula',
        autor: 'Zimmerman, B. J.',
        ano: 2002,
        modeloIntervencion: 'Adaptación Educativa',
        fileUrl: 'https://storage.googleapis.com/example-bucket/Zimmerman_Autorregulacion.pdf',
        estrategias: [
            { nombre: 'Técnica de los 5 minutos (Inicio de Tarea)', pagina: 92 },
            { nombre: 'Segmentación de Tareas (Chunking)', pagina: 104 }
        ],
        tags: ['educativa', 'planificacion', 'procrastinacion']
    }
];



// --- Funciones de Acceso a Datos (Simulan llamadas a Firestore) ---

export function getStudents(): Student[] {
    return studentsDB;
}

export function getStudentById(id: string): Student | undefined {
    return studentsDB.find(s => s.id === id);
}

export function getEvaluations(): Evaluation[] {
    return evaluationsDB;
}

// --- NUEVAS FUNCIONES PARA OBTENER DATOS DE SEGUIMIENTO ---
export function getClinicalAssessmentByStudentId(studentId: string): ClinicalAssessment | undefined {
    return clinicalAssessmentsDB.find(a => a.studentId === studentId);
}

export function getFunctionalAnalysisByStudentId(studentId: string): FunctionalAnalysis | undefined {
    return functionalAnalysesDB.find(a => a.studentId === studentId);
}

export function getTreatmentPlanByStudentId(studentId: string): TreatmentPlan | undefined {
    return treatmentPlansDB.find(a => a.studentId === studentId);
}

export function getProgressTrackingByStudentId(studentId: string): ProgressData[] {
    return progressTrackingDB[studentId] || [];
}

export function getEducationalAssessmentByStudentId(studentId: string): EducationalAssessment | undefined {
    return educationalAssessmentsDB.find(a => a.studentId === studentId);
}

export function getEvidenceRepository(): EvidenceReference[] {
    return evidenceRepositoryDB;
}
