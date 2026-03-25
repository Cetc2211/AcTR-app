import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface MatriculaRegistro {
  matricula: string;              // "CBTA-2026-G1A-001"
  nombreCompleto: string;         // Nombre del estudiante
  nombreNormalizado: string;      // APELLIDO APELLIDO NOMBRE (para ordenamiento)
  grupoId: string;                // ID del grupo en Academic Tracker
  grupoNombre: string;            // "Grupo 1A - Semestre 1"
  semestre: number;               // 1-6
  periodo: string;                // "2026-1" (año-periodo)
  expedienteId?: string;          // ID del expediente clínico (si existe)
  fechaAsignacion: Date;          // Cuándo se generó la matrícula
  fechaUltimaEvaluacion?: Date;   // Última evaluación completada
  evaluacionesCompletadas: number;// Contador de evaluaciones
  activo: boolean;                // Si sigue vigente
  telefono?: string;              // WhatsApp del estudiante o tutor
  email?: string;                 // Email si tiene
}

export interface GenerarMatriculasResult {
  success: boolean;
  matriculas: MatriculaRegistro[];
  errores: string[];
  totalGenerados: number;
  totalRecuperados: number;
}

export interface ListaMatriculasGrupo {
  grupoId: string;
  grupoNombre: string;
  periodo: string;
  fechaGeneracion: Date;
  estudiantes: MatriculaRegistro[];
  resumen: {
    total: number;
    conExpediente: number;
    sinExpediente: number;
    evaluados: number;
    pendientes: number;
  };
}

// ============================================
// CONFIGURACIÓN
// ============================================

const PLANTEL = 'CBTA';
const PERIODO_ACTUAL = '2026-1'; // Se puede hacer dinámico
const COLECCION_MATRICULAS = 'matriculas_estudiantes';

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Normaliza un nombre para ordenamiento: "Juan Pérez García" → "PEREZ GARCIA JUAN"
 */
function normalizarNombre(nombre: string): string {
  return nombre
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim()
    .split(' ')
    .reverse()
    .join(' ');
}

/**
 * Extrae el semestre del nombre del grupo
 * "Grupo 1A - Semestre 1" → 1
 */
