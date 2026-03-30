param(
    [switch]$VerboseOutput
)

$ErrorActionPreference = 'SilentlyContinue'

$checks = @(
    @{ Name = 'Web app'; Type = 'port'; Host = '127.0.0.1'; Port = 3010 },
    @{ Name = 'Orchestrator API'; Type = 'port'; Host = '127.0.0.1'; Port = 3011 },
    @{ Name = 'User service'; Type = 'port'; Host = '127.0.0.1'; Port = 3004 },
    @{ Name = 'Document API'; Type = 'port'; Host = '127.0.0.1'; Port = 3001 },
    @{ Name = 'Chat service'; Type = 'port'; Host = '127.0.0.1'; Port = 3003 },
    @{ Name = 'PostgreSQL'; Type = 'port'; Host = '127.0.0.1'; Port = 5432 },
    @{ Name = 'MongoDB'; Type = 'port'; Host = '127.0.0.1'; Port = 27017 },
    @{ Name = 'Weaviate HTTP'; Type = 'port'; Host = '127.0.0.1'; Port = 8088 },
    @{ Name = 'Redis'; Type = 'port'; Host = '127.0.0.1'; Port = 6380 },
    @{ Name = 'RabbitMQ AMQP'; Type = 'port'; Host = '127.0.0.1'; Port = 5672 },
    @{ Name = 'RabbitMQ UI'; Type = 'port'; Host = '127.0.0.1'; Port = 15672 },
    @{ Name = 'MinIO API'; Type = 'port'; Host = '127.0.0.1'; Port = 9000 },
    @{ Name = 'MinIO Console'; Type = 'port'; Host = '127.0.0.1'; Port = 9001 },
    @{ Name = 'SearxNG'; Type = 'port'; Host = '127.0.0.1'; Port = 8080 },
    @{ Name = 'Multi-agent health endpoint'; Type = 'http-get'; Url = 'http://localhost:3011/health' }
)

$ok = 0
$failed = 0
$results = @()

Write-Host '=== System Healthcheck (Full Stack) ===' -ForegroundColor Cyan

foreach ($c in $checks) {
    if ($c.Type -eq 'port') {
        $test = Test-NetConnection -ComputerName $c.Host -Port $c.Port -WarningAction SilentlyContinue
        $isPass = [bool]$test.TcpTestSucceeded
        $detail = if ($isPass) { "listening on $($c.Host):$($c.Port)" } else { "cannot connect to $($c.Host):$($c.Port)" }

        $results += [PSCustomObject]@{
            Check  = $c.Name
            Target = "$($c.Host):$($c.Port)"
            Status = if ($isPass) { 'PASS' } else { 'FAIL' }
            Detail = $detail
        }
    }
    elseif ($c.Type -eq 'http-get') {
        try {
            $resp = Invoke-WebRequest -Uri $c.Url -Method Get -UseBasicParsing -TimeoutSec 4
            $isPass = $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400
            $detail = "HTTP $($resp.StatusCode)"
        }
        catch {
            $isPass = $false
            $detail = $_.Exception.Message
        }

        $results += [PSCustomObject]@{
            Check  = $c.Name
            Target = $c.Url
            Status = if ($isPass) { 'PASS' } else { 'FAIL' }
            Detail = $detail
        }
    }
    elseif ($c.Type -eq 'http-post') {
        try {
            $resp = Invoke-WebRequest -Uri $c.Url -Method Post -Body $c.Body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 4
            $isPass = $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500
            $detail = "HTTP $($resp.StatusCode)"
        }
        catch {
            $isPass = $false
            $detail = $_.Exception.Message
        }

        $results += [PSCustomObject]@{
            Check  = $c.Name
            Target = $c.Url
            Status = if ($isPass) { 'PASS' } else { 'FAIL' }
            Detail = $detail
        }
    }
}

foreach ($r in $results) {
    if ($r.Status -eq 'PASS') {
        $ok++
        Write-Host ("[PASS] {0} -> {1}" -f $r.Check, $r.Target) -ForegroundColor Green
    }
    else {
        $failed++
        Write-Host ("[FAIL] {0} -> {1}" -f $r.Check, $r.Target) -ForegroundColor Red
        if ($VerboseOutput) {
            Write-Host ("       {0}" -f $r.Detail) -ForegroundColor DarkGray
        }
    }
}

Write-Host ''
Write-Host ("Summary: PASS={0}, FAIL={1}, TOTAL={2}" -f $ok, $failed, ($ok + $failed)) -ForegroundColor Yellow

if ($failed -gt 0) {
    Write-Host 'Hint: Start full stack with multi-agent/start-local.ps1 all, then run this script again.' -ForegroundColor Yellow
    exit 1
}

exit 0
