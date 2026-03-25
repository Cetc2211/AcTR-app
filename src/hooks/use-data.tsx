'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, PartialId, StudentObservation } from '@/lib/placeholder-data';
import { getPartialLabel } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { User } from 'firebase/auth';


// TYPE DEFINITIONS
export type EvaluationCriteria = {
  id: string;
  name: string;
  weight: number;
  expectedValue: number;
  isAutomated?: boolean;
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


export type GroupedActivities = {
  [dueDate: string]: Activity[];
};

export type GroupStats = {
  average: number;
  highRiskCount: number;
}

export type CalculatedRisk = {
    level: 'low' | 'medium' | 'high';
    reason: string;
}
export type StudentWithRisk = Student & { calculatedRisk: CalculatedRisk };

export type CriteriaDetail = {
    name: string;
    earned: number;
    weight: number;
}

export type StudentStats = {
    finalGrade: number;
    criteriaDetails: CriteriaDetail[];
    isRecovery: boolean;
    partialId: PartialId;
    attendance: { p: number; a: number; total: number; rate: number };
    observations: StudentObservation[];
};


export type PartialData = {
    grades: Grades;
    attendance: AttendanceRecord;
    participations: ParticipationRecord;
    activities: Activity[];
    activityRecords: ActivityRecord;
    recoveryGrades: RecoveryGrades;
    feedbacks: { [studentId: string]: string };
    groupAnalysis?: string;
};

export type AllPartialsDataForGroup = {
    [partialId in PartialId]?: PartialData;
};

export type AllPartialsData = {
  [groupId: string]: AllPartialsDataForGroup;
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
    signature: string;
    facilitatorName?: string;
};

const defaultSettings: AppSettings = {
    institutionName: "Mi Institución",
    logo: "",
    theme: "theme-mint",
    apiKey: "",
    signature: "",
    facilitatorName: "",
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

type GroupReportSummary = {
    totalStudents: number;
    approvedCount: number;
    failedCount: number;
    groupAverage: number;
    attendanceRate: number;
    participationRate: number;
}

type RecoverySummary = {
    recoveryStudentsCount: number;
    approvedOnRecovery: number;
    failedOnRecovery: number;
}


// CONTEXT TYPE
interface DataContextType {
  // State
  isLoading: boolean;
  error: Error | null;
  user: User | null | undefined;
  groups: Group[];
  allStudents: Student[];
  activeStudentsInGroups: Student[];
  allObservations: {[studentId: string]: StudentObservation[]};
  settings: AppSettings;
  
  activeGroup: Group | null;
  activePartialId: PartialId;
  
  partialData: PartialData;
  allPartialsDataForActiveGroup: AllPartialsDataForGroup;


  groupAverages: {[groupId: string]: number};
  atRiskStudents: StudentWithRisk[];
  overallAverageParticipation: number;

  // Setters / Updaters
  addStudentsToGroup: (groupId: string, students: Student[]) => Promise<void>;
  removeStudentFromGroup: (groupId: string, studentId: string) => Promise<void>;
  updateGroup: (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => Promise<void>;
  updateStudent: (studentId: string, data: Partial<Student>) => Promise<void>;
  updateGroupCriteria: (criteria: EvaluationCriteria[]) => Promise<void>;
  createGroup: (group: Group) => Promise<void>;
  
  setActiveGroupId: (groupId: string | null) => void;
  setActivePartialId: (partialId: PartialId) => void;
  
  setGrades: (setter: React.SetStateAction<Grades>) => Promise<void>;
  setAttendance: (setter: React.SetStateAction<AttendanceRecord>) => Promise<void>;
  setParticipations: (setter: React.SetStateAction<ParticipationRecord>) => Promise<void>;
  setActivities: (setter: React.SetStateAction<Activity[]>) => Promise<void>;
  setActivityRecords: (setter: React.SetStateAction<ActivityRecord>) => Promise<void>;
  setRecoveryGrades: (setter: React.SetStateAction<RecoveryGrades>) => Promise<void>;
  setStudentFeedback: (studentId: string, feedback: string) => Promise<void>;
  setGroupAnalysis: (analysis: string) => Promise<void>;
  setSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;


  // Functions
  deleteGroup: (groupId: string) => Promise<void>;
  addStudentObservation: (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => Promise<void>;
  updateStudentObservation: (studentId: string, observationId: string, updateText: string, isClosing: boolean) => Promise<void>;
  calculateFinalGrade: (studentId: string) => number;
  calculateDetailedFinalGrade: (studentId: string, pData: PartialData, criteria: EvaluationCriteria[]) => { finalGrade: number, criteriaDetails: CriteriaDetail[], isRecovery: boolean };
  getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
  fetchPartialData: (groupId: string, partialId: PartialId) => Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null>;
  takeAttendanceForDate: (groupId: string, date: string) => Promise<void>;
  generateFeedbackWithAI: (student: Student, stats: StudentStats) => Promise<string>;
  generateGroupAnalysisWithAI: (group: Group, summary: GroupReportSummary, recoverySummary: RecoverySummary, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]) => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// DATA PROVIDER COMPONENT
export const DataProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const [user, authLoading] = useAuthState(auth);

    // Main State
    const [groups, setGroups] = useState<Group[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allObservations, setAllObservations] = useState<{[studentId: string]: StudentObservation[]}>({});
    const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialId] = useState<PartialId>('p1');
    const [allPartialsData, setAllPartialsData] = useState<AllPartialsData>({});

    const getStorageKey = (baseKey: string) => user ? `${baseKey}_${user.uid}` : `${baseKey}_logged_out`;

    const loadFromStorage = useCallback(<T,>(key: string, defaultValue: T): T => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const storedValue = localStorage.getItem(getStorageKey(key));
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage`, error);
            setError(error as Error);
            return defaultValue;
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                try {
                    setGroups(loadFromStorage('app_groups', []));
                    setAllStudents(loadFromStorage('app_students', []));
                    setAllObservations(loadFromStorage('app_observations', {}));
                    setAllPartialsData(loadFromStorage('app_partialsData', {}));
                    setSettingsState(loadFromStorage('app_settings', defaultSettings));
                    
                    const storedActiveGroupId = loadFromStorage('activeGroupId_v1', null);
                    const availableGroups = loadFromStorage('app_groups', []);
                    if(availableGroups.some((g: Group) => g.id === storedActiveGroupId)){
                        setActiveGroupIdState(storedActiveGroupId);
                    } else if (availableGroups.length > 0) {
                        setActiveGroupIdState(availableGroups[0].id);
                    }
                } catch (e) {
                    setError(e as Error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                 setIsLoading(false); // No user, stop loading
            }
        }
    }, [user, loadFromStorage, authLoading]);
    
    // Derived State
    const activeGroup = useMemo(() => {
        if (!activeGroupId) return null;
        return groups.find(g => g.id === activeGroupId) || null;
    }, [groups, activeGroupId]);

    const allPartialsDataForActiveGroup = useMemo(() => {
        if (!activeGroupId) return {};
        return allPartialsData[activeGroupId] || {};
    }, [activeGroupId, allPartialsData]);
    
    const partialData = useMemo((): PartialData => {
        if (!activeGroupId) return defaultPartialData;
        return allPartialsDataForActiveGroup[activePartialId] || defaultPartialData;
    }, [allPartialsDataForActiveGroup, activePartialId, activeGroupId]);

    // Data Persistence Effects
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_groups'), JSON.stringify(groups));
    }, [groups, isLoading, user]);
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_students'), JSON.stringify(allStudents));
    }, [allStudents, isLoading, user]);
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_observations'), JSON.stringify(allObservations));
    }, [allObservations, isLoading, user]);
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_settings'), JSON.stringify(settings));
    }, [settings, isLoading, user]);
     useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('activeGroupId_v1'), JSON.stringify(activeGroupId));
    }, [activeGroupId, isLoading, user]);
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_partialsData'), JSON.stringify(allPartialsData));
    }, [allPartialsData, isLoading, user]);


    const setActiveGroupId = useCallback((groupId: string | null) => {
        setActiveGroupIdState(groupId);
    }, []);

    // ---- Calculation Logic ----
    const calculateDetailedFinalGrade = useCallback((studentId: string, pData: PartialData, criteria: EvaluationCriteria[]): { finalGrade: number, criteriaDetails: CriteriaDetail[], isRecovery: boolean } => {
        if (!pData || !criteria || criteria.length === 0) {
            return { finalGrade: 0, criteriaDetails: [], isRecovery: false };
        }

        const recoveryInfo = pData.recoveryGrades?.[studentId];
        if (recoveryInfo?.applied) {
            return {
                finalGrade: recoveryInfo.grade ?? 0,
                criteriaDetails: [{ name: 'Recuperación', earned: recoveryInfo.grade ?? 0, weight: 100 }],
                isRecovery: true,
            };
        }
        
        let finalGrade = 0;
        const criteriaDetails: CriteriaDetail[] = [];
        
        for (const criterion of criteria) {
            let performanceRatio = 0;

             if (criterion.name === 'Actividades' || criterion.name === 'Portafolio') {
                const totalActivities = pData.activities?.length ?? 0;
                if (totalActivities > 0) {
                    const deliveredActivities = Object.values(pData.activityRecords?.[studentId] || {}).filter(Boolean).length;
                    performanceRatio = deliveredActivities / totalActivities;
                }
            } else if (criterion.name === 'Participación') {
                 const totalClasses = Object.keys(pData.participations || {}).length;
                 if (totalClasses > 0) {
                    const studentParticipations = Object.values(pData.participations).filter(day => day[studentId]).length;
                    performanceRatio = studentParticipations / totalClasses;
                 }
            } else {
                const delivered = pData.grades?.[studentId]?.[criterion.id]?.delivered ?? 0;
                const expected = criterion.expectedValue;
                if (expected > 0) {
                    performanceRatio = (delivered ?? 0) / expected;
                }
            }
            const earnedPercentage = performanceRatio * criterion.weight;
            finalGrade += earnedPercentage;
            criteriaDetails.push({ name: criterion.name, earned: earnedPercentage, weight: criterion.weight });
        }
        
        const grade = Math.max(0, Math.min(100, finalGrade));
        return { finalGrade: grade, criteriaDetails: criteriaDetails, isRecovery: false };
    }, []);

    const calculateFinalGrade = useCallback((studentId: string): number => {
        if (!activeGroup || !partialData) return 0;
        return calculateDetailedFinalGrade(studentId, partialData, activeGroup.criteria).finalGrade;
    }, [activeGroup, partialData, calculateDetailedFinalGrade]);


    const getStudentRiskLevel = useCallback((finalGrade: number, pAttendance: AttendanceRecord | undefined, studentId: string): CalculatedRisk => {
        const safeAttendance = pAttendance || {};
        const studentAttendanceDays = Object.keys(safeAttendance).filter(date => Object.prototype.hasOwnProperty.call(safeAttendance[date], studentId));
        const totalDaysForStudent = studentAttendanceDays.length;

        const absences = studentAttendanceDays.reduce((count, date) => {
            return safeAttendance[date][studentId] === false ? count + 1 : count;
        }, 0);
        
        if (absences > 3) {
            return {
                level: 'high',
                reason: `Ausentismo crítico (${absences} faltas). Requiere atención independientemente del promedio.`
            };
        }

        if (finalGrade < 50 && absences >= 2) {
             return {
                level: 'high',
                reason: `Promedio de ${finalGrade.toFixed(0)}% y ${absences} faltas.`
            };
        }
        
        if (finalGrade <= 70 && absences >= 2) {
            return {
                level: 'medium',
                reason: `Promedio de ${finalGrade.toFixed(0)}% y ${absences} faltas.`
            };
        }
        
        return {level: 'low', reason: 'Sin riesgo detectado' };
    }, []);
    
    // --- Calculated / Memoized State ---
    const groupAverages = useMemo(() => {
        const averages: {[groupId: string]: number} = {};
        groups.forEach(group => {
            if (!group || !group.criteria || group.criteria.length === 0) {
                averages[group.id] = 0;
                return;
            }
            const groupPartialData = allPartialsData[group.id]?.[activePartialId];
            if (!groupPartialData) {
                averages[group.id] = 0;
                return;
            }
            const groupGrades = group.students.map(s => calculateDetailedFinalGrade(s.id, groupPartialData, group.criteria).finalGrade);
            if(groupGrades.length === 0) {
                averages[group.id] = 0;
                return;
            }
            const total = groupGrades.reduce((sum, grade) => sum + grade, 0);
            averages[group.id] = groupGrades.length > 0 ? total / groupGrades.length : 0;
        });
        return averages;
    }, [groups, allPartialsData, activePartialId, calculateDetailedFinalGrade]);

    const atRiskStudents = useMemo(() => {
        const students: StudentWithRisk[] = [];
        const studentsAtRiskInPartial = new Map<string, StudentWithRisk>();
        groups.forEach(group => {
            if (!group || !group.criteria || group.criteria.length === 0) return;
            const groupPartialData = allPartialsData[group.id]?.[activePartialId];
            if (!groupPartialData) return;

            group.students.forEach(student => {
                const finalGrade = calculateDetailedFinalGrade(student.id, groupPartialData, group.criteria).finalGrade;
                const risk = getStudentRiskLevel(finalGrade, groupPartialData.attendance, student.id);

                if (risk.level === 'high' || risk.level === 'medium') {
                    studentsAtRiskInPartial.set(student.id, { ...student, calculatedRisk: risk });
                }
            });
        });
        students.push(...Array.from(studentsAtRiskInPartial.values()));
        return students;
    }, [groups, allPartialsData, activePartialId, calculateDetailedFinalGrade, getStudentRiskLevel]);

    const overallAverageParticipation = useMemo(() => {
        if (!activeGroup) return 100;
        const pData = allPartialsData[activeGroup.id]?.[activePartialId];
        if (!pData || Object.keys(pData.participations).length === 0) return 100;

        let totalRatio = 0;
        let studentsWithOpportunities = 0;
        activeGroup.students.forEach(student => {
            const participationDates = Object.keys(pData.participations);
            const studentParticipationOpportunities = participationDates.filter(date => Object.prototype.hasOwnProperty.call(pData.participations[date], student.id)).length;

            if (studentParticipationOpportunities > 0) {
                 const studentParticipations = Object.values(pData.participations).filter(p => p[student.id]).length;
                 totalRatio += studentParticipations / studentParticipationOpportunities;
                 studentsWithOpportunities++;
            }
        });
        if (studentsWithOpportunities > 0) {
            return (totalRatio / studentsWithOpportunities) * 100;
        }
        return 100;
    }, [activeGroup, allPartialsData, activePartialId]);


    // ---- HOOK FUNCTIONS ----
    const createGroup = useCallback(async (group: Group) => {
        setGroups(prev => {
            const newGroups = [...prev, group];
            if(newGroups.length === 1) {
                setActiveGroupIdState(newGroups[0].id);
            }
            return newGroups;
        });
        return Promise.resolve();
    }, []);

    const addStudentsToGroup = useCallback(async (groupId: string, students: Student[]) => {
        const newStudentIds = new Set(students.map(s => s.id));
        setAllStudents(prev => [...prev.filter(s => !newStudentIds.has(s.id)), ...students]);
        setGroups(prev => prev.map(g => g.id === groupId ? {...g, students: [...g.students, ...students]} : g));
        return Promise.resolve();
    }, []);

    const removeStudentFromGroup = useCallback(async (groupId: string, studentId: string) => {
        setGroups(prev => prev.map(g => g.id === groupId ? {...g, students: g.students.filter(s => s.id !== studentId)} : g));
        return Promise.resolve();
    }, []);
    
    const updateGroup = useCallback(async (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data } : g));
        return Promise.resolve();
    }, []);

    const updateStudent = useCallback(async (studentId: string, data: Partial<Student>) => {
        setAllStudents(prev => prev.map(s => s.id === studentId ? {...s, ...data} : s));
        setGroups(prev => prev.map(g => ({
            ...g,
            students: g.students.map(s => s.id === studentId ? { ...s, ...data } : s),
        })));
        return Promise.resolve();
    }, []);

    const updateGroupCriteria = useCallback(async (criteria: EvaluationCriteria[]) => {
        if(activeGroupId) {
            setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, criteria } : g));
        }
        return Promise.resolve();
    }, [activeGroupId]);
    
    const deleteGroup = useCallback(async (groupId: string) => {
        setGroups(prev => {
            const newGroups = prev.filter(g => g.id !== groupId);
            if (activeGroupId === groupId) {
                const newActiveId = newGroups.length > 0 ? newGroups[0].id : null;
                setActiveGroupIdState(newActiveId);
            }
            return newGroups;
        });
        return Promise.resolve();
    }, [activeGroupId]);

    const addStudentObservation = useCallback(async (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
        const newObservation: StudentObservation = {
            ...observation,
            id: `OBS-${Date.now()}`,
            date: new Date().toISOString(),
            followUpUpdates: [],
            isClosed: false,
        };
        setAllObservations(prev => ({
            ...prev,
            [observation.studentId]: [...(prev[observation.studentId] || []), newObservation]
        }));
        return Promise.resolve();
    }, []);

    const updateStudentObservation = useCallback(async (studentId: string, observationId: string, updateText: string, isClosing: boolean) => {
        setAllObservations(prev => {
            const studentObs = (prev[studentId] || []).map(obs => {
                if (obs.id === observationId) {
                    const newUpdate = { date: new Date().toISOString(), update: updateText };
                    return {
                        ...obs,
                        followUpUpdates: [...obs.followUpUpdates, newUpdate],
                        isClosed: isClosing
                    };
                }
                return obs;
            });
            return { ...prev, [studentId]: studentObs };
        });
    }, []);
    
    const resetAllData = useCallback(async () => {
        if(typeof window !== 'undefined' && user) {
            localStorage.removeItem(getStorageKey('app_groups'));
            localStorage.removeItem(getStorageKey('app_students'));
            localStorage.removeItem(getStorageKey('app_observations'));
            localStorage.removeItem(getStorageKey('app_partialsData'));
            localStorage.removeItem(getStorageKey('activeGroupId_v1'));
        }
        setGroups([]);
        setAllStudents([]);
        setAllObservations({});
        setAllPartialsData({});
        setActiveGroupIdState(null);
        setActivePartialId('p1');
        window.location.reload();
        return Promise.resolve();
    }, [user, getStorageKey]);

    const createSetterForPartialData = useCallback(<T,>(field: keyof PartialData) => {
        return async (setter: React.SetStateAction<T>) => {
            if (!activeGroupId) return Promise.resolve();
            
            setAllPartialsData(prevAllData => {
                const currentGroupData = prevAllData[activeGroupId] || {};
                const currentPartialData = currentGroupData[activePartialId] || defaultPartialData;
                const currentValue = currentPartialData[field] as T;
                const newValue = typeof setter === 'function' ? (setter as (prevState: T) => T)(currentValue) : setter;

                const newPartialData = { ...currentPartialData, [field]: newValue };
                return {
                    ...prevAllData,
                    [activeGroupId]: {
                        ...currentGroupData,
                        [activePartialId]: newPartialData,
                    },
                };
            });
            return Promise.resolve();
        };
    }, [activeGroupId, activePartialId]);

    const setSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
        setSettingsState(prev => ({...prev, ...newSettings}));
        return Promise.resolve();
    }, []);

    const setGrades = createSetterForPartialData<Grades>('grades');
    const setAttendance = createSetterForPartialData<AttendanceRecord>('attendance');
    const setParticipations = createSetterForPartialData<ParticipationRecord>('participations');
    const setActivities = createSetterForPartialData<Activity[]>('activities');
    const setActivityRecords = createSetterForPartialData<ActivityRecord>('activityRecords');
    const setRecoveryGrades = createSetterForPartialData<RecoveryGrades>('recoveryGrades');
    
    const setStudentFeedback = useCallback(async (studentId: string, feedback: string) => {
        if (!activeGroupId) return Promise.resolve();
        setAllPartialsData(prev => {
            const newFeedbacks = { ...(prev[activeGroupId]?.[activePartialId]?.feedbacks || {}), [studentId]: feedback };
            const newPData = { ...(prev[activeGroupId]?.[activePartialId] || defaultPartialData), feedbacks: newFeedbacks };
            return {
                ...prev,
                [activeGroupId]: {
                    ...(prev[activeGroupId] || {}),
                    [activePartialId]: newPData
                }
            };
        });
    }, [activeGroupId, activePartialId]);

    const setGroupAnalysis = useCallback(async (analysis: string) => {
        if (!activeGroupId) return Promise.resolve();
        setAllPartialsData(prev => {
            const newPData = { ...(prev[activeGroupId]?.[activePartialId] || defaultPartialData), groupAnalysis: analysis };
            return {
                ...prev,
                [activeGroupId]: {
                    ...(prev[activeGroupId] || {}),
                    [activePartialId]: newPData
                }
            };
        });
    }, [activeGroupId, activePartialId]);
    
    const takeAttendanceForDate = useCallback(async (groupId: string, date: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const newAttendanceRecord = group.students.reduce((acc, s) => ({...acc, [s.id]: true}), {});
        
        setAllPartialsData(prevAllData => {
            const currentGroupData = prevAllData[groupId] || {};
            const currentPartialData = currentGroupData[activePartialId] || defaultPartialData;
            const newAttendance = {...currentPartialData.attendance, [date]: newAttendanceRecord };
            const newPartialData = { ...currentPartialData, attendance: newAttendance };
            return {
                ...prevAllData,
                [groupId]: {
                    ...currentGroupData,
                    [activePartialId]: newPartialData,
                },
            };
        });
    }, [groups, activePartialId]);
    
    const fetchPartialData = useCallback(async (groupId: string, partialId: PartialId): Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null> => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return null;
        const pData = allPartialsData[groupId]?.[partialId] || defaultPartialData;
        return {...pData, criteria: group?.criteria || []};
    }, [allPartialsData, groups]);

    const callGoogleAI = async (prompt: string): Promise<string> => {
        if (!settings.apiKey) {
            throw new Error("No se ha configurado una clave API de Google AI. Ve a Ajustes para agregarla.");
        }
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${settings.apiKey}`;
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error del servicio de IA: ${errorData.error?.message || response.statusText}`);
            }
            const data = await response.json();
            const feedbackText = data.candidates[0]?.content?.parts[0]?.text;
            if (!feedbackText) {
                throw new Error("La respuesta de la IA no contiene texto.");
            }
            return feedbackText;
        } catch (error) {
            if (error instanceof Error) {
                 throw new Error(error.message);
            }
            throw new Error("Ocurrió un error desconocido al conectar con el servicio de IA.");
        }
    };
    
    const generateFeedbackWithAI = useCallback(async (student: Student, stats: StudentStats): Promise<string> => {
        const criteriaSummary = stats.criteriaDetails.map(c => `- ${c.name}: ${c.earned.toFixed(0)}% de ${c.weight}%`).join('\n');
        const observationsSummary = stats.observations.length > 0 
            ? `Observaciones importantes en bitácora:\n` + stats.observations.map(o => `- Tipo: ${o.type}. Detalles: ${o.details}. ${o.canalizationTarget ? `Canalizado a: ${o.canalizationTarget}` : ''}`).join('\n')
            : "No hay observaciones en bitácora para este parcial.";

        const prompt = `
            Eres un asistente de docentes experto en pedagogía y comunicación asertiva.
            Tu tarea es generar una retroalimentación constructiva, profesional y personalizada para un estudiante, integrando sus datos académicos y de comportamiento.
            La retroalimentación debe ser balanceada: inicia con fortalezas, luego aborda áreas de oportunidad y finaliza con recomendaciones claras.

            INSTRUCCIONES CLAVE:
            1.  **Analiza la Bitácora:** No solo listes las observaciones. Interprétalas y adapta el tono.
                - Si hay 'Problema de conducta', enfoca el mensaje en el apoyo. Ejemplo: "He notado algunos desafíos en... y quiero que sepas que estoy aquí para ayudarte a encontrar mejores estrategias. No es para señalar, sino para que juntos logremos un ambiente positivo".
                - Si hay 'Episodio emocional' y fue canalizado, muestra empatía. Ejemplo: "Soy consciente de la situación que estás atravesando y quiero que sepas que tienes mi apoyo. Es importante que aproveches el acompañamiento que se te ha brindado".
                - Si hay 'Méritos', úsalos para reforzar positivamente. Ejemplo: "Quiero felicitarte especialmente por [mérito], demuestra tu gran capacidad para...".
            2.  **Conecta los Puntos:** Relaciona el rendimiento académico (calificaciones, asistencia) con las observaciones de la bitácora si es posible.
            3.  **Tono:** Usa un tono de apoyo y motivador, enfocado en el crecimiento del estudiante.
            4.  **Formato:** Redacta en párrafos fluidos. No uses asteriscos ni guiones para listas en el texto final.
            5.  **Sin Despedidas:** No incluyas ninguna despedida, firma o nombre al final. La salida debe ser únicamente el cuerpo de la retroalimentación.

            DATOS DEL ESTUDIANTE:
            - Nombre: ${student.name}
            - Calificación final del parcial: ${stats.finalGrade.toFixed(0)}%
            - Tasa de asistencia: ${stats.attendance.rate.toFixed(0)}%
            - Desglose de calificación:
            ${criteriaSummary}
            - Información de la bitácora:
            ${observationsSummary}

            Por favor, redacta la retroalimentación para ${student.name}, aplicando todas las instrucciones.
        `;
        return callGoogleAI(prompt);
    }, [settings.apiKey]);
    
    const generateGroupAnalysisWithAI = useCallback(async (group: Group, summary: GroupReportSummary, recoverySummary: RecoverySummary, atRisk: StudentWithRisk[], observations: (StudentObservation & { studentName: string })[]): Promise<string> => {
        const partialLabel = getPartialLabel(activePartialId);
        const atRiskSummary = atRisk.length > 0 ? `Se han identificado ${atRisk.length} estudiantes en riesgo (${atRisk.filter(s=>s.calculatedRisk.level==='high').length} en riesgo alto y ${atRisk.filter(s=>s.calculatedRisk.level==='medium').length} en riesgo medio).` : "No se han identificado estudiantes en riesgo significativo en este parcial.";
        const observationsSummary = observations.length > 0 ? `Se han registrado ${observations.length} observaciones notables en la bitácora durante este periodo. Las más comunes son sobre: ${[...new Set(observations.map(o => o.type.toLowerCase()))].join(', ')}.` : "No se han registrado observaciones significativas en la bitácora para este grupo en el parcial.";
        const recoveryContext = recoverySummary.recoveryStudentsCount > 0 ? `Un total de ${recoverySummary.recoveryStudentsCount} estudiantes requirieron calificación de recuperación. De ellos, ${recoverySummary.approvedOnRecovery} lograron aprobar gracias a esta medida, mientras que ${recoverySummary.failedOnRecovery} no alcanzaron la calificación aprobatoria. Esto indica que la estrategia de recuperación fue parcialmente exitosa.` : `No hubo estudiantes que requirieran calificación de recuperación en este parcial, lo cual es un indicador positivo.`;

        const prompt = `
            Actúa como un analista educativo experto redactando un informe para un docente. Tu tarea es generar un análisis narrativo profesional, objetivo y fluido sobre el rendimiento de un grupo de estudiantes para el ${partialLabel}.
            Sintetiza los datos cuantitativos y cualitativos proporcionados en un texto coherente. La redacción debe ser formal, directa y constructiva, como si la hubiera escrito el propio docente para sus archivos o para un directivo.
            
            IMPORTANTE: No utilices asteriscos (*) para listas o para dar énfasis. La redacción debe ser en párrafos fluidos. No uses "lenguaje de IA" o formatos típicos de chatbot.

            DATOS DEL GRUPO A ANALIZAR:
            - Asignatura: ${group.subject}
            - Parcial: ${partialLabel}
            - Número de estudiantes: ${summary.totalStudents}
            - Promedio general del grupo: ${summary.groupAverage.toFixed(1)}%
            - Tasa de aprobación (incluyendo recuperación): ${(summary.approvedCount / summary.totalStudents * 100).toFixed(1)}% (${summary.approvedCount} de ${summary.totalStudents} estudiantes)
            - Tasa de asistencia general: ${summary.attendanceRate.toFixed(1)}%
            - Resumen de estudiantes en riesgo: ${atRiskSummary}
            - Resumen de la bitácora: ${observationsSummary}
            - Análisis de recuperación: ${recoveryContext}

            Basado en estos datos, redacta el análisis cualitativo. Estructura el informe de la siguiente manera:
            1. Un párrafo inicial con el panorama general del rendimiento del grupo en el ${partialLabel}, mencionando el promedio y la tasa de aprobación.
            2. Un segundo párrafo analizando las posibles causas o correlaciones (ej. relación entre asistencia, observaciones de bitácora y rendimiento).
            3. Un tercer párrafo enfocado en la estrategia de recuperación (si aplica), comentando su efectividad y sugiriendo acciones para los estudiantes que no lograron aprobar ni con esta medida.
            4. Un párrafo final de cierre y recomendaciones. En este párrafo, se debe exhortar de manera profesional a que el personal directivo (director, subdirector académico), tutores de grupo y responsables de programas de apoyo (tutorías, atención socioemocional, psicología) se mantengan atentos y aborden a los estudiantes con bajo rendimiento, ausentismo o cualquier situación de riesgo identificada, así como a aquellos que aprobaron en recuperación, para asegurar su éxito en periodos ordinarios futuros.
        `;
        return callGoogleAI(prompt);
    }, [settings.apiKey, activePartialId]);

    const activeStudentsInGroups = useMemo(() => {
      const studentSet = new Map<string, Student>();
      groups.forEach(group => {
        (group.students || []).forEach(student => {
          if (student && student.id) {
            studentSet.set(student.id, student);
          }
        });
      });
      return Array.from(studentSet.values());
    }, [groups]);

    const contextValue: DataContextType = {
        isLoading: isLoading || authLoading,
        error,
        user,
        groups,
        allStudents,
        activeStudentsInGroups,
        allObservations,
        settings,
        activeGroup,
        activePartialId,
        partialData,
        allPartialsDataForActiveGroup,
        groupAverages,
        atRiskStudents,
        overallAverageParticipation,
        addStudentsToGroup,
        removeStudentFromGroup,
        updateGroup,
        updateStudent,
        updateGroupCriteria,
        createGroup,
        setActiveGroupId,
        setActivePartialId,
        setGrades,
        setAttendance,
        setParticipations,
        setActivities,
        setActivityRecords,
        setRecoveryGrades,
        setStudentFeedback,
        setGroupAnalysis,
        setSettings,
        deleteGroup,
        addStudentObservation,
        updateStudentObservation,
        calculateFinalGrade,
        getStudentRiskLevel,
        calculateDetailedFinalGrade,
        fetchPartialData,
        takeAttendanceForDate,
        resetAllData,
        generateFeedbackWithAI,
        generateGroupAnalysisWithAI,
    };

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
