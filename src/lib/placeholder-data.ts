

export type PartialId = 'p1' | 'p2' | 'p3';

export type RiskFlag = 'RIESGO_ASISTENCIA' | 'RIESGO_ACADEMICO' | 'RIESGO_EJECUTIVO' | 'RIESGO_CONDUCTUAL';

export interface StudentReferral {
  student_id: string;        // ID de Firestore
  timestamp: string;         // ISO 8601
  academic_data: {
    average: number;         // Riesgo si < 6.0
    attendance_rate: number; // Alerta si < 85%
    completion_rate: number; // Actividades < 60% indica falla ejecutiva
  };
  flags: RiskFlag[];
  log_summary: string[];     // Últimas observaciones de bitácora
}

export type Announcement = {
    id: string;
    type: 'info' | 'justification' | 'urgent'; // Justification type implies it's a general justification notice or info about justifications
    title: string;
    message: string;
    targetGroup?: string; // If null, global. If set, only for teachers of this Official Group
    createdAt: string;
    expiresAt?: string;
    isActive: boolean;
};

export type JustificationCategory = 'Salud' | 'Familiar' | 'Personal' | 'Institucional' | 'Otro';

export type StudentJustification = {
    id: string;
    studentId: string;
    date: string; // YYYY-MM-DD
    category?: JustificationCategory;
    reason: string;
    adminEmail: string;
    timestamp: string;
};

export type Student = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tutorName?: string;
  tutorPhone?: string;
  photo: string;
  // PIGEC-130 Integration Fields
  clinicalStatus?: 'pendiente' | 'en_seguimiento' | 'concluido';
  pedagogicalInstructions?: string;
  // Clinical Data for Local Intelligence Engine
  neuropsiTotal?: number;  // 0-100 (Atención y Memoria)
  ansiedad_norm?: number;  // 0-1 (Deprecated, keep for compatibility if needed or migrate)
  depresion_norm?: number; // 0-1 (Deprecated)
  
  // New Screening Fields (v2.3)
  screeningDate?: string;
  neuropsiScore?: number; // 0-100
  gad7Score?: number;     // 0-21
};

export type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
  isAutomated?: boolean;
};

export type OfficialGroup = {
  id: string;
  name: string;
  createdAt: string;
  tutorEmail?: string; // Correo del docente asignado como Tutor
};

export type Group = {
  id: string;
  officialGroupId?: string; // Link to OfficialGroup
  subject: string;
  students: Student[];
  criteria: EvaluationCriteria[];
  semester?: string;
  groupName?: string;
  facilitator?: string;
  whatsappLink?: string;
  isSemesterIntegrated?: boolean;
  loadedPartials?: PartialId[]; // Controls which partials are included in the semester average
  status?: 'active' | 'archived'; 
  archivedAt?: string;
};

export type StudentObservation = {
    id: string;
    studentId: string;
    partialId: PartialId;
    date: string; // ISO date string
    type: 'Problema de conducta' | 'Episodio emocional' | 'Mérito' | 'Demérito' | 'Asesoría académica' | 'Otros' | string;
    details: string;
    requiresCanalization: boolean;
    canalizationTarget?: 'Tutor' | 'Atención psicológica' | 'Directivo' | 'Padre/Madre/Tutor legal' | 'Otros' | string;
    requiresFollowUp: boolean;
    followUpUpdates: { date: string; update: string }[];
    isClosed: boolean;
};

export type SpecialNote = {
  id: string;
  text: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
};


export type GradeDetail = {
  delivered: number | null;
};

export type Grades = {
  [studentId: string]: {
    [criterionId: string]: GradeDetail;
  };
};

export type RecoveryGrade = {
    grade: number | null;
    applied: boolean;
};

export type RecoveryGrades = {
    [studentId: string]: RecoveryGrade;
};

// New Type for Direct Assignment (Merit)
export type MeritGrade = {
    grade: number | null;
    applied: boolean;
    reason?: string; // Optional reason for the merit
};

export type MeritGrades = {
    [studentId: string]: MeritGrade;
};

export type AttendanceRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

export type ParticipationRecord = {
  [date: string]: {
    [studentId: string]: boolean;
  };
};

export type Activity = {
  id: string;
  name: string;
  dueDate: string; // YYYY-MM-DD
  programmedDate: string; // YYYY-MM-DD
};

export type ActivityRecord = {
    [studentId: string]: {
        [activityId: string]: boolean;
    };
};

export type PartialData = {
    grades: Grades;
    attendance: AttendanceRecord;
    participations: ParticipationRecord;
    activities: Activity[];
    activityRecords: ActivityRecord;
    recoveryGrades: RecoveryGrades;
    meritGrades?: MeritGrades; // New field for merit grades
    feedbacks: { [studentId: string]: string };
    groupAnalysis: string;
};

export type AllPartialsDataForGroup = {
    [partialId in PartialId]?: PartialData;
};

export type AllPartialsData = {
  [groupId: string]: AllPartialsDataForGroup;
};


export type CalculatedRisk = {
    level: 'low' | 'medium' | 'high';
    reason: string;
};

export type StudentWithRisk = Student & { calculatedRisk: CalculatedRisk };

export type CriteriaDetail = {
    name: string;
    earned: number;
    weight: number;
};

export type StudentStats = {
    finalGrade: number;
    criteriaDetails: CriteriaDetail[];
    isRecovery: boolean;
    partialId: PartialId;
    attendance: { p: number; a: number; total: number; rate: number };
    observations: StudentObservation[];
};

export type GroupedActivities = {
  [dueDate: string]: Activity[];
};

export type UserProfile = {
    name: string;
    email: string;
    photoURL: string;
}

export type AppSettings = {
    institutionName: string;
    logo: string;
    theme: string;
    apiKey: string;
    aiModel?: string;
    signature: string;
    facilitatorName: string;
    scheduleImageUrl: string;
    teacherPhoto: string;
    whatsappContactNumber?: string;
    // Prefect specific settings for reports
    prefectName?: string;
    prefectTitle?: string;
    prefectSignature?: string; // Base64
};

// Pedagogical Injection Schema (Technical Spec 1.0)
export type PedagogicalStrategy = {
    id: string; // UUID
    student_id: string; // Relation to Student
    category: 'Atención' | 'Memoria' | 'Emocional' | 'Conducta' | 'Otro';
    strategy_text: string; // The phrase to inject
    is_injected: boolean; 
};
