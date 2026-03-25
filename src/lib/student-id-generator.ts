'use client';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';

// ============================================
// GENERADOR DE MATRÍCULAS PIGEC
// ============================================

interface StudentIdentity {
    pigecId: string;           // CBTA-245-1A-001
    plantel: string;           // 245
    grupo: string;             // 1A
    consecutivo: number;       // 001
    nombreCompleto: string;    // Juan Pérez García
    academicTrackerId?: string; // ID en Academic Tracker si existe
    fechaGeneracion: Date;
    activo: boolean;
}

interface GroupInfo {
    id: string;
    name: string;
    plantel: string;
    semester: string;
    career: string;
    studentCount: number;
}

/**
 * Genera una matrícula PIGEC única
 * Formato: CBTA-[PLANTEL]-[GRUPO]-[CONSECUTIVO]
 */
export function generatePigecId(plantel: string, grupo: string, consecutivo: number): string {
    const consecutivoStr = consecutivo.toString().padStart(3, '0');
    return `CBTA-${plantel}-${grupo}-${consecutivoStr}`;
}

/**
 * Parsea una matrícula PIGEC a sus componentes
 */
export function parsePigecId(pigecId: string): { plantel: string; grupo: string; consecutivo: number } | null {
    const parts = pigecId.split('-');
    if (parts.length !== 4 || parts[0] !== 'CBTA') {
        return null;
    }
    return {
        plantel: parts[1],
        grupo: parts[2],
        consecutivo: parseInt(parts[3])
    };
}

/**
 * Valida si una matrícula PIGEC tiene el formato correcto
 */
export function isValidPigecId(pigecId: string): boolean {
    const regex = /^CBTA-\d{3}-[1-6][AB]-\d{3}$/;
    return regex.test(pigecId);
}

/**
 * Obtiene el siguiente consecutivo disponible para un grupo
 */
export async function getNextConsecutive(plantel: string, grupo: string): Promise<number> {
    if (!db) return 1;

    try {
        const q = query(
            collection(db, 'pigec_identities'),
            where('plantel', '==', plantel),
            where('grupo', '==', grupo)
        );
        
        const snapshot = await getDocs(q);
        let maxConsecutivo = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.consecutivo > maxConsecutivo) {
                maxConsecutivo = data.consecutivo;
            }
        });
        
        return maxConsecutivo + 1;
    } catch (error) {
        console.error('Error obteniendo consecutivo:', error);
        return 1;
    }
}

/**
 * Registra una nueva identidad PIGEC en la base de datos
 */
export async function registerStudentIdentity(
    plantel: string,
    grupo: string,
    nombreCompleto: string,
    academicTrackerId?: string
): Promise<StudentIdentity | null> {
    if (!db) return null;

    try {
        const consecutivo = await getNextConsecutive(plantel, grupo);
        const pigecId = generatePigecId(plantel, grupo, consecutivo);
        
        const identity: StudentIdentity = {
            pigecId,
            plantel,
            grupo,
            consecutivo,
            nombreCompleto,
            academicTrackerId,
            fechaGeneracion: new Date(),
            activo: true
        };

        await setDoc(doc(db, 'pigec_identities', pigecId), {
            ...identity,
            fechaGeneracion: Timestamp.now()
        });

        return identity;
    } catch (error) {
        console.error('Error registrando identidad:', error);
        return null;
    }
}

/**
 * Busca una identidad PIGEC por matrícula
 */
export async function findStudentById(pigecId: string): Promise<StudentIdentity | null> {
    if (!db) return null;

    try {
        const docRef = doc(db, 'pigec_identities', pigecId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as StudentIdentity;
        }
        return null;
    } catch (error) {
        console.error('Error buscando identidad:', error);
        return null;
    }
}

/**
 * Busca estudiantes por grupo
 */
export async function findStudentsByGroup(plantel: string, grupo: string): Promise<StudentIdentity[]> {
    if (!db) return [];

    try {
        const q = query(
            collection(db, 'pigec_identities'),
            where('plantel', '==', plantel),
            where('grupo', '==', grupo),
            where('activo', '==', true)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as StudentIdentity);
    } catch (error) {
        console.error('Error buscando estudiantes por grupo:', error);
        return [];
    }
}

/**
 * Genera identidades para todo un grupo desde Academic Tracker
 */
export async function generateGroupIdentities(
    groupInfo: GroupInfo,
    studentNames: string[]
): Promise<{ success: number; failed: number; identities: StudentIdentity[] }> {
    const results = { success: 0, failed: 0, identities: [] as StudentIdentity[] };

    for (const nombre of studentNames) {
        const identity = await registerStudentIdentity(
            groupInfo.plantel,
            groupInfo.name.replace(/[^1-6AB]/g, ''), // Limpiar nombre de grupo
            nombre
        );
        
        if (identity) {
            results.success++;
            results.identities.push(identity);
        } else {
            results.failed++;
        }
    }

    return results;
}

/**
 * Genera credencial PDF para estudiante (datos para el PDF)
 */
export function generateCredentialData(identity: StudentIdentity, cicloEscolar: string) {
    return {
        matricula: identity.pigecId,
        nombre: identity.nombreCompleto,
        plantel: `CBTA ${identity.plantel}`,
        grupo: identity.grupo,
        cicloEscolar,
        qrData: JSON.stringify({
            id: identity.pigecId,
            nombre: identity.nombreCompleto,
            tipo: 'PIGEC-TAMIZAJE'
        }),
        fechaEmision: new Date().toLocaleDateString('es-MX')
    };
}

/**
 * Genera lista de grupo para tutores
 */
export function generateGroupList(
    groupName: string,
    plantel: string,
    identities: StudentIdentity[]
): { titulo: string; headers: string[]; rows: string[][] } {
    return {
        titulo: `Lista de Control - Tamizaje Psicopedagógico\nGrupo: ${groupName} | Plantel: CBTA ${plantel}`,
        headers: ['No.', 'Matrícula PIGEC', 'Nombre del Estudiante', 'Firma de Recepción'],
        rows: identities.map((id, index) => [
            (index + 1).toString(),
            id.pigecId,
            id.nombreCompleto,
            '' // Espacio para firma
        ])
    };
}

// ============================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================

export const PLANTEL_DEFAULT = '245'; // Se puede configurar según el plantel
export const CICLO_ESCOLAR_ACTUAL = '2025-A';

export const NIVELES_SOPORTE = {
    NIVEL_1: {
        nombre: 'Tamizaje Universal',
        descripcion: 'Aplicación masiva a todos los estudiantes',
        herramientas: ['ficha-id', 'phq-9', 'gad-7', 'lira', 'goca', 'neuro-screen'],
        requiereConsentimiento: false
    },
    NIVEL_2: {
        nombre: 'Soporte Selectivo',
        descripcion: 'Evaluación profunda a estudiantes identificados',
        herramientas: ['bdi-ii', 'bai', 'idare', 'hads', 'chte', 'ipa'],
        requiereConsentimiento: false
    },
    NIVEL_3: {
        nombre: 'Soporte Intensivo',
        descripcion: 'Evaluación especializada individual',
        herramientas: ['wisc-v', 'ssi', 'columbia', 'assist', 'bhs'],
        requiereConsentimiento: true
    }
} as const;
