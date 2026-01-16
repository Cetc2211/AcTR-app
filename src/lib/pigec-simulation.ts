
import { Student, StudentObservation, PartialId } from '@/lib/placeholder-data';
import { v4 as uuidv4 } from 'uuid';

/**
 * PIGEC-130 Integration Simulation
 * 
 * This file contains logic to simulate the injection of findings from the
 * PIGEC-130 screening platform into the Academic Tracker pedagogical log.
 */

// Simulation Configuration
const TARGET_STUDENT_NAMES = [
  "Ana López",
  "Carlos Ruiz",
  "Diana Garcia" // Assuming these exist in your mock data, we will filter by them
];

// Mock Findings from PIGEC-130 (Normally this comes from an external API)
interface MockFinding {
  studentName: string;
  screeningType: 'GAD-7' | 'NEUROPSI' | 'BDI-2';
  resultCode: 'HIGH_ANXIETY' | 'LOW_ATTENTION' | 'EF_DEFICIT';
  details: string; // The specific technical recommendation to inject
}

const MOCK_FINDINGS: MockFinding[] = [
  {
    studentName: "Ana López",
    screeningType: 'GAD-7',
    resultCode: 'HIGH_ANXIETY',
    details: "Sugerencia: Proporcionar instrucciones por escrito y segmentar tareas complejas para reducir la carga cognitiva."
  },
  {
    studentName: "Carlos Ruiz",
    screeningType: 'NEUROPSI',
    resultCode: 'EF_DEFICIT',
    details: "Sugerencia: Uso de organizadores gráficos y recordatorios visuales para fortalecer la planeación."
  },
  {
     studentName: "Diana Garcia",
     screeningType: 'NEUROPSI',
     resultCode: 'LOW_ATTENTION',
     details: "Sugerencia: Ubicación preferencial al frente del aula y claves gestuales para redirigir la atención durante explicaciones."
  }
];

export const simulatePigecInjection = (
  students: Student[],
  addObservation: (studentId: string, observation: StudentObservation) => void
) => {
  const logs: string[] = [];
  logs.push("--- INICIANDO SIMULACIÓN PIGEC-130 -> ACADEMIC TRACKER ---");

  MOCK_FINDINGS.forEach(finding => {
    // 1. Match Student
    const student = students.find(s => s.name.toLowerCase().includes(finding.studentName.toLowerCase()));
    
    if (student) {
        logs.push(`[ENCONTRADO] Beneficiario: ${student.name}`);
        logs.push(`   > Detectado: ${finding.screeningType} (Protocolo de Privacidad: Activo)`);
        logs.push(`   > Inyectando recomendación pedagógica...`);

        // 2. Create Observation
        const observation: StudentObservation = {
            id: uuidv4(),
            studentId: student.id,
            partialId: 'p1', // Assuming active partial
            date: new Date().toISOString(),
            type: 'Pedagógico', // New type for PIGEC findings
            details: finding.details,
            requiresCanalization: false,
            requiresFollowUp: true,
            followUpUpdates: [],
            isClosed: false
        };

        // 3. Inject
        addObservation(student.id, observation);
        logs.push(`   > [ÉXITO] Bitácora actualizada: "${finding.details}"`);
        logs.push(`   > Alerta de Riesgo: ACTIVADA por vulnerabilidad externa.`);
    } else {
        logs.push(`[ERROR] Estudiante no encontrado: ${finding.studentName}`);
    }
  });

  logs.push("--- SIMULACIÓN COMPLETADA ---");
  return logs;
};
