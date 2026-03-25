'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Student, Group, PartialId, StudentObservation, OfficialGroup, Announcement, Justification, JustificationCategory } from '@/lib/placeholder-data';
import { getPartialLabel } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, addDoc } from 'firebase/firestore';


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
  officialGroups: OfficialGroup[];
  allObservations: {[studentId: string]: StudentObservation[]};
  settings: AppSettings;
  
  activeGroup: Group | null;
  activePartialId: PartialId;
  
  partialData: PartialData;
  allPartialsDataForActiveGroup: AllPartialsDataForGroup;


  groupAverages: {[groupId: string]: number};
  atRiskStudents: StudentWithRisk[];
  overallAverageParticipation: number;
  announcements: Announcement[];
  justifications: Justification[];

  // Setters / Updaters
  addStudentsToGroup: (groupId: string, students: Student[]) => Promise<void>;
  addStudentsToOfficialGroup: (groupId: string, students: Student[]) => Promise<void>; 
  createOfficialGroup: (name: string) => Promise<string>;
  deleteOfficialGroup: (groupId: string) => Promise<void>;
  createAnnouncement: (title: string, content: string, target?: string, expiresAt?: Date) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  createJustification: (groupId: string, studentId: string, date: Date, reason: string, category: JustificationCategory) => Promise<void>;
  
  getOfficialGroupStudents: (groupId: string) => Promise<Student[]>;
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
    const [officialGroups, setOfficialGroups] = useState<OfficialGroup[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [justifications, setJustifications] = useState<Justification[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allObservations, setAllObservations] = useState<{[studentId: string]: StudentObservation[]}>({});
    const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialId] = useState<PartialId>('p1');
    const [allPartialsData, setAllPartialsData] = useState<AllPartialsData>({});

    const getStorageKey = (baseKey: string) => user ? `${baseKey}_${user.uid}` : `${baseKey}_logged_out`;

    // --- REEMPLAZO DE LOCALSTORAGE POR FIRESTORE ---
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        // Suscribirse a los datos del usuario en Firestore
        // Estructura esperada: users/{uid} contiene un documento con los datos principales
        // O subcolecciones: users/{uid}/groups, users/{uid}/students, etc.
        // Dado el esquema "functional" proporcionado, parece usar colecciones raíz o user-scoped.
        // Vamos a asumir una estructura centralizada en 'users/{uid}' para simplificar la migración inicial 
        // o leer de colecciones raíz filtrando por ownerId si fuera necesario.
        
        // Estrategia: Leer todo de Firestore al inicio.
        const fetchData = async () => {
            try {
                // 1. Grupos (Academic Groups)
                // Buscamos en una colección 'groups' donde el owner sea el usuario, O dentro del documento del usuario
                // Por compatibilidad con el código anterior, vamos a intentar leer de una colección 'user_data' o similar
                // O mejor aún, leer de las colecciones que mencionaste: "official_groups", "students", etc.
                
                // NOTA: Si en tu base de datos anterior todo estaba en un solo JSON gigante en localStorage,
                // al migrar a Firestore idealmente deberíamos tener colecciones.
                // Como mencionaste "official_groups", "students" en el JSON, asumiremos colecciones en la raíz o bajo el usuario.
                
                // Para no romper nada, intentaremos leer de un documento principal de configuración del usuario
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    setSettingsState(data.settings || defaultSettings);
                    // Si existen datos legacy aquí, los usamos. Si no, buscaremos en colecciones.
                    if (data.groups) setGroups(data.groups);
                    if (data.activeGroupId) setActiveGroupIdState(data.activeGroupId);
                } else {
                    // Si no existe, lo creamos con defaults
                    await setDoc(userDocRef, { email: user.email, settings: defaultSettings }, { merge: true });
                }

                // Cargar Official Groups
                try {
                    // Ajusta esta ruta si tus datos están en otro lado (ej: users/{uid}/official_groups)
                    // Usaremos una subcolección por defecto para aislar datos de usuarios
                    const officialGroupsRef = collection(db, `users/${user.uid}/official_groups`);
                    const ogSnap = await getDocs(officialGroupsRef);
                    const ogList = ogSnap.docs.map(d => ({ id: d.id, ...d.data() } as OfficialGroup));
                    if (ogList.length > 0) setOfficialGroups(ogList);
                } catch (e) { console.log("No official groups found or error", e); }

                 // Cargar Students (Global pool)
                 try {
                    const studentsRef = collection(db, `users/${user.uid}/students`);
                    const stSnap = await getDocs(studentsRef);
                    const stList = stSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
                    if (stList.length > 0) setAllStudents(stList);
                } catch (e) { console.log("No students found or error", e); }

                // Cargar Grupos Académicos (Si no estaban en el userDoc)
                try {
                    const groupsRef = collection(db, `users/${user.uid}/groups`);
                    const gSnap = await getDocs(groupsRef);
                    const gList = gSnap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
                    if (gList.length > 0) setGroups(gList);
                } catch (e) { console.log("No groups found or error", e); }
                
                 // Cargar Anuncios
                 try {
                    const annRef = collection(db, `users/${user.uid}/announcements`);
                    const annSnap = await getDocs(annRef);
                    const annList = annSnap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
                     if (annList.length > 0) setAnnouncements(annList);
                } catch (e) { console.log("No announcements found", e); }

                 // Cargar Justificaciones
                 try {
                    const justRef = collection(db, `users/${user.uid}/justifications`);
                    const justSnap = await getDocs(justRef);
                    const justList = justSnap.docs.map(d => ({ id: d.id, ...d.data() } as Justification));
                    if (justList.length > 0) setJustifications(justList);
                } catch (e) { console.log("No just found", e); }

                 // Cargar Observaciones
                 try {
                    const obsRef = collection(db, `users/${user.uid}/observations`);
                    const obsSnap = await getDocs(obsRef);
                    const obsMap: {[studentId: string]: StudentObservation[]} = {};
                    obsSnap.docs.forEach(d => {
                         // Asumimos que el documento se llama como el ID del estudiante y contiene { observations: [...] }
                         // O el documento es la observación y tiene un campo studentId.
                         // Dado el tipo {[studentId: string]: StudentObservation[]}, lo más lógico para Firestore es:
                         // Colección 'observations', docId = studentId, data = { list: [...] }
                         const data = d.data();
                         if (data.list) {
                             obsMap[d.id] = data.list as StudentObservation[];
                         }
                    });
                    if (Object.keys(obsMap).length > 0) setAllObservations(obsMap);
                } catch (e) { console.log("No observations found", e); }

                 // Cargar Datos Parciales (Grades, Attendance, etc.)
                 try {
                    const pdRef = collection(db, `users/${user.uid}/partials_data`);
                    const pdSnap = await getDocs(pdRef);
                    const pdMap: AllPartialsData = {};
                    pdSnap.docs.forEach(d => {
                         // DocId = groupId, Data = { p1: ..., p2: ... }
                         pdMap[d.id] = d.data() as AllPartialsDataForGroup;
                    });
                     if (Object.keys(pdMap).length > 0) setAllPartialsData(pdMap);
                } catch (e) { console.log("No partials data found", e); }



            } catch (err) {
                console.error("Error fetching data from Firestore:", err);
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

    }, [user, authLoading]);
    
    // --- FIN REEMPLAZO ---
    /*
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
                    setOfficialGroups(loadFromStorage('app_officialGroups', []));
                    setAnnouncements(loadFromStorage('app_announcements', []));
                    setJustifications(loadFromStorage('app_justifications', []));
                    setAllStudents(loadFromStorage('app_students', []));
                    setAllObservations(loadFromStorage('app_observations', {}));
                    setAllPartialsData(loadFromStorage('app_partialsData', {}));
                    setSettingsState(loadFromStorage('app_settings', defaultSettings));
                    
                    const storedActiveGroupId = loadFromStorage('activeGroupId_v1', null);
                    // ... (rest of logic)
                }
            }
        }
    }, ...);
    */
                    // setAllStudents(loadFromStorage('app_students', []));
                    // setAllObservations(loadFromStorage('app_observations', {}));
                    // setAllPartialsData(loadFromStorage('app_partialsData', {}));
                    // setSettingsState(loadFromStorage('app_settings', defaultSettings));
