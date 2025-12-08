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
        prompt = f"""Eres un docente experimentado escribiendo un informe académico formal. 

DATOS ESTADÍSTICOS DISPONIBLES:
Grupo: {group_name} - Período: {partial}
Total estudiantes: {stats.get('totalStudents', 0)}
Aprobados: {stats.get('approvedCount', 0)} ({stats.get('approvalRate', 0)}%)
Reprobados: {stats.get('failedCount', 0)}
Promedio: {stats.get('groupAverage', 0)}
Asistencia: {stats.get('attendanceRate', 0)}%
En riesgo: {stats.get('atRiskStudentCount', 0)} ({stats.get('atRiskPercentage', 0)}%)

INSTRUCCIONES CRÍTICAS:
Redacta ÚNICAMENTE el análisis académico. NO incluyas:
- Encabezados, introducción o datos de identificación
- Información sobre qué modelo de IA se usó para generar esto
- Explicaciones sobre el proceso de análisis
- Símbolos como asteriscos (*), almohadillas (#), guiones (-) para listas

El informe DEBE contener SOLO estos dos apartados:

LOGROS Y LIMITANTES DEL GRUPO
Describe con profundidad los logros observados (desempeño académico, comprensión, participación) y las limitantes (inasistencias, estudiantes en riesgo, bajo rendimiento). Redacta como el docente escribiendo: reflexivo, directo, sin frases genéricas.

RECOMENDACIONES
Incluye subsecciones breves dirigidas a: Dirección, Subdirección Académica, Orientación y Tutoría, y Para el Docente. Cada recomendación debe ser específica, accionable y basada en los datos.

REQUISITOS DE FORMATO:
- Lenguaje completamente formal y profesional
- NINGÚN símbolo de formato (sin *, sin #, sin -, sin viñetas)
- Párrafos narrativos y coherentes
- Sin listas numeradas
- Sin títulos con símbolos especiales
- Redacción que parezca del docente, no de IA
- Ir directo al análisis, sin introducción

Redacta SOLO el contenido del análisis, nada más."""
        
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
        
        prompt = f"""Eres un docente escribiendo retroalimentación formal y personalizada para un estudiante.

DATOS DEL ESTUDIANTE:
Nombre: {student_name}
Asignatura: {subject}
Calificaciones: {grades_summary}
Asistencia: {attendance}%
Observaciones del docente: {observations}

INSTRUCCIONES:
Redacta una retroalimentación formal que:

1. RECONOCIMIENTO DE LOGROS
   - Identifica específicamente qué está haciendo bien
   - Reconoce el esfuerzo y progreso observado
   
2. ÁREAS DE MEJORA
   - Señala con claridad qué necesita mejorar
   - Explica por qué es importante para su aprendizaje
   
3. PLAN DE ACCIÓN
   - Proporciona estrategias concretas y realizables
   - Indica recursos disponibles en la institución
   - Sugiere tiempo realista para ver resultados

4. CIERRE MOTIVACIONAL
   - Expresa confianza en sus capacidades
   - Motiva sin ser genérico
   - Invita a comunicación y apoyo

ESTILO:
- Lenguaje profesional pero accesible
- SIN asteriscos, NO usar símbolos #
- Dirigida directamente al estudiante
- Empática y constructiva
- Evita ser condescendiente o excesivamente crítica
- Que suene como escrita por el docente, no por IA

Redacta la retroalimentación completa y coherente."""
        
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
