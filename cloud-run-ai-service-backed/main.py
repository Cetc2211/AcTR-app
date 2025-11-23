from flask import Flask, request, jsonify
from google.cloud import secretmanager
import google.generativeai as genai
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuración de CORS
@app.after_request
def add_cors_headers(response):
    # En producción, reemplaza '*' con el dominio de tu aplicación Vercel (ej: 'https://tu-app.vercel.app')
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'POST,OPTIONS'
    return response

# --- Función auxiliar para obtener el modelo configurado ---
def get_configured_model(api_key=None):
    """
    Obtiene el modelo de IA configurado.
    Primero intenta usar la clave API proporcionada.
    Si no está disponible, intenta obtenerla desde Secret Manager.
    """
    
    vertex_ai_api_key = api_key
    
    # Si no se proporcionó clave API, intentar obtenerla desde Secret Manager
    if not vertex_ai_api_key:
        project_id = os.environ.get('GCP_PROJECT_ID', 'academic-tracker-qeoxi') 
        secret_id = "vertex-ai-api-key" 
        
        try:
            secret_client = secretmanager.SecretManagerServiceClient()
            secret_name_path = f"projects/{project_id}/secrets/{secret_id}/versions/latest"
            secret_response = secret_client.access_secret_version(request={"name": secret_name_path})
            vertex_ai_api_key = secret_response.payload.data.decode("UTF-8")
        except Exception as e:
            logger.error(f"Error al acceder a Secret Manager para '{secret_id}': {e}")
            logger.info("Se requiere una clave API en la solicitud o estar configurada en Secret Manager.")
            raise Exception("Error de configuración: No se pudo obtener la clave API. Asegúrate de incluir 'api_key' en la solicitud o configura Google Secret Manager.")

    try:
        genai.configure(api_key=vertex_ai_api_key)
        # Usar un modelo estable
        return genai.GenerativeModel('gemini-1.5-pro') 
    except Exception as e:
        logger.error(f"Error al inicializar Vertex AI o cargar el modelo: {e}")
        raise Exception("Error de inicialización de IA.")

# Ruta de verificación de estado (health check)
@app.route('/', methods=['GET'])
def health_check():
    return 'AI Report Service is running!', 200

# Ruta principal para generar informes
@app.route('/generate-report', methods=['POST'])
def generate_report():
    # --- Lógica de validación de entrada ---
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se proporcionaron datos en la solicitud."}), 400
    
    student_name = data.get('student_name')
    grades = data.get('grades') 
    subject = data.get('subject')
    api_key = data.get('api_key')
    
    if not all([student_name, grades, subject]):
        return jsonify({"error": "Datos de entrada incompletos. Se requieren 'student_name', 'grades' y 'subject'."}), 400

    try:
        model = get_configured_model(api_key)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # --- Construir el prompt para la IA ---
    prompt = f"""
    Eres un asistente de evaluación académica para profesores. Tu tarea es generar un informe detallado y constructivo sobre el rendimiento académico de un estudiante.

    **Información del Estudiante:**
    - Nombre: {student_name}
    - Asignatura: {subject}
    - Calificaciones/Evaluaciones: {grades}

    **El informe debe incluir los siguientes apartados:**
    1.  **Resumen General del Rendimiento:** Una visión concisa del desempeño global del estudiante en la asignatura.
    2.  **Puntos Fuertes:** Destaca las áreas donde el estudiante ha demostrado un buen desempeño o habilidades notables.
    3.  **Áreas de Mejora:** Identifica específicamente dónde el estudiante necesita trabajar más, con ejemplos si es posible.
    4.  **Sugerencias para el Estudiante:** Recomendaciones prácticas y accionables que el estudiante puede seguir para mejorar.
    5.  **Sugerencias para el Profesor:** Estrategias o enfoques que el profesor puede implementar para apoyar al estudiante.

    **Formato del Informe:**
    - Utiliza un lenguaje profesional y de apoyo.
    - Estructura el informe con encabezados claros para cada sección.
    - El informe debe ser conciso pero informativo.
    """
    
    # --- Generar el informe con Vertex AI ---
    try:
        response_ia = model.generate_content(prompt)
        report_content = response_ia.text
        return jsonify({"report": report_content}), 200
    except Exception as e:
        logger.error(f"Error al generar contenido con Vertex AI: {e}")
        return jsonify({"error": "Fallo en la generación del informe de IA. Intente de nuevo o revise los datos."}), 500

@app.route('/generate-group-report', methods=['POST'])
def generate_group_report():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se proporcionaron datos."}), 400

    group_name = data.get('group_name')
    partial = data.get('partial')
    stats = data.get('stats') # Expecting a dict with stats
    api_key = data.get('api_key')

    if not all([group_name, partial, stats]):
        return jsonify({"error": "Faltan datos requeridos (group_name, partial, stats)."}), 400

    try:
        model = get_configured_model(api_key)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # --- Prompt para Grupo ---
    prompt = f"""
      Eres un asistente pedagógico experto en análisis de datos académicos.
      Tu tarea es redactar un análisis narrativo profesional y constructivo sobre el rendimiento de un grupo de estudiantes.
      Utiliza un tono formal pero comprensible, enfocado en la mejora continua.

      Aquí están los datos del grupo para el {partial}:
      - Asignatura: {group_name}
      - Total de Estudiantes: {stats.get('totalStudents')}
      - Estudiantes Aprobados: {stats.get('approvedCount')}
      - Estudiantes Reprobados: {stats.get('failedCount')}
      - Calificación Promedio del Grupo: {stats.get('groupAverage')}
      - Tasa de Asistencia General: {stats.get('attendanceRate')}%
      - Estudiantes en Riesgo: {stats.get('atRiskStudentCount')}

      Basado en estos datos, redacta un párrafo de análisis que aborde los siguientes puntos:
      1.  **Análisis General**: Comienza con una visión general del rendimiento del grupo. Menciona el índice de aprobación y la calificación promedio.
      2.  **Asistencia**: Comenta sobre la tasa de asistencia.
      3.  **Áreas de Enfoque**: Identifica las áreas clave que requieren atención (reprobados, riesgo).
      4.  **Recomendaciones**: Ofrece 1 o 2 recomendaciones generales y accionables.
      5.  **Conclusión Positiva**: Termina con una nota alentadora.

      Formato de salida: Un único párrafo de texto. No uses listas ni viñetas.
    """

    try:
        response = model.generate_content(prompt)
        return jsonify({"report": response.text}), 200
    except Exception as e:
        logger.error(f"Error Vertex AI Group: {e}")
        return jsonify({"error": "Error generando reporte de grupo."}), 500


# Iniciar el servidor Flask
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
