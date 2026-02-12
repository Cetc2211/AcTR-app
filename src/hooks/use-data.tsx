'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { get, set, del, clear } from 'idb-keyval';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, addDoc, deleteDoc, onSnapshot, orderBy } from 'firebase/firestore';
import type { Student, Group, OfficialGroup, PartialId, StudentObservation, SpecialNote, EvaluationCriteria, GradeDetail, Grades, RecoveryGrade, RecoveryGrades, MeritGrade, MeritGrades, AttendanceRecord, ParticipationRecord, Activity, ActivityRecord, CalculatedRisk, StudentWithRisk, CriteriaDetail, StudentStats, GroupedActivities, AppSettings, PartialData, AllPartialsData, AllPartialsDataForGroup, Announcement, StudentJustification, JustificationCategory } from '@/lib/placeholder-data';
import { DEFAULT_MODEL, normalizeModel } from '@/lib/ai-models';
import { format } from 'date-fns';
import { getPartialLabel } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
    aiModel: DEFAULT_MODEL,
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

const normalizeSettingsValue = (settings: AppSettings): AppSettings => {
    const aiModel = normalizeModel(settings.aiModel);
    if (aiModel === settings.aiModel) {
        return settings;
    }
    return { ...settings, aiModel };
};

export type GroupRiskStats = {
    groupId: string;
    groupName: string;
    totalRisk: number;
    high: number;
    medium: number;
    studentsByRisk: {
        high: StudentWithRisk[];
        medium: StudentWithRisk[];
    };
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
    groupRisks: { [groupId: string]: GroupRiskStats };
    overallAverageAttendance: number;
    officialGroups: OfficialGroup[];

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
    setMeritGrades: (setter: React.SetStateAction<MeritGrades>) => Promise<void>; // New Setter
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
    
    // Official Groups
    createOfficialGroup: (name: string, tutorEmail?: string) => Promise<string>;
    deleteOfficialGroup: (id: string) => Promise<void>;
    updateOfficialGroup: (id: string, data: Partial<OfficialGroup>) => Promise<void>;
    addStudentsToOfficialGroup: (officialGroupId: string, students: Student[]) => Promise<void>;
    getOfficialGroupStudents: (officialGroupId: string) => Promise<Student[]>;

    // Justifications & Announcements
    announcements: Announcement[];
    justifications: StudentJustification[];
    unreadAnnouncementsCount: number;
    markAnnouncementsAsRead: () => void;
    createAnnouncement: (title: string, message: string, targetGroup?: string, expiresAt?: string) => Promise<void>;
    createJustification: (studentId: string, date: string, reason: string, category: JustificationCategory) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    deleteJustification: (id: string) => Promise<void>;


    // Calculation & Fetching
    calculateFinalGrade: (studentId: string) => number;
    calculateDetailedFinalGrade: (studentId: string, pData: PartialData, criteria: EvaluationCriteria[]) => { finalGrade: number; criteriaDetails: CriteriaDetail[]; isRecovery: boolean };
    getStudentRiskLevel: (finalGrade: number, pAttendance: AttendanceRecord, studentId: string) => CalculatedRisk;
    fetchPartialData: (groupId: string, partialId: PartialId) => Promise<(PartialData & { criteria: EvaluationCriteria[] }) | null>;
    triggerPedagogicalCheck: (studentId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- STATE MANAGEMENT ---
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [user, authLoading] = useAuthState(auth);

    const [groups, setGroupsState] = useState<Group[]>([]);
    const [allStudents, setAllStudentsState] = useState<Student[]>([]);
    const [allObservations, setAllObservationsState] = useState<{ [studentId: string]: StudentObservation[] }>({});
    const [specialNotes, setSpecialNotesState] = useState<SpecialNote[]>([]);
    const [allPartialsData, setAllPartialsDataState] = useState<AllPartialsData>({});
    const [settings, setSettingsState] = useState(defaultSettings);
    const [officialGroups, setOfficialGroups] = useState<OfficialGroup[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [justifications, setJustifications] = useState<StudentJustification[]>([]);
    const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0); 

    useEffect(() => {
        const lastRead = localStorage.getItem('lastReadAnnouncementTime');
        const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
        
        const unread = announcements.filter(a => new Date(a.createdAt).getTime() > lastReadTime).length;
        setUnreadAnnouncementsCount(unread);
    }, [announcements]);

    const markAnnouncementsAsRead = useCallback(() => {
        localStorage.setItem('lastReadAnnouncementTime', new Date().toISOString());
        setUnreadAnnouncementsCount(0);
    }, []);
    const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
    const [activePartialId, setActivePartialIdState] = useState<PartialId>('p1');

    
    // --- ASYNC DATA HYDRATION ---
    useEffect(() => {
        if (authLoading) return;

        const hydrateData = async () => {
            setIsLoading(true);
            try {
                // Step 1: helper to load local
                const readLocal = async <T,>(key: string): Promise<{ value: T, lastUpdated: number } | undefined> => {
                     try {
                            const localPayload = await get(key);
                            if (localPayload && typeof localPayload === 'object' && 'value' in localPayload && 'lastUpdated' in localPayload) {
                                 return localPayload as { value: T, lastUpdated: number };
                            } else if (localPayload) {
                                 // Legacy format support
                                 return { value: localPayload as T, lastUpdated: 0 };
                            }
                     } catch (e) {
                         console.warn(`Error reading local data for ${key}`, e);
                     }
                     return undefined;
                };

                // Step 2: Load Local Data in Parallel (FAST PHASE)
                const [
                    localGroups,
                    localStudents,
                    localObservations,
                    localSpecialNotes,
                    localPartials,
                    localSettingsRaw,
                    localActiveGroupId
                ] = await Promise.all([
                    readLocal<Group[]>('app_groups'),
                    readLocal<Student[]>('app_students'),
                    readLocal<{ [studentId: string]: StudentObservation[] }>('app_observations'),
                    readLocal<SpecialNote[]>('app_specialNotes'),
                    readLocal<AllPartialsData>('app_partialsData'),
                    readLocal<AppSettings>('app_settings'),
                    get<string>('activeGroupId_v1')
                ]);

                // Apply Local Data Optimistically
                if (localGroups) setGroupsState(localGroups.value);
                if (localStudents) setAllStudentsState(localStudents.value);
                if (localObservations) setAllObservationsState(localObservations.value);
                if (localSpecialNotes) setSpecialNotesState(localSpecialNotes.value);
                if (localPartials) setAllPartialsDataState(localPartials.value);
                
                const resolvedSettings = normalizeSettingsValue(localSettingsRaw?.value || defaultSettings);
                setSettingsState(resolvedSettings);

                const currentGroups = localGroups?.value || [];
                if (localActiveGroupId && currentGroups.some(g => g.id === localActiveGroupId)) {
                    setActiveGroupIdState(localActiveGroupId);
                } else if (currentGroups.length > 0) {
                    setActiveGroupIdState(currentGroups[0].id);
                } else {
                    setActiveGroupIdState(null);
                }

                // CRITICAL OPTIMIZATION: Release UI before Cloud Sync
                setIsLoading(false);

                // Step 3: Background Cloud Sync (SLOW PHASE)
                if (user) {
                     const syncKey = async <T,>(key: string, localWrapper: { value: T, lastUpdated: number } | undefined, setter: (val: T) => void) => {
                         try {
                            const docRef = doc(db, 'users', user.uid, 'userData', key);
                            const docSnap = await getDoc(docRef);
                            
                            const localData = localWrapper?.value;
                            const localTimestamp = localWrapper?.lastUpdated || 0;

                            if (docSnap.exists()) {
                                const cloudPayload = docSnap.data();
                                const cloudData = cloudPayload.value as T;
                                const cloudTimestamp = cloudPayload.lastUpdated || 0;

                                if (cloudTimestamp > localTimestamp) {
                                    // Cloud is newer -> Update Local & State
                                    console.log(`Cloud update for ${key}`);
                                    await set(key, { value: cloudData, lastUpdated: cloudTimestamp });
                                    setter(cloudData);
                                } else if (localTimestamp > cloudTimestamp) {
                                    // Local is newer -> Push to Cloud
                                    console.log(`Pushing local ${key} to cloud`);
                                    await setDoc(docRef, { value: localData, lastUpdated: localTimestamp }, { merge: true });
                                }
                            } else if (localData) {
                                // Cloud empty -> Push local
                                await setDoc(docRef, { value: localData, lastUpdated: Date.now() });
                            }
                         } catch(err) {
                             console.error(`Background sync error for ${key}:`, err);
                         }
                    };

                    // Run cloud syncs in parallel background
                    await Promise.all([
                        syncKey('app_groups', localGroups, setGroupsState),
                        syncKey('app_students', localStudents, setAllStudentsState),
                        syncKey('app_observations', localObservations, setAllObservationsState),
                        syncKey('app_specialNotes', localSpecialNotes, setSpecialNotesState),
                        syncKey('app_partialsData', localPartials, setAllPartialsDataState),
                        syncKey('app_settings', localSettingsRaw, async (val) => {
                             const norm = normalizeSettingsValue(val);
                             setSettingsState(norm);
                             if (norm.aiModel !== val.aiModel) {
                                 await set('app_settings', norm);
                             }
                        })
                    ]);
                }

            } catch (e) {
                console.error("Data hydration error:", e);
                setError(e instanceof Error ? e : new Error('An unknown error occurred during data hydration'));
                // Ensure loading is off if error occurs early
                setIsLoading(false); 
            }
        };
        hydrateData();
    }, [user, authLoading]);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(collection(db, 'official_groups'), (snapshot) => {
            const fetchedGroups: OfficialGroup[] = [];
            snapshot.forEach((doc) => {
                fetchedGroups.push({ id: doc.id, ...doc.data() } as OfficialGroup);
            });
            setOfficialGroups(fetchedGroups);
        }, (error) => {
            console.error("Error fetching official groups:", error);
        });

        const unsubscribeAnn = onSnapshot(query(collection(db, 'announcements'), where('isActive', '==', true)), (snapshot) => {
            const fetched: Announcement[] = [];
            const now = Date.now();
            snapshot.forEach((doc) => {
                const data = doc.data();
                
                // Expiration Logic:
                // 1. If explicit 'expiresAt' exists, check it.
                // 2. If NO 'expiresAt', assume 48 hours default lifetime from 'createdAt'.
                let shouldShow = true;

                if (data.expiresAt) {
                    if (new Date(data.expiresAt).getTime() < now) {
                        shouldShow = false;
                    }
                } else if (data.createdAt) {
                    // Fallback for legacy/permanent announcements: Enforce 48h limit
                    const createdTime = new Date(data.createdAt).getTime();
                    const fortyEightHours = 48 * 60 * 60 * 1000;
                    if (now - createdTime > fortyEightHours) {
                        shouldShow = false;
                    }
                }

                if (shouldShow) {
                    fetched.push({ id: doc.id, ...(data as any) } as Announcement);
                }
            });
            // Sort in memory to avoid index requirement
            fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setAnnouncements(fetched);
        }, (e) => console.error("Error announcements", e));

        const unsubscribeJust = onSnapshot(query(collection(db, 'justifications'), orderBy('date', 'desc')), (snapshot) => {
            const fetched: StudentJustification[] = [];
            snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() } as StudentJustification));
            setJustifications(fetched);
        }, (e) => console.error("Error justifications", e));

        return () => {
            unsubscribe();
            unsubscribeAnn();
            unsubscribeJust();
        };
    }, [user]);

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
            
            // 1. Update React State immediately for UI responsiveness
            setter(newValue);
            
            // 2. Prepare payload with timestamp
            const now = Date.now();
            const payload = { value: newValue, lastUpdated: now };
            
            // 3. Save to Local IDB immediately
            try {
                await set(key, payload); // Save entire payload to match new structure
            } catch (e) {
                console.error(`Error saving ${key} to IDB:`, e);
            }

            // 4. Background Sync to Cloud
            if (user) {
                const docRef = doc(db, 'users', user.uid, 'userData', key);
                // Fire and forget - let the offline persistence SDK handle the queue
                setDoc(docRef, payload, { merge: true }).catch(err => {
                    console.error(`Sync error for ${key}:`, err);
                    // Silent retry logic handled by SDK, but we log it.
                    // If critical, we could toast here.
                });
            }
        };
    };

    const setGroups = createSetterWithStorage(setGroupsState, 'app_groups', groups);
    const setAllStudents = createSetterWithStorage(setAllStudentsState, 'app_students', allStudents);
    const setAllObservations = createSetterWithStorage(setAllObservationsState, 'app_observations', allObservations);
    const setSpecialNotes = createSetterWithStorage(setSpecialNotesState, 'app_specialNotes', specialNotes);
    const setAllPartialsData = createSetterWithStorage(setAllPartialsDataState, 'app_partialsData', allPartialsData);
    
    // Explicit Settings Setter with Timestamp Logic
    const setSettings = async (newSettings: AppSettings) => {
        const normalizedSettings = normalizeSettingsValue(newSettings);
        setSettingsState(normalizedSettings);
        
        const now = Date.now();
        const payload = { value: normalizedSettings, lastUpdated: now };

        try {
             await set('app_settings', payload);
        } catch(e) { console.error("Error saving local settings:", e); }

        if (user) {
            try {
                const docRef = doc(db, 'users', user.uid, 'userData', 'app_settings');
                await setDoc(docRef, payload, { merge: true });
            } catch (err) {
                console.error("Error saving settings to Firestore:", err);
            }
        }
    };

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
    
    // Custom setAttendance to sync absences to shared cloud collection
    const setAttendance = useCallback(async (setter: React.SetStateAction<AttendanceRecord>) => {
        if (!activeGroupId) return;

        let newAttendance: AttendanceRecord | undefined;

        await setAllPartialsData(prev => {
            const groupData = prev[activeGroupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            const oldValue = pData.attendance;
            const newValue = typeof setter === 'function' ? (setter as any)(oldValue) : setter;
            
            newAttendance = newValue;

            const updatedPData = { ...pData, attendance: newValue };
            const updatedGroupData = { ...groupData, [activePartialId]: updatedPData };
            const finalState = { ...prev, [activeGroupId]: updatedGroupData };
            set('app_partialsData', finalState);
            return finalState;
        });

        // Sync to 'absences' collection in Firestore
        if (newAttendance && user) {
             const group = groups.find(g => g.id === activeGroupId);
             if (group) {
                 for (const [date, records] of Object.entries(newAttendance)) {
                     const absentStudentIds = Object.entries(records)
                        .filter(([_, isPresent]) => !isPresent)
                        .map(([studentId]) => studentId);
                     
                     // Create a safe ID for the document
                     const safeDate = date.replace(/\//g, '-');
                     const docId = `${activeGroupId}_${safeDate}`; 
                     const docRef = doc(db, 'absences', docId);
                     
                     const absentStudents = group.students
                        .filter(s => absentStudentIds.includes(s.id))
                        .map(s => ({ id: s.id, name: s.name }));

                     // Fire and forget - don't await to keep UI snappy
                     setDoc(docRef, {
                         groupId: activeGroupId,
                         groupName: group.groupName || group.subject,
                         date: date,
                         teacherId: user.uid,
                         teacherEmail: user.email,
                         absentStudents: absentStudents,
                         whatsappLink: group.whatsappLink || '',
                         timestamp: new Date().toISOString()
                     }, { merge: true }).catch(e => console.error("Error syncing absences:", e));
                 }
             }
        }
    }, [activeGroupId, activePartialId, setAllPartialsData, groups, user]);

    const setParticipations = createPartialDataSetter('participations');
    const setActivities = createPartialDataSetter('activities');
    const setActivityRecords = createPartialDataSetter('activityRecords');
    const setRecoveryGrades = createPartialDataSetter('recoveryGrades');
    const setMeritGrades = createPartialDataSetter('meritGrades');

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
        console.log(`Adding ${students.length} students to group ${groupId}`);
        try {
            await setAllStudents(prev => [...prev, ...students.filter(s => !prev.some(ps => ps.id === s.id))]);
            await setGroups(prev => prev.map(g => g.id === groupId ? { ...g, students: [...g.students, ...students] } : g));
            console.log('Students added successfully');
        } catch (error) {
            console.error('Error in addStudentsToGroup:', error);
            throw error;
        }
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

// Helper to check for pending pedagogical strategies (Technical Spec 2.0)
const checkAndInjectStrategies = async (studentId: string, addObs: Function) => {
    try {
        const strategiesRef = collection(db, 'pedagogical_strategies');
        const q = query(strategiesRef, where('student_id', '==', studentId), where('is_injected', '==', false));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(async (docSnap) => {
            const strategy = docSnap.data();
            console.log(`Injecting Strategy for ${studentId}: ${strategy.category}`);
            
            // 1. Inject into Teacher Log
            await addObs({
                studentId,
                type: 'Pedagógico', // Special type for filtered support
                details: `${strategy.category}: ${strategy.strategy_text}`,
                partialId: 'p1', // Default
                requiresCanalization: false,
                requiresFollowUp: false
            });

            // 2. Mark as injected to avoid duplication via field update
            const docRef = doc(db, 'pedagogical_strategies', docSnap.id);
            await updateDoc(docRef, { is_injected: true });
        });
    } catch (e) {
        // Silent fail or log - don't block UI
        console.warn("Error checking pedagogical strategies:", e);
    }
};

    const addStudentObservation = useCallback(async (obs: Omit<StudentObservation, 'id' | 'date' | 'followUpUpdates' | 'isClosed'>) => {
        const newObs = { ...obs, id: `OBS-${Date.now()}`, date: new Date().toISOString(), followUpUpdates: [], isClosed: false };
        await setAllObservations(prev => ({ ...prev, [obs.studentId]: [...(prev[obs.studentId] || []), newObs] }));
    }, [setAllObservations]);

    // Expose injection Trigger
    const triggerPedagogicalCheck = useCallback((studentId: string) => {
        checkAndInjectStrategies(studentId, addStudentObservation);
    }, [addStudentObservation]);

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
        
        // 1. Update Local State
        setAllPartialsData(prev => {
            const groupData = prev[groupId] || {};
            const pData = groupData[activePartialId] || defaultPartialData;
            if (pData.attendance[date]) return prev;
            const newAttendance = group.students.reduce((acc, s) => ({ ...acc, [s.id]: true }), {});
            const finalState = { ...prev, [groupId]: { ...groupData, [activePartialId]: { ...pData, attendance: { ...pData.attendance, [date]: newAttendance }, participations: { ...pData.participations, [date]: {} } } } };
            set('app_partialsData', finalState);
            return finalState;
        });

        // 2. Initial Sync to 'absences' collection (Empty list initially as everyone is present)
        if (user) {
             const safeDate = date.replace(/\//g, '-');
             const docId = `${groupId}_${safeDate}`; 
             const docRef = doc(db, 'absences', docId);
             
             setDoc(docRef, {
                 groupId: groupId,
                 groupName: group.groupName || group.subject,
                 date: date,
                 teacherId: user.uid,
                 teacherEmail: user.email,
                 absentStudents: [], // Initially empty
                 whatsappLink: group.whatsappLink || '',
                 timestamp: new Date().toISOString()
             }, { merge: true }).catch(e => console.error("Error syncing initial attendance:", e));
        }

    }, [groups, activePartialId, setAllPartialsData, user]);

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

    // Official Groups Actions
    const createOfficialGroup = useCallback(async (name: string, tutorEmail?: string) => {
        const docRef = await addDoc(collection(db, 'official_groups'), {
            name,
            tutorEmail: tutorEmail || '',
            createdAt: new Date().toISOString(),
        });
        return docRef.id;
    }, []);

    const deleteOfficialGroup = useCallback(async (id: string) => {
        await deleteDoc(doc(db, 'official_groups', id));
    }, []);

    const updateOfficialGroup = useCallback(async (id: string, data: Partial<OfficialGroup>) => {
        await updateDoc(doc(db, 'official_groups', id), data);
    }, []);

    const addStudentsToOfficialGroup = useCallback(async (officialGroupId: string, students: Student[]) => {
        const batchPromises = students.map(async (student) => {
             // Add to central 'students' collection, linked to official_group_id
             await addDoc(collection(db, 'students'), {
                 ...student,
                 official_group_id: officialGroupId
             });
        });
        await Promise.all(batchPromises);
    }, []);

    const getOfficialGroupStudents = useCallback(async (officialGroupId: string) => {
        const q = query(collection(db, 'students'), where('official_group_id', '==', officialGroupId));
        const snapshot = await getDocs(q);
        const students: Student[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            students.push({ ...data, id: doc.id } as Student);
        });
        return students;
    }, []);

    const createAnnouncement = useCallback(async (title: string, message: string, targetGroup?: string, expiresAt?: string) => {
        const newAnn: any = {
            title,
            message,
            type: 'info',
            isActive: true,
            createdAt: new Date().toISOString()
        };
        
        if (targetGroup) {
            newAnn.targetGroup = targetGroup;
        }

        if (expiresAt) {
            newAnn.expiresAt = expiresAt;
        }

        await addDoc(collection(db, 'announcements'), newAnn);
    }, []);

    const deleteAnnouncement = useCallback(async (id: string) => {
         await updateDoc(doc(db, 'announcements', id), { isActive: false });
    }, []);

    const createJustification = useCallback(async (studentId: string, date: string, reason: string, category: JustificationCategory = 'Otro') => {
        if (!user) return;
        const newJust: Omit<StudentJustification, 'id'> = {
            studentId,
            date,
            reason,
            category,
            adminEmail: user.email || 'unknown',
            timestamp: new Date().toISOString()
        };
        await addDoc(collection(db, 'justifications'), newJust);
    }, [user]);

    const deleteJustification = useCallback(async (id: string) => {
        // Implementation for deletion if needed
    }, []);


    // --- CALCULATIONS & DERIVED DATA ---
    const calculateDetailedFinalGrade = useCallback((studentId: string, pData: PartialData, criteria: EvaluationCriteria[]): { finalGrade: number, criteriaDetails: CriteriaDetail[], isRecovery: boolean } => {
        const meritInfo = pData.meritGrades?.[studentId];
        if (meritInfo?.applied) {
            return { finalGrade: meritInfo.grade ?? 0, criteriaDetails: [{ name: 'Asignación Directa', earned: meritInfo.grade ?? 0, weight: 100 }], isRecovery: false };
        }
        
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
        // FIX: Proportional logic for early course stages
        const attended = days.reduce((count, d) => pAttendance[d][studentId] === true ? count + 1 : count, 0);
        
        // If very few days recorded (< 3), be lenient with attendance risk unless it's 0%
        let attendanceRate = 100;
        if (days.length > 0) {
             attendanceRate = (attended / days.length) * 100;
             // Tolerance: If less than 4 days, only flag if attendance is 0% (absent all days)
             if (days.length < 4 && attended > 0) {
                 attendanceRate = 100; // Treat as perfect for risk calc if they came at least once
             }
        }
        
        let reason = [];
        // FIX: Grade Projection instead of Absolute Value for early stages
        // If finalGrade is low but it's early (e.g., max possible points so far is small), we shouldn't flag high risk immediately
        // However, the calculateDetailedFinalGrade returns a 0-100 scale based on RATIOS, so it interprets "1/1 activity" as 100% of that weighting.
        // The issue is likely when NO activities or FEW activities exist, ratios might be 0/0 or 0/1.
        
        // Revised logic:
        // 1. If grade <= 59, it is high risk ONLY if we have enough data points or if it's explicitly 0.
        // 2. We will stick to the existing grade logic but add a disclaimer for low data.
        
        if (finalGrade <= 59) {
             // If very early (e.g., < 4 attendance days recorded implies start of partial), be softer
             if (days.length < 4 && finalGrade > 0) {
                  // If they have SOME grade, don't flag high risk yet, maybe medium
                  // Downgrade high risk to medium in early stages if not comprehensive failure
             } else {
                 reason.push(`Calificación reprobatoria (${finalGrade.toFixed(0)}%).`);
             }
        }
        
        if (attendanceRate < 80) {
            reason.push(`Asistencia baja (${attendanceRate.toFixed(0)}%).`);
        }
        
        if (reason.length > 0) {
            return { level: 'high', reason: reason.join(' ') };
        }
        
        // Medium Risk Logic
        if (finalGrade > 59 && finalGrade <= 70) {
            return { level: 'medium', reason: `Calificación baja (${finalGrade.toFixed(0)}%).` };
        }
        if (days.length < 4 && finalGrade <= 59 && finalGrade > 0) {
             return { level: 'medium', reason: `Inicio de parcial: Calificación baja (${finalGrade.toFixed(0)}%).` };
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

    const groupRisks = useMemo(() => {
        const risks: { [groupId: string]: GroupRiskStats } = {};
        groups.forEach(group => {
            const data = allPartialsData[group.id]?.[activePartialId];
            if (!data || !group.criteria || group.criteria.length === 0) {
                 risks[group.id] = { groupId: group.id, groupName: group.subject, totalRisk: 0, high: 0, medium: 0, studentsByRisk: { high: [], medium: [] } };
                 return;
            }

            const high: StudentWithRisk[] = [];
            const medium: StudentWithRisk[] = [];

            group.students.forEach(student => {
                const finalGrade = calculateDetailedFinalGrade(student.id, data, group.criteria).finalGrade;
                const risk = getStudentRiskLevel(finalGrade, data.attendance, student.id);
                const sWithRisk = { ...student, calculatedRisk: risk };
                
                if (risk.level === 'high') high.push(sWithRisk);
                else if (risk.level === 'medium') medium.push(sWithRisk);
            });

            risks[group.id] = {
                groupId: group.id,
                groupName: group.subject,
                totalRisk: high.length + medium.length,
                high: high.length,
                medium: medium.length,
                studentsByRisk: { high, medium }
            };
        });
        return risks;
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
    
    // --- REAL-TIME SYNC ENGINE ---
    useEffect(() => {
        if (!activeGroupId || !activeGroup?.officialGroupId) return;

        // 1. Subscribe to Student List Changes (New Students added by Admin)
        const q = query(
            collection(db, 'students'), 
            where('official_group_id', '==', activeGroup.officialGroupId)
        );

        const unsubscribeStudents = onSnapshot(q, (snapshot) => {
            const freshStudents: Student[] = [];
            snapshot.forEach((doc) => {
                freshStudents.push({ ...doc.data(), id: doc.id } as Student);
            });
            
            // Compare to avoid infinite loops if data is identical
            // We use a simple length + ID check for efficiency
            const currentIds = new Set(activeGroup.students.map(s => s.id));
            const hasChanges = freshStudents.length !== activeGroup.students.length || 
                               freshStudents.some(s => !currentIds.has(s.id)) ||
                               freshStudents.some(s => { // Deep check for name updates
                                   const curr = activeGroup.students.find(c => c.id === s.id);
                                   return curr && (curr.name !== s.name || curr.phone !== s.phone);
                               });

            if (hasChanges) {
                console.log("Real-time Sync: Updating students from official source...");
                toast({ title: "Lista Actualizada", description: "Se han detectado cambios en el grupo oficial." });
                
                setGroups(prev => prev.map(g => {
                    if (g.id === activeGroupId) {
                        return { ...g, students: freshStudents };
                    }
                    return g;
                }));
            }
        }, (error) => {
            console.error("Error watching official students:", error);
        });

        // 2. Subscribe to Official Group Metadata Changes (Name/Semester changes)
        const docRef = doc(db, 'official_groups', activeGroup.officialGroupId);
        const unsubscribeMeta = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const officialName = data.name;
                
                // Parse Metadata
                const match = officialName.match(/^(\d+)[^A-Za-z0-9]*([A-Za-z]+)/);
                let newSemester = '';
                let newGroupName = '';
                if (match) {
                    newSemester = match[1];
                    newGroupName = match[2];
                }

                // Check if update needed
                if (newSemester && (activeGroup.semester !== newSemester || activeGroup.groupName !== newGroupName)) {
                     console.log("Real-time Sync: Updating Group Metadata...");
                     setGroups(prev => prev.map(g => {
                        if (g.id === activeGroupId) {
                            return { 
                                ...g, 
                                semester: newSemester, 
                                groupName: newGroupName 
                            };
                        }
                        return g;
                    }));
                }
            }
        });

        return () => {
            unsubscribeStudents();
            unsubscribeMeta();
        };
    }, [activeGroupId, activeGroup?.officialGroupId]); // Re-subscribe if group changes

    return (
        <DataContext.Provider value={{
            isLoading, error, groups, allStudents, activeStudentsInGroups, allObservations, specialNotes, settings, activeGroup, activeGroupId, activePartialId, partialData, allPartialsDataForActiveGroup, groupAverages, atRiskStudents, groupRisks, overallAverageAttendance, officialGroups,
            announcements, justifications, unreadAnnouncementsCount, markAnnouncementsAsRead,
            setGroups, setAllStudents, setAllObservations, setAllPartialsData, setSpecialNotes,
            setSettings, setActiveGroupId, setActivePartialId,
            setGrades, setAttendance, setParticipations, setActivities, setActivityRecords, setRecoveryGrades, setMeritGrades, setStudentFeedback, setGroupAnalysis,
            addStudentsToGroup, removeStudentFromGroup, updateGroup, updateStudent, updateGroupCriteria, deleteGroup, addStudentObservation, updateStudentObservation, takeAttendanceForDate, deleteAttendanceDate, resetAllData, importAllData, addSpecialNote, updateSpecialNote, deleteSpecialNote,
            createOfficialGroup, deleteOfficialGroup, updateOfficialGroup, addStudentsToOfficialGroup, getOfficialGroupStudents, createAnnouncement, deleteAnnouncement, createJustification, deleteJustification,
            calculateFinalGrade, calculateDetailedFinalGrade, getStudentRiskLevel, fetchPartialData, triggerPedagogicalCheck,
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
