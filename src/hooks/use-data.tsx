'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { get, set, del, clear } from 'idb-keyval';
import type { Student, Group, PartialId, StudentObservation, SpecialNote, EvaluationCriteria, GradeDetail, Grades, RecoveryGrade, RecoveryGrades, AttendanceRecord, ParticipationRecord, Activity, ActivityRecord, CalculatedRisk, StudentWithRisk, CriteriaDetail, StudentStats, GroupedActivities, AppSettings, PartialData, AllPartialsData, AllPartialsDataForGroup } from '@/lib/placeholder-data';
import { format } from 'date-fns';
import { getPartialLabel } from '@/lib/utils';


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
    whatsappContactNumber: "",
    aiModel: 'gemini-2.5-flash',
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
    

    return (
        <DataContext.Provider value={{
            isLoading, error, groups, allStudents, activeStudentsInGroups, allObservations, specialNotes, settings, activeGroup, activeGroupId, activePartialId, partialData, allPartialsDataForActiveGroup, groupAverages, atRiskStudents, overallAverageAttendance,
            setGroups, setAllStudents, setAllObservations, setAllPartialsData, setSpecialNotes,
            setSettings, setActiveGroupId, setActivePartialId,
            setGrades, setAttendance, setParticipations, setActivities, setActivityRecords, setRecoveryGrades, setStudentFeedback, setGroupAnalysis,
            addStudentsToGroup, removeStudentFromGroup, updateGroup, updateStudent, updateGroupCriteria, deleteGroup, addStudentObservation, updateStudentObservation, takeAttendanceForDate, deleteAttendanceDate, resetAllData, importAllData, addSpecialNote, updateSpecialNote, deleteSpecialNote,
            calculateFinalGrade, calculateDetailedFinalGrade, getStudentRiskLevel, fetchPartialData,
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
