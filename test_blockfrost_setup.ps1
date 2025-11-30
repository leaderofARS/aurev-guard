#!/usr/bin/env pwsh
# test_blockfrost_setup.ps1
# Tests Blockfrost integration and live pipeline end-to-end

param(
    [string]$BlockfrostApiKey = "",
    [string]$WalletAddress = "",
    [string]$BlockfrostProject = "preview"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🔗 Blockfrost Integration Test Suite" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Validate API Key
Write-Host "📋 Step 1: Validate Blockfrost API Key" -ForegroundColor Yellow
if (-not $BlockfrostApiKey) {
    $BlockfrostApiKey = $env:BLOCKFROST_API_KEY
    if (-not $BlockfrostApiKey) {
        Write-Host "❌ BLOCKFROST_API_KEY not provided and not in environment!" -ForegroundColor Red
        Write-Host "   Usage: .\test_blockfrost_setup.ps1 -BlockfrostApiKey 'your_key' -WalletAddress 'addr_test1...' " -ForegroundColor Gray
        Write-Host ""
        Write-Host "   To get an API key:" -ForegroundColor Cyan
        Write-Host "   1. Visit https://blockfrost.io" -ForegroundColor Cyan
        Write-Host "   2. Create a project for Cardano Preview Testnet" -ForegroundColor Cyan
        Write-Host "   3. Copy the Project ID" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host "✅ API Key: $($BlockfrostApiKey.Substring(0, 10))..." -ForegroundColor Green
Write-Host ""

# Step 2: Test Blockfrost Connection
Write-Host "🌐 Step 2: Test Blockfrost API Connection" -ForegroundColor Yellow
try {
    $headers = @{ "project_id" = $BlockfrostApiKey }
    $response = Invoke-WebRequest `
        -Uri "https://cardano-$BlockfrostProject.blockfrost.io/api/v0/blocks/latest" `
        -Headers $headers `
        -TimeoutSec 10
    
    $blockData = $response.Content | ConvertFrom-Json
    Write-Host "✅ Connected to Blockfrost!" -ForegroundColor Green
    Write-Host "   Latest Block: $($blockData.hash)" -ForegroundColor Cyan
    Write-Host "   Block Height: $($blockData.height)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to connect to Blockfrost:" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Check Backend Service
Write-Host "🔧 Step 3: Check Backend Service" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 5
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "✅ Backend is running on port 5000" -ForegroundColor Green
    Write-Host "   Status: $($healthData.status)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Backend not accessible on port 5000" -ForegroundColor Red
    Write-Host "   Please start backend: cd apps/backend && npm start" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 4: Check Orchestrator Service
Write-Host "🤖 Step 4: Check Orchestrator Service" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 5
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "✅ Orchestrator is running on port 8080" -ForegroundColor Green
    Write-Host "   Status: $($healthData.status)" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  Orchestrator not accessible on port 8080" -ForegroundColor Yellow
    Write-Host "   (optional, but recommended)" -ForegroundColor Gray
}
Write-Host ""

# Step 5: Test Mock Pipeline (No Blockfrost Needed)
Write-Host "🧪 Step 5: Test Mock Pipeline (with mock data)" -ForegroundColor Yellow
try {
    $body = @{
        walletAddress = "addr_test1_mock_test"
        transactionId = "txn_test_$(Get-Random)"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest `
        -Uri "http://localhost:5000/api/live-pipeline/start" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 10
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ Mock pipeline works!" -ForegroundColor Green
    Write-Host "   Job ID: $($data.jobId)" -ForegroundColor Cyan
    Write-Host "   Status: $($data.status)" -ForegroundColor Cyan
    
    # Try to get status
    Start-Sleep -Seconds 2
    $statusResponse = Invoke-WebRequest `
        -Uri "http://localhost:5000/api/live-pipeline/status/$($data.jobId)" `
        -TimeoutSec 10
    
    $statusData = $statusResponse.Content | ConvertFrom-Json
    Write-Host "   Pipeline Status: $($statusData.status)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Mock pipeline failed:" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Step 6: Test Real Pipeline (if wallet provided)
if ($WalletAddress) {
    Write-Host "⚡ Step 6: Test Real Pipeline with Blockfrost Data" -ForegroundColor Yellow
    Write-Host "   Wallet Address: $WalletAddress" -ForegroundColor Cyan
    
    try {
        # Set environment variable for this process
        $env:BLOCKFROST_API_KEY = $BlockfrostApiKey
        $env:BLOCKFROST_PROJECT = $BlockfrostProject
        
        $body = @{
            walletAddress = $WalletAddress
            transactionId = "txn_real_$(Get-Random)"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest `
            -Uri "http://localhost:5000/api/real-pipeline/start" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 30
        
        $data = $response.Content | ConvertFrom-Json
        Write-Host "✅ Real pipeline started!" -ForegroundColor Green
        Write-Host "   Job ID: $($data.jobId)" -ForegroundColor Cyan
        Write-Host "   Wallet: $($data.walletAddress)" -ForegroundColor Cyan
        
        # Poll for results
        Write-Host "   ⏳ Processing... (this may take 10-30 seconds)" -ForegroundColor Gray
        $maxAttempts = 20
        $attempt = 0
        
        while ($attempt -lt $maxAttempts) {
            Start-Sleep -Seconds 2
            $statusResponse = Invoke-WebRequest `
                -Uri "http://localhost:5000/api/real-pipeline/status/$($data.jobId)" `
                -TimeoutSec 10
            
            $statusData = $statusResponse.Content | ConvertFrom-Json
            Write-Host "   Status: $($statusData.status) | Progress: $($statusData.progress)%" -ForegroundColor Cyan
            
            if ($statusData.status -eq "completed") {
                Write-Host "✅ Pipeline completed!" -ForegroundColor Green
                
                # Get results
                $resultsResponse = Invoke-WebRequest `
                    -Uri "http://localhost:5000/api/real-pipeline/results/$WalletAddress" `
                    -TimeoutSec 10
                
                $resultsData = $resultsResponse.Content | ConvertFrom-Json
                Write-Host ""
                Write-Host "📊 Results:" -ForegroundColor Cyan
                Write-Host $($resultsData | ConvertTo-Json -Depth 3) -ForegroundColor White
                break
            } elseif ($statusData.status -eq "error") {
                Write-Host "❌ Pipeline error: $($statusData.error)" -ForegroundColor Red
                break
            }
            
            $attempt++
        }
        
        if ($attempt -eq $maxAttempts) {
            Write-Host "⚠️  Pipeline timeout (> 40 seconds)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Real pipeline failed:" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️  Step 6: Skipped (provide -WalletAddress to test real pipeline)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Test Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set BLOCKFROST_API_KEY in your environment" -ForegroundColor Gray
Write-Host "2. Open http://localhost:5173 in browser" -ForegroundColor Gray
Write-Host "3. Go to Risk page and select 'Live Blockfrost' mode" -ForegroundColor Gray
Write-Host "4. Enter a wallet address and click Analyze" -ForegroundColor Gray
Write-Host ""
