#!/usr/bin/env powershell
# ============================================
# AUREV Guard - Full Integration Startup
# Launches all 3 services in parallel
# ============================================

Write-Host "🚀 AUREV Guard Full Integration Startup" -ForegroundColor Green
Write-Host "Starting: Orchestrator, Backend, Frontend" -ForegroundColor Green
Write-Host ""

# Check prerequisites
$prereqs = @(
    @{ name = "Python"; cmd = "python --version" },
    @{ name = "Node.js"; cmd = "node --version" },
    @{ name = "npm"; cmd = "npm --version" }
)

Write-Host "📋 Checking Prerequisites..." -ForegroundColor Cyan
foreach ($prereq in $prereqs) {
    try {
        Invoke-Expression $prereq.cmd > $null 2>&1
        Write-Host "✅ $($prereq.name) found" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($prereq.name) NOT found - please install it first" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
$workspace = "C:\Users\Asus\Desktop\hackathon\aurevguard"

# Function to start a service in a new terminal
function Start-Service {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "Starting $Name on port $Port..." -ForegroundColor Cyan
    
    $psCmd = @"
cd '$WorkingDirectory'
$Command
"@
    
    Start-Process powershell -ArgumentList "-NoProfile", "-Command", $psCmd -NoNewWindow
    Start-Sleep -Seconds 2
    Write-Host "✅ $Name started" -ForegroundColor Green
}

# 1. Start Orchestrator
Write-Host ""
Write-Host "=" * 60
Write-Host "1️⃣  Starting Orchestrator (FastAPI)" -ForegroundColor Yellow
Write-Host "=" * 60
Start-Service -Name "Orchestrator" `
    -WorkingDirectory $workspace `
    -Command "python -m uvicorn masumi.orchestrator.app:app --reload --port 8080" `
    -Port 8080

# 2. Start Backend
Write-Host ""
Write-Host "=" * 60
Write-Host "2️⃣  Starting Backend (Express)" -ForegroundColor Yellow
Write-Host "=" * 60
Start-Service -Name "Backend" `
    -WorkingDirectory "$workspace\apps\backend" `
    -Command "npm start" `
    -Port 5000

# 3. Start Frontend
Write-Host ""
Write-Host "=" * 60
Write-Host "3️⃣  Starting Frontend (Vite)" -ForegroundColor Yellow
Write-Host "=" * 60
Start-Service -Name "Frontend" `
    -WorkingDirectory "$workspace\apps\frontend" `
    -Command "npm run dev" `
    -Port 5173

Write-Host ""
Write-Host "=" * 60
Write-Host "✅ All Services Started!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""
Write-Host "📡 Service URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:   http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:    http://localhost:5000/health" -ForegroundColor White
Write-Host "  Orchestrator: http://localhost:8080/masumi/health" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Quick Tests:" -ForegroundColor Cyan
Write-Host '  powershell -Command "Invoke-WebRequest -UseBasicParsing http://localhost:5000/health"' -ForegroundColor White
Write-Host '  powershell -Command "Invoke-WebRequest -UseBasicParsing http://localhost:8080/masumi/health"' -ForegroundColor White
Write-Host ""
Write-Host "📖 Full Documentation:" -ForegroundColor Cyan
Write-Host "  Read: $workspace\FULL_INTEGRATION_STARTUP.md" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Services are running. Press any key in the frontend terminal to open the browser..." -ForegroundColor Yellow
