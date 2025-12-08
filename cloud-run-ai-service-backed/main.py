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
        logger.info("🔄 Calling Gemini model")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error calling Gemini: {e}")
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
        prompt = f"""Analiza el siguiente rendimiento académico del grupo y proporciona un análisis detallado:

Grupo: {group_name}
Período: {partial}

Estadísticas:
- Total de estudiantes: {stats.get('totalStudents', 0)}
- Aprobados: {stats.get('approvedCount', 0)}
- Reprobados: {stats.get('failedCount', 0)}
- Promedio del grupo: {stats.get('groupAverage', 0)}
- Asistencia promedio: {stats.get('attendanceRate', 0)}%
- Estudiantes en riesgo: {stats.get('atRiskStudentCount', 0)}

Por favor proporciona:
1. Resumen del desempeño del grupo
2. Fortalezas identificadas
3. Áreas de mejora
4. Recomendaciones específicas para docentes
5. Estrategias para estudiantes en riesgo

Sé conciso pero exhaustivo en tu análisis."""
        
        logger.info(f"Generating report for group: {group_name}, partial: {partial}")
        report_text = call_generative_api(prompt)
        logger.info(f"Report generated successfully")
        
        return jsonify({
            "success": True,
            "report": report_text,
            "group": group_name,
            "partial": partial
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating group report: {e}", exc_info=True)
        return jsonify({"error": f"Error al generar informe: {str(e)}"}), 500
        
        # Build the prompt for Gemini
        prompt = f"""Analiza el siguiente rendimiento académico del grupo y proporciona un análisis detallado:

Grupo: {group_name}
Período: {partial}

Estadísticas:
- Total de estudiantes: {stats.get('totalStudents', 0)}
- Aprobados: {stats.get('approvedCount', 0)}
- Reprobados: {stats.get('failedCount', 0)}
- Promedio del grupo: {stats.get('groupAverage', 0)}
- Asistencia promedio: {stats.get('attendanceRate', 0)}%
- Estudiantes en riesgo: {stats.get('atRiskStudentCount', 0)}

Por favor proporciona:
1. Resumen del desempeño del grupo
2. Fortalezas identificadas
3. Áreas de mejora
4. Recomendaciones específicas para docentes
5. Estrategias para estudiantes en riesgo

Sé conciso pero exhaustivo en tu análisis."""
        
        logger.info(f"Generating report for group: {group_name}, partial: {partial}")
        report_text = call_generative_api(prompt)
        logger.info(f"Report generated successfully")
        
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
        
        prompt = f"""Genera retroalimentación constructiva y motivadora para el siguiente estudiante:

Nombre: {student_name}
Asignatura: {subject}
Calificaciones: {grades_summary}
Asistencia: {attendance}%
Observaciones: {observations}

Por favor proporciona:
1. Reconocimiento de logros
2. Áreas de mejora específicas
3. Estrategias personalizadas para mejorar
4. Motivación y apoyo emocional
5. Pasos concretos a seguir

Sé empático, constructivo y motivador. Adapta el lenguaje para ser comprensible y relevante."""
        
        logger.info(f"Generating feedback for student: {student_name}, subject: {subject}")
        feedback_text = call_generative_api(prompt)
        logger.info(f"Feedback generated successfully")
        
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
