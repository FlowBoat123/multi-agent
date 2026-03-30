@echo off
REM ===========================================
REM  Khoi dong Infrastructure (Docker containers)
REM ===========================================
echo [INFRA] Khoi dong MongoDB, Weaviate, RabbitMQ, Redis, MinIO...
cd /d "%~dp0microservice"
docker-compose -f docker-compose.local.yaml up -d
echo.
echo [INFRA] Doi RabbitMQ san sang...
:wait_rabbitmq
timeout /t 3 /nobreak >nul
curl -s http://localhost:15672 >nul 2>&1
if %errorlevel% neq 0 (
    echo   Cho RabbitMQ...
    goto wait_rabbitmq
)
echo [INFRA] RabbitMQ da san sang!
echo.
echo ==========================================
echo  Infrastructure dang chay:
echo   MongoDB       : localhost:27017
echo   Weaviate      : localhost:8080
echo   RabbitMQ      : localhost:5672
echo   RabbitMQ UI   : http://localhost:15672
echo   Redis         : localhost:6380
echo   MinIO API     : localhost:9000
echo   MinIO Console : http://localhost:9001
echo ==========================================
