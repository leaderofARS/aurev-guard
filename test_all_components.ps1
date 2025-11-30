#!/usr/bin/env powershell
# ============================================
# Comprehensive System Status Check
# Tests: Frontend, Backend, Masumi, AI Agent, Pipelines
# ============================================

Write-Host "🔍 AUREV Guard - Complete System Status Check" -ForegroundColor Cyan
Write-Host ("=" * 70)
Write-Host ""

$allTests = @()
$passed = 0
$failed = 0
$warnings = 0

# Helper function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Body = $null,
        [switch]$ShowResponse = $false
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "  URL: $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            UseBasicParsing = $true
            Uri = $Url
            Method = $Method
            ErrorAction = "Stop"
            TimeoutSec = 5
        }
        
        if ($Body) {
            $params.ContentType = 'application/json'
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            Write-Host "  ✅ PASS (HTTP $($response.StatusCode))" -ForegroundColor Green
            
            if ($ShowResponse) {
                try {
                    $json = $response.Content | ConvertFrom-Json
                    Write-Host "  Response: $($json | ConvertTo-Json -Compress)" -ForegroundColor Gray
                } catch {
                    Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))" -ForegroundColor Gray
                }
            }
            
            return @{ success = $true; response = $response }
        } else {
            Write-Host "  ❌ FAIL (HTTP $($response.StatusCode))" -ForegroundColor Red
            return @{ success = $false; response = $null }
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -like "*connection*" -or $errorMsg -like "*refused*") {
            Write-Host "  ⚠️  SERVICE NOT RUNNING" -ForegroundColor Yellow
            return @{ success = $false; response = $null; warning = $true }
        } else {
            Write-Host "  ❌ FAIL: $errorMsg" -ForegroundColor Red
            return @{ success = $false; response = $null }
        }
    }
}

# ============================================
# 1. FRONTEND TESTS
# ============================================
Write-Host ""
Write-Host ("=" * 70)
Write-Host "1. FRONTEND (React + Vite)" -ForegroundColor Cyan
Write-Host ("=" * 70)

$frontendTest = Test-Endpoint -Name "Frontend Root" -Url "http://localhost:5173"
if ($frontendTest.success) { $passed++ } 
elseif ($frontendTest.warning) { $warnings++; Write-Host "  💡 Start with: cd apps/frontend; npm run dev" -ForegroundColor Yellow }
else { $failed++ }

# ============================================
# 2. BACKEND TESTS
# ============================================
Write-Host ""
Write-Host ("=" * 70)
Write-Host "2. BACKEND (Node.js + Express)" -ForegroundColor Cyan
Write-Host ("=" * 70)

$backendHealth = Test-Endpoint -Name "Backend Health" -Url "http://localhost:5000/health" -ShowResponse
if ($backendHealth.success) { $passed++ } 
elseif ($backendHealth.warning) { $warnings++; Write-Host "  💡 Start with: cd apps/backend; npm start" -ForegroundColor Yellow }
else { $failed++ }

$backendRoot = Test-Endpoint -Name "Backend Root" -Url "http://localhost:5000"
if ($backendRoot.success) { $passed++ } else { $failed++ }

# ============================================
# 3. MASUMI ORCHESTRATOR TESTS
# ============================================
Write-Host ""
Write-Host ("=" * 70)
Write-Host "3. MASUMI ORCHESTRATOR (FastAPI)" -ForegroundColor Cyan
Write-Host ("=" * 70)

$masumiHealth = Test-Endpoint -Name "Masumi Health" -Url "http://localhost:8080/masumi/health" -ShowResponse
if ($masumiHealth.success) { 
    $passed++ 
    try {
        $healthData = $masumiHealth.response.Content | ConvertFrom-Json
        Write-Host "  📊 Agents Registered: $($healthData.agents_registered)" -ForegroundColor Cyan
    } catch {
        # Ignore JSON parsing errors
    }
} 
elseif ($masumiHealth.warning) { 
    $warnings++
    Write-Host "  💡 Start with: python -m uvicorn masumi.orchestrator.app:app --reload --port 8080" -ForegroundColor Yellow
}
else { $failed++ }

