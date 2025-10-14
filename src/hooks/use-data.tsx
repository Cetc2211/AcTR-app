'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { get, set, del, clear } from 'idb-keyval';
import type { Student, Group, PartialId, StudentObservation, SpecialNote, EvaluationCriteria, GradeDetail, Grades, RecoveryGrade, RecoveryGrades, AttendanceRecord, ParticipationRecord, Activity, ActivityRecord, CalculatedRisk, StudentWithRisk, CriteriaDetail, StudentStats, GroupedActivities, AppSettings, PartialData, AllPartialsData, AllPartialsDataForGroup } from '@/lib/placeholder-data';
import { format } from 'date-fns';
import { getPartialLabel } from '@/lib/utils';
import { generateFeedback, generateGroupAnalysis, generateSemesterAnalysis } from '@/lib/gemini';


// TYPE DEFINITIONS
type ExportData = {
  version: string;
  groups: Group[];
  students: Student[];
  observations: { [studentId: string]: StudentObservation[] };
  specialNotes: SpecialNote[];
  settings: AppSettings;
  partialsData: AllPartialsData; 
};

export type UserProfile = {
    name: string;
    email: string;
    photoURL: string;
}

export const defaultSettings: AppSettings = {
    institutionName: "Mi Institución",
    logo: "",
    theme: "theme-candy",
    apiKey: "",
    signature: "",
    facilitatorName: "",
    scheduleImageUrl: "",
    teacherPhoto: "",
    whatsappContactNumber: ""
};

const defaultPartialData: PartialData = {
    grades: {},
    attendance: {},
    participations: {},
    activities: [],
    activityRecords: {},
    recoveryGrades: {},
    feedbacks: {},
    groupAnalysis: '',
};

// --- DATA CONTEXT & PROVIDER ---
interface DataContextType {
    // State
    isLoading: boolean;
    error: Error | null;
    groups: Group[];
    allStudents: Student[];
    activeStudentsInGroups: Student[];
    allObservations: { [studentId: string]: StudentObservation[] };
    specialNotes: SpecialNote[];
    settings: AppSettings;
    activeGroup: Group | null;
    activeGroupId: string | null;
    activePartialId: PartialId;
    partialData: PartialData;
    allPartialsDataForActiveGroup: AllPartialsDataForGroup;
    groupAverages: { [groupId: string]: number };
    atRiskStudents: StudentWithRisk[];
    overallAverageAttendance: number;

    // State Setters
    setGroups: (setter: React.SetStateAction<Group[]>) => Promise<void>;
    setAllStudents: (setter: React.SetStateAction<Student[]>) => Promise<void>;
    setAllObservations: (setter: React.SetStateAction<{ [studentId: string]: StudentObservation[] }>) => Promise<void>;
    setAllPartialsData: (setter: React.SetStateAction<AllPartialsData>) => Promise<void>;
    setSpecialNotes: (setter: React.SetStateAction<SpecialNote[]>) => Promise<void>;
    setSettings: (settings: AppSettings) => Promise<void>;
    setActiveGroupId: (groupId: string | null) => void;
    setActivePartialId: (partialId: PartialId) => void;

    // Derived Setters for PartialData
    setGrades: (setter: React.SetStateAction<Grades>) => Promise<void>;
    setAttendance: (setter: React.SetStateAction<AttendanceRecord>) => Promise<void>;
    setParticipations: (setter: React.SetStateAction<ParticipationRecord>) => Promise<void>;
    setActivities: (setter: React.SetStateAction<Activity[]>) => Promise<void>;
    setActivityRecords: (setter: React.SetStateAction<ActivityRecord>) => Promise<void>;
    setRecoveryGrades: (setter: React.SetStateAction<RecoveryGrades>) => Promise<void>;
    setStudentFeedback: (studentId: string, feedback: string) => Promise<void>;
    setGroupAnalysis: (analysis: string) => Promise<void>;

