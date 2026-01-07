import os
import logging
import json
from datetime import datetime
from flask import Flask, request, jsonify
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Force rebuild timestamp: 2025-12-19T07:30:00-update-prompt
app = Flask(__name__)

# Initialize critical variables
api_key = None
model = None
is_ai_ready = False 

try:
    api_key = os.environ.get("GOOGLE_AI_API_KEY")
    
    if not api_key:
        logger.error("⚠️ GOOGLE_AI_API_KEY environment variable is not set!")
    else:
        # --- CRITICAL: Configure without client_options ---
        genai.configure(api_key=api_key)
        logger.info("✅ Google Generative AI configured successfully")
        
        # --- DIAGNOSTIC: List available models ---
        logger.info("🔍 Listing available models for this API Key (Diagnostic):")
        try:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    logger.info(f"   - {m.name}")
        except Exception as list_err:
            logger.error(f"⚠️ Failed to list models: {list_err}")

        # Switching to gemini-2.5-flash-lite per user request for testing (cost/performance)
        model_name = 'gemini-2.5-flash-lite'
        model = genai.GenerativeModel(model_name)
        logger.info(f"✅ Model initialized: {model_name} (Testing Flash-Lite variant)")
        is_ai_ready = True
    
except Exception as e:
    logger.error(f"CRITICAL ERROR: Failed to initialize AI model: {e}", flush=True)
    print(f"CRITICAL ERROR: {e}", flush=True)

@app.route('/', methods=['GET'])
def health():
    """Health check endpoint."""
    status = "healthy" if is_ai_ready else "initializing"
    return jsonify({
        "status": status,
        "service": "AcTR-IA-Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.12-updated-prompt",
        "model": "gemini-2.5-flash" if is_ai_ready else "not-loaded",
        "api_key_configured": bool(api_key),
        "endpoints": ["/generate-report", "/generate-group-report", "/generate-student-feedback"]
    }), 200 if is_ai_ready else 500

@app.route('/record-attendance', methods=['POST'])
def record_attendance():
    """Records student attendance data."""
    try:
        data = request.get_json()
        if not data:
            logger.error("No data provided for attendance recording.")
            return jsonify({"error": "No data provided"}), 400

        logger.info(f"Received attendance data: {json.dumps(data, indent=2)}")

        return jsonify({"success": True, "message": "Attendance recorded successfully."}), 200

    except Exception as e:
        logger.error(f"Error in /record-attendance: {e}", exc_info=True)
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

def call_generative_api(prompt: str) -> str:
    """Call the Gemini model to generate content."""
    if not is_ai_ready or not model:
        raise Exception("Model not initialized. Check server logs for startup errors.")
    
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
        if not is_ai_ready:
            error_msg = "AI model not initialized. Check server logs for startup errors."
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
            
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        group_name = data.get('group_name', 'Unknown Group')
        partial = data.get('partial', 'Unknown Partial')
        stats = data.get('stats', {})
        
        # Adjusted prompt to include the specific greeting requested by the user
        prompt = f'''Asume el rol de un Generador de Contenido Académico. Tu propósito es crear un **CUERPO DE TEXTO NARRATIVO continuo** para un informe formal.

DATOS ESTADÍSTICOS (REFERENCIA INTERNA):
Grupo: {group_name} - Período: {partial}
Total estudiantes: {stats.get('totalStudents', 0)}
Aprobados: {stats.get('approvedCount', 0)} ({stats.get('approvalRate', 0)}%)
Reprobados: {stats.get('failedCount', 0)}
Promedio: {stats.get('groupAverage', 0)}
Asistencia: {stats.get('attendanceRate', 0)}%
En riesgo: {stats.get('atRiskStudentCount', 0)} ({stats.get('atRiskPercentage', 0)}%)

INSTRUCCIONES DE REDACCIÓN:

1.  **INICIO OBLIGATORIO:** El texto DEBE comenzar EXACTAMENTE con el siguiente párrafo (adaptando el periodo y grupo):
    "Por medio del presente le saludo esperando se encuentre gozando de salud y bienestar. De igual forma, me permito informar sobre los logros obtenidos durante el {partial} del periodo en curso en el grupo {group_name}."

2.  **DESARROLLO (Sin repetir el saludo):**
    *   Continúa inmediatamente con un análisis narrativo de los logros y el rendimiento general. Menciona explícitamente los porcentajes de aprobación y promedio como indicadores de logro.
    *   Identifica limitantes o áreas de oportunidad (reprobación, asistencia, riesgo) de forma constructiva.
    *   Finaliza con párrafos de acciones sugeridas dirigidas a las autoridades educativas y docentes.

3.  **FORMATO:**
    *   Texto continuo en párrafos.
    *   **PROHIBIDO** usar títulos, subtítulos, viñetas, listas o símbolos como asteriscos (*).
    *   Lenguaje formal y profesional.
    *   No agregues despedidas ("Atentamente") ni firmas al final.

Genera el informe completo.'''
        
        logger.info(f"Generating report for group: {group_name}, partial: {partial}")
        report_text = call_generative_api(prompt)

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
        if not is_ai_ready:
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
        
        prompt = f'''Asume el rol de un docente empático y profesional. Tu tarea es redactar una retroalimentación formal y completamente personalizada dirigida directamente a un estudiante.

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
   Señala con claridad qué necesita mejorar. Explica de manera constructiva por qué mejorar en estas áreas es crucial para su éxito académico en la asignatura.

3. Plan de Acción Detallado
   Proporciona estrategias concretas, realistas y accionables que el estudiante pueda implementar de inmediato. Menciona los recursos específicos disponibles en la institución y sugiere un tiempo realista para que pueda evaluar los primeros resultados.

4. Bitácora, Apoyo y Cierre Motivacional
   Incluye recomendaciones específicas sobre las anotaciones en la bitácora si es aplicable. Si el estudiante ha sido canalizado a atención psicológica, motívale para seguir adelante con el apoyo disponible, siempre de manera respetuosa y no invasiva. Recuérdale que el profesor está disponible para brindarle apoyo continuo y expresa plena confianza en sus capacidades para superar los desafíos.

Redacta la retroalimentación completa, comenzando directamente con el análisis formal y dirigiéndote al estudiante en segunda persona (tú/usted).'''

        
        logger.info(f"Generating feedback for student: {student_name}, subject: {subject}")
        feedback_text = call_generative_api(prompt)

        if not feedback_text:
            logger.warning(f"Feedback generated but is empty for student {student_name}!")
            feedback_text = "No se pudo generar la retroalimentación. Por favor intenta de nuevo."
        
        # Log preview of the feedback to confirm content
        preview = feedback_text[:100].replace('\n', ' ') if feedback_text else "EMPTY"
        logger.info(f"📝 Feedback generated (preview): {preview}...")
        
        response_json = {
            "success": True,
            "feedback": feedback_text,
            "student": student_name,
            "subject": subject
        }
        
        return jsonify(response_json), 200
        
    except Exception as e:
        logger.error(f"Error generating student feedback: {e}", exc_info=True)
        return jsonify({"error": f"Error al generar retroalimentación: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 8080))
    logger.info(f"🚀 Starting Flask app on port {port}")
    app.run(debug=False, host='0.0.0.0', port=port)
