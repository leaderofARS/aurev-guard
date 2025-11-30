# Test Orchestrator with Real Data

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Testing Orchestrator with Real AI Model Data" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Test 1: Get Configuration
Write-Host "1️⃣  Getting Training Configuration..." -ForegroundColor Yellow
$config = Invoke-WebRequest -Uri "http://127.0.0.1:8080/masumi/training/config" | ConvertFrom-Json
Write-Host "✅ Config loaded`n"

# Test 2: Make Prediction with Real Feature Data
Write-Host "2️⃣  Testing Prediction Endpoint with Real Data..." -ForegroundColor Yellow

$walletAddr = "addr_test1qp23yv7k4kzhd2rntjamkda4q7hdn9qkrf63u9p8ce6fhwdeve3p6rsav4v5mdcz8qzcfenrlwhrs2ffk04ac44ermfq5t8ljx"
$features = @{
    tx_count = 2
    total_received = 14999.819891
    total_sent = 10000.0
    max_tx_size = 10000.0
    avg_tx_size = 3571.4028415714283
    net_balance_change = 4999.819890999999
    unique_counterparties = 2
    tx_per_day = 2.0
    active_days = 1
    burstiness = 37845.0
    collateral_ratio = 0.0
    smart_contract_flag = 0
    high_value_ratio = 0.0
    counterparty_diversity = 1.0
    inflow_outflow_asymmetry = 0.1999942364704774
    timing_entropy = -0.0
    velocity_hours = 0.0
} | ConvertTo-Json

try {
    $predictResponse = Invoke-WebRequest `
        -Uri "http://127.0.0.1:8080/masumi/predict?wallet_address=$walletAddr&include_explanation=true&include_shap=true" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $features `
        -TimeoutSec 10

    $result = $predictResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Prediction received:`n"
    $result | Format-List
    Write-Host "`n"
} catch {
    Write-Host "⚠️  Prediction endpoint error: $_`n"
}

# Test 3: Data Quality Assessment
Write-Host "3️⃣  Testing Data Quality Endpoint..." -ForegroundColor Yellow

$qualityRequest = @{
    record_count = 142
    feature_columns = @(
        "tx_count", "total_received", "total_sent", "max_tx_size",
        "avg_tx_size", "net_balance_change", "unique_counterparties"
    )
} | ConvertTo-Json

try {
    $qualityResponse = Invoke-WebRequest `
        -Uri "http://127.0.0.1:8080/masumi/data/quality" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $qualityRequest `
        -TimeoutSec 10
    
    Write-Host "✅ Data quality assessed:`n"
    $qualityResponse.Content | ConvertFrom-Json | Format-List
    Write-Host "`n"
} catch {
    Write-Host "⚠️  Data quality endpoint error: $_`n"
}

# Test 4: Initialize Training Pipeline
Write-Host "4️⃣  Initializing Training Pipeline..." -ForegroundColor Yellow

$trainingInit = @{
    name = "training-batch-001"
    description = "Training with features from agents/ai_model/data"
    data_source = "agents/ai_model/data"
    record_count = 142
} | ConvertTo-Json

try {
    $trainingResponse = Invoke-WebRequest `
        -Uri "http://127.0.0.1:8080/masumi/training/initialize" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $trainingInit `
        -TimeoutSec 10
    
    $trainResult = $trainingResponse.Content | ConvertFrom-Json
    Write-Host "✅ Training pipeline initialized:`n"
    $trainResult | Format-List
    $pipelineId = $trainResult.pipeline_id
    Write-Host "`n"
} catch {
    Write-Host "⚠️  Training init error: $_`n"
    $pipelineId = $null
}

# Test 5: Get Pipeline Status
if ($pipelineId) {
    Write-Host "5️⃣  Checking Pipeline Status..." -ForegroundColor Yellow
    try {
        $statusResponse = Invoke-WebRequest `
            -Uri "http://127.0.0.1:8080/masumi/training/pipeline/$pipelineId" `
            -TimeoutSec 10
        
        $statusResult = $statusResponse.Content | ConvertFrom-Json
        Write-Host "✅ Pipeline Status:`n"
        $statusResult | Format-List
        Write-Host "`n"
    } catch {
        Write-Host "⚠️  Status check error: $_`n"
    }
}

# Summary
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ ORCHESTRATOR TESTING COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
