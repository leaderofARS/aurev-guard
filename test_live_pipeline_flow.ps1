#!/usr/bin/env pwsh
# test_live_pipeline.ps1
# Test the live pipeline with real Blockfrost data

param(
    [string]$WalletAddress = "",
    [string]$BlockfrostApiKey = ""
)

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔄 LIVE PIPELINE TEST - Fetch from Blockfrost" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Validate/Get Blockfrost API Key
if (-not $BlockfrostApiKey) {
    $BlockfrostApiKey = $env:BLOCKFROST_API_KEY
}

if (-not $BlockfrostApiKey) {
    Write-Host "❌ BLOCKFROST_API_KEY not set!" -ForegroundColor Red
    Write-Host "   Set it with: \$env:BLOCKFROST_API_KEY = 'your_key'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Blockfrost API Key: $($BlockfrostApiKey.Substring(0, 10))..." -ForegroundColor Green
Write-Host ""

# Step 2: Get Wallet Address
if (-not $WalletAddress) {
    Write-Host "Enter a Cardano testnet wallet address (addr_test1...):" -ForegroundColor Yellow
    $WalletAddress = Read-Host "Wallet Address"
}

if (-not $WalletAddress) {
    Write-Host "❌ No wallet address provided" -ForegroundColor Red
    exit 1
}

Write-Host "📍 Wallet Address: $WalletAddress" -ForegroundColor Cyan
Write-Host ""

# Step 3: Validate wallet address format
if ($WalletAddress -match "^addr(1|_test1)[a-zA-Z0-9]{50,}$" -or $WalletAddress.Length -eq 56 -or $WalletAddress.Length -eq 64) {
    Write-Host "✅ Wallet address format valid" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: Wallet address format may be invalid" -ForegroundColor Yellow
    Write-Host "   Expected format: addr_test1... (testnet) or addr1... (mainnet)" -ForegroundColor Gray
}

Write-Host ""

# Step 4: Test Blockfrost Connection
Write-Host "🌐 Testing Blockfrost connection..." -ForegroundColor Yellow
try {
    $headers = @{ "project_id" = $BlockfrostApiKey }
    $response = Invoke-WebRequest `
        -Uri "https://cardano-preview.blockfrost.io/api/v0/blocks/latest" `
        -Headers $headers `
        -TimeoutSec 10
    
    $blockData = $response.Content | ConvertFrom-Json
    Write-Host "✅ Blockfrost connected!" -ForegroundColor Green
    Write-Host "   Latest Block: $($blockData.hash)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to connect to Blockfrost" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Test Backend is Running
Write-Host "🔧 Checking backend service..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 5
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "✅ Backend running on port 5000" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not accessible on port 5000" -ForegroundColor Red
    Write-Host "   Please start: cd apps/backend && npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 6: Start Real Pipeline
Write-Host "⚡ Starting real pipeline with Blockfrost data..." -ForegroundColor Yellow
Write-Host "   (This will take 10-30 seconds)" -ForegroundColor Gray
Write-Host ""

try {
    $body = @{
        walletAddress = $WalletAddress
        transactionId = "test_$(Get-Random)"
    } | ConvertTo-Json

    $startResponse = Invoke-WebRequest `
        -Uri "http://localhost:5000/api/real-pipeline/start" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 10

    $startData = $startResponse.Content | ConvertFrom-Json
    
    if ($startData.success) {
        $jobId = $startData.jobId
        Write-Host "✅ Pipeline started!" -ForegroundColor Green
        Write-Host "   Job ID: $jobId" -ForegroundColor Cyan
        Write-Host "   Status: $($startData.status)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to start pipeline" -ForegroundColor Red
        Write-Host "   Error: $($startData.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Pipeline start failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 7: Poll for Results
Write-Host "📊 Waiting for results (polling every 3 seconds)..." -ForegroundColor Yellow
Write-Host ""

$maxAttempts = 40
$attempt = 0
$completed = $false

while ($attempt -lt $maxAttempts -and -not $completed) {
    Start-Sleep -Seconds 3
    
    try {
        $statusResponse = Invoke-WebRequest `
            -Uri "http://localhost:5000/api/real-pipeline/status/$jobId" `
            -TimeoutSec 5

        $statusData = $statusResponse.Content | ConvertFrom-Json

        Write-Host "[$($attempt + 1)/$maxAttempts] Status: $($statusData.status) | Progress: $($statusData.progress)% | Stage: $($statusData.stage)" -ForegroundColor Cyan

        if ($statusData.status -eq "completed") {
            Write-Host ""
            Write-Host "✅ PIPELINE COMPLETED!" -ForegroundColor Green
            Write-Host ""
            
            if ($statusData.results) {
                Write-Host "📊 Results Summary:" -ForegroundColor Yellow
                $results = $statusData.results
                Write-Host "   Wallet: $($results.wallet_address)" -ForegroundColor Cyan
                Write-Host "   Risk Score: $($results.prediction.risk_score * 100 | [Math]::Round(1))%" -ForegroundColor Cyan
                Write-Host "   Risk Label: $($results.prediction.risk_label)" -ForegroundColor Cyan
                Write-Host "   Anomaly Score: $($results.prediction.anomaly_score | [Math]::Round(3))" -ForegroundColor Cyan
                Write-Host "   Is Anomaly: $($results.prediction.is_anomaly)" -ForegroundColor Cyan
                Write-Host "   Confidence: $($results.prediction.confidence * 100 | [Math]::Round(1))%" -ForegroundColor Cyan
                
                if ($results.blockfrost_data) {
                    Write-Host ""
                    Write-Host "📈 Blockfrost Data:" -ForegroundColor Yellow
                    Write-Host "   Transactions Fetched: $($results.blockfrost_data.transaction_count)" -ForegroundColor Cyan
                }
                
                if ($results.features) {
                    Write-Host ""
                    Write-Host "🔍 Features (8-Dimensional):" -ForegroundColor Yellow
                    Write-Host "   tx_count_24h: $($results.features.tx_count_24h)" -ForegroundColor Cyan
                    Write-Host "   total_value_24h: $($results.features.total_value_24h)" -ForegroundColor Cyan
                    Write-Host "   largest_value_24h: $($results.features.largest_value_24h)" -ForegroundColor Cyan
                    Write-Host "   unique_counterparts_24h: $($results.features.unique_counterparts_24h)" -ForegroundColor Cyan
                }
            }
            
            $completed = $true
            break
        } elseif ($statusData.status -eq "failed") {
            Write-Host ""
            Write-Host "❌ PIPELINE FAILED!" -ForegroundColor Red
            Write-Host "   Error: $($statusData.error)" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "⚠️  Failed to check status: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    $attempt++
}

if (-not $completed) {
    Write-Host ""
    Write-Host "⏱️  Pipeline timeout (exceeded 40 polling attempts, ~2 minutes)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ TEST COMPLETE" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
