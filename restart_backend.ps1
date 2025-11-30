#!/usr/bin/env powershell
# ============================================
# Restart Backend Server
# Kills existing backend processes and starts fresh
# ============================================

Write-Host "🔄 Restarting Backend Server..." -ForegroundColor Yellow
Write-Host ""

# Find and kill Node processes running on port 5000
Write-Host "🔍 Finding processes on port 5000..." -ForegroundColor Cyan
$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        Write-Host "  Stopping process $pid..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
    Write-Host "✅ Old backend processes stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No backend process found on port 5000" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Starting fresh backend server..." -ForegroundColor Green

# Start backend
$workspace = "C:\Users\Asus\Desktop\hackathon\aurevguard"
$backendPath = "$workspace\apps\backend"

cd $backendPath

Write-Host "📁 Working directory: $backendPath" -ForegroundColor Cyan
Write-Host "🏃 Running: npm start" -ForegroundColor Cyan
Write-Host ""

# Start the backend server
npm start
