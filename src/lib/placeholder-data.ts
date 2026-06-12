export type PartialId = 'p1' | 'p2' | 'p3';

export type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue?: number;
  description?: string;
};

export type Student = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tutorName?: string;
  tutorPhone?: string;
  photo: string;
  official_group_id?: string;
  [key: string]: unknown;
};

export type Group = {
  id: string;
  subject: string;
  students: Student[];
  criteria?: EvaluationCriteria[];
  evaluationCriteria?: EvaluationCriteria[];
  semester?: string;
  groupName?: string;
  facilitator?: string;
  officialGroupId?: string;
  whatsappLink?: string;
  [key: string]: unknown;
};

export type StudentObservation = {
  id: string;
  studentId: string;
  partialId: PartialId;
  date: string;
  type: string;
  details: string;
  requiresCanalization: boolean;
  canalizationTarget?: string;
  requiresFollowUp: boolean;
  followUpUpdates: { date: string; update: string }[];
  isClosed: boolean;
};

export type SpecialNote = {
  id: string;
  title?: string;
  content?: string;
  date?: string;
  color?: string;
  [key: string]: unknown;
};

export type GradeDetail = {
  delivered?: number;
  grade?: number;
  value?: number;
  notes?: string;
  [key: string]: unknown;
};

export type Grades = Record<string, Record<string, GradeDetail>>;

export type RecoveryGrade = {
  applied?: boolean;
  grade?: number;
  reason?: string;
  [key: string]: unknown;
};

export type RecoveryGrades = Record<string, RecoveryGrade>;

export type MeritGrade = {
  applied?: boolean;
  grade?: number;
  score?: number;
  reason?: string;
  [key: string]: unknown;
};

export type MeritGrades = Record<string, MeritGrade>;

export type AttendanceRecord = Record<string, Record<string, boolean>>;

export type ParticipationRecord = Record<string, Record<string, number>>;

export type Activity = {
  id: string;
  name: string;
  date?: string;
  maxScore?: number;
  [key: string]: unknown;
};

export type ActivityRecord = Record<string, Record<string, boolean>>;

export type CalculatedRisk = {
  level: 'high' | 'medium' | 'low';
  reason: string;
};

export type StudentWithRisk = Student & {
  riskLevel?: CalculatedRisk;
  finalGrade?: number;
  attendanceRate?: number;
  atRiskReasons?: string[];
};

export type CriteriaDetail = {
  name: string;
  earned: number;
  weight: number;
};

export type StudentStats = {
  completionRate?: number;
  failingSubjects?: number;
  [key: string]: unknown;
};

export type GroupedActivities = Record<string, Activity[]>;

export type AppSettings = {
  institutionName: string;
  logo: string;
  theme: string;
  apiKey: string;
  signature: string;
  facilitatorName: string;
  scheduleImageUrl: string;
  teacherPhoto: string;
  whatsappContactNumber: string;
  aiModel: string;
  [key: string]: unknown;
};

export type PartialData = {
  grades: Grades;
  attendance: AttendanceRecord;
  participations: ParticipationRecord;
  activities: Activity[];
  activityRecords: ActivityRecord;
  recoveryGrades: RecoveryGrades;
  meritGrades?: MeritGrades;
  feedbacks: Record<string, string>;
  groupAnalysis: string;
};

export type AllPartialsDataForGroup = Record<string, PartialData>;

export type AllPartialsData = Record<string, AllPartialsDataForGroup>;

export type OfficialGroup = {
  id: string;
  name: string;
  tutorEmail?: string;
  createdAt?: string;
  students?: string[];
  [key: string]: unknown;
};

export type JustificationCategory = 'Salud' | 'Familiar' | 'Personal' | 'Otro';

export type Announcement = {
  id: string;
  title: string;
  message?: string;
  content?: string;
  type?: string;
  target?: string;
  targetGroup?: string;
  isActive?: boolean;
  expiresAt?: string;
  createdAt: string;
  [key: string]: unknown;
};

export type StudentJustification = {
  id: string;
  studentId: string;
  date: string;
  reason: string;
  category: JustificationCategory;
  createdAt?: string;
  createdBy?: string;
  [key: string]: unknown;
};
