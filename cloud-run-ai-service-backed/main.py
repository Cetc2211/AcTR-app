import os
import logging
import json
from datetime import datetime
from flask import Flask, request, jsonify
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Force rebuild timestamp: 2025-12-08T04:10:00-gemini-2.5-pro
app = Flask(__name__)

# Initialize critical variables
api_key = None
model = None

try:
    api_key = os.environ.get("GOOGLE_AI_API_KEY")
    
    if not api_key:
        logger.error("⚠️ GOOGLE_AI_API_KEY environment variable is not set!")
        raise Exception("Missing GOOGLE_AI_API_KEY")
    
    # --- CRITICAL: Configure without client_options ---
    # This ensures we use the standard Google AI endpoint, not Vertex AI
    genai.configure(api_key=api_key)
    logger.info("✅ Google Generative AI configured successfully")
    
    # Initialize model with gemini-2.5-pro (latest and most powerful)
    model = genai.GenerativeModel('gemini-2.5-pro')
    logger.info("✅ Gemini 2.5 Pro model initialized with success")
    
except Exception as e:
    logger.error(f"CRITICAL ERROR: Failed to initialize AI model: {e}", flush=True)
    print(f"CRITICAL ERROR: {e}", flush=True)
    # Exit with error to indicate initialization failure
    exit(1)

@app.route('/', methods=['GET'])
def health():
    """Health check endpoint."""
    status = "healthy" if model else "initializing"
    return jsonify({
        "status": status,
        "service": "AcTR-IA-Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.4",
        "model": "gemini-2.5-pro" if model else "not-loaded",
        "api_key_configured": bool(api_key)
    }), 200 if model else 500


def call_generative_api(prompt: str) -> str:
    """Call the Gemini model to generate content."""
    if not model:
        raise Exception("Model not initialized")
    
    try:
        logger.info("🔄 Calling Gemini model with prompt length: " + str(len(prompt)))
        response = model.generate_content(prompt)
        
        if not response or not response.text:
            logger.error("⚠️ Empty response from Gemini model")
            raise Exception("Gemini model returned empty response")
        
        logger.info(f"✅ Gemini response received, length: {len(response.text)}")
        return response.text
    except Exception as e:
        logger.error(f"❌ Error calling Gemini: {e}", exc_info=True)
        raise Exception(f"Model generation failed: {str(e)}")


@app.route('/generate-report', methods=['POST'])
def generate_report():
    """Generic report generation endpoint (alias for /generate-group-report)."""
    return generate_group_report()

