$port = 5173
Write-Host "🔍 Finding processes on port $port..." -ForegroundColor Cyan
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    foreach ($pid in $processes) {
        Write-Host "  Stopping process $pid..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✅ Old frontend processes stopped" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No frontend process found on port $port" -ForegroundColor Gray
}

Write-Host "🚀 Starting fresh frontend server..." -ForegroundColor Green
cd "C:\Users\Asus\Desktop\hackathon\aurevguard\apps\frontend"
npm run dev
