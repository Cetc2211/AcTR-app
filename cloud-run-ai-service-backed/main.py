import os
import logging
import json
from datetime import datetime
from flask import Flask, request, jsonify
from google.cloud import storage
from google.cloud import secretmanager
from google.cloud.sql.connector import Connector, IPTypes
import sqlalchemy
from sqlalchemy import text
import vertexai
from vertexai.language_models import TextEmbeddingModel
from vertexai.generative_models import GenerativeModel
import pypdf
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# --- Configuration ---
PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "academic-tracker-qeoxi")
REGION = os.environ.get("GCP_REGION", "us-central1")
# Instance connection name format: "project:region:instance"
DB_INSTANCE_CONNECTION_NAME = os.environ.get("DB_INSTANCE_CONNECTION_NAME", "academic-tracker-qeoxi:us-central1:ingestion-academic-db")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_NAME = os.environ.get("DB_NAME", "academic_db") # Adjust if different

# Initialize Clients
storage_client = storage.Client()
secret_client = secretmanager.SecretManagerServiceClient()
connector = Connector()

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=REGION)

### CORRECCIÓN #1: Unificar la fuente de la contraseña
# El código original usaba Secret Manager, pero Cloud Run falló. 
# Estamos forzando el uso de la variable de entorno DB_PASSWORD que pasamos en el gcloud run deploy.

def get_db_password():
    """Retrieve DB password from environment variable."""
    # Retorna la variable de entorno DB_PASSWORD que pasamos en el comando gcloud run deploy
    db_pass = os.environ.get("DB_PASSWORD")
    if not db_pass:
        # Esto lanzará un error FATAL si la contraseña no está en las variables de entorno, 
        # forzando a que se configure en el comando de despliegue.
        logger.error("DB_PASSWORD environment variable is not set.")
        raise ValueError("DB_PASSWORD environment variable is required and missing.")
    return db_pass
    
    # El código de Secret Manager original ha sido deshabilitado/removido para usar solo DB_PASSWORD
    # El error FATAL anterior era causado por esta función: 
    #   db_pass = get_db_password() # Intentaba usar Secret Manager
    #   Luego, si la clave de Secret Manager era incorrecta, fallaba. 
    # Al usar DB_PASSWORD directamente, eliminamos esa capa de fallo.

def get_db_connection():
    """Creates a connection to the Cloud SQL database."""
    # Usamos la nueva función que obtiene la contraseña de la variable de entorno
    db_pass = get_db_password()
    
    def getconn():
        conn = connector.connect(
            DB_INSTANCE_CONNECTION_NAME,
            "pg8000",
            user=DB_USER,
            password=db_pass,
            db=DB_NAME,
            ip_type=IPTypes.PUBLIC  # Use PRIVATE if connected via VPC
        )
        return conn

    pool = sqlalchemy.create_engine(
        "postgresql+pg8000://",
        creator=getconn,
    )
    return pool

# Global DB Pool
try:
    db_pool = get_db_connection()
except (ValueError, Exception) as e:
    # Capturar el error si la contraseña no está seteada antes de init_db
    logger.error(f"Error initializing DB connection pool: {e}")
    # Nota: Si el pool falla aquí, init_db() y las rutas fallarán hasta que se corrija el despliegue.