@app.route('/generate-group-report', methods=['POST'])
def generate_group_report():
    """Generate an AI analysis for a group's academic performance."""
    try:
        if not model:
            error_msg = "AI model not initialized. Check server logs for startup errors."
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
            
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        group_name = data.get('group_name', 'Unknown Group')
        partial = data.get('partial', 'Unknown Partial')
        stats = data.get('stats', {})
        
        # Build the prompt for Gemini
                prompt = f"""Asume el rol de un Generador de Contenido Académico, cuyo único propósito es crear un **CUERPO DE TEXTO NARRATIVO continuo** para ser insertado en una plantilla de informe preexistente.

DATOS ESTADÍSTICOS DISPONIBLES (SOLO PARA REFERENCIA INTERNA DEL ANÁLISIS, PROHIBIDO REPRODUCIRLOS):
Grupo: {group_name} - Período: {partial}
Total estudiantes: {stats.get('totalStudents', 0)}
Aprobados: {stats.get('approvedCount', 0)} ({stats.get('approvalRate', 0)}%)
Reprobados: {stats.get('failedCount', 0)}
Promedio: {stats.get('groupAverage', 0)}
Asistencia: {stats.get('attendanceRate', 0)}%
En riesgo: {stats.get('atRiskStudentCount', 0)} ({stats.get('atRiskPercentage', 0)}%)

INSTRUCCIONES CRÍTICAS Y PROHIBICIONES (ESTRICTO CUMPLIMIENTO):

1.  **PROHIBICIÓN ABSOLUTA DE METADATOS:** No incluyas NINGÚN elemento de formato de informe como:
    * Títulos de documento (ej: "INFORME DE RENDIMIENTO ACADÉMICO").
    * Listas de destinatarios (ej: "PARA: Dirección...").
    * Firma o despedida (ej: "Atentamente," o frases de agradecimiento).
    * **PROHIBIDO REPRODUCIR LOS DATOS ESTADÍSTICOS DE REFERENCIA en el texto o en una lista.**

2.  **ESTRUCTURA Y FORMATO NARRATIVO:** Genera un único cuerpo de texto que fluya entre dos secciones narrativas, sin títulos ni números de sección. El lenguaje debe ser formal y profesional.

3.  **PROHIBICIÓN DE SÍMBOLOS:** No utilices NINGÚN símbolo para separar o listar ideas: **sin asteriscos (*), sin almohadillas (#), sin guiones (-), sin viñetas, sin números de lista.**

El cuerpo de texto debe cubrir:

* **PARTE 1 (Análisis de Logros y Limitantes):** Un análisis narrativo del rendimiento, logros grupales y la identificación de las limitantes o polarización (usando los datos de riesgo y asistencia como evidencia).
* **PARTE 2 (Acciones Sugeridas):** Párrafos narrativos que incluyan las recomendaciones implícitas dirigidas a Dirección, Subdirección, Orientación/Tutoría y Para el Docente.

El texto debe **comenzar directamente con el análisis** y **terminar inmediatamente después de la última recomendación** para el docente. No añadas nada más.
"""

        
        logger.info(f"Generating report for group: {group_name}, partial: {partial}")
        report_text = call_generative_api(prompt)
        logger.info(f"Report generated successfully, length: {len(report_text) if report_text else 0}")
        
        if not report_text:
            logger.warning("Report generated but is empty!")
            report_text = "No se pudo generar el informe. Por favor intenta de nuevo."
        
        return jsonify({
            "success": True,
            "report": report_text,
            "group": group_name,
            "partial": partial
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating group report: {e}", exc_info=True)
        return jsonify({"error": f"Error al generar informe: {str(e)}"}), 500

@app.route('/generate-student-feedback', methods=['POST'])
def generate_student_feedback():
    """Generate personalized feedback for a student."""
    try:
        if not model:
            error_msg = "AI model not initialized. Check server logs for startup errors."
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
            
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        student_name = data.get('student_name', 'Estudiante')
        subject = data.get('subject', 'Unknown')
        grades = data.get('grades', [])
        attendance = data.get('attendance', 0)
        observations = data.get('observations', '')
        
        grades_summary = ', '.join([str(g) for g in grades]) if grades else 'No disponible'
        
        prompt = f"""Asume el rol de un docente empático y profesional. Tu tarea es redactar una retroalimentación formal y completamente personalizada dirigida directamente a un estudiante.

DATOS DEL ESTUDIANTE:
Nombre: {student_name}
Asignatura: {subject}
Calificaciones: {grades_summary}
Asistencia: {attendance}%
Observaciones del docente: {observations}

INSTRUCCIONES DE FORMATO CRÍTICAS:
El texto debe ser un conjunto de **párrafos narrativos coherentes**.
**PROHIBIDO** el uso de cualquier símbolo de formato (sin asteriscos, sin almohadillas, sin guiones, sin listas numeradas o viñetas).
La redacción debe sonar genuinamente escrita por el docente, no por un sistema de inteligencia artificial.

El informe debe cubrir obligatoriamente las siguientes secciones en una redacción fluida:

1. Reconocimiento de Logros y Esfuerzo
   Identifica lo que el estudiante está haciendo bien. Destaca el esfuerzo y el progreso que has observado en su desempeño durante el período.

2. Áreas de Mejora y su Importancia
   Señala con claridad los aspectos específicos de su desempeño que necesita fortalecer. Explica de manera constructiva por qué mejorar en estas áreas es crucial para su éxito académico en la asignatura.

3. Plan de Acción Detallado
   Proporciona estrategias concretas, realistas y accionables que el estudiante pueda implementar de inmediato. Menciona los recursos específicos disponibles en la institución y sugiere un tiempo realista para que pueda evaluar los primeros resultados.

4. Bitácora, Apoyo y Cierre Motivacional
   Incluye recomendaciones específicas sobre las anotaciones en la bitácora si es aplicable. Si el estudiante ha sido canalizado a atención psicológica, motívale para seguir adelante con el apoyo disponible, siempre de manera respetuosa y no invasiva. Recuérdale que el profesor está disponible para brindarle apoyo continuo y expresa plena confianza en sus capacidades para superar los desafíos.

Redacta la retroalimentación completa, comenzando directamente con el análisis formal y dirigiéndote al estudiante en segunda persona (tú/usted)."""

        
        logger.info(f"Generating feedback for student: {student_name}, subject: {subject}")
        feedback_text = call_generative_api(prompt)
        
        if not feedback_text:
            logger.warning(f"Feedback generated but is empty for student {student_name}!")
            feedback_text = "No se pudo generar la retroalimentación. Por favor intenta de nuevo."
        
        logger.info(f"Feedback generated successfully, length: {len(feedback_text)}")
        
        return jsonify({
            "success": True,
            "feedback": feedback_text,
            "student": student_name,
            "subject": subject
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating student feedback: {e}", exc_info=True)
        return jsonify({"error": f"Error al generar retroalimentación: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8080))
    logger.info(f"🚀 Starting Flask app on port {port}")
    app.run(debug=False, host='0.0.0.0', port=port)