$masumiAgents = Test-Endpoint -Name "Masumi Agents List" -Url "http://localhost:8080/masumi/agents" -ShowResponse
if ($masumiAgents.success) { 
    $passed++ 
    try {
        $agentsData = $masumiAgents.response.Content | ConvertFrom-Json
        Write-Host "  📊 Total Agents: $($agentsData.total)" -ForegroundColor Cyan
        foreach ($agent in $agentsData.agents) {
            Write-Host "    - $($agent.name): $($agent.endpoint)" -ForegroundColor Gray
        }
    } catch {
        # Ignore JSON parsing errors
    }
} 
else { $failed++ }

# ============================================
# 4. AI AGENT TESTS (via Masumi)
# ============================================
Write-Host ""
Write-Host ("=" * 70)
Write-Host "4. AI AGENT (via Masumi)" -ForegroundColor Cyan
Write-Host ("=" * 70)

$aiAgentHealth = Test-Endpoint -Name "AI Agent Health (via Masumi)" -Url "http://localhost:8080/masumi/agents/ai_model/health"
if ($aiAgentHealth.success) { 
    $passed++ 
    Write-Host "  ✅ AI Agent is reachable through Masumi" -ForegroundColor Green
} 
elseif ($aiAgentHealth.warning) { 
    $warnings++
    Write-Host "  ⚠️  AI Agent not running or not registered" -ForegroundColor Yellow
    Write-Host "  💡 AI Agent should be on port 8083" -ForegroundColor Yellow
}
else { $failed++ }

# ============================================
# 5. LIVE PIPELINE INTEGRATION TESTS
# ============================================
Write-Host ""
Write-Host ("=" * 70)
Write-Host "5. LIVE PIPELINE INTEGRATION" -ForegroundColor Cyan
Write-Host ("=" * 70)

$pipelineBody = @{
    walletAddress = "addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl"
    transactionId = "tx_test_12345"
}

$pipelineStart = Test-Endpoint -Name "Start Live Pipeline" `
    -Url "http://localhost:5000/api/live-pipeline/start" `
    -Method "POST" `
    -Body $pipelineBody `
    -ShowResponse

if ($pipelineStart.success) {
    $passed++
    
    try {
        $startData = $pipelineStart.response.Content | ConvertFrom-Json
        $jobId = $startData.jobId
        
        Write-Host ""
        Write-Host "  📋 Job ID: $jobId" -ForegroundColor Cyan
        
        # Test status endpoint
        Start-Sleep -Seconds 1
        $statusTest = Test-Endpoint -Name "Get Pipeline Status" `
            -Url "http://localhost:5000/api/live-pipeline/status/$jobId" `
            -ShowResponse
        
        if ($statusTest.success) {
            $passed++
            try {
                $statusData = $statusTest.response.Content | ConvertFrom-Json
                Write-Host "  📊 Status: $($statusData.status), Progress: $($statusData.progress)%" -ForegroundColor Cyan
            } catch {
                # Ignore JSON parsing errors
            }
        } else {
            $failed++
        }
    } catch {
        Write-Host "  ⚠️  Could not parse pipeline response" -ForegroundColor Yellow
        $warnings++
    }
} 
elseif ($pipelineStart.warning) {
    $warnings++
    Write-Host "  ⚠️  Backend not running - cannot test pipeline" -ForegroundColor Yellow
}
else {
    $failed++
}

# ============================================
# 6. MASUMI WORKFLOW TEST
# ============================================
Write-Host ""
Write-Host ("=" * 70)
Write-Host "6. MASUMI WORKFLOW ROUTING" -ForegroundColor Cyan
Write-Host ("=" * 70)

$workflowBody = @{
    workflow = "ai_predict"
    payload = @{
        wallet_address = "addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl"
        features = @{
            tx_count_24h = 45
            total_received = 5000000
            total_sent = 3000000
            unique_counterparties = 12
        }
    }
}

$workflowTest = Test-Endpoint -Name "Masumi Workflow: ai_predict" `
    -Url "http://localhost:8080/masumi/route" `
    -Method "POST" `
    -Body $workflowBody `
    -ShowResponse