    // Core Actions
    addStudentsToGroup: (groupId: string, students: Student[]) => Promise<void>;
    removeStudentFromGroup: (groupId: string, studentId: string) => Promise<void>;
    updateGroup: (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => Promise<void>;
    updateStudent: (studentId: string, data: Partial<Student>) => Promise<void>;
    updateGroupCriteria: (criteria: EvaluationCriteria[]) => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
    addStudentObservation: (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => Promise<void>;
    updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => Promise<void>;
    takeAttendanceForDate: (groupId: string, date: string) => Promise<void>;
    deleteAttendanceDate: (date: string) => Promise<void>;
    resetAllData: () => Promise<void>;
    importAllData: (data: ExportData) => Promise<void>;
    addSpecialNote: (note: Omit<SpecialNote, 'id'>) => Promise<void>;
    updateSpecialNote: (noteId: string, note: Partial<Omit<SpecialNote, 'id'>>) => Promise<void>;
    deleteSpecialNote: (noteId: string) => Promise<void>;


    // Calculation & Fetching
    calculateFinalGrade: (studentId: string) => number;
    calculateDetailedFinalGrade: (studentId: string, pData: PartialData, criteria: EvaluationCriteria[]) => { finalGrade: number; criteriaDetails: CriteriaDetail[]; isRecovery: boolean };
    getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
    fetchPartialData: (groupId: string, partialId: PartialId) => Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null>;
    
    // AI Features
    generateFeedbackWithAI: (student: Student, stats: StudentStats) => Promise<string>;
    generateGroupAnalysisWithAI: (group: Group, summary: any, recoverySummary: any, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]) => Promise<string>;
    generateSemesterAnalysisWithAI: (group: Group, summary: any) => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- STATE MANAGEMENT ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const [groups, setGroupsState] = useState<Group[]>([]);
    const [allStudents, setAllStudentsState] = useState<Student[]>([]);
    const [allObservations, setAllObservationsState] = useState<{ [studentId: string]: StudentObservation[] }>({});
    const [specialNotes, setSpecialNotesState] = useState<SpecialNote[]>([]);
    const [allPartialsData, setAllPartialsDataState] = useState<AllPartialsData>({});
    const [settings, setSettingsState] = useState(defaultSettings);
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialIdState] = useState<PartialId>('p1');

    
    // --- ASYNC DATA HYDRATION ---
    useEffect(() => {
        const hydrateData = async () => {
            setIsLoading(true);
            try {
                const [
                    loadedGroups,
                    loadedStudents,
                    loadedObservations,
                    loadedSpecialNotes,
                    loadedPartialsData,
                    loadedSettings,
                    loadedActiveGroupId
                ] = await Promise.all([
                    get<Group[]>('app_groups'),
                    get<Student[]>('app_students'),
                    get<{ [studentId: string]: StudentObservation[] }>('app_observations'),
                    get<SpecialNote[]>('app_specialNotes'),
                    get<AllPartialsData>('app_partialsData'),
                    get<AppSettings>('app_settings'),
                    get<string>('activeGroupId_v1')
                ]);

                setGroupsState(loadedGroups || []);
                setAllStudentsState(loadedStudents || []);
                setAllObservationsState(loadedObservations || {});
                setSpecialNotesState(loadedSpecialNotes || []);
                setAllPartialsDataState(loadedPartialsData || {});
                setSettingsState(loadedSettings || defaultSettings);
                
                if (loadedActiveGroupId && (loadedGroups || []).some(g => g.id === loadedActiveGroupId)) {
                    setActiveGroupIdState(loadedActiveGroupId);
                } else if ((loadedGroups || []).length > 0) {
                    setActiveGroupIdState(loadedGroups![0].id);
                } else {
                    setActiveGroupIdState(null);
                }
                
            } catch (e) {
                console.error("Data hydration error:", e);
                setError(e instanceof Error ? e : new Error('An unknown error occurred during data hydration'));
            } finally {
                setIsLoading(false);
            }
        };
        hydrateData();
    }, []);

    const createSetterWithStorage = <T,>(
        setter: React.Dispatch<React.SetStateAction<T>>,
        key: string,
        inMemoryState: T,
    ) => {
        return async (value: React.SetStateAction<T>) => {
            const oldValue = inMemoryState;
            const newValue =
                typeof value === 'function'
                    ? (value as (prevState: T) => T)(oldValue)
                    : value;
            setter(newValue);
            await set(key, newValue);
        };
    };

    const setGroups = createSetterWithStorage(setGroupsState, 'app_groups', groups);
    const setAllStudents = createSetterWithStorage(setAllStudentsState, 'app_students', allStudents);
    const setAllObservations = createSetterWithStorage(setAllObservationsState, 'app_observations', allObservations);
    const setSpecialNotes = createSetterWithStorage(setSpecialNotesState, 'app_specialNotes', specialNotes);
    const setAllPartialsData = createSetterWithStorage(setAllPartialsDataState, 'app_partialsData', allPartialsData);
    
