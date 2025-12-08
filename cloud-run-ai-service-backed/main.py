import os
import logging
import json
import sys
import requests
from datetime import datetime
from flask import Flask, request, jsonify

# Configure logging with flush to ensure visibility in Cloud Run logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Force rebuild timestamp: 2025-12-07-03:00-v2.3-fail-loud-init
app = Flask(__name__)

# Initialize critical variables
api_key = None
model_initialized = False

# REST API endpoint for Generative Language API
GENERATIVE_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
MODEL_NAME = "gemini-1.0-pro"  # Using gemini-1.0-pro as per Google recommendations

# ===== CRITICAL: Initialize API key and validate configuration =====
try:
    api_key = os.environ.get("GOOGLE_AI_API_KEY")
    
    if not api_key:
        error_msg = "CRITICAL ERROR: GOOGLE_AI_API_KEY environment variable is not set!"
        print(error_msg, flush=True)
        logger.error(error_msg)
        # Fail loudly on startup if API key is missing
        sys.exit(1)
    
    logger.info("✅ Google AI API key loaded from environment")
    
    # Validate API key format (should start with 'AIza')
    if not api_key.startswith('AIza'):
        error_msg = f"CRITICAL ERROR: Invalid API key format. Expected to start with 'AIza', got: {api_key[:10]}..."
        print(error_msg, flush=True)
        logger.error(error_msg)
        sys.exit(1)
    
    logger.info(f"✅ API key validated. Key prefix: {api_key[:10]}...")
    model_initialized = True
    logger.info("✅ Model initialization check passed. Application ready.")
    
except Exception as e:
    error_msg = f"CRITICAL ERROR: Failed to initialize API configuration: {str(e)}"
    print(error_msg, flush=True)
    logger.error(error_msg, exc_info=True)
    # Force exit to make the error visible in Cloud Run logs
    sys.exit(1)

@app.route('/', methods=['GET'])
def health():
    """Health check endpoint for monitoring and connectivity tests."""
    status = "healthy" if model_initialized else "unhealthy"
    return jsonify({
        "service": "AcTR-IA-Backend",
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.2",
        "model": MODEL_NAME,
        "model_initialized": model_initialized,
        "api_key_configured": bool(api_key),
        "base_url": GENERATIVE_API_BASE
    }), 200 if model_initialized else 500


def call_generative_api(prompt: str, model_name: str = MODEL_NAME) -> str:
    """Call the Generative Language REST API directly.
    
    Args:
        prompt: The prompt text to send to the model
        model_name: The model to use (default: gemini-1.5-flash-latest)
    
    Returns:
        The generated text response
    
    Raises:
        Exception: If the API call fails
    """
    if not api_key:
        raise Exception("API key not configured")
    
    url = f"{GENERATIVE_API_BASE}/{model_name}:generateContent?key={api_key}"
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "topP": 0.9,
            "topK": 40,
            "maxOutputTokens": 2048
        }
    }
    
    try:
        logger.info(f"🔄 Calling API: {url.split('?')[0]}")
        response = requests.post(
            url,
            json=payload,
            timeout=60,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            error_detail = response.text
            logger.error(f"API Error {response.status_code}: {error_detail}")
            raise Exception(f"API error {response.status_code}: {error_detail}")
        
        result = response.json()
        
        # Extract text from response
        if "candidates" in result and len(result["candidates"]) > 0:
            candidate = result["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                parts = candidate["content"]["parts"]
                if len(parts) > 0 and "text" in parts[0]:
                    return parts[0]["text"]
        
        raise Exception("No text in API response")
        
    except requests.RequestException as e:
        logger.error(f"Request error: {e}")
        raise Exception(f"Request failed: {str(e)}")


@app.route('/generate-report', methods=['POST'])
def generate_report():
    """Generic report generation endpoint (alias for /generate-group-report)."""
    return generate_group_report()

@app.route('/generate-group-report', methods=['POST'])
def generate_group_report():
    """Generate an AI analysis for a group's academic performance."""
    try:
        # Fail fast if model not initialized
        if not model_initialized:
            error_msg = "AI model not initialized. Check server logs for startup errors."
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
            
        if not api_key:
            error_msg = "API key not configured"
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

@app.route('/generate-student-feedback', methods=['POST'])
def generate_student_feedback():
    """Generate personalized feedback for a student."""
    try:
        # Fail fast if model not initialized
        if not model_initialized:
            error_msg = "AI model not initialized. Check server logs for startup errors."
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 500
            
        if not api_key:
            error_msg = "API key not configured"
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
