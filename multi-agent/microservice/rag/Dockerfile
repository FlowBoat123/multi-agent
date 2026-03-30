FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        python3-dev \
        git \
    && rm -rf /var/lib/apt/lists/*

# Cài pip và các công cụ build
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy requirements
COPY requirements.txt .

# Cài numpy trước cho torch
RUN pip install --no-cache-dir numpy && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Cài các thư viện còn lại
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('distiluse-base-multilingual-cased-v2')"

# Copy source
COPY . .

# CMD mặc định
CMD ["python", "main.py"]