    const setSettings = useCallback(async (newSettings: AppSettings) => {
        setSettingsState(newSettings);
        await set('app_settings', newSettings);
    }, []);

    const setActiveGroupId = useCallback(async (groupId: string | null) => {
        setActiveGroupIdState(groupId);
        if (groupId) {
            await set('activeGroupId_v1', groupId);
        } else {
            await del('activeGroupId_v1');
        }
    }, []);
    

    // --- MEMOIZED DERIVED STATE ---
    const activeGroup = useMemo(() => {
      if (!activeGroupId) return null;
      return groups.find(g => g.id === activeGroupId) || null;
    }, [groups, activeGroupId]);

    const activeStudentsInGroups = useMemo(() => Array.from(new Map(groups.flatMap(g => g.students.map(s => [s.id, s]))).values()), [groups]);
    const allPartialsDataForActiveGroup = useMemo(() => allPartialsData[activeGroupId || ''] || {}, [allPartialsData, activeGroupId]);
    const partialData = useMemo(() => allPartialsDataForActiveGroup[activePartialId] || defaultPartialData, [allPartialsDataForActiveGroup, activePartialId]);

    // --- CORE FUNCTIONS / ACTIONS ---
    const setActivePartialId = (partialId: PartialId) => setActivePartialIdState(partialId);

    const createPartialDataSetter = useCallback((field: keyof PartialData) => {
        return async (setter: React.SetStateAction<any>) => {
            if (!activeGroupId) return;

            setAllPartialsData(prev => {
                const groupData = prev[activeGroupId] || {};
                const pData = groupData[activePartialId] || defaultPartialData;
                const newValue = typeof setter === 'function' ? setter(pData[field]) : setter;
                const updatedPData = { ...pData, [field]: newValue };
                const updatedGroupData = { ...groupData, [activePartialId]: updatedPData };
                
                const finalState = { ...prev, [activeGroupId]: updatedGroupData };
                set('app_partialsData', finalState); // Persist change
                return finalState;
            });
        };
    }, [activeGroupId, activePartialId, setAllPartialsData]);
    
    const setGrades = createPartialDataSetter('grades');
    const setAttendance = createPartialDataSetter('attendance');
    const setParticipations = createPartialDataSetter('participations');
    const setActivities = createPartialDataSetter('activities');
    const setActivityRecords = createPartialDataSetter('activityRecords');
    const setRecoveryGrades = createPartialDataSetter('recoveryGrades');

