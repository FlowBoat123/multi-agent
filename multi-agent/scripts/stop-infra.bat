@echo off
echo Dung Infrastructure...
cd /d "%~dp0..\microservice"
docker-compose -f docker-compose.local.yaml down
echo Da dung tat ca Infrastructure containers.