if ($workflowTest.success) {
    $passed++
    Write-Host "  ✅ Masumi successfully routed workflow to AI agent" -ForegroundColor Green
    try {
        $workflowData = $workflowTest.response.Content | ConvertFrom-Json
        if ($workflowData.prediction) {
            Write-Host "  📊 Prediction received: Risk Score = $($workflowData.prediction.risk_score)" -ForegroundColor Cyan
        }
    } catch {
        # Ignore JSON parsing errors
    }
} 
elseif ($workflowTest.warning) {
    $warnings++
    Write-Host "  ⚠️  Masumi not running - cannot test workflow" -ForegroundColor Yellow
}
else {
    $failed++
}

# ============================================
# 7. PORT STATUS CHECK
# ============================================
Write-Host ""
Write-Host ("=" * 70)
Write-Host "7. PORT STATUS CHECK" -ForegroundColor Cyan
Write-Host ("=" * 70)

$ports = @(
    @{ Port = 5173; Service = "Frontend" }
    @{ Port = 5000; Service = "Backend" }
    @{ Port = 8080; Service = "Masumi Orchestrator" }
    @{ Port = 8083; Service = "AI Agent" }
)

foreach ($portInfo in $ports) {
    $port = $portInfo.Port
    $service = $portInfo.Service
    
    $listening = netstat -ano | Select-String ":$port " | Select-String "LISTENING"
    
    if ($listening) {
        Write-Host "  ✅ Port $port ($service): LISTENING" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Port $port ($service): NOT LISTENING" -ForegroundColor Red
    }
}

# ============================================
# SUMMARY
# ============================================
Write-Host ""
Write-Host ("=" * 70)
Write-Host "📊 TEST SUMMARY" -ForegroundColor Yellow
Write-Host ("=" * 70)
Write-Host "✅ Passed:  $passed" -ForegroundColor Green
Write-Host "❌ Failed:  $failed" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warnings" -ForegroundColor Yellow
Write-Host "📈 Total:    $($passed + $failed + $warnings)" -ForegroundColor Cyan
Write-Host ""

# ============================================
# RECOMMENDATIONS
# ============================================
if ($failed -gt 0 -or $warnings -gt 0) {
    Write-Host ("=" * 70)
    Write-Host "💡 RECOMMENDATIONS" -ForegroundColor Yellow
    Write-Host ("=" * 70)
    
    if ($warnings -gt 0) {
        Write-Host ""
        Write-Host "To start all services, open 3 PowerShell terminals:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Terminal 1 (Masumi):" -ForegroundColor Yellow
        Write-Host "  cd C:\Users\Asus\Desktop\hackathon\aurevguard" -ForegroundColor Gray
        Write-Host "  python -m uvicorn masumi.orchestrator.app:app --reload --port 8080" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Terminal 2 (Backend):" -ForegroundColor Yellow
        Write-Host "  cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\backend" -ForegroundColor Gray
        Write-Host "  npm start" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Terminal 3 (Frontend):" -ForegroundColor Yellow
        Write-Host "  cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\frontend" -ForegroundColor Gray
        Write-Host "  npm run dev" -ForegroundColor Gray
        Write-Host ""
    }
    
    if ($failed -gt 0) {
        Write-Host "⚠️  Some tests failed. Check the error messages above." -ForegroundColor Red
    }
} else {
    Write-Host "🎉 All Systems Operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Frontend:     http://localhost:5173" -ForegroundColor Green
    Write-Host "✅ Backend:      http://localhost:5000" -ForegroundColor Green
    Write-Host "✅ Masumi:       http://localhost:8080" -ForegroundColor Green
    Write-Host "✅ AI Agent:     http://localhost:8083 (via Masumi)" -ForegroundColor Green
}

Write-Host ""
Write-Host ("=" * 70)

if ($failed -eq 0 -and $warnings -eq 0) {
    exit 0
} elseif ($failed -eq 0) {
    exit 0  # Warnings are OK
} else {
    exit 1
}

