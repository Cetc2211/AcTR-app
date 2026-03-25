import jsPDF from 'jspdf';
import { TutorStudentView } from './tutor-service';

export class TutorReportService {

  // Sello de IA: Conclusión Sugerida
  static generateAIConclusion(student: TutorStudentView): string {
    const riskCount = (student.riskVariables.dropoutRisk ? 1 : 0) + 
                      (student.riskVariables.failingRisk ? 1 : 0) + 
                      student.riskVariables.clinicalAlerts.length;
    
    if (riskCount === 0) {
        return "El alumno mantiene un desempeño estable. Se sugiere continuar con el monitoreo regular sin intervenciones adicionales por el momento.";
    } else if (student.riskVariables.dropoutRisk) {
        return "ALERTA CRÍTICA: Se identifica un patrón de inasistencia severa. Se recomienda activar el protocolo de retención inmediato y citar a los padres.";
    } else if (student.riskVariables.clinicalAlerts.length > 0) {
        return "SEGUIMIENTO PIGEC: El alumno presenta indicadores clínicos que requieren atención. Es crucial verificar si ya está siendo atendido por el área de psicología.";
    } else {
        return "RIESGO MODERADO: Se observan indicadores de riesgo académico. Se sugiere reforzar el compromiso con el alumno mediante una entrevista motivacional.";
    }
  }

  // Generador PDF Individual
  static generateIndividualReport(student: TutorStudentView) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header Institucional
    doc.setFontSize(18);
    doc.setTextColor(40, 53, 147); // Indigo
    doc.text('CBTa 130 - Reporte de Tutoría Individual', 15, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString()} | Sistema de Alerta Temprana`, 15, 26);
    
    // Línea separadora
    doc.setDrawColor(200);
    doc.line(15, 30, pageWidth - 15, 30);

    // Datos del Alumno
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Alumno: ${student.name}`, 15, 40);
    doc.setFontSize(11);
    doc.text(`Grupo: ${student.groupName} | Email: ${student.email || 'N/A'}`, 15, 46);

    // Gráfica de Asistencia (Barra simple)
    doc.text('Estado de Asistencia:', 15, 60);
    const maxBarWidth = 100;
    const barWidth = (student.absencePercentage / 20) * maxBarWidth; // Escala visual, tope en 20%
    const limitedBarWidth = Math.min(barWidth, maxBarWidth);
    
    // Barra de fondo (gris)
    doc.setFillColor(240, 240, 240);
    doc.rect(60, 56, maxBarWidth, 6, 'F');
    
    // Barra de valor (Verde si bajo riesgo, Rojo si alto)
    if (student.riskVariables.dropoutRisk) {
        doc.setFillColor(220, 38, 38); // Red
    } else {
        doc.setFillColor(22, 163, 74); // Green
    }
    doc.rect(60, 56, limitedBarWidth, 6, 'F');
    doc.text(`${student.absencePercentage.toFixed(1)}% Inasistencias`, 165, 60);

    // Historial PIGEC (Alertas Clínicas)
    doc.setFontSize(12);
    doc.text('Historial de Alertas Clínicas (PIGEC-130)', 15, 80);
    let yPos = 90;
    
    if (student.riskVariables.clinicalAlerts.length > 0) {
        student.riskVariables.clinicalAlerts.forEach((alert) => {
            doc.setFillColor(254, 242, 242); // Light red bg
            doc.rect(15, yPos - 4, pageWidth - 30, 8, 'F');
            doc.setFontSize(10);
            doc.setTextColor(185, 28, 28);
            doc.text(`• ${alert}`, 20, yPos + 1);
            yPos += 10;
        });
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Sin alertas clínicas registradas.', 20, yPos);
        yPos += 10;
    }

    // Intervenciones del Tutor
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Bitácora de Acciones Tutorales', 15, yPos);
    yPos += 8;

    if (student.tutorInterventions && student.tutorInterventions.length > 0) {
        student.tutorInterventions.forEach((int) => {
             doc.setFontSize(10);
             doc.text(`${new Date(int.date).toLocaleDateString()}: ${int.action}`, 20, yPos);
             yPos += 6;
        });
    } else {
         doc.setFontSize(10);
         doc.setTextColor(100);
         doc.text('No se han registrado acciones manuales este semestre.', 20, yPos);
         yPos += 6;
    }
    
    // Sello de IA - Conclusión
    yPos += 15;
    doc.setDrawColor(59, 130, 246); // Blue border
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, pageWidth - 30, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text('Conclusión Sugerida por IA', 20, yPos + 8);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    const conclusion = this.generateAIConclusion(student);
    const splitConclusion = doc.splitTextToSize(conclusion, pageWidth - 40);
    doc.text(splitConclusion, 20, yPos + 16);

    doc.save(`Reporte_Tutoria_${student.name.replace(/\s+/g, '_')}.pdf`);
  }

  // Generador PDF Grupal
  static generateGroupReport(groupName: string, students: TutorStudentView[]) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título
    doc.setFontSize(18);
    doc.text(`Radiografía Grupal - ${groupName}`, 15, 20);
    doc.setFontSize(10);
    doc.text(`CBTa 130 - Fecha: ${new Date().toLocaleDateString()}`, 15, 26);

    // Estadísticas
    const totalStudents = students.length;
    const atRisk = students.filter(s => s.riskVariables.dropoutRisk).length;
    const pigecCases = students.filter(s => s.riskVariables.clinicalAlerts.length > 0).length;

    doc.setFillColor(243, 244, 246);
    doc.rect(15, 35, pageWidth - 30, 25, 'F');
    
    doc.setFontSize(12);
    doc.text('Resumen de Riesgo', 20, 45);
    doc.setFontSize(10);
    doc.text(`Total Alumnos: ${totalStudents}`, 20, 53);
    doc.text(`En Riesgo de Deserción: ${atRisk} (${((atRisk/totalStudents)*100).toFixed(0)}%)`, 80, 53);
    doc.text(`Casos PIGEC: ${pigecCases}`, 150, 53);

    // Tabla de Detalles
    let yPos = 70;
    doc.setFontSize(12);
    doc.text('Detalle de Casos Críticos', 15, yPos);
    yPos += 10;
    
    doc.setFontSize(9);
    doc.setFillColor(229, 231, 235);
    doc.rect(15, yPos - 5, pageWidth - 30, 7, 'F');
    doc.text('Nombre del Alumno', 20, yPos);
    doc.text('Inasistencias', 90, yPos);
    doc.text('Estado PIGEC', 130, yPos);
    yPos += 8;

    students.filter(s => s.riskVariables.dropoutRisk || s.riskVariables.clinicalAlerts.length > 0)
        .forEach(s => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(s.name, 20, yPos);
            
            const riskText = `${s.absencePercentage.toFixed(1)}%`;
            doc.setTextColor(s.riskVariables.dropoutRisk ? 220 : 0, 0, 0); // Red if risk
            doc.text(riskText, 90, yPos);
            doc.setTextColor(0);

            const pigecText = s.riskVariables.clinicalAlerts.length > 0 ? 'ACTIVO' : '-';
            doc.text(pigecText, 130, yPos);
            
            yPos += 7;
        });

    doc.save(`Radiografia_Grupal_${groupName.replace(/\s+/g, '_')}.pdf`);
  }
}
