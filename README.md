# Multi-Agent RAG System

Hệ thống hỏi đáp tài liệu dựa trên kiến trúc **Multi-Agent** kết hợp **RAG (Retrieval-Augmented Generation)**, sử dụng microservices và LangGraph.

## Kiến trúc tổng quan

```
┌──────────┐
│  Nginx   │  ← API Gateway (port 80)
└────┬─────┘
     │
     ├──────────────────┬──────────────────┐
     ▼                  ▼                  ▼
┌──────────┐     ┌──────────┐      ┌──────────┐
│   User   │     │ Document │      │   Chat   │
│  Service │     │  Service │      │  Service │
│ (Node.js)│     │ (Node.js)│      │ (Node.js)│
│ :3004    │     │ :3001    │      │ :3003    │
└────┬─────┘     └────┬─────┘      └────┬─────┘
     │                │                  │
     │          ┌─────▼──────┐     ┌─────▼──────────┐
     │          │  Document  │     │  Orchestrator   │
     │          │ Processor  │     │  (LangGraph)    │
     │          │ (Python)   │     │  (Python)       │
     │          └─────┬──────┘     └─────┬───────────┘
     │                │                  │
     ▼                ▼                  ▼
┌─────────┐   ┌───────────┐      ┌───────────┐
│ MongoDB │   │ Weaviate  │      │ RabbitMQ  │
│ :27017  │   │  (VectorDB│      │ :5672     │
└─────────┘   │  :8080)   │      └───────────┘
              └───────────┘
```

### Các service chính

| Service | Công nghệ | Mô tả |
|---------|-----------|-------|
| **Nginx** | Nginx | API Gateway, reverse proxy, WebSocket proxy |
| **User** | Node.js / Express 5 | Xác thực (JWT, Google OAuth), quản lý người dùng |
| **Document** | Node.js / Express 5 | CRUD tài liệu, upload file qua MinIO |
| **Document Processor** | Python | Xử lý tài liệu (chunking, embedding), lưu vào Weaviate |
| **Chat** | Node.js / Express 5 + Socket.IO | Quản lý conversation, message, real-time chat |
| **Orchestrator** | Python / LangGraph | Điều phối multi-agent pipeline xử lý câu hỏi |

### Multi-Agent Pipeline (Orchestrator)

Hệ thống sử dụng LangGraph với các agent:

```
START → Receptionist → Analyst → Searcher → Validator → Synthesizer → Summarizer → END
```

- **Receptionist**: Tiếp nhận và phân loại câu hỏi
- **Analyst**: Phân tích câu hỏi, xác định các truy vấn cần tìm kiếm
- **Searcher**: Tìm kiếm tài liệu liên quan từ Weaviate (vector search)
- **Validator**: Kiểm tra chất lượng kết quả tìm kiếm, yêu cầu tìm lại nếu chưa đủ
- **Synthesizer**: Tổng hợp câu trả lời từ context
- **Summarizer**: Tóm tắt/rút gọn câu trả lời

### Infrastructure

| Service | Image | Port |
|---------|-------|------|
| MongoDB | `mongo:latest` | 27017 |
| Weaviate | `semitechnologies/weaviate:latest` | 8080, 50051 |
| RabbitMQ | `rabbitmq:3-management` | 5672, 15672 (management UI) |
| Redis | `redis:alpine` | 6380 |
| MinIO | `minio/minio` | 9000 (API), 9001 (Console) |

---

## Yêu cầu hệ thống