    const setStudentFeedback = useCallback(async (studentId: string, feedback: string) => {
        if (!activeGroupId) return;
        setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const newFeedbacks = { ...(pData.feedbacks || {}), [studentId]: feedback };
            const finalState = { ...prev, [activeGroupId]: { ...groupData, [activePartialId]: { ...pData, feedbacks: newFeedbacks } } };
            set('app_partialsData', finalState);
            return finalState;
        });
    }, [activeGroupId, activePartialId, setAllPartialsData]);

    const setGroupAnalysis = useCallback(async (analysis: string) => {
        if (!activeGroupId) return;
        setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const finalState = { ...prev, [activeGroupId]: { ...groupData, [activePartialId]: { ...pData, groupAnalysis: analysis } } };
            set('app_partialsData', finalState);
            return finalState;
        });
    }, [activeGroupId, activePartialId, setAllPartialsData]);

    const addStudentsToGroup = useCallback(async (groupId: string, students: Student[]) => {
        await setAllStudents(prev => [...prev, ...students.filter(s => !prev.some(ps => ps.id === s.id))]);
        await setGroups(prev => prev.map(g => g.id === groupId ? { ...g, students: [...g.students, ...students] } : g));
    }, [setAllStudents, setGroups]);

    const removeStudentFromGroup = useCallback(async (groupId: string, studentId: string) => {
        await setGroups(prev => prev.map(g => g.id === groupId ? { ...g, students: g.students.filter(s => s.id !== studentId) } : g));
    }, [setGroups]);

    const updateGroup = useCallback(async (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => {
        await setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data } : g));
    }, [setGroups]);

    const updateStudent = useCallback(async (studentId: string, data: Partial<Student>) => {
        await setAllStudents(prev => prev.map(s => (s.id === studentId ? { ...s, ...data } : s)));
        await setGroups(prev =>
            prev.map(g => ({
                ...g,
                students: g.students.map(s => (s.id === studentId ? { ...s, ...data } : s)),
            }))
        );
    }, [setAllStudents, setGroups]);

    const updateGroupCriteria = useCallback(async (criteria: EvaluationCriteria[]) => {
        if (!activeGroupId) return;
        await setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, criteria } : g));
    }, [activeGroupId, setGroups]);

    const deleteGroup = useCallback(async (groupId: string) => {
        await setGroups(prev => prev.filter(g => g.id !== groupId));
        if (activeGroupId === groupId) setActiveGroupId(null);
    }, [activeGroupId, setGroups, setActiveGroupId]);

    const addStudentObservation = useCallback(async (obs: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
        const newObs = { ...obs, id: `OBS-${Date.now()}`, date: new Date().toISOString(), followUpUpdates: [], isClosed: false };
        await setAllObservations(prev => ({ ...prev, [obs.studentId]: [...(prev[obs.studentId] || []), newObs] }));
    }, [setAllObservations]);

    const updateStudentObservation = useCallback(async (studentId: string, obsId: string, updateText: string, isClosing: boolean) => {
        await setAllObservations(prev => ({
            ...prev,
            [studentId]: (prev[studentId] || []).map(obs => obs.id === obsId ? {
                ...obs,
                followUpUpdates: [...obs.followUpUpdates, { date: new Date().toISOString(), update: updateText }],
                isClosed: isClosing
            } : obs)
        }));
    }, [setAllObservations]);

    const takeAttendanceForDate = useCallback(async (groupId: string, date: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        setAllPartialsData(prev => {
            const groupData = prev[groupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            if (pData.attendance[date]) return prev;
            const newAttendance = group.students.reduce((acc, s) => ({ ...acc, [s.id]: true }), {});
            const finalState = { ...prev, [groupId]: { ...groupData, [activePartialId]: { ...pData, attendance: { ...pData.attendance, [date]: newAttendance }, participations: { ...pData.participations, [date]: {} } } } };
            set('app_partialsData', finalState);
            return finalState;
        });
    }, [groups, activePartialId, setAllPartialsData]);

    const deleteAttendanceDate = useCallback(async (date: string) => {
        if (!activeGroupId) return;
        setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const { [date]: _, ...newAttendance } = pData.attendance;
            const { [date]: __, ...newParticipations } = pData.participations;
            const finalState = { ...prev, [activeGroupId]: { ...groupData, [activePartialId]: { ...pData, attendance: newAttendance, participations: newParticipations } } };
            set('app_partialsData', finalState);
            return finalState;
        });
    }, [activeGroupId, activePartialId, setAllPartialsData]);

    const resetAllData = useCallback(async () => {
       setIsLoading(true);
        try {
            await clear();
            setTimeout(() => window.location.reload(), 500);
        } catch (e) {
            setError(e as Error);
        }
    }, []);

    const importAllData = useCallback(async (data: ExportData) => {
        if (!data.version || !data.groups || !data.students || !data.settings) {
            throw new Error("Archivo de importación inválido o corrupto.");
        }
        await clear();

        await set('app_groups', data.groups || []);
        await set('app_students', data.students || []);
        await set('app_observations', data.observations || {});
        await set('app_specialNotes', data.specialNotes || []);
        await set('app_settings', data.settings);
        await set('app_partialsData', data.partialsData || {});
        
        if (data.groups && data.groups.length > 0) {
           await set('activeGroupId_v1', data.groups[0].id);
        }
    }, []);
    
    // Special Notes Actions
    const addSpecialNote = useCallback(async (note: Omit<SpecialNote, 'id'>) => {
        const newNote = { ...note, id: `NOTE-${Date.now()}` };
        await setSpecialNotes(prev => [...prev, newNote]);
    }, [setSpecialNotes]);

    const updateSpecialNote = useCallback(async (noteId: string, noteUpdate: Partial<Omit<SpecialNote, 'id'>>) => {
        await setSpecialNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...noteUpdate } : n));
    }, [setSpecialNotes]);

    const deleteSpecialNote = useCallback(async (noteId: string) => {
        await setSpecialNotes(prev => prev.filter(n => n.id !== noteId));
    }, [setSpecialNotes]);


    // --- CALCULATIONS & DERIVED DATA ---
    const calculateDetailedFinalGrade = useCallback((studentId: string, pData: PartialData, criteria: EvaluationCriteria[]): { finalGrade: number, criteriaDetails: CriteriaDetail[], isRecovery: boolean } => {
        const recoveryInfo = pData.recoveryGrades?.[studentId];
        if (recoveryInfo?.applied) {
            return { finalGrade: recoveryInfo.grade ?? 0, criteriaDetails: [{ name: 'Recuperación', earned: recoveryInfo.grade ?? 0, weight: 100 }], isRecovery: true };
        }
        if (!pData || !criteria || criteria.length === 0) return { finalGrade: 0, criteriaDetails: [], isRecovery: false };

        let finalGrade = 0;
        const criteriaDetails: CriteriaDetail[] = [];
        criteria.forEach(c => {
            let ratio = 0;
            if (c.name === 'Actividades' || c.name === 'Portafolio') {
                const total = pData.activities?.length ?? 0;
                if (total > 0) ratio = (Object.values(pData.activityRecords?.[studentId] || {}).filter(Boolean).length) / total;
            } else if (c.name === 'Participación') {
                const total = Object.keys(pData.participations || {}).length;
                if (total > 0) ratio = Object.values(pData.participations).filter((day: any) => day[studentId]).length / total;
            } else {
                const delivered = pData.grades?.[studentId]?.[c.id]?.delivered ?? 0;
                if (c.expectedValue > 0) ratio = delivered / c.expectedValue;
            }
            const earned = ratio * c.weight;
            finalGrade += earned;
            criteriaDetails.push({ name: c.name, earned, weight: c.weight });
        });
        return { finalGrade: Math.max(0, Math.min(100, finalGrade)), criteriaDetails, isRecovery: false };
    }, []);

    const calculateFinalGrade = useCallback((studentId: string) => {
        if (!activeGroup) return 0;
        const data = allPartialsData[activeGroup.id]?.[activePartialId];
        return calculateDetailedFinalGrade(studentId, data || defaultPartialData, activeGroup?.criteria || []).finalGrade;
    }, [activeGroup, activePartialId, allPartialsData, calculateDetailedFinalGrade]);

    const getStudentRiskLevel = useCallback((finalGrade: number, pAttendance: AttendanceRecord, studentId: string): CalculatedRisk => {
        const days = Object.keys(pAttendance).filter(d => Object.prototype.hasOwnProperty.call(pAttendance[d], studentId));
        const attended = days.reduce((count, d) => pAttendance[d][studentId] === true ? count + 1 : count, 0);
        const attendanceRate = days.length > 0 ? (attended / days.length) * 100 : 100;
        
        let reason = [];
        if (finalGrade <= 59) {
            reason.push(`Calificación reprobatoria (${finalGrade.toFixed(0)}%).`);
        }
        if (attendanceRate < 80) {
            reason.push(`Asistencia baja (${attendanceRate.toFixed(0)}%).`);
        }
        
        if (reason.length > 0) {
            return { level: 'high', reason: reason.join(' ') };
        }
        
        if (finalGrade > 59 && finalGrade <= 70) {
            return { level: 'medium', reason: `Calificación baja (${finalGrade.toFixed(0)}%).` };
        }
        
        return { level: 'low', reason: 'Rendimiento adecuado' };
    }, []);

    const groupAverages = useMemo(() => {
        return groups.reduce((acc, group) => {
            const data = allPartialsData[group.id]?.[activePartialId];
            if (!data || !group.criteria || group.criteria.length === 0) { acc[group.id] = 0; return acc; }
            const grades = group.students.map(s => calculateDetailedFinalGrade(s.id, data, group.criteria).finalGrade);
            acc[group.id] = grades.length > 0 ? grades.reduce((sum, g) => sum + g, 0) / grades.length : 0;
            return acc;
        }, {} as { [gid: string]: number });
    }, [groups, activePartialId, allPartialsData, calculateDetailedFinalGrade]);

    const atRiskStudents = useMemo(() => {
        return groups.flatMap(group => {
            const data = allPartialsData[group.id]?.[activePartialId];
            if (!data || !group.criteria || group.criteria.length === 0) return [];
            return group.students.map(student => {
                const finalGrade = calculateDetailedFinalGrade(student.id, data, group.criteria).finalGrade;
                const risk = getStudentRiskLevel(finalGrade, data.attendance, student.id);
                return { ...student, calculatedRisk: risk };
            }).filter(s => s.calculatedRisk.level !== 'low');
        }).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [groups, activePartialId, allPartialsData, calculateDetailedFinalGrade, getStudentRiskLevel]);

    const overallAverageAttendance = useMemo(() => {
        if (!activeGroup) return 100;
        let totalPossible = 0;
        let totalPresent = 0;
        
        const attendanceForPartial = partialData.attendance;

        activeGroup.students.forEach(student => {
            Object.keys(attendanceForPartial).forEach(date => {
                // Check if the student has a record for this date
                if (Object.prototype.hasOwnProperty.call(attendanceForPartial[date], student.id)) {
                    totalPossible++;
                    if (attendanceForPartial[date][student.id]) {
                        totalPresent++;
                    }
                }
            });
        });

        if (totalPossible === 0) return 100;
        return (totalPresent / totalPossible) * 100;
    }, [activeGroup, partialData.attendance]);

    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null> => {
        const group = groups.find(g => g.id === groupId);
        return group ? { ...(allPartialsData[groupId]?.[partialId] || defaultPartialData), criteria: group.criteria || [] } : null;
    }, [allPartialsData, groups]);
    
    const generateFeedbackWithAI = useCallback(async (student: Student, stats: StudentStats): Promise<string> => {
        const prompt = `Como asistente educativo experto, crea una retroalimentación detallada y constructiva para el estudiante ${student.name}.
        
        DATOS CLAVE:
        - Calificación Final del Parcial: ${stats.finalGrade.toFixed(1)}%
        - Tasa de Asistencia: ${stats.attendance.rate.toFixed(1)}%
        - Desglose de Calificación: ${stats.criteriaDetails.map(c => `${c.name}: ${c.earned.toFixed(1)}%`).join(', ')}
        - Observaciones Recientes en Bitácora: ${stats.observations.length > 0 ? stats.observations.map(o => `(${o.type}) ${o.details}`).join('; ') : 'Ninguna.'}
        
        ESTRUCTURA DE LA RETROALIMENTACIÓN:
        1.  **Resumen General:** Inicia con un párrafo que resuma el desempeño general del estudiante en el parcial.
        2.  **Fortalezas:** Identifica y destaca 1 o 2 áreas donde el estudiante demostró un buen rendimiento. Sé específico (ej. "mostró un excelente dominio en el proyecto...").
        3.  **Áreas de Oportunidad:** Señala 1 o 2 áreas específicas que requieren mejora. Conecta el bajo rendimiento en un criterio con una posible causa (ej. "La calificación en 'Actividades' es baja, lo que sugiere una inconsistencia en la entrega de tareas...").
        4.  **Recomendaciones Concretas:** Ofrece 2 o 3 pasos o acciones claras y prácticas que el estudiante puede tomar para mejorar en el siguiente parcial.
        5.  **Cierre Motivacional:** Termina con una frase de aliento que motive al estudiante.
        
        REQUISITOS:
        -   **Lenguaje:** Utiliza un tono profesional, pero cercano y alentador. Evita la jerga demasiado técnica.
        -   **Formato:** Usa viñetas o listas numeradas para que la información sea fácil de digerir.
        -   **Idioma:** Toda la retroalimentación debe estar en español.
        -   **No incluyas el desglose de calificación en la respuesta final, solo úsalo como contexto.**`;
        
        return await generateFeedback(prompt, settings.apiKey);
    }, [settings.apiKey]);
    
    const generateGroupAnalysisWithAI = useCallback(async (group: Group, summary: any, recoverySummary: any, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]) => {
        const prompt = `Eres un pedagogo experto analizando el rendimiento de un grupo de estudiantes. Genera un análisis narrativo profesional para un informe académico.

DATOS DEL GRUPO:
-   Asignatura: ${group.subject}
-   Total de Estudiantes: ${summary.totalStudents}
-   Promedio General: ${summary.groupAverage.toFixed(1)}%
-   Tasa de Aprobación: ${((summary.approvedCount / summary.totalStudents) * 100).toFixed(1)}% (${summary.approvedCount} de ${summary.totalStudents} aprobados)
-   Tasa de Asistencia General: ${summary.attendanceRate.toFixed(1)}%
-   Estudiantes en Riesgo (Alto o Medio): ${atRisk.length}
-   Observaciones Recientes Clave: ${observations.slice(0, 3).map(o => `${o.studentName}: ${o.details}`).join('; ') || 'Ninguna destacada.'}

ESTRUCTURA DEL ANÁLISIS:
1.  **Análisis General del Rendimiento:** Comienza con un párrafo que resuma el desempeño general del grupo, interpretando el promedio y la tasa de aprobación.
2.  **Análisis de Asistencia:** Comenta sobre la tasa de asistencia y su posible impacto en el rendimiento académico.
3.  **Identificación de Patrones:** Menciona si observas algún patrón general. ¿El grupo es homogéneo o heterogéneo? ¿Hay fortalezas o debilidades comunes?
4.  **Alumnado en Riesgo:** Enfócate en el número de estudiantes en riesgo. Sin nombrar a los estudiantes, describe las posibles causas (bajas calificaciones, inasistencias).
5.  **Recomendaciones y Estrategias:** Propón 2 o 3 estrategias o acciones pedagógicas que se podrían implementar en el siguiente parcial para mejorar el rendimiento del grupo y apoyar a los estudiantes en riesgo.
6.  **Conclusión:** Cierra con una perspectiva general para el futuro del grupo.

REQUISITOS:
-   **Tono:** Profesional, objetivo y propositivo.
-   **Idioma:** Español.
-   **Formato:** Párrafos bien estructurados. No uses listas o viñetas.`;

        return await generateGroupAnalysis(prompt, settings.apiKey);
    }, [settings.apiKey]);
    
    const generateSemesterAnalysisWithAI = useCallback(async (group: Group, summary: any) => {
        const prompt = `Eres un director académico redactando el análisis final de un informe semestral para un grupo.

DATOS FINALES DEL SEMESTRE:
-   Asignatura: ${group.subject}
-   Total de Estudiantes: ${summary.totalStudents}
-   Promedio General Final: ${summary.groupAverage.toFixed(1)}%
-   Tasa de Aprobación Final: ${((summary.approvedCount / summary.totalStudents) * 100).toFixed(1)}% (${summary.approvedCount} de ${summary.totalStudents} aprobados)
-   Tasa de Asistencia Consolidada: ${summary.attendanceRate.toFixed(1)}%

ESTRUCTURA DEL ANÁLISIS SEMESTRAL:
1.  **Conclusión General del Semestre:** Inicia con una valoración global del desempeño del grupo a lo largo del semestre. ¿Cumplieron las expectativas? ¿Hubo progreso?
2.  **Análisis de Resultados Finales:** Interpreta la tasa de aprobación y el promedio final. ¿Son resultados positivos? ¿Qué indican sobre el aprendizaje consolidado?
3.  **Reflexión sobre el Proceso:** Comenta brevemente sobre la trayectoria del grupo. ¿Fue un semestre estable, de mejora constante, o con altibajos? Relaciona la asistencia con los resultados.
4.  **Perspectivas a Futuro:** Basado en los resultados, ofrece una breve perspectiva o recomendación para los estudiantes en su siguiente etapa académica.
5.  **Cierre Formal:** Concluye el análisis de forma concisa y profesional.

REQUISITOS:
-   **Tono:** Formal, conclusivo y evaluativo.
-   **Idioma:** Español.
-   **Formato:** Un único párrafo o dos párrafos cortos. Debe ser un resumen ejecutivo y directo.`;

        return await generateSemesterAnalysis(prompt, settings.apiKey);
    }, [settings.apiKey]);


    return (
        <DataContext.Provider value={{
            isLoading, error, groups, allStudents, activeStudentsInGroups, allObservations, specialNotes, settings, activeGroup, activeGroupId, activePartialId, partialData, allPartialsDataForActiveGroup, groupAverages, atRiskStudents, overallAverageAttendance,
            setGroups, setAllStudents, setAllObservations, setAllPartialsData, setSpecialNotes,
            setSettings, setActiveGroupId, setActivePartialId,
            setGrades, setAttendance, setParticipations, setActivities, setActivityRecords, setRecoveryGrades, setStudentFeedback, setGroupAnalysis,
            addStudentsToGroup, removeStudentFromGroup, updateGroup, updateStudent, updateGroupCriteria, deleteGroup, addStudentObservation, updateStudentObservation, takeAttendanceForDate, deleteAttendanceDate, resetAllData, importAllData, addSpecialNote, updateSpecialNote, deleteSpecialNote,
            calculateFinalGrade, calculateDetailedFinalGrade, getStudentRiskLevel, fetchPartialData,
            generateFeedbackWithAI, generateGroupAnalysisWithAI, generateSemesterAnalysisWithAI
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData debe ser usado dentro de un DataProvider');
    }
    return context;
};
