import { Student, OfficialGroup, Group, StudentObservation, RiskFlag } from '@/lib/placeholder-data';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, orderBy, limit, Timestamp } from 'firebase/firestore';

// Definición extendida para incluir datos calculados para la vista del tutor
export interface TutorStudentView extends Student {
  totalAbsences: number;
  absencePercentage: number;
  riskVariables: {
    dropoutRisk: boolean;
    failingRisk: boolean;
    clinicalAlerts: string[]; // De PIGEC-130
  };
  recentLogs: StudentObservation[]; // Últimos 5 registros de bitácoras
  aiSuggestion?: string;
  groupName: string;
  tutorInterventions: { id: string; date: string; action: string; }[];
}

export class TutorService {
    
  // 1. Filtro de Grupos Asignados (Real)
  static async getTutorGroupsForEmail(tutorEmail: string): Promise<OfficialGroup[]> {
    try {
        const groupsRef = collection(db, 'official_groups');
        // Buscamos grupos donde el tutorEmail coincida
        // Nota: Asegurarse de tener índice compuesto si es necesario, pero simple should work
        const q = query(groupsRef, where('tutorEmail', '==', tutorEmail));
        const querySnapshot = await getDocs(q);
        
        const groups: OfficialGroup[] = [];
        querySnapshot.forEach((doc) => {
            groups.push({ id: doc.id, ...doc.data() } as OfficialGroup);
        });
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
  static async getStudentsWithAnalytics(officialGroupId: string): Promise<TutorStudentView[]> {
    try {
        // A. Obtener Alumnos del Grupo Oficial
        const studentsRef = collection(db, 'students');
        const qStudents = query(studentsRef, where('official_group_id', '==', officialGroupId));
        const studentsSnap = await getDocs(qStudents);
        
        const baseStudents: Student[] = [];
        studentsSnap.forEach((doc) => {
            baseStudents.push({ id: doc.id, ...doc.data() } as Student);
        });

        if (baseStudents.length === 0) return [];

        // B. Obtener Inasistencias Globales (Aproximación por Fetch Reciente)
        // Traemos las últimas 500 inasistencias registradas en el sistema para cruzar datos
        // Idealmente filtraríamos por fecha >= InicioSemestre
        const absencesRef = collection(db, 'absences');
        const qAbsences = query(absencesRef, orderBy('timestamp', 'desc'), limit(500));
        const absencesSnap = await getDocs(qAbsences);

        const absenceCounts: { [studentId: string]: number } = {};
        
        absencesSnap.forEach(doc => {
            const data = doc.data();
            const absentList = data.absentStudents || [];
            // absentList es array de objetos {id, name}
            absentList.forEach((absent: any) => {
                 if (absent.id) {
                     absenceCounts[absent.id] = (absenceCounts[absent.id] || 0) + 1;
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
        const complianceStats = await this.getComplianceStats(officialGroupId, baseStudents.map(s => s.id));


        return baseStudents.map(student => {
            // Cálculo de Asistencia
            const totalAbsences = absenceCounts[student.id] || 0;
            // Estimamos % base 100 clases semestrales (ajustable)
            const absencePercentage = (totalAbsences / 60) * 100; // Asumiendo ~60 clases al corte

            // Riesgos
            const isDropoutRisk = absencePercentage > 15;
            const stats = complianceStats[student.id] || { completionRate: 100, failingSubjects: 0 };
            const isFailingRisk = stats.failingSubjects > 2 || stats.completionRate < 60;
            
            // PIGEC Alerts (Basado en datos del perfil del alumno y psych_results mockeadas)
            const clinicalAlerts: string[] = [];
            if (student.clinicalStatus === 'pendiente' || (student.neuropsiScore && student.neuropsiScore < 70)) {
                clinicalAlerts.push('Atención Clínica Requerida');
            }
            if (student.pedagogicalInstructions) {
                clinicalAlerts.push(student.pedagogicalInstructions);
            }

            // Propuesta IA (Motor de Decisiones)
            let aiSuggestion = undefined;
            if (isDropoutRisk && isFailingRisk) {
                 aiSuggestion = 'ALERTA MÁXIMA: Patrón de deserción inminente. Citar a tutor legal urgentemente.';
            } else if (isDropoutRisk) {
                aiSuggestion = 'Acción recomendada: Indagar causa de inasistencias (Salud/Familiar).';
            } else if (clinicalAlerts.length > 0 && isFailingRisk) {
                 aiSuggestion = 'Acción recomendada: Canalizar a intervención clínica en PIGEC por bloqueo académico.';
            } else if (isFailingRisk) {
                aiSuggestion = 'Acción recomendada: Activar compromiso académico por bajo cumplimiento de tareas.';
            }

            return {
                ...student,
                totalAbsences,
                absencePercentage,
                riskVariables: {
                    dropoutRisk: isDropoutRisk,
                    failingRisk: isFailingRisk,
                    clinicalAlerts
                },
                recentLogs: observationMap[student.id] || [],
                aiSuggestion,
                groupName: 'Oficial', 
                tutorInterventions: activeTutorInterventions[student.id] || []
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
          // Nota: Firestore 'in' query supports up to 10 values. Si son más alumnos, hay que segmentar.
          // Para MVP, traemos las últimas globales y filtramos.
          const q = query(collection(db, 'observations'), orderBy('date', 'desc'), limit(100));
          const snap = await getDocs(q);
          const map: {[id: string]: StudentObservation[]} = {};
          
          snap.forEach(doc => {
              const data = doc.data() as StudentObservation; // Cast inseguro, validar en prod
              if (studentIds.includes(data.studentId)) {
                  if (!map[data.studentId]) map[data.studentId] = [];
                  map[data.studentId].push({ ...data, id: doc.id });
              }
          });
          return map;
      } catch (e) {
          console.log("No detailed logs found or collection missing");
          return {};
      }
  }

  static async getComplianceStats(officialGroupId: string, studentIds: string[]) {
      // Compliance Monitor Logic
      // 1. Obtener todas las materias (groups) ligadas a este officialGroupId
      // 2. Iterar sus partialData para ver entregas.
      
      const stats: {[id: string]: {completionRate: number, failingSubjects: number}} = {};
      studentIds.forEach(id => stats[id] = { completionRate: 100, failingSubjects: 0 });

      try {
        // LEEMOS DE LA COLECCIÓN PÚBLICA 'academic_compliance'
        // Esta colección contiene documentos { studentId, groupId, completionRate, failingRisk }
        // Necesitemos filtrar por los alumnos de interés.
        // Como 'in' query tiene limite 10, mejor traemos todo lo reciente o filtramos en memoria si no es costoso.
        // O hacemos batches.
        // Opción: Query por studentId es ineficiente (N queries).
        // Opción: Query por collectionGroup si guardamos officialGroupId en el documento.
        // Requerimos que 'academic_compliance' tenga 'officialGroupId' o que filtremos por materias.
        
        // Paso 1: Obtener IDs de materias del grupo oficial
        const groupsRef = collection(db, 'groups');
        const qGroups = query(groupsRef, where('officialGroupId', '==', officialGroupId));
        const groupsSnap = await getDocs(qGroups);
        const subjectGroupIds = groupsSnap.docs.map(d => d.id);
        
        if (subjectGroupIds.length === 0) return stats;

        // Paso 2: Leer compliance de esas materias
        // Optimizacion: Leer toda la coleccion 'academic_compliance' donde groupId IN subjectGroupIds
        // Firestore 'in' limit es 10. Si hay mas de 10 materias, dividir.
        
        const complianceRef = collection(db, 'academic_compliance');
        // Dividir en chunks de 10
        const chunks = [];
        for (let i = 0; i < subjectGroupIds.length; i += 10) {
            chunks.push(subjectGroupIds.slice(i, i + 10));
        }

        const allDocs = [];
        for (const chunk of chunks) {
            const q = query(complianceRef, where('groupId', 'in', chunk));
            const snap = await getDocs(q);
            allDocs.push(...snap.docs);
        }

        // Paso 3: Agrupar por estudiante
        const studentMap: {[id: string]: { totalRate: number, count: number, failed: number }} = {};
        
        allDocs.forEach(doc => {
            const data = doc.data();
            const sId = data.studentId;
            if (!studentMap[sId]) studentMap[sId] = { totalRate: 0, count: 0, failed: 0 };
            
            studentMap[sId].totalRate += (data.completionRate || 0);
            studentMap[sId].count++;
            if (data.failingRisk) studentMap[sId].failed++;
        });

        // Paso 4: Finalizar stats
        studentIds.forEach(id => {
            const s = studentMap[id];
            if (s && s.count > 0) {
                stats[id] = {
                    completionRate: s.totalRate / s.count,
                    failingSubjects: s.failed
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
        const q = query(ref, orderBy('timestamp', 'desc'), limit(100)); // Últimas 100 acciones
        const snap = await getDocs(q);
        const map: {[id: string]: any[]} = {};
        
        snap.forEach(doc => {
            const data = doc.data();
            if (studentIds.includes(data.studentId)) {
                if (!map[data.studentId]) map[data.studentId] = [];
                map[data.studentId].push({ id: doc.id, ...data });
            }
        });
        return map;
      } catch (e) {
          return {};
      }
  }
}

