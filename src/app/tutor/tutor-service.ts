import { Student, OfficialGroup, Group, StudentObservation, RiskFlag } from '@/lib/placeholder-data';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';

export interface TutorStudentSubjectSnapshot {
    subject: string;
    completionRate: number;
    failingRisk: boolean;
    lastUpdated?: string;
}

export type TutorPartialView = 'p1' | 'p2' | 'p3' | 'semester';

// Definición extendida para incluir datos calculados para la vista del tutor
export interface TutorStudentView extends Student {
  totalAbsences: number;
  absencePercentage: number;
    completionRate: number;
    failingSubjects: number;
  riskVariables: {
    dropoutRisk: boolean;
    failingRisk: boolean;
  };
  recentLogs: StudentObservation[]; // Últimos 5 registros de bitácoras
  aiSuggestion?: string;
  groupName: string;
  tutorInterventions: { id: string; date: string; action: string; }[];
    subjectSnapshots: TutorStudentSubjectSnapshot[];
}

export class TutorService {
      private static normalizeText(value: unknown): string {
          return String(value || '')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .trim()
              .toLowerCase();
      }

      private static toMillis(value: unknown): number {
          if (!value) return 0;

          if (typeof value === 'string' || typeof value === 'number') {
              const parsed = new Date(value).getTime();
              return Number.isFinite(parsed) ? parsed : 0;
          }

          if (typeof value === 'object' && value !== null && 'toDate' in (value as Record<string, unknown>)) {
              const timestampLike = value as { toDate: () => Date };
              try {
                  return timestampLike.toDate().getTime();
              } catch {
                  return 0;
              }
          }

          return 0;
      }

    static subscribeTutorGroupsForEmail(
        tutorEmail: string,
        onData: (groups: OfficialGroup[]) => void,
        onError?: (error: unknown) => void,
    ): () => void {
        const normalizedEmail = tutorEmail.toLowerCase().trim();

        return onSnapshot(
            collection(db, 'official_groups'),
            (snapshot) => {
                const groups = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() } as OfficialGroup))
                    .filter((group) => {
                        const email = String(group.tutorEmail || '').trim().toLowerCase();
                        return email === normalizedEmail;
                    });

