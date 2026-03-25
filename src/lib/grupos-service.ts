import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface Grupo {
  id: string;
  nombre: string;
  semestre: number;
  carrera: string;
  turno: 'Matutino' | 'Vespertino';
  periodo: string;
  totalEstudiantes: number;
  tutorId?: string;
  tutorEmail?: string;
  activo: boolean;
  fechaCreacion?: Date;
}

export interface EstudianteGrupo {
  id: string;
  nombre: string;
  matricula?: string;
  grupo: string;
  grupoId: string;
  semestre: number;
  telefono?: string;
  email?: string;
}

export interface GruposResult {
  success: boolean;
  grupos: Grupo[];
  error?: string;
}

export interface EstudiantesGrupoResult {
  success: boolean;
  estudiantes: EstudianteGrupo[];
  error?: string;
}

// ============================================
// CONFIGURACIÓN
// ============================================

const COLECCION_GRUPOS_OFICIALES = 'official_groups';
const COLECCION_ESTUDIANTES = 'students';
const PERIODO_ACTUAL = '2026-1';

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function extraerSemestre(grupoNombre: string): number {
  const match = grupoNombre.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

function extraerCarrera(grupoNombre: string): string {
  const match = grupoNombre.match(/\s+([A-Z]+)\s*$/);
  return match ? match[1] : 'Tecnólogo';
}

function extraerTurno(grupoNombre: string): 'Matutino' | 'Vespertino' {
  if (grupoNombre.toLowerCase().includes('vespertino') || grupoNombre.toLowerCase().includes('vesp')) {
    return 'Vespertino';
  }
  return 'Matutino';
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Obtiene todos los grupos oficiales de Firestore
 */
export async function obtenerGrupos(): Promise<GruposResult> {
  if (!db) {
    return { success: false, grupos: [], error: 'Base de datos no disponible' };
  }

  try {
    const gruposRef = collection(db, COLECCION_GRUPOS_OFICIALES);
    const gruposSnapshot = await getDocs(gruposRef);

    if (gruposSnapshot.empty) {
      console.log('No se encontraron grupos en official_groups');
      return { success: true, grupos: [] };
    }

    const grupos: Grupo[] = gruposSnapshot.docs.map(doc => {
      const data = doc.data();
      const nombre = data.name || `Grupo ${doc.id}`;
      
      return {
        id: doc.id,
        nombre: nombre,
        semestre: extraerSemestre(nombre),
        carrera: extraerCarrera(nombre),
        turno: extraerTurno(nombre),
        periodo: PERIODO_ACTUAL,
        totalEstudiantes: 0,
        tutorEmail: data.tutorEmail,
        activo: true,
        fechaCreacion: data.createdAt ? new Date(data.createdAt) : undefined
      };
    });

    // Obtener conteo de estudiantes por grupo
    const conteoPorGrupo = await obtenerConteoEstudiantesPorGrupo();
    
    grupos.forEach(grupo => {
      grupo.totalEstudiantes = conteoPorGrupo.get(grupo.id) || 0;
    });

    grupos.sort((a, b) => {
      if (a.semestre !== b.semestre) return a.semestre - b.semestre;
      return a.nombre.localeCompare(b.nombre);
    });

    console.log(`[grupos-service] Cargados ${grupos.length} grupos desde official_groups`);
    return { success: true, grupos };

  } catch (error) {
    console.error('Error obteniendo grupos:', error);
    return { 
      success: false, 
      grupos: [], 
      error: `Error al obtener grupos: ${error}` 
    };
  }
}

/**
 * Obtiene todos los estudiantes de un grupo específico
 * IMPORTANTE: Filtra en memoria para evitar problemas de índices de Firestore
 */
export async function obtenerEstudiantesGrupo(grupoId: string): Promise<EstudiantesGrupoResult> {
  if (!db) {
    return { success: false, estudiantes: [], error: 'Base de datos no disponible' };
  }

  try {
    console.log(`[grupos-service] ========== BUSCANDO ESTUDIANTES ==========`);
    console.log(`[grupos-service] Grupo ID buscado: "${grupoId}"`);
    console.log(`[grupos-service] Tipo de grupoId: ${typeof grupoId}`);
    
    // Obtener TODOS los estudiantes y filtrar en memoria (evita problemas de índices)
    const estudiantesRef = collection(db, COLECCION_ESTUDIANTES);
    const estudiantesSnapshot = await getDocs(estudiantesRef);

    console.log(`[grupos-service] Total documentos en 'students': ${estudiantesSnapshot.docs.length}`);

    if (estudiantesSnapshot.empty) {
      console.log('[grupos-service] No hay estudiantes en la base de datos');
      return { success: true, estudiantes: [] };
    }

    // Debug: mostrar todos los grupos encontrados en estudiantes
    const gruposEncontrados = new Set<string>();
    estudiantesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const gid = data.official_group_id;
      if (gid) {
        gruposEncontrados.add(gid);
      }
    });
    console.log(`[grupos-service] Grupos encontrados en estudiantes:`, Array.from(gruposEncontrados));

    // Filtrar manualmente por official_group_id
    const estudiantesFiltrados = estudiantesSnapshot.docs.filter(doc => {
      const data = doc.data();
      const estudianteGrupoId = data.official_group_id;
      const coincide = estudianteGrupoId === grupoId;
      return coincide;
    });

    console.log(`[grupos-service] Estudiantes filtrados para grupo "${grupoId}": ${estudiantesFiltrados.length}`);

    if (estudiantesFiltrados.length === 0) {
      return { success: true, estudiantes: [] };
    }

    // Obtener el nombre del grupo
    const gruposResult = await obtenerGrupos();
    const grupo = gruposResult.grupos.find(g => g.id === grupoId);
    const grupoNombre = grupo?.nombre || 'Grupo';

    const estudiantes: EstudianteGrupo[] = estudiantesFiltrados.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.name || 'Sin nombre',
        matricula: data.matricula,
        grupo: grupoNombre,
        grupoId: grupoId,
        semestre: extraerSemestre(grupoNombre),
        telefono: data.phone || data.telefono,
        email: data.email
      };
    });

    // Ordenar por nombre
    estudiantes.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return { success: true, estudiantes };

  } catch (error) {
    console.error('[grupos-service] Error obteniendo estudiantes del grupo:', error);
    return { 
      success: false, 
      estudiantes: [], 
      error: `Error al obtener estudiantes: ${error}` 
    };
  }
}

