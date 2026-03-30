@echo off
REM ===========================================
REM  Khoi dong tat ca services trong cac tab rieng
REM ===========================================

echo Khoi dong Infrastructure...
call "%~dp0start-infra.bat"

echo.
echo Khoi dong cac Application Services trong terminal rieng...
echo.

timeout /t 5 /nobreak

start "User Service" cmd /k "%~dp0start-user.bat"
start "Document API" cmd /k "%~dp0start-document-api.bat"
start "Document Processor" cmd /k "%~dp0start-document-processor.bat"
start "Chat Service" cmd /k "%~dp0start-chat.bat"
start "Orchestrator" cmd /k "%~dp0start-orchestrator.bat"

echo.
echo ==========================================
echo  Tat ca services da duoc khoi dong!
echo  Moi service chay trong 1 cua so rieng.
echo.
echo  API Endpoints:
echo    User     : http://localhost:3004/api/v1
echo    Document : http://localhost:3001/api/v1
echo    Chat     : http://localhost:3003/api/v1
echo ==========================================
