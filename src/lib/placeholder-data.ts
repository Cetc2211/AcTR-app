import type { EvaluationCriteria } from "@/hooks/use-data";

export type PartialId = 'p1' | 'p2' | 'p3';

export type Student = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tutorName?: string;
  tutorPhone?: string;
  photo: string;
};

export type Group = {
  id: string;
  subject: string;
  students: Student[];
  criteria: EvaluationCriteria[];
  semester?: string;
  groupName?: string;
  facilitator?: string;
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

export type OfficialGroup = {
    id: string;
    name: string;
    createdAt?: string;
    students?: string[]; // IDs of students
};

export type JustificationCategory = 'Salud' | 'Familiar' | 'Personal' | 'Otro';

export type Announcement = {
    id: string;
    title: string;
    content: string;
    target?: string;
    expiresAt: string;
    createdAt: string;
};

export type Justification = {
    id: string;
    studentId: string;
    groupId: string;
    date: string;
    reason: string;
    category: JustificationCategory;
    createdAt: string;
};