function extraerSemestre(grupoNombre: string): number {
  const match = grupoNombre.match(/semestre\s*(\d)/i);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Genera el código corto del grupo
 * "Grupo 1A - Semestre 1" → "G1A"
 */
function generarCodigoGrupo(grupoNombre: string): string {
  const match = grupoNombre.match(/Grupo\s*(\d+)([A-Z])/i);
  if (match) {
    return `G${match[1]}${match[2].toUpperCase()}`;
  }
  return 'G00';
}

/**
 * Genera una matrícula única
 */
function generarMatricula(
  grupoNombre: string,
  numeroSecuencial: number,
  periodo: string = PERIODO_ACTUAL
): string {
  const codigoGrupo = generarCodigoGrupo(grupoNombre);
  const año = periodo.split('-')[0];
  const numero = numeroSecuencial.toString().padStart(3, '0');

  return `${PLANTEL}-${año}-${codigoGrupo}-${numero}`;
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Obtiene la siguiente matrícula disponible para un grupo
 */
async function obtenerSiguienteNumero(grupoId: string): Promise<number> {
  if (!db) return 1;

  try {
    const q = query(
      collection(db, COLECCION_MATRICULAS),
      where('grupoId', '==', grupoId),
      orderBy('matricula', 'desc')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return 1;

    // Extraer el número de la última matrícula
    const ultimaMatricula = snapshot.docs[0].data().matricula as string;
    const partes = ultimaMatricula.split('-');
    const ultimoNumero = parseInt(partes[partes.length - 1]);

    return ultimoNumero + 1;
  } catch (error) {
    console.error('Error obteniendo siguiente número:', error);
    return 1;
  }
}

/**
 * Busca una matrícula existente por nombre (coincidencia aproximada)
 */
async function buscarMatriculaPorNombre(
  nombreEstudiante: string,
  grupoId: string
): Promise<MatriculaRegistro | null> {
  if (!db) return null;

  try {
    const nombreNormalizado = normalizarNombre(nombreEstudiante);

    const q = query(
      collection(db, COLECCION_MATRICULAS),
      where('grupoId', '==', grupoId),
      where('nombreNormalizado', '==', nombreNormalizado)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      fechaAsignacion: doc.data().fechaAsignacion?.toDate() || new Date(),
      fechaUltimaEvaluacion: doc.data().fechaUltimaEvaluacion?.toDate()
    } as MatriculaRegistro & { id: string };
  } catch (error) {
    console.error('Error buscando matrícula:', error);
    return null;
  }
}

/**
 * Genera matrículas para una lista de estudiantes de un grupo
 * Conecta con Academic Tracker para obtener la lista real
 */
export async function generarMatriculasGrupo(
  grupoId: string,
  grupoNombre: string,
  estudiantes: { id: string; nombre: string; telefono?: string; email?: string }[]
): Promise<GenerarMatriculasResult> {
  const result: GenerarMatriculasResult = {
    success: false,
    matriculas: [],
    errores: [],
    totalGenerados: 0,
    totalRecuperados: 0
  };

  if (!db) {
    result.errores.push('Base de datos no disponible');
    return result;
  }

  try {
    const batch = writeBatch(db);
    const semestre = extraerSemestre(grupoNombre);
    let siguienteNumero = await obtenerSiguienteNumero(grupoId);

    for (const estudiante of estudiantes) {
      try {
        // Verificar si ya tiene matrícula
        const existente = await buscarMatriculaPorNombre(estudiante.nombre, grupoId);

        if (existente) {
          // Actualizar datos si es necesario
          result.matriculas.push({
            ...existente,
            telefono: existente.telefono || estudiante.telefono,
            email: existente.email || estudiante.email
          });
          result.totalRecuperados++;
          continue;
        }

        // Generar nueva matrícula
        const matricula = generarMatricula(grupoNombre, siguienteNumero);
        const matriculaRegistro: MatriculaRegistro = {
          matricula,
          nombreCompleto: estudiante.nombre,
          nombreNormalizado: normalizarNombre(estudiante.nombre),
          grupoId,
          grupoNombre,
          semestre,
          periodo: PERIODO_ACTUAL,
          fechaAsignacion: new Date(),
          evaluacionesCompletadas: 0,
          activo: true,
          telefono: estudiante.telefono,
          email: estudiante.email
        };

        // Guardar en Firestore
        const docRef = doc(collection(db, COLECCION_MATRICULAS));
        batch.set(docRef, {
          ...matriculaRegistro,
          fechaAsignacion: Timestamp.now()
        });

        result.matriculas.push(matriculaRegistro);
        result.totalGenerados++;
        siguienteNumero++;
      } catch (error) {
        result.errores.push(`Error con estudiante ${estudiante.nombre}: ${error}`);
      }
    }

    // Commit batch
    await batch.commit();
    result.success = true;

  } catch (error) {
    result.errores.push(`Error general: ${error}`);
    result.success = false;
  }

  return result;
}

/**
 * Obtiene la lista completa de matrículas de un grupo
 */
export async function obtenerMatriculasGrupo(grupoId: string): Promise<ListaMatriculasGrupo | null> {
  if (!db) return null;

  try {
    const q = query(
      collection(db, COLECCION_MATRICULAS),
      where('grupoId', '==', grupoId),
      orderBy('nombreNormalizado', 'asc')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const estudiantes: MatriculaRegistro[] = snapshot.docs.map(doc => ({
      ...doc.data(),
      fechaAsignacion: doc.data().fechaAsignacion?.toDate() || new Date(),
      fechaUltimaEvaluacion: doc.data().fechaUltimaEvaluacion?.toDate()
    } as MatriculaRegistro));

    const primero = estudiantes[0];

    return {
      grupoId,
      grupoNombre: primero.grupoNombre,
      periodo: primero.periodo,
      fechaGeneracion: new Date(),
      estudiantes,
      resumen: {
        total: estudiantes.length,
        conExpediente: estudiantes.filter(e => e.expedienteId).length,
        sinExpediente: estudiantes.filter(e => !e.expedienteId).length,
        evaluados: estudiantes.filter(e => e.evaluacionesCompletadas > 0).length,
        pendientes: estudiantes.filter(e => e.evaluacionesCompletadas === 0).length
      }
    };
  } catch (error) {
    console.error('Error obteniendo matrículas del grupo:', error);
    return null;
  }
}

/**
 * Busca una matrícula específica para validación en formularios
 */
export async function validarMatricula(matricula: string): Promise<MatriculaRegistro | null> {
  if (!db) return null;

  try {
    const q = query(
      collection(db, COLECCION_MATRICULAS),
      where('matricula', '==', matricula.toUpperCase()),
      where('activo', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      ...doc.data(),
      fechaAsignacion: doc.data().fechaAsignacion?.toDate() || new Date(),
      fechaUltimaEvaluacion: doc.data().fechaUltimaEvaluacion?.toDate()
    } as MatriculaRegistro;
  } catch (error) {
    console.error('Error validando matrícula:', error);
    return null;
  }
}

/**
 * Actualiza el expediente ID de una matrícula
 */
export async function vincularExpediente(
  matricula: string,
  expedienteId: string
): Promise<boolean> {
  if (!db) return false;

  try {
    const q = query(
      collection(db, COLECCION_MATRICULAS),
      where('matricula', '==', matricula.toUpperCase())
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return false;

    const docRef = doc(db, COLECCION_MATRICULAS, snapshot.docs[0].id);
    await setDoc(docRef, {
      expedienteId,
      fechaUltimaEvaluacion: Timestamp.now(),
      evaluacionesCompletadas: snapshot.docs[0].data().evaluacionesCompletadas + 1
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error vinculando expediente:', error);
    return false;
  }
}

/**
 * Genera texto formateado para lista de matrículas (para WhatsApp o PDF)
 */
export function generarTextoListaMatriculas(lista: ListaMatriculasGrupo): string {
  const lineas: string[] = [];

  lineas.push(`📋 *LISTA DE MATRÍCULAS*`);
  lineas.push(`📍 ${lista.grupoNombre}`);
  lineas.push(`📅 Período: ${lista.periodo}`);
  lineas.push(`👥 Total: ${lista.resumen.total} estudiantes`);
  lineas.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lineas.push('');

  lista.estudiantes.forEach((est, idx) => {
    const estado = est.evaluacionesCompletadas > 0 ? '✅' : '⏳';
    lineas.push(`${estado} \`${est.matricula}\` - ${est.nombreCompleto}`);
  });

  lineas.push('');
  lineas.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lineas.push(`✅ Evaluados: ${lista.resumen.evaluados}`);
  lineas.push(`⏳ Pendientes: ${lista.resumen.pendientes}`);

  return lineas.join('\n');
}
