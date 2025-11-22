# Usa una imagen base oficial de Python.
# python:3.9-slim es una buena opción por su tamaño reducido.
FROM python:3.9-slim

# Establece el directorio de trabajo en el contenedor.
WORKDIR /app

# Copia el archivo de dependencias primero para aprovechar el cache de Docker.
COPY requirements.txt .

# Instala las dependencias.
# Actualizamos pip primero para evitar advertencias y luego instalamos los requerimientos.
# --no-cache-dir reduce el tamaño de la imagen.
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia el resto del código de la aplicación.
COPY . .

# Cloud Run establece la variable de entorno PORT.
# Exponemos el puerto 8080 como un valor por defecto.
EXPOSE 8080

# Define el comando para ejecutar la aplicación con Gunicorn.
# Gunicorn es un servidor WSGI de grado de producción.
# 'main:app' se refiere al objeto 'app' de Flask en el archivo 'main.py'.
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "main:app"]