/**
 * Obtiene el conteo de estudiantes por grupo
 * Filtra en memoria para evitar problemas de índices
 */
export async function obtenerConteoEstudiantesPorGrupo(): Promise<Map<string, number>> {
  if (!db) {
    return new Map();
  }

  try {
    const estudiantesRef = collection(db, COLECCION_ESTUDIANTES);
    const estudiantesSnapshot = await getDocs(estudiantesRef);

    const conteo = new Map<string, number>();

    estudiantesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const grupoId = data.official_group_id;
      
      if (grupoId) {
        conteo.set(grupoId, (conteo.get(grupoId) || 0) + 1);
      }
    });

    console.log(`[grupos-service] Conteo de estudiantes por grupo: ${conteo.size} grupos con estudiantes`);
    return conteo;

  } catch (error) {
    console.error('[grupos-service] Error obteniendo conteo de estudiantes:', error);
    return new Map();
  }
}

/**
 * Suscribe a cambios en tiempo real en los grupos
 */
export function subscribeToGrupos(callback: (grupos: Grupo[]) => void): () => void {
  if (!db) {
    callback([]);
    return () => {};
  }

  const gruposRef = collection(db, COLECCION_GRUPOS_OFICIALES);
  
  const unsubscribe = onSnapshot(gruposRef, async (snapshot) => {
    const grupos: Grupo[] = snapshot.docs.map(doc => {
      const data = doc.data();
      const nombre = data.name || `Grupo ${doc.id}`;
      
      return {
        id: doc.id,
        nombre: nombre,
        semestre: extraerSemestre(nombre),
        carrera: extraerCarrera(nombre),
        turno: extraerTurno(nombre),
        periodo: PERIODO_ACTUAL,
        totalEstudiantes: 0,
        tutorEmail: data.tutorEmail,
        activo: true,
        fechaCreacion: data.createdAt ? new Date(data.createdAt) : undefined
      };
    });

    const conteoPorGrupo = await obtenerConteoEstudiantesPorGrupo();
    grupos.forEach(grupo => {
      grupo.totalEstudiantes = conteoPorGrupo.get(grupo.id) || 0;
    });

    grupos.sort((a, b) => {
      if (a.semestre !== b.semestre) return a.semestre - b.semestre;
      return a.nombre.localeCompare(b.nombre);
    });

    callback(grupos);
  }, (error) => {
    console.error('[grupos-service] Error en suscripción a grupos:', error);
  });

  return unsubscribe;
}

/**
 * Formatea el nombre del grupo para mostrar
 */
export function formatearNombreGrupo(grupo: Grupo): string {
  return `${grupo.nombre} (${grupo.totalEstudiantes} estudiantes)`;
}

/**
 * Filtra grupos por semestre
 */
export function filtrarGruposPorSemestre(grupos: Grupo[], semestre: number | 'all'): Grupo[] {
  if (semestre === 'all') return grupos;
  return grupos.filter(g => g.semestre === semestre);
}

/**
 * Busca grupos por nombre
 */
export function buscarGrupos(grupos: Grupo[], termino: string): Grupo[] {
  const terminoLower = termino.toLowerCase();
  return grupos.filter(g => 
    g.nombre.toLowerCase().includes(terminoLower) ||
    g.carrera.toLowerCase().includes(terminoLower) ||
    g.tutorEmail?.toLowerCase().includes(terminoLower)
  );
}
