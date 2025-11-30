#!/usr/bin/env powershell
# ============================================
# Integration Test Suite
# Tests Backend <-> Orchestrator <-> Frontend
# ============================================

Write-Host "🧪 AUREV Guard Integration Test Suite" -ForegroundColor Green
Write-Host ""

# Test configuration
$tests = @()
$passed = 0
$failed = 0

# Helper function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Cyan
    Write-Host "  URL: $Url"
    
    try {
        $params = @{
            UseBasicParsing = $true
            Uri = $Url
            Method = $Method
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.ContentType = 'application/json'
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            Write-Host "  ✅ PASS (HTTP $($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ❌ FAIL (HTTP $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "=" * 60
Write-Host "Frontend Tests" -ForegroundColor Yellow
Write-Host "=" * 60

if (Test-Endpoint -Name "Frontend Root" -Url "http://localhost:5173") { $passed++ } else { $failed++ }
Write-Host ""

Write-Host "=" * 60
Write-Host "Backend Tests" -ForegroundColor Yellow
Write-Host "=" * 60

if (Test-Endpoint -Name "Backend Health" -Url "http://localhost:5000/health") { $passed++ } else { $failed++ }
Write-Host ""

if (Test-Endpoint -Name "Backend Root" -Url "http://localhost:5000") { $passed++ } else { $failed++ }
Write-Host ""

Write-Host "=" * 60
Write-Host "Orchestrator Tests" -ForegroundColor Yellow
Write-Host "=" * 60

if (Test-Endpoint -Name "Orchestrator Health" -Url "http://localhost:8080/masumi/health") { $passed++ } else { $failed++ }
Write-Host ""

if (Test-Endpoint -Name "Orchestrator Agents List" -Url "http://localhost:8080/masumi/agents") { $passed++ } else { $failed++ }
Write-Host ""

Write-Host "=" * 60
Write-Host "Live Pipeline Tests" -ForegroundColor Yellow
Write-Host "=" * 60

$pipelineBody = @{
    walletAddress = "addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl"
    transactionId = "tx_test_12345"
}

if (Test-Endpoint -Name "Start Live Pipeline" `
    -Url "http://localhost:5000/api/live-pipeline/start" `
    -Method "POST" `
    -Body $pipelineBody) {
    $passed++
    
    # Extract jobId and test status endpoint
    $startResp = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:5000/api/live-pipeline/start" `
        -Method "POST" `
        -ContentType "application/json" `
        -Body ($pipelineBody | ConvertTo-Json)
    
    $jobId = ($startResp.Content | ConvertFrom-Json).jobId
    
    Write-Host ""
    Write-Host "Testing: Get Pipeline Status" -ForegroundColor Cyan
    Write-Host "  URL: http://localhost:5000/api/live-pipeline/status/$jobId"
    
    $statusResp = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:5000/api/live-pipeline/status/$jobId"
    
    if ($statusResp.StatusCode -eq 200) {
        Write-Host "  ✅ PASS (HTTP $($statusResp.StatusCode))" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ FAIL" -ForegroundColor Red
        $failed++
    }
} else {
    $failed++
}
Write-Host ""

Write-Host "=" * 60
Write-Host "📊 Test Summary" -ForegroundColor Yellow
Write-Host "=" * 60
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host "📈 Total:  $($passed + $failed)" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host ""
    Write-Host "🎉 All Integration Tests Passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "⚠️  Some tests failed. Check the output above." -ForegroundColor Yellow
    exit 1
}