/*
                    const storedActiveGroupId = loadFromStorage('activeGroupId_v1', null);
                    const availableGroups = loadFromStorage('app_groups', []);
                    if(availableGroups.some((g: Group) => g.id === storedActiveGroupId)){
                        setActiveGroupIdState(storedActiveGroupId);
                    } else if (availableGroups.length > 0) {
                        setActiveGroupIdState(availableGroups[0].id);
                    }
*/
                } catch (e) {
                    setError(e as Error);
                } finally {
                    // setIsLoading(false);
                }
            } else {
                 setIsLoading(false); // No user, stop loading
            }
        }
    }, [user, authLoading]);

    
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
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_officialGroups'), JSON.stringify(officialGroups));
    }, [officialGroups, isLoading, user]);
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_announcements'), JSON.stringify(announcements));
    }, [announcements, isLoading, user]);
    useEffect(() => {
        if(!isLoading && user) localStorage.setItem(getStorageKey('app_justifications'), JSON.stringify(justifications));
    }, [justifications, isLoading, user]);
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


    const setActiveGroupId = useCallback(async (groupId: string | null) => {
        setActiveGroupIdState(groupId);
        if (user) {
             const userDocRef = doc(db, 'users', user.uid);
             await updateDoc(userDocRef, { activeGroupId: groupId });
        }
    }, [user]);

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
        if (user) {
             const groupRef = doc(db, `users/${user.uid}/groups`, group.id);
             await setDoc(groupRef, group);
        }
        return Promise.resolve();
    }, [user]);

    const addStudentsToGroup = useCallback(async (groupId: string, students: Student[]) => {
        const newStudentIds = new Set(students.map(s => s.id));
        setAllStudents(prev => [...prev.filter(s => !newStudentIds.has(s.id)), ...students]);
        setGroups(prev => prev.map(g => g.id === groupId ? {...g, students: [...g.students, ...students]} : g));
        
        if (user) {
             // Update global students
             const batchPromises = students.map(s => 
                  setDoc(doc(db, `users/${user.uid}/students`, s.id), s, { merge: true })
             );
             await Promise.all(batchPromises);
             
             // Update group students
             const groupRef = doc(db, `users/${user.uid}/groups`, groupId);
             const groupSnap = await getDoc(groupRef);
             if (groupSnap.exists()) {
                 const currentStudents = (groupSnap.data() as Group).students || [];
                 // Avoid duplicates?? The state logic just appends.
                 // We should probably filter.
                 const existingIds = new Set(currentStudents.map(s => s.id));
                 const toAdd = students.filter(s => !existingIds.has(s.id));
                 await updateDoc(groupRef, { students: [...currentStudents, ...toAdd] });
             }
        }
        return Promise.resolve();
    }, [user]);

    const removeStudentFromGroup = useCallback(async (groupId: string, studentId: string) => {
        setGroups(prev => prev.map(g => g.id === groupId ? {...g, students: g.students.filter(s => s.id !== studentId)} : g));
        if (user) {
             const groupRef = doc(db, `users/${user.uid}/groups`, groupId);
             const groupSnap = await getDoc(groupRef);
             if (groupSnap.exists()) {
                 const currentStudents = (groupSnap.data() as Group).students || [];
                 const newStudents = currentStudents.filter(s => s.id !== studentId);
                 await updateDoc(groupRef, { students: newStudents });
             }
        }
        return Promise.resolve();
    }, [user]);
    
    const updateGroup = useCallback(async (groupId: string, data: Partial<Omit<Group, 'id' | 'students'>>) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...data } : g));
        if (user) {
             const groupRef = doc(db, `users/${user.uid}/groups`, groupId);
             await updateDoc(groupRef, data);
        }
        return Promise.resolve();
    }, [user]);

    const updateStudent = useCallback(async (studentId: string, data: Partial<Student>) => {
        setAllStudents(prev => prev.map(s => s.id === studentId ? {...s, ...data} : s));
        setGroups(prev => prev.map(g => ({
            ...g,
            students: g.students.map(s => s.id === studentId ? { ...s, ...data } : s),
        })));
        
        if (user) {
             const studentRef = doc(db, `users/${user.uid}/students`, studentId);
             await setDoc(studentRef, data, { merge: true });
             
             // Update in groups (inefficient but necessary with this data model)
             // We use the `groups` from state to know which ones to update
             for (const group of groups) {
                 if (group.students.some(s => s.id === studentId)) {
                     const updatedGroupStudents = group.students.map(s => s.id === studentId ? { ...s, ...data } : s);
                     const groupRef = doc(db, `users/${user.uid}/groups`, group.id);
                     await updateDoc(groupRef, { students: updatedGroupStudents });
                 }
             }
        }
        return Promise.resolve();
    }, [user, groups]);

    const updateGroupCriteria = useCallback(async (criteria: EvaluationCriteria[]) => {
        if(activeGroupId) {
            setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, criteria } : g));
             if (activeGroupId && user) {
                  const groupRef = doc(db, `users/${user.uid}/groups`, activeGroupId);
                  updateDoc(groupRef, { criteria });
             }
        }
        return Promise.resolve();
    }, [activeGroupId, user]);
    
    const deleteGroup = useCallback(async (groupId: string) => {
        setGroups(prev => {
            const newGroups = prev.filter(g => g.id !== groupId);
            if (activeGroupId === groupId) {
                const newActiveId = newGroups.length > 0 ? newGroups[0].id : null;
                if(newActiveId !== activeGroupId) setActiveGroupIdState(newActiveId);
            }
            return newGroups;
        });
        if (user) {
             const groupRef = doc(db, `users/${user.uid}/groups`, groupId);
             await deleteDoc(groupRef);
             // Also delete partials data for this group? Maybe keep for history?
             // For now, let's just delete the group metadata
        }
        return Promise.resolve();
    }, [activeGroupId, user]);

    const addStudentObservation = useCallback(async (observation: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
        const newObservation: StudentObservation = {
            ...observation,
            id: `OBS-${Date.now()}`,
            date: new Date().toISOString(),
            followUpUpdates: [],
            isClosed: false,
        };
        
        let updatedList: StudentObservation[] = [];
        setAllObservations(prev => {
            const currentList = prev[observation.studentId] || [];
            updatedList = [...currentList, newObservation];
            return {
                ...prev,
                [observation.studentId]: updatedList
            };
        });

        if (user) {
             const studentObsRef = doc(db, `users/${user.uid}/observations`, observation.studentId);
             await setDoc(studentObsRef, { list: updatedList }, { merge: true });
        }
        return Promise.resolve();
    }, [user]);

    const updateStudentObservation = useCallback(async (studentId: string, observationId: string, updateText: string, isClosing: boolean) => {
        let updatedList: StudentObservation[] = [];
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
            updatedList = studentObs;
            return { ...prev, [studentId]: studentObs };
        });

        if (user) {
             const studentObsRef = doc(db, `users/${user.uid}/observations`, studentId);
             await setDoc(studentObsRef, { list: updatedList }, { merge: true });
        }
    }, [user]);
    
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
            
            let newValue: T;
            setAllPartialsData(prevAllData => {
                const currentGroupData = prevAllData[activeGroupId] || {};
                const currentPartialData = currentGroupData[activePartialId] || defaultPartialData;
                const currentValue = currentPartialData[field] as T;
                newValue = typeof setter === 'function' ? (setter as (prevState: T) => T)(currentValue) : setter;

                const newPartialData = { ...currentPartialData, [field]: newValue };
                return {
                    ...prevAllData,
                    [activeGroupId]: {
                        ...currentGroupData,
                        [activePartialId]: newPartialData,
                    },
                };
            });

            if (user) {
                 const docRef = doc(db, `users/${user.uid}/partials_data`, activeGroupId);
                 await setDoc(docRef, { [activePartialId]: { [field]: newValue! } }, { merge: true });
            }
            return Promise.resolve();
        };
    }, [activeGroupId, activePartialId, user]);

    const setSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
        setSettingsState(prev => ({...prev, ...newSettings}));
         if (user) {
             const userDocRef = doc(db, 'users', user.uid);
             await setDoc(userDocRef, { settings: newSettings }, { merge: true });
        }
        return Promise.resolve();
    }, [user]);

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
        if (user) {
             const docRef = doc(db, `users/${user.uid}/partials_data`, activeGroupId);
             await setDoc(docRef, { [activePartialId]: { feedbacks: { [studentId]: feedback } } }, { merge: true });
        }
    }, [activeGroupId, activePartialId, user]);

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
        if (user) {
             const docRef = doc(db, `users/${user.uid}/partials_data`, activeGroupId);
             await setDoc(docRef, { [activePartialId]: { groupAnalysis: analysis } }, { merge: true });
        }
    }, [activeGroupId, activePartialId, user]);
    
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

        if (user) {
             const docRef = doc(db, `users/${user.uid}/partials_data`, groupId);
             await setDoc(docRef, { [activePartialId]: { attendance: { [date]: newAttendanceRecord } } }, { merge: true });
        }
    }, [groups, activePartialId, user]);
    
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

    const createOfficialGroup = useCallback(async (name: string): Promise<string> => {
        const newGroup = {
            id: `OG-${Date.now()}`,
            name,
            createdAt: new Date().toISOString(),
            students: []
        };
        setOfficialGroups(prev => [...prev, newGroup]);
        
        if (user) {
             const docRef = doc(db, `users/${user.uid}/official_groups`, newGroup.id);
             await setDoc(docRef, newGroup);
        }
        return newGroup.id;
    }, [user]);

    const deleteOfficialGroup = useCallback(async (groupId: string) => {
        setOfficialGroups(prev => prev.filter(g => g.id !== groupId));
        if (user) {
             const docRef = doc(db, `users/${user.uid}/official_groups`, groupId);
             await deleteDoc(docRef);
        }
    }, [user]);

    const createAnnouncement = useCallback(async (title: string, content: string, target?: string, expiresAt?: Date) => {
        const newAnn: Announcement = {
            id: `ANN-${Date.now()}`,
            title,
            content,
            target,
            expiresAt: expiresAt?.toISOString() || '',
            createdAt: new Date().toISOString()
        };
        setAnnouncements(prev => [newAnn, ...prev]);
        if(user) {
             setDoc(doc(db, `users/${user.uid}/announcements`, newAnn.id), newAnn);
        }
    }, [user]);

    const deleteAnnouncement = useCallback(async (id: string) => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        if(user) {
             deleteDoc(doc(db, `users/${user.uid}/announcements`, id));
        }
    }, [user]);

    const createJustification = useCallback(async (groupId: string, studentId: string, date: Date, reason: string, category: JustificationCategory) => {
        const newJust: Justification = {
             id: `JUST-${Date.now()}`,
             groupId,
             studentId,
             date: date.toISOString(),
             reason,
             category,
             createdAt: new Date().toISOString()
        };
        setJustifications(prev => [newJust, ...prev]);
        if(user) {
             setDoc(doc(db, `users/${user.uid}/justifications`, newJust.id), newJust);
        }
    }, [user]);

    const addStudentsToOfficialGroup = useCallback(async (groupId: string, newStudents: Student[]) => {
        setAllStudents(prev => {
             const existingIds = new Set(prev.map(s => s.id));
             const studentsToAdd = newStudents.filter(s => !existingIds.has(s.id));
             return [...prev, ...studentsToAdd];
        });
        
        const studentsToAdd = newStudents;

        setOfficialGroups(prev => prev.map(g => {
            if (g.id === groupId) {
                 const currentStudentIds = new Set(g.students || []);
                 newStudents.forEach(s => currentStudentIds.add(s.id));
                 return { ...g, students: Array.from(currentStudentIds) };
            }
            return g;
        }));

        if (user) {
             const group = officialGroups.find(g => g.id === groupId);
             // Necesitamos la versión actualizada de students, así que recalculamos un poco o usamos la lógica de setOfficialGroups anterior con cuidado.
             // Para estar seguros, leemos lo que vamos a escribir:
             let updatedStudentIds: string[] = [];
             
             if (group) {
                 const currentStudentIds = new Set(group.students || []);
                 newStudents.forEach(s => currentStudentIds.add(s.id));
                 updatedStudentIds = Array.from(currentStudentIds);
                 
                 await updateDoc(doc(db, `users/${user.uid}/official_groups`, groupId), { students: updatedStudentIds });
             }

            // Guardar estudiantes nuevos en colección students
             const batchPromises = studentsToAdd.map(s => 
                  setDoc(doc(db, `users/${user.uid}/students`, s.id), s, { merge: true })
             );
             await Promise.all(batchPromises);
        }
    }, [user, officialGroups]);

    const getOfficialGroupStudents = useCallback(async (groupId: string): Promise<Student[]> => {
        const group = officialGroups.find(g => g.id === groupId);
        if (!group || !group.students) return [];
        return allStudents.filter(s => group.students?.includes(s.id));
    }, [officialGroups, allStudents]);

    const contextValue: DataContextType = {
        isLoading: isLoading || authLoading,
        error,
        user,
        groups,
        officialGroups,
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
        announcements,
        justifications,
        addStudentsToGroup,
        addStudentsToOfficialGroup,
        createOfficialGroup,
        deleteOfficialGroup,
        createAnnouncement,
        deleteAnnouncement,
        createJustification,
        getOfficialGroupStudents,
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