def init_db():
    """Initializes the database schema if it doesn't exist."""
    # Note: In a real production scenario, use migration tools like Alembic.
    # This is for demonstration/prototype purposes.
    # Solo intentamos la inicialización si el pool se creó exitosamente
    if 'db_pool' not in globals():
         logger.warning("DB Pool not initialized. Skipping schema creation.")
         return

    with db_pool.connect() as conn:
        # Enable pgvector extension
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        
        # Create tables (schema definition remains the same)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255),
                enrollment_date DATE,
                status VARCHAR(50)
            );
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                code VARCHAR(50),
                description TEXT
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255),
                gcs_path VARCHAR(1024),
                uploaded_by VARCHAR(255),
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                student_id INT REFERENCES students(id),
                course_id INT REFERENCES courses(id),
                document_type VARCHAR(50),
                summary TEXT,
                status VARCHAR(50)
            );
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS document_embeddings (
                document_id INT PRIMARY KEY REFERENCES documents(id),
                embedding vector(768), -- 768 dimensions for text-embedding-004
                embedding_model VARCHAR(255)
            );
        """))
        conn.commit()
        logger.info("Database schema initialized.")

# Initialize DB on startup (be careful with concurrency in Cloud Run, usually done in a separate job)
try:
    init_db()
except Exception as e:
    logger.error(f"Failed to initialize DB: {e}")

def extract_text_from_pdf(blob):
    """Extracts text from a PDF blob."""
    try:
        file_bytes = blob.download_as_bytes()
        pdf_file = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_file)
        text_content = ""
        for page in reader.pages:
            text_content += page.extract_text() + "\n"
        return text_content
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return ""

def generate_embeddings(text_content):
    """Generates embeddings using Vertex AI."""
    if not text_content:
        return []
    model = TextEmbeddingModel.from_pretrained("text-embedding-004")
    # Vertex AI embedding models have a token limit. Truncate if necessary.
    # For simplicity, we take the first chunk. In production, chunk the document.
    embeddings = model.get_embeddings([text_content[:8000]]) 
    return embeddings[0].values

def generate_summary(text_content):
    """Generates a summary using Vertex AI."""
    if not text_content:
        return ""
    
    ### CORRECCIÓN #2: Modelo Gemini
    # Se reemplaza el modelo preview por el estable.
    model = GenerativeModel("gemini-1.5-pro") 
    
    prompt = f"Summarize the following academic document in a concise paragraph:\n\n{text_content[:10000]}"
    response = model.generate_content(prompt)
    return response.text

@app.route('/', methods=['GET'])
def health():
    """Health check endpoint for monitoring and connectivity tests."""
    return jsonify({
        "status": "healthy",
        "service": "AcTR-IA-Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0"
    }), 200

@app.route('/', methods=['POST'])
def ingest_event():
    """
    Cloud Run service endpoint triggered by Cloud Storage events (via Eventarc).
    """
    try:
        # CloudEvents format
        event = request.get_json()
        if not event:
            return "No event received", 400

        logger.info(f"Received event: {event}")
        
        # ... [El resto de la lógica de evento permanece igual] ...
        
        # Handle different event formats (Direct GCS trigger vs Eventarc)
        # Eventarc usually wraps the GCS event in the body
        if 'bucket' in event: # Direct GCS notification
            bucket_name = event['bucket']
            file_name = event['name']
        elif 'message' in event and 'data' in event['message']: # Pub/Sub
             import base64
             data = json.loads(base64.b64decode(event['message']['data']).decode('utf-8'))
             bucket_name = data['bucket']
             file_name = data['name']
        else:
            # Fallback/Assumption for Eventarc payload structure
            bucket_name = event.get('bucket')
            file_name = event.get('name')

        if not bucket_name or not file_name:
             return "Invalid event data", 400

        logger.info(f"Processing file: {file_name} from {bucket_name}")

        # 1. Read File
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_name)
        
        # Determine file type and extract text
        text_content = ""
        doc_type = "unknown"
        
        if file_name.lower().endswith('.pdf'):
            text_content = extract_text_from_pdf(blob)
            doc_type = "pdf"
        elif file_name.lower().endswith('.txt'):
            text_content = blob.download_as_text()
            doc_type = "text"
        else:
            logger.warning(f"Unsupported file type for text extraction: {file_name}")
            # Still record the file existence
        
        # 2. Process with Vertex AI
        embedding_vector = []
        summary_text = ""
        
        if text_content:
            try:
                embedding_vector = generate_embeddings(text_content)
                summary_text = generate_summary(text_content)
            except Exception as e:
                logger.error(f"Vertex AI processing failed: {e}")

        # 3. Store in Cloud SQL
        # Se requiere la conexión a DB aquí. Si falla, el log lo indicará.
        with db_pool.connect() as conn:
            # Insert Document Metadata
            
            result = conn.execute(text("""
                INSERT INTO documents (filename, gcs_path, document_type, summary, status)
                VALUES (:filename, :gcs_path, :dtype, :summary, :status)
                RETURNING id
            """), {
                "filename": file_name,
                "gcs_path": f"gs://{bucket_name}/{file_name}",
                "dtype": doc_type,
                "summary": summary_text,
                "status": "processed"
            })
            doc_id = result.scalar()
            
            # Insert Embeddings
            if embedding_vector:
                conn.execute(text("""
                    INSERT INTO document_embeddings (document_id, embedding, embedding_model)
                    VALUES (:doc_id, :embedding, :model)
                """), {
                    "doc_id": doc_id,
                    "embedding": str(embedding_vector), # pgvector expects string representation or list
                    "model": "text-embedding-004"
                })
            
            conn.commit()

        return jsonify({"status": "success", "message": f"Processed {file_name}"}), 200

    except Exception as e:
        logger.error(f"Error processing event: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Usa un puerto variable de entorno si está disponible
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
