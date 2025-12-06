import os
import logging
import json
from datetime import datetime
from flask import Flask, request, jsonify

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize Google Generative AI
import google.generativeai as genai

api_key = os.environ.get("GOOGLE_AI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    logger.info("✅ Google Generative AI initialized successfully with API key")
else:
    logger.error("⚠️  GOOGLE_AI_API_KEY environment variable is not set!")

# Initialize model globally
model = None
try:
    if api_key:
        model = genai.GenerativeModel("gemini-1.5-pro")
        logger.info("✅ Gemini 1.5 Pro model initialized")
except Exception as e:
    logger.error(f"⚠️  Error initializing model: {e}")

@app.route('/', methods=['GET'])
def health():
    """Health check endpoint for monitoring and connectivity tests."""
    status = "ready" if model else "initializing"
    return jsonify({
        "status": status,
        "service": "AcTR-IA-Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0",
        "model": "gemini-1.5-pro" if model else "not-loaded",
        "api_key_configured": bool(api_key)
    }), 200

@app.route('/generate-report', methods=['POST'])
def generate_report():
    """Generic report generation endpoint (alias for /generate-group-report)."""
    return generate_group_report()

@app.route('/generate-group-report', methods=['POST'])
def generate_group_report():
    """Generate an AI analysis for a group's academic performance."""
    try:
        if not model:
            logger.error("Model not initialized")
            return jsonify({"error": "Modelo no inicializado. Verifica la clave API."}), 500
            
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
        response = model.generate_content(prompt)
        logger.info(f"Report generated successfully")
        
        return jsonify({
            "success": True,
            "report": response.text,
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
            logger.error("Model not initialized")
            return jsonify({"error": "Modelo no inicializado. Verifica la clave API."}), 500
            
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
        response = model.generate_content(prompt)
        logger.info(f"Feedback generated successfully")
        
        return jsonify({
            "success": True,
            "feedback": response.text,
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
