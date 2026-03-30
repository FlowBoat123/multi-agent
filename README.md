# Agent System - Fullstack + Multi-Agent

Tai lieu nay mo ta tong quan he thong va cach chay duoc toan bo dich vu hien tai tren may local (uu tien Windows PowerShell).

## 1) Tong quan he thong

He thong gom 3 lop chinh:

1. Web app chinh (Next.js)

- Chay o cong 3010
- Xu ly giao dien chat, cai dat model/provider, route request chat

2. Ha tang dung chung (Docker)

- PostgreSQL, MinIO, SearxNG
- MongoDB, Weaviate, Redis, RabbitMQ

3. Cum Multi-Agent (Node.js + Python)

- User Service (3004)
- Document API (3001)
- Chat Service (3003)
- Document Processor (Python)
- Orchestrator worker (Python)
- Orchestrator API (3011) - endpoint ma web app goi khi chat bang model multi-agent

## 2) So do luong chinh

- UI (3010) -> API chat backend
- Neu model la multi-agent-v1 va MULTI\_AGENT\_ENABLED=1:
  - backend route request toi MULTI\_AGENT\_ENDPOINT (mac dinh <http://localhost:3011/chat>)
- Orchestrator API (3011) dieu phoi cac agent va goi cac service lien quan
- RabbitMQ/Redis/Weaviate/MongoDB dung cho queue, cache, retrieval, metadata

## 3) Dieu kien truoc khi chay

- Docker Desktop
- Node.js + pnpm
- Python 3.10+ (khuyen nghi dung .venv trong root)
- Windows PowerShell

## 4) Bien moi truong quan trong

Tai root:

- .env hoac .env.local can co:
  - MULTI\_AGENT\_ENABLED=1
  - MULTI\_AGENT\_ENDPOINT=<http://localhost:3011/chat>

Tai multi-agent:

- multi-agent/microservice/orchestrator/.env
  - DEEPSEEK\_API\_KEY=\<key\_that>
- multi-agent/microservice/rag/.env
  - DEEPSEEK\_API\_KEY=\<key\_that>

Luu y: neu DEEPSEEK\_API\_KEY de gia tri placeholder, mot so luong se loi du orchestrator da chay.

## 5) Cai dat 1 lan (one-time)

### 5.1 Cai dependency root

```powershell
pnpm install
```

### 5.2 Cai dependency cho multi-agent Node services

```powershell
cd multi-agent/microservice/user; npm install
cd ../document/node-api; npm install
cd ../../chat; npm install
cd ../../../..
```

### 5.3 Cai dependency cho Python services (khuyen nghi trong .venv root)

```powershell
# Tu root
.\.venv\Scripts\Activate.ps1

# Document processor
cd multi-agent/microservice/document/python-processor
pip install -r requirements.txt

# Orchestrator
cd ../../orchestrator
pip install -r requirements.txt

# (Tuy chon) RAG service neu ban su dung
cd ../rag
pip install -r requirements.txt

cd ../../../..
```

## 6) Chay toan bo dich vu

Co 2 cach. Khuyen nghi Cach A de gon nhat.

### Cach A - script tong (khuyen nghi)

Terminal 1:

```powershell
cd multi-agent
.\start-local.ps1 all
```

Script se:

- bat docker-compose.unified.yml
- doi RabbitMQ san sang
- bat cac Node/Python service cua multi-agent (bao gom orchestrator API 3011)

Terminal 2:

```powershell
cd ..
pnpm dev
```

Mo web app:

- <http://localhost:3010>

### Cach B - chay thu cong tung phan

1. Bat ha tang:

```powershell
docker compose -f docker-compose.unified.yml up -d --build
```

2. Bat multi-agent services:

```powershell
cd multi-agent
.\start-local.ps1 services
```

3. Bat web app:

```powershell
cd ..
pnpm dev
```

## 7) Kiem tra he thong da san sang

### 7.0 Kiem tra nhanh 1 lenh (khuyen nghi)

```powershell
./scripts/healthcheck-all.ps1
```

Them `-VerboseOutput` de hien chi tiet loi:

```powershell
./scripts/healthcheck-all.ps1 -VerboseOutput
```

### 7.1 Kiem tra container

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Can thay toi thieu: postgres, redis, rabbitmq, mongo, weaviate(vector-db), minio, searxng.

### 7.2 Kiem tra cong 3011 (orchestrator API)

```powershell
Get-NetTCPConnection -LocalPort 3011 -State Listen
```

Neu khong co ket qua, multi-agent chat se khong hoat dong.

### 7.3 Kiem tra health endpoint multi-agent

```powershell
Invoke-WebRequest -Uri "http://localhost:3011/health" -UseBasicParsing
```

Neu endpoint timeout/connection refused: orchestrator-api chua chay hoac loi env/dependency.

## 8) Loi thuong gap va cach xu ly

1. Khong chat duoc bang multi-agent

- Trieu chung: request bi timeout hoac ServiceUnavailable
- Kiem tra:
  - MULTI\_AGENT\_ENABLED=1
  - MULTI\_AGENT\_ENDPOINT dung va truy cap duoc
  - cong 3011 dang listen
- Khac phuc:
  - chay lai multi-agent/start-local.ps1 all
  - xem job log trong cua so chay script

2. pnpm dev fail

- Thu chay lai:
  - pnpm install
  - pnpm dev
- Neu van fail, doc file log dev-server.err.log va dev-3011.err.log de khoanh vung

3. RabbitMQ/Mongo/Redis chua san sang

- Cho them 20-60 giay sau khi docker up
- Kiem tra docker ps
- Thu restart:
  - docker compose -f docker-compose.unified.yml down
  - docker compose -f docker-compose.unified.yml up -d --build

4. Loi key LLM trong orchestrator

- Kiem tra DEEPSEEK\_API\_KEY trong:
  - multi-agent/microservice/orchestrator/.env
  - multi-agent/microservice/rag/.env

## 9) Dung he thong

### Dung multi-agent jobs + infra

```powershell
cd multi-agent
.\start-local.ps1 stop
```

### Hoac dung rieng docker infra

```powershell
docker compose -f docker-compose.unified.yml down
```

## 10) Danh sach cong nhanh

- Web app: 3010
- Orchestrator API: 3011
- User service: 3004
- Document API: 3001
- Chat service: 3003
- PostgreSQL: 5432
- MongoDB: 27017
- Weaviate: 8088 (HTTP), 50051 (gRPC)
- Redis: 6380
- RabbitMQ: 5672, UI 15672
- MinIO: 9000, Console 9001
- SearxNG: 8080

---

## 11) Script ho tro

- scripts/healthcheck-all.ps1: kiem tra tong hop port va endpoint quan trong, tra ve exit code 0 neu pass het.
