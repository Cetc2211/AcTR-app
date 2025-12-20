

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
};

export type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
  isAutomated?: boolean;
};

export type Group = {
  id: string;
  subject: string;
  students: Student[];
  criteria: EvaluationCriteria[];
  semester?: string;
  groupName?: string;
  facilitator?: string;
  whatsappLink?: string;
  isSemesterIntegrated?: boolean;
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
};