- **Docker** >= 20.10 & **Docker Compose** >= 2.0
- **RAM** >= 8GB (khuyến nghị 16GB do Weaviate + embedding models)
- **Disk** >= 10GB trống
- **DEEPSEEK_API_KEY** — API key từ [DeepSeek](https://platform.deepseek.com/) (bắt buộc cho LLM)

---

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd multi-agent
```

### 2. Tạo file environment

Tạo các file `.env.docker` cho từng service. Các file này **không có sẵn** trong repo, cần tạo thủ công.

#### `microservice/chat/.env.docker`

```env
PORT=3003
SESSION_SECRET=your_session_secret
MONGO_URI=mongodb://admin:Phamquan2004@mongo:27017/chats?authSource=admin
RABBITMQ_URL=amqp://root:Phamquan2004%40@rabbitmq:5672

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=chat
```

#### `microservice/user/.env.docker`

```env
PORT=3004
SESSION_SECRET=your_session_secret
MONGO_URI=mongodb://admin:Phamquan2004@mongo:27017/users?authSource=admin
RABBITMQ_URL=amqp://root:Phamquan2004%40@rabbitmq:5672

# JWT
JWT_SECRET_ACCESS_TOKEN=your_access_token_secret
JWT_ACCESS_TOKEN_EXPIRE=1d
JWT_SECRET_REFRESH_TOKEN=your_refresh_token_secret
JWT_REFRESH_TOKEN_EXPIRE=7d

# Google OAuth (tuỳ chọn)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost/api/v1/auth/google/callback

# Email (tuỳ chọn - dùng cho OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

#### `microservice/document/node-api/.env.docker`

```env
PORT=3001
SESSION_SECRET=your_session_secret
MONGO_URI=mongodb://admin:Phamquan2004@mongo:27017/documents?authSource=admin
RABBITMQ_URL=amqp://root:Phamquan2004%40@rabbitmq:5672

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=document
```

#### `microservice/document/python-processor/.env.docker`

```env
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=root
RABBITMQ_PASSWORD=Phamquan2004@

VECTOR_DB_HOST=vector-db
VECTOR_DB_PORT=8080

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=document

REGEX_SEMANTIC_COLLECTION=Regex_semantic
```

#### `microservice/orchestrator/.env.docker`

```env
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=root
RABBITMQ_PASSWORD=Phamquan2004@

VECTOR_DB_HOST=vector-db
VECTOR_DB_PORT=8080

# LLM - BẮT BUỘC
DEEPSEEK_API_KEY=your_deepseek_api_key

REGEX_SEMANTIC_COLLECTION=Regex_semantic
```

### 3. Khởi chạy hệ thống

```bash
cd microservice
docker-compose up --build -d
```

Lần chạy đầu tiên sẽ mất thời gian build image và tải model embedding.

### 4. Kiểm tra trạng thái

```bash
# Xem tất cả container
docker-compose ps

# Xem log của service cụ thể
docker-compose logs -f orchestrator
docker-compose logs -f chat
docker-compose logs -f document-processor
```

### 5. Truy cập các giao diện quản trị

| Service | URL |
|---------|-----|
| API Gateway | http://localhost |
| RabbitMQ Management | http://localhost:15672 (root / Phamquan2004@) |
| MinIO Console | http://localhost:9001 (minioadmin / minioadmin) |
| Weaviate | http://localhost:8080 |

---

## Sử dụng

### API Endpoints (qua Nginx - port 80)

#### Authentication

```
POST /api/v1/auth/register        # Đăng ký
POST /api/v1/auth/login            # Đăng nhập
POST /api/v1/auth/refresh-token    # Làm mới token
```

#### User

```
GET  /api/v1/user/profile          # Thông tin người dùng
```

#### Document

```
POST /api/v1/document/upload       # Upload tài liệu (PDF, DOCX, ...)
GET  /api/v1/document              # Danh sách tài liệu
DELETE /api/v1/document/:id        # Xoá tài liệu
```

#### Chat / Conversation

```
POST /api/v1/conversation          # Tạo cuộc hội thoại mới
GET  /api/v1/conversation          # Danh sách cuộc hội thoại
GET  /api/v1/message/:conversationId  # Lấy tin nhắn trong cuộc hội thoại
```

#### WebSocket (Socket.IO)

Kết nối real-time qua Socket.IO tại `ws://localhost/socket.io/`.

### Quy trình sử dụng

1. **Đăng ký / Đăng nhập** → Lấy JWT access token
2. **Upload tài liệu** → Hệ thống tự động chunking, embedding và lưu vào Weaviate
3. **Tạo cuộc hội thoại** → Bắt đầu chat
4. **Gửi câu hỏi** → Hệ thống Multi-Agent tự động:
   - Phân tích câu hỏi
   - Tìm kiếm tài liệu liên quan (vector search)
   - Kiểm tra chất lượng kết quả
   - Tổng hợp câu trả lời
   - Trả kết quả qua WebSocket

---

## Evaluation (Đánh giá hệ thống)

Dự án bao gồm bộ công cụ đánh giá chất lượng RAG.

### Cài đặt dependencies đánh giá

```bash
# Tại thư mục gốc (multi-agent/)
pip install -r requirements.txt
```

Dependencies: `langgraph`, `langchain-openai`, `weaviate-client`, `sentence-transformers`, `python-dotenv`, `httpx`, ...

### Tạo file `.env` tại thư mục gốc

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### Chạy test evaluation

```bash
# Chạy test với bộ câu hỏi (mặc định 2 mẫu)
python run_test_evaluation.py
```

Script sẽ:
- Đọc câu hỏi từ `test_set_ver1.json`
- Gửi từng câu hỏi vào hệ thống RAG
- Lưu kết quả vào `results/evaluation_results_<timestamp>.json`

### Đánh giá kết quả

```bash
python evaluate_results.py results/evaluation_results_<timestamp>.json
```

Các metric đánh giá:

| Metric | Mô tả |
|--------|-------|
| **Keyword Overlap** | Tỷ lệ từ khoá trùng khớp giữa expected và actual |
| **Containment** | Kiểm tra expected có nằm trong actual không |
| **Faithfulness** | Câu trả lời có trung thực với context không (LLM-based) |
| **Answer Relevancy** | Câu trả lời có liên quan đến câu hỏi không (LLM-based) |
| **Context Precision** | Chất lượng các đoạn context được retrieve (LLM-based) |
| **Context Recall** | Context có bao phủ đủ thông tin cần thiết không (LLM-based) |
| **Contextual Relevancy** | Mức độ liên quan tổng thể của context (LLM-based) |

Kết quả đánh giá được lưu vào `results/evaluation_results_<timestamp>_evaluated.json`.

---

## Cấu trúc thư mục

```
multi-agent/
├── evaluate_results.py          # Script đánh giá kết quả
├── run_test_evaluation.py       # Script chạy test evaluation
├── test_set_ver1.json           # Bộ test (câu hỏi - đáp án mong đợi)
├── requirements.txt             # Python dependencies cho evaluation
├── results/                     # Kết quả evaluation
│
└── microservice/
    ├── docker-compose.yaml      # Docker Compose - toàn bộ hệ thống
    ├── cors.json                # Cấu hình CORS cho MinIO
    │
    ├── nginx/                   # API Gateway
    │   ├── Dockerfile
    │   └── nginx.conf
    │
    ├── user/                    # User Service (Node.js)
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    │       ├── controllers/     # Route handlers
    │       ├── models/          # Mongoose models
    │       ├── routes/          # Express routes
    │       ├── services/        # Business logic
    │       └── utils/           # DB, JWT, mail, ...
    │
    ├── document/
    │   ├── node-api/            # Document API (Node.js)
    │   │   ├── Dockerfile
    │   │   ├── package.json
    │   │   └── src/
    │   │
    │   └── python-processor/    # Document Processor (Python)
    │       ├── Dockerfile
    │       ├── requirements.txt
    │       ├── handler/         # create/delete document handlers
    │       ├── services/        # Document & search services
    │       └── utils/           # Chunking, vector DB, MinIO, ...
    │
    ├── chat/                    # Chat Service (Node.js + Socket.IO)
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    │       ├── controllers/
    │       ├── models/
    │       ├── workers/         # RabbitMQ publisher/consumer
    │       └── utils/
    │
    ├── orchestrator/            # Multi-Agent Orchestrator (Python/LangGraph)
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── src/
    │       ├── graph.py         # LangGraph workflow definition
    │       ├── agents/          # Các agent: receptionist, analyst, searcher, ...
    │       ├── router.py        # Conditional routing logic
    │       └── utils/           # RabbitMQ, vector DB connections
    │
    └── rag/                     # RAG Service (Python) - standalone
        ├── Dockerfile
        ├── requirements.txt
        ├── handler/             # RAG processing
        └── utils/               # Model, vector DB
```

---

## Dừng / Xoá hệ thống

```bash
cd microservice

# Dừng tất cả container
docker-compose down

# Dừng và xoá volumes (xoá toàn bộ dữ liệu)
docker-compose down -v

# Xoá images đã build
docker-compose down --rmi local
```

---

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| RabbitMQ chưa sẵn sàng | Đợi healthcheck hoàn tất (~30s), kiểm tra `docker-compose logs rabbitmq` |
| Orchestrator lỗi DEEPSEEK_API_KEY | Đảm bảo đã set `DEEPSEEK_API_KEY` trong `orchestrator/.env.docker` |
| Document processor crash | Kiểm tra RAM (cần đủ cho embedding model), xem log `docker-compose logs document-processor` |
| Không kết nối được MongoDB | Kiểm tra `MONGO_URI` có `authSource=admin` và mật khẩu đúng |
| MinIO upload lỗi | Kiểm tra bucket đã được tạo trong MinIO Console (http://localhost:9001) |
| Weaviate timeout | Đợi Weaviate khởi động xong, kiểm tra `http://localhost:8080/v1/.well-known/ready` |
