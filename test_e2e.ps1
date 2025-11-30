#!/usr/bin/env pwsh

# End-to-End Test: Backend -> Orchestrator -> AI Pipeline

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AUREV Guard E2E Pipeline Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$walletAddress = "addr1qyznz6p5qf8zh8s23r4j5r8p5r5w5w5w5w5w5w5w5w5w5w5w5w5w"

# Start pipeline
Write-Host "`n1️⃣  Starting pipeline for wallet: $walletAddress" -ForegroundColor Yellow

$bodyObj = @{
    walletAddress = $walletAddress
    transactionId = "txn_test_$(Get-Date -Format 'yyyyMMddHHmmss')"
}
$bodyJson = $bodyObj | ConvertTo-Json

try {
    $startResp = Invoke-WebRequest `
        -Uri 'http://localhost:5000/api/live-pipeline/start' `
        -Method POST `
        -Headers @{ 'Content-Type' = 'application/json' } `
        -Body $bodyJson `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $startData = $startResp.Content | ConvertFrom-Json
    $jobId = $startData.jobId
    Write-Host "✅ Pipeline started successfully" -ForegroundColor Green
    Write-Host "   JobID: $jobId" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to start pipeline: $_" -ForegroundColor Red
    exit 1
}

# Poll status
Write-Host "`n2️⃣  Polling job status..." -ForegroundColor Yellow
$maxWait = 60
$elapsed = 0
$completed = $false

while ($elapsed -lt $maxWait) {
    Start-Sleep -Milliseconds 500
    $elapsed += 0.5
    
    try {
        $statusResp = Invoke-WebRequest `
            -Uri "http://localhost:5000/api/live-pipeline/status/$jobId" `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $statusData = $statusResp.Content | ConvertFrom-Json
        $progress = $statusData.progress
        $status = $statusData.status
        
        Write-Host "   [$($elapsed.ToString('0.0'))s] Progress: $progress% | Status: $status" -ForegroundColor Cyan
        
        if ($status -eq 'completed') {
            Write-Host "`n✅ Pipeline COMPLETED!" -ForegroundColor Green
            Write-Host "`n3️⃣  Results:" -ForegroundColor Yellow
            $statusData.results | ConvertTo-Json -Depth 15 | Write-Output
            $completed = $true
            break
        }
        elseif ($status -eq 'failed') {
            Write-Host "`n❌ Pipeline FAILED: $($statusData.error)" -ForegroundColor Red
            break
        }
    }
    catch {
        Write-Host "   Error polling: $_" -ForegroundColor Red
    }
}

if (-not $completed -and $elapsed -ge $maxWait) {
    Write-Host "`n⏱️  Timeout after $maxWait seconds" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
