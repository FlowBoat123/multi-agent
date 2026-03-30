FROM python:3.10-slim

# Cài gói hệ thống
RUN apt-get update && \
    apt-get install -y build-essential curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/

# Cài pip mới
RUN pip install --upgrade pip

# Cài protobuf trước để tránh bị override
RUN pip install --no-cache-dir protobuf==5.29.0 googleapis-common-protos

# Cài các package còn lại (trừ weaviate-client & protobuf vì đã cài)
RUN pip install --no-cache-dir --compile -r requirements.txt

COPY . /app

ENV PYTHONPATH=/app

CMD ["python", "-m", "src.main"]
