# Usa una imagen base oficial de Python.
FROM python:3.9-slim

# Instala dependencias del sistema necesarias para google-cloud-aiplatform
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo en el contenedor.
WORKDIR /app

# Copia el archivo de dependencias primero para aprovechar el cache de Docker.
COPY requirements.txt .

# Instala las dependencias de Python.
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de la aplicación.
COPY . .

# Cloud Run establece la variable de entorno PORT.
EXPOSE 8080

# Comando para ejecutar la aplicación con Gunicorn.
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--timeout", "120", "main:app"]
