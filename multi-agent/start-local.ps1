<# 
  Script khởi chạy toàn bộ hệ thống Multi-Agent trên máy local (Windows PowerShell)
  Cách dùng: .\start-local.ps1 [infra|services|all|stop]
#>

param(
    [string]$Action = "all"
)

$ErrorActionPreference = "Continue"
$BaseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$MicroserviceDir = Join-Path $BaseDir "microservice"
$RootDir = Split-Path -Parent $BaseDir
$UnifiedCompose = Join-Path $RootDir "docker-compose.unified.yml"
$VenvPython = Join-Path (Split-Path -Parent $BaseDir) ".venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    $VenvPython = "python"
}

function Write-Header($msg) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Start-Infrastructure {
    Write-Header "Khoi dong Infrastructure (Docker)"
    if (-not (Test-Path $UnifiedCompose)) {
        Write-Host "Khong tim thay file compose hop nhat: $UnifiedCompose" -ForegroundColor Red
        return
    }

    Push-Location $RootDir
    docker compose -f docker-compose.unified.yml up -d
    Pop-Location

    Write-Host ""
    Write-Host "Doi RabbitMQ san sang..." -ForegroundColor Yellow
    $maxRetries = 30
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:15672" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "RabbitMQ da san sang!" -ForegroundColor Green
                break
            }
        } catch {}
        Write-Host "  Cho RabbitMQ... ($i/$maxRetries)" -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }

    Write-Host ""
    Write-Host "Infrastructure dang chay:" -ForegroundColor Green
    Write-Host "  MongoDB       : localhost:27017"
    Write-Host "  Weaviate      : localhost:8088"
    Write-Host "  RabbitMQ      : localhost:5672 (Management: http://localhost:15672)"
    Write-Host "  Redis         : localhost:6380"
    Write-Host "  MinIO         : localhost:9000 (Console: http://localhost:9001)"
    Write-Host "  SearxNG       : http://localhost:8080"
}

function Stop-Infrastructure {
    Write-Header "Dung Infrastructure"
    if (-not (Test-Path $UnifiedCompose)) {
        Write-Host "Khong tim thay file compose hop nhat: $UnifiedCompose" -ForegroundColor Red
        return
    }

    Push-Location $RootDir
    docker compose -f docker-compose.unified.yml down
    Pop-Location
}

function Start-NodeService($Name, $Dir, $Port) {
    Write-Host "  Khoi dong $Name (port $Port)..." -ForegroundColor Yellow
    $envFile = Join-Path $Dir ".env"
    if (-not (Test-Path $envFile)) {
        Write-Host "    CANH BAO: Khong tim thay $envFile" -ForegroundColor Red
        return
    }
    
    $job = Start-Job -Name $Name -ScriptBlock {
        param($WorkDir)
        Set-Location $WorkDir
        npm start 2>&1
    } -ArgumentList $Dir
    
    Write-Host "    $Name da khoi dong (Job ID: $($job.Id))" -ForegroundColor Green
}

function Start-PythonService($Name, $Dir, $EntryPoint, $UseSrcModule) {
    Write-Host "  Khoi dong $Name..." -ForegroundColor Yellow
    $envFile = Join-Path $Dir ".env"
    if (-not (Test-Path $envFile)) {
        Write-Host "    CANH BAO: Khong tim thay $envFile" -ForegroundColor Red
        return
    }

    $job = Start-Job -Name $Name -ScriptBlock {
        param($WorkDir, $Entry, $UseModule, $PythonExe)
        Set-Location $WorkDir

        if ($UseModule -and $Entry -eq "src.api") {
            & $PythonExe -m uvicorn src.api:app --host 0.0.0.0 --port 3011 2>&1
            return
        }

        if ($UseModule) {
            & $PythonExe -m $Entry 2>&1
        } else {
            & $PythonExe $Entry 2>&1
        }
    } -ArgumentList $Dir, $EntryPoint, $UseSrcModule, $VenvPython
    
    Write-Host "    $Name da khoi dong (Job ID: $($job.Id))" -ForegroundColor Green
}

function Start-Services {
    Write-Header "Khoi dong Application Services"

    # Node.js services
    Start-NodeService "user-service" (Join-Path $MicroserviceDir "user") 3004
    Start-NodeService "document-api" (Join-Path $MicroserviceDir "document\node-api") 3001
    Start-NodeService "chat-service" (Join-Path $MicroserviceDir "chat") 3003

    # Python services
    Start-PythonService "document-processor" (Join-Path $MicroserviceDir "document\python-processor") "main.py" $false
    Start-PythonService "orchestrator" (Join-Path $MicroserviceDir "orchestrator") "src.main" $true
    Start-PythonService "orchestrator-api" (Join-Path $MicroserviceDir "orchestrator") "src.api" $true

    Write-Host ""
    Write-Host "Tat ca services da duoc khoi dong!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Xem log:     Get-Job | Receive-Job -Name <ten-service>" -ForegroundColor Gray
    Write-Host "Xem trang thai: Get-Job" -ForegroundColor Gray
    Write-Host "Dung tat ca:  .\start-local.ps1 stop" -ForegroundColor Gray
}

function Stop-Services {
    Write-Header "Dung Application Services"
    $serviceNames = @("user-service", "document-api", "chat-service", "document-processor", "orchestrator", "orchestrator-api")
    foreach ($name in $serviceNames) {
        $jobs = Get-Job -Name $name -ErrorAction SilentlyContinue
        if ($jobs) {
            Stop-Job -Name $name -ErrorAction SilentlyContinue
            Remove-Job -Name $name -Force -ErrorAction SilentlyContinue
            Write-Host "  Da dung $name" -ForegroundColor Yellow
        }
    }
    Write-Host "  Tat ca services da dung." -ForegroundColor Green
}

# --- Main ---
switch ($Action.ToLower()) {
    "infra" {
        Start-Infrastructure
    }
    "services" {
        Start-Services
    }
    "all" {
        Start-Infrastructure
        Start-Sleep -Seconds 3
        Start-Services
        Write-Host ""
        Write-Header "He thong da san sang!"
        Write-Host ""
        Write-Host "  API Endpoints:" -ForegroundColor White
        Write-Host "    User Service     : http://localhost:3004/api/v1" 
        Write-Host "    Document Service : http://localhost:3001/api/v1"
        Write-Host "    Chat Service     : http://localhost:3003/api/v1"
        Write-Host ""
        Write-Host "  Management UIs:" -ForegroundColor White
        Write-Host "    RabbitMQ  : http://localhost:15672"
        Write-Host "    MinIO     : http://localhost:9001"
        Write-Host "    Weaviate  : http://localhost:8088"
        Write-Host "    SearxNG   : http://localhost:8080"
        Write-Host ""
    }
    "stop" {
        Stop-Services
        Stop-Infrastructure
    }
    default {
        Write-Host "Cach dung: .\start-local.ps1 [infra|services|all|stop]"
        Write-Host ""
        Write-Host "  infra    - Chi khoi dong infrastructure (MongoDB, RabbitMQ, ...)"
        Write-Host "  services - Chi khoi dong application services"
        Write-Host "  all      - Khoi dong tat ca (mac dinh)"
        Write-Host "  stop     - Dung tat ca"
    }
}
