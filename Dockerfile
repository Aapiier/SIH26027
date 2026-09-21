# RailSync AI - Production FastAPI Backend Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend, data, dataset generation code
COPY backend /app/backend
COPY dataset_generation /app/dataset_generation
COPY data /app/data

# Environment
ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

# Run FastAPI server
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