                onData(groups);
            },
            (error) => {
                if (onError) onError(error);
            },
        );
    }

    
  // 1. Filtro de Grupos Asignados (Real)
  static async getTutorGroupsForEmail(tutorEmail: string): Promise<OfficialGroup[]> {
    try {
        const normalizedEmail = tutorEmail.toLowerCase().trim();
        const groupsRef = collection(db, 'official_groups');
        // Primary path: normalized exact match
        const q = query(groupsRef, where('tutorEmail', '==', normalizedEmail));
        const querySnapshot = await getDocs(q);
        
        const groups: OfficialGroup[] = [];
        querySnapshot.forEach((doc) => {
            groups.push({ id: doc.id, ...doc.data() } as OfficialGroup);
        });

        // Fallback: legacy mixed-case emails in Firestore
        if (groups.length === 0) {
            const allSnap = await getDocs(groupsRef);
            allSnap.forEach((doc) => {
                const data = doc.data() as OfficialGroup;
                const email = String((data as any).tutorEmail || '').trim().toLowerCase();
                if (email && email === normalizedEmail) {
                    groups.push({ id: doc.id, ...data } as OfficialGroup);
                }
            });
        }

        return groups;
    } catch (error) {
        console.error("Error fetching tutor groups:", error);
        return [];
    }
  }

  // Helper para mantener compatibilidad con el código anterior que esperaba 1 grupo
  static async getTutorGroup(tutorEmail: string): Promise<OfficialGroup | null> {
      const groups = await this.getTutorGroupsForEmail(tutorEmail);
      return groups.length > 0 ? groups[0] : null;
  }

  static async logTutorAction(studentId: string, action: string): Promise<{ id: string; date: string; action: string; }> {
      try {
          const docRef = await addDoc(collection(db, 'tutor_interventions'), {
              studentId,
              action,
              date: new Date().toISOString(),
              timestamp: Timestamp.now()
          });
          return {
              id: docRef.id,
              date: new Date().toISOString(),
              action
          };
      } catch (e) {
          console.error("Error logging action:", e);
          throw e;
      }
  }

  // 2. Concentrador de Datos Reales
    static async getStudentsWithAnalytics(
        officialGroupId: string,
        partialView: TutorPartialView = 'p1',
    ): Promise<TutorStudentView[]> {
    try {
        // A. Obtener Alumnos del Grupo Oficial
        const studentsRef = collection(db, 'students');
        const [legacyStudentsSnap, camelStudentsSnap] = await Promise.all([
            getDocs(query(studentsRef, where('official_group_id', '==', officialGroupId))),
            getDocs(query(studentsRef, where('officialGroupId', '==', officialGroupId))),
        ]);

        const baseStudentsMap = new Map<string, Student>();
        [legacyStudentsSnap, camelStudentsSnap].forEach((snapshot) => {
            snapshot.forEach((doc) => {
                baseStudentsMap.set(doc.id, { id: doc.id, ...doc.data() } as Student);
            });
        });

        let baseStudents: Student[] = Array.from(baseStudentsMap.values());

        if (baseStudents.length === 0) {
            // Fallback: reconstruir lista de alumnos desde academic_compliance
            const complianceSnap = await getDocs(query(collection(db, 'academic_compliance'), where('officialGroupId', '==', officialGroupId)));
            const complianceStudentMap = new Map<string, Student>();

            complianceSnap.forEach((doc) => {
                const data = doc.data() as Record<string, unknown>;
                const studentId = String(data.studentId || '').trim();
                if (!studentId) return;
                const studentName = String(data.studentName || '').trim() || `Alumno ${studentId}`;

                if (!complianceStudentMap.has(studentId)) {
                    complianceStudentMap.set(studentId, {
                        id: studentId,
                        name: studentName,
                        photo: 'https://placehold.co/100x100.png',
                        official_group_id: officialGroupId,
                    } as Student);
                }
            });

            baseStudents = Array.from(complianceStudentMap.values());
        }

        if (baseStudents.length === 0) return [];

        // B. Obtener Inasistencias para el grupo oficial
        const absencesRef = collection(db, 'absences');
        let relevantAbsenceDocs = [] as Array<Record<string, unknown>>;

        try {
            const officialAbsences = await getDocs(query(absencesRef, where('officialGroupId', '==', officialGroupId)));
            relevantAbsenceDocs = officialAbsences.docs.map((doc) => doc.data() as Record<string, unknown>);
        } catch (e) {
            console.warn('Error querying absences by officialGroupId, using fallback', e);
        }

        if (relevantAbsenceDocs.length === 0) {
            const complianceForGroup = await getDocs(query(collection(db, 'academic_compliance'), where('officialGroupId', '==', officialGroupId)));
            const knownGroupIds = new Set<string>();
            complianceForGroup.forEach((doc) => {
                const data = doc.data() as Record<string, unknown>;
                const groupId = String(data.groupId || '').trim();
                if (groupId) knownGroupIds.add(groupId);
            });

            // Fallback legacy path for historical docs without officialGroupId
            const studentIds = new Set(baseStudents.map((s) => s.id));
            const fallbackSnap = await getDocs(query(absencesRef, orderBy('timestamp', 'desc'), limit(500)));
            relevantAbsenceDocs = fallbackSnap.docs
                .map((doc) => doc.data() as Record<string, unknown>)
                .filter((data) => {
                    const legacyGroupId = String(data.groupId || '').trim();
                    if (legacyGroupId && knownGroupIds.has(legacyGroupId)) {
                        return true;
                    }
                    const absentList = Array.isArray(data.absentStudents) ? data.absentStudents : [];
                    return absentList.some((absent: any) => absent?.id && studentIds.has(String(absent.id)));
                });
        }

        const studentIdSet = new Set(baseStudents.map((s) => String(s.id || '').trim()));
        const studentIdByName = new Map<string, string>();
        baseStudents.forEach((student) => {
            const normalizedName = this.normalizeText((student as any).name);
            if (normalizedName) {
                studentIdByName.set(normalizedName, String(student.id || '').trim());
            }
        });

        const resolveStudentId = (rawId: unknown, rawName?: unknown): string | null => {
            const candidateId = String(rawId || '').trim();
            if (candidateId && studentIdSet.has(candidateId)) return candidateId;

            const normalizedName = this.normalizeText(rawName);
            if (normalizedName && studentIdByName.has(normalizedName)) {
                return studentIdByName.get(normalizedName) || null;
            }

            return null;
        };

        const absenceCounts: { [studentId: string]: number } = {};
        const totalSessions = relevantAbsenceDocs.length;
        
        relevantAbsenceDocs.forEach((data) => {
            const absentList = data.absentStudents || [];
            // absentList es array de objetos {id, name}
            absentList.forEach((absent: any) => {
                 const resolvedId = resolveStudentId(absent?.id, absent?.name);
                 if (resolvedId) {
                     absenceCounts[resolvedId] = (absenceCounts[resolvedId] || 0) + 1;
                 }
            });
        });

        // C. Obtener Estrategias PIGEC
        // Esto requeriría muchas lecturas si filtramos por alumno una por una.
        // Haremos una query general de estrategias recientes o pendientes.
        // Simularemos PIGEC por ahora basándonos en campos del estudiante ya cargados (neuropsiScore, etc)
        // ya que la colección 'pedagogical_strategies' es compleja de cruzar masivamente sin Cloud Functions.

        // D. Procesar cada alumno (con Compliance Monitor y Log Mirror)
        const activeTutorInterventions = await this.getTutorInterventions(baseStudents.map(s => s.id));
        const observationMap = await this.getAllObservations(baseStudents.map(s => s.id));

        // Para Compliance Monitor: Necesitamos iterar sobre todos los grupos del sistema que tengan officialGroupId igual al actual
        // Esto es costoso en lectura si no hay cache.
        // Simularemos que obtenemos el "Promedio General" de una colección agregada 'semester_stats'
        // o lo calculamos al vuelo si son pocos grupos.
        const complianceStats = await this.getComplianceStats(officialGroupId, baseStudents, partialView);


        return baseStudents.map(student => {
            // Cálculo de Asistencia
            const totalAbsences = absenceCounts[student.id] || 0;
            const absencePercentage = totalSessions > 0 ? (totalAbsences / totalSessions) * 100 : 0;

            // Riesgos
            const isDropoutRisk = absencePercentage > 15;
            const stats = complianceStats[student.id] || { completionRate: 100, failingSubjects: 0, subjects: [] };
            const isFailingRisk = stats.failingSubjects > 2 || stats.completionRate < 60;
            
            // PIGEC Alerts (Basado en datos del perfil del alumno y psych_results mockeadas)
            // Propuesta IA (Motor de Decisiones)
            let aiSuggestion = undefined;
            if (isDropoutRisk && isFailingRisk) {
                 aiSuggestion = 'ALERTA MÁXIMA: Patrón de deserción inminente. Citar a tutor legal urgentemente.';
            } else if (isDropoutRisk) {
                aiSuggestion = 'Acción recomendada: Indagar causa de inasistencias (Salud/Familiar).';
            } else if (isFailingRisk) {
                aiSuggestion = 'Acción recomendada: Activar compromiso académico por bajo cumplimiento de tareas.';
            }

            return {
                ...student,
                totalAbsences,
                absencePercentage,
                completionRate: stats.completionRate,
                failingSubjects: stats.failingSubjects,
                riskVariables: {
                    dropoutRisk: isDropoutRisk,
                    failingRisk: isFailingRisk
                },
                recentLogs: observationMap[student.id] || [],
                aiSuggestion,
                groupName: 'Oficial', 
                tutorInterventions: activeTutorInterventions[student.id] || [],
                subjectSnapshots: stats.subjects || []
            };
        });

    } catch (error) {
        console.error("Error building tutor view:", error);
        return [];
    }
  }

  static async getAllObservations(studentIds: string[]) {
      // Log Mirror: Busca observaciones en la colección 'student_observations' (que asumimos existe o se migrará a ella)
      // Si no existe, usamos el store local simulado o buscamos en grupos.
      // Opción real: Query a collection group si las observaciones están anidadas, o collection root.
      // Asumiremos colección root 'observations'
      try {
          const map: {[id: string]: StudentObservation[]} = {};

          const chunks: string[][] = [];
          for (let i = 0; i < studentIds.length; i += 10) {
              chunks.push(studentIds.slice(i, i + 10));
          }

          for (const chunk of chunks) {
              const q = query(collection(db, 'observations'), where('studentId', 'in', chunk));
              const snap = await getDocs(q);
              snap.forEach(doc => {
                  const data = doc.data() as StudentObservation;
                  if (!map[data.studentId]) map[data.studentId] = [];
                  map[data.studentId].push({ ...data, id: doc.id });
              });
          }

          // Keep recent logs first for UI consistency
          Object.keys(map).forEach((studentId) => {
              map[studentId].sort((a, b) => {
                  const aDate = new Date(a.date || 0).getTime();
                  const bDate = new Date(b.date || 0).getTime();
                  return bDate - aDate;
              });
          });

          return map;
      } catch (e) {
          console.log("No detailed logs found or collection missing");
          return {};
      }
  }

        static async getComplianceStats(
            officialGroupId: string,
            students: Student[],
            partialView: TutorPartialView = 'p1',
        ) {
      // Compliance Monitor Logic
      // 1. Obtener todas las materias (groups) ligadas a este officialGroupId
      // 2. Iterar sus partialData para ver entregas.
      
    const studentIds = students.map((student) => String(student.id || '').trim()).filter(Boolean);
    const studentIdSet = new Set(studentIds);
    const studentIdByName = new Map<string, string>();
    students.forEach((student) => {
        const normalizedName = this.normalizeText((student as any).name);
        if (normalizedName) {
            studentIdByName.set(normalizedName, String(student.id || '').trim());
        }
    });

    const resolveStudentId = (rawId: unknown, rawName?: unknown): string | null => {
        const candidateId = String(rawId || '').trim();
        if (candidateId && studentIdSet.has(candidateId)) return candidateId;

        const normalizedName = this.normalizeText(rawName);
        if (normalizedName && studentIdByName.has(normalizedName)) {
            return studentIdByName.get(normalizedName) || null;
        }

        return null;
    };

    const stats: {[id: string]: {completionRate: number, failingSubjects: number, subjects: TutorStudentSubjectSnapshot[]}} = {};
    studentIds.forEach(id => stats[id] = { completionRate: 100, failingSubjects: 0, subjects: [] });

      try {
        // Fuente principal: academic_compliance por officialGroupId (evita desalineacion de IDs legacy).
        const complianceRef = collection(db, 'academic_compliance');
        const normalizedOfficialGroupId = String(officialGroupId || '').trim();
        const officialSnap = await getDocs(query(complianceRef, where('officialGroupId', '==', normalizedOfficialGroupId)));
        let docsToAggregate = officialSnap.docs;

        // Fallback legacy: documentos sin officialGroupId.
        // Traemos una ventana amplia y filtramos por IDs/nombres del alumnado actual.
        if (docsToAggregate.length === 0) {
            const legacySnap = await getDocs(query(complianceRef, orderBy('lastUpdated', 'desc'), limit(2000)));
            docsToAggregate = legacySnap.docs.filter((docSnap) => {
                const data = docSnap.data() as Record<string, unknown>;
                const docOfficialGroupId = String(data.officialGroupId || data.official_group_id || '').trim();
                if (docOfficialGroupId) return false;
                const resolvedId = resolveStudentId(data.studentId, data.studentName);
                return !!resolvedId;
            });
        }

        const normalizedPartial = String(partialView || 'p1').trim().toLowerCase();
        const allowedPartials = new Set(['p1', 'p2', 'p3']);

        const docsWithPartialInfo = docsToAggregate.filter((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            const partialId = String(data.partialId || '').trim().toLowerCase();
            return allowedPartials.has(partialId);
        });

        let scopedDocs = docsToAggregate;
        if (docsWithPartialInfo.length === 0) {
            // Todo legacy sin partialId: usamos todo el universo para no perder métricas reales.
            scopedDocs = docsToAggregate;
        } else if (normalizedPartial === 'semester') {
            scopedDocs = docsWithPartialInfo;
        } else if (allowedPartials.has(normalizedPartial)) {
            const partialScoped = docsWithPartialInfo.filter((docSnap) => {
                const data = docSnap.data() as Record<string, unknown>;
                const partialId = String(data.partialId || '').trim().toLowerCase();
                return partialId === normalizedPartial;
            });

            if (partialScoped.length > 0) {
                scopedDocs = partialScoped;
            } else {
                // Si no hay docs de ese parcial aun, no mezclar otros parciales.
                scopedDocs = [];
            }
        }

        // Paso 4: Agrupar por estudiante
        const studentMap: {[id: string]: { totalRate: number, count: number, failed: number, subjects: Map<string, { totalRate: number; count: number; failed: number; lastUpdatedMs: number; subject: string }> }} = {};
        
        scopedDocs.forEach(doc => {
            const data = doc.data();
            const sId = resolveStudentId(data.studentId, data.studentName);
            if (!sId) return;

            if (!studentMap[sId]) studentMap[sId] = { totalRate: 0, count: 0, failed: 0, subjects: new Map() };

            const academicPerformance = Number(data.academicPerformance ?? data.finalGrade ?? data.completionRate ?? 0);
            const normalizedRate = Number.isFinite(academicPerformance) ? academicPerformance : 0;
            const failingRisk = Boolean(data.failingRisk) || normalizedRate < 60;
            const subjectLabel = String(data.subject || data.groupName || 'Asignatura sin nombre').trim() || 'Asignatura sin nombre';
            const lastUpdatedMs = this.toMillis(data.lastUpdated || data.updatedAt || data.timestamp);
            
            studentMap[sId].totalRate += normalizedRate;
            studentMap[sId].count++;
            if (failingRisk) studentMap[sId].failed++;

            const subjectKey = subjectLabel.toLowerCase();
            if (!studentMap[sId].subjects.has(subjectKey)) {
                studentMap[sId].subjects.set(subjectKey, {
                    totalRate: 0,
                    count: 0,
                    failed: 0,
                    lastUpdatedMs,
                    subject: subjectLabel,
                });
            }

            const subjectStats = studentMap[sId].subjects.get(subjectKey)!;
            subjectStats.totalRate += normalizedRate;
            subjectStats.count++;
            if (failingRisk) subjectStats.failed++;
            if (lastUpdatedMs > subjectStats.lastUpdatedMs) {
                subjectStats.lastUpdatedMs = lastUpdatedMs;
            }
        });

        // Paso 5: Finalizar stats
        studentIds.forEach(id => {
            const s = studentMap[id];
            if (s && s.count > 0) {
                const subjects = Array.from(s.subjects.values())
                    .map((subjectStats) => {
                        const subjectAverage = subjectStats.count > 0 ? subjectStats.totalRate / subjectStats.count : 0;
                        return {
                            subject: subjectStats.subject,
                            completionRate: subjectAverage,
                            failingRisk: subjectStats.failed > 0 || subjectAverage < 60,
                            lastUpdated: subjectStats.lastUpdatedMs ? new Date(subjectStats.lastUpdatedMs).toISOString() : undefined,
                        } as TutorStudentSubjectSnapshot;
                    })
                    .sort((a, b) => a.completionRate - b.completionRate);

                stats[id] = {
                    completionRate: s.totalRate / s.count,
                    failingSubjects: subjects.filter((subject) => subject.failingRisk).length,
                    subjects,
                };
            }
        });
        
        return stats;

      } catch (e) {
          console.error("Error calculating compliance", e);
          return stats;
      }
  }

  static async getTutorInterventions(studentIds: string[]): Promise<{[id: string]: any[]}> {
      // Helper para traer intervenciones pasadas
      // Simplificado: Traemos todo y filtramos en memoria (MVP)
      try {
        const ref = collection(db, 'tutor_interventions');
        const map: {[id: string]: any[]} = {};

        const chunks: string[][] = [];
        for (let i = 0; i < studentIds.length; i += 10) {
            chunks.push(studentIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const q = query(ref, where('studentId', 'in', chunk));
            const snap = await getDocs(q);
            snap.forEach(doc => {
                const data = doc.data() as any;
                if (!map[data.studentId]) map[data.studentId] = [];
                map[data.studentId].push({ id: doc.id, ...data });
            });
        }

        Object.keys(map).forEach((studentId) => {
            map[studentId].sort((a, b) => {
                const aDate = new Date(a.date || 0).getTime();
                const bDate = new Date(b.date || 0).getTime();
                return bDate - aDate;
            });
        });

        return map;
      } catch (e) {
          return {};
      }
  }

  static subscribeStudentsWithAnalytics(
    officialGroupId: string,
        partialView: TutorPartialView,
    onData: (students: TutorStudentView[]) => void,
    onError?: (error: unknown) => void,
  ): () => void {
      let disposed = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let refreshing = false;

      const refresh = async () => {
          if (disposed || refreshing) return;
          refreshing = true;
          try {
              const next = await this.getStudentsWithAnalytics(officialGroupId, partialView);
              if (!disposed) onData(next);
          } catch (e) {
              if (!disposed && onError) onError(e);
          } finally {
              refreshing = false;
          }
      };

      const scheduleRefresh = () => {
          if (disposed) return;
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
              void refresh();
          }, 250);
      };

      const unsubs = [
          onSnapshot(query(collection(db, 'students'), where('official_group_id', '==', officialGroupId)), scheduleRefresh),
          onSnapshot(query(collection(db, 'students'), where('officialGroupId', '==', officialGroupId)), scheduleRefresh),
          onSnapshot(query(collection(db, 'absences'), orderBy('timestamp', 'desc'), limit(200)), scheduleRefresh),
          onSnapshot(query(collection(db, 'observations'), orderBy('date', 'desc'), limit(100)), scheduleRefresh),
          onSnapshot(query(collection(db, 'academic_compliance'), orderBy('lastUpdated', 'desc'), limit(500)), scheduleRefresh),
          onSnapshot(query(collection(db, 'tutor_interventions'), orderBy('timestamp', 'desc'), limit(200)), scheduleRefresh),
      ];

      // Initial load
      void refresh();

      return () => {
          disposed = true;
          if (timer) clearTimeout(timer);
          unsubs.forEach((unsub) => unsub());
      };
  }
}

