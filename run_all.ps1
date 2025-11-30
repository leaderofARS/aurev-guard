param(
  [string]$PythonPath = "$($env:USERPROFILE)\anaconda3\python.exe",
  [int]$Port = 8000,
  [switch]$Data,
  [switch]$Train,
  [switch]$Api,
  [switch]$Test,
  [switch]$All
)

Write-Host "== AUREV Guard: Orchestrator ==" -ForegroundColor Cyan
$RepoRoot = (Get-Location).Path

function Run($args) {
  Write-Host "$ $args" -ForegroundColor Gray
  & $PythonPath $args
  if ($LASTEXITCODE -ne 0) { throw "Command failed: $args" }
}

# Default to full pipeline if no flags
if (-not ($Data -or $Train -or $Api -or $Test -or $All)) { $All = $true }
if ($All) { $Data = $true; $Train = $true; $Api = $true; $Test = $true }

# 1) Ensure __init__.py
Write-Host "[1/5] Ensuring package markers"
$initPaths = @(
  "agents/__init__.py",
  "agents/ai_model/__init__.py",
  "agents/ai_model/src/__init__.py",
  "agents/ai_model/src/features/__init__.py",
  "agents/ai_model/src/pipeline/__init__.py",
  "agents/ai_model/src/utils/__init__.py"
)
foreach ($p in $initPaths) {
  $full = Join-Path $RepoRoot $p
  $dir = Split-Path $full
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  if (-not (Test-Path $full)) { New-Item -ItemType File -Path $full | Out-Null; Write-Host "created $p" }
}

# 2) Install deps
Write-Host "[2/5] Installing dependencies"
$reqFile = Join-Path $RepoRoot "agents/ai_model/src/requirements.txt"
if (Test-Path $reqFile) {
  Run "-m pip install -r `"$reqFile`""
} else {
  Run "-m pip install fastapi uvicorn pydantic loguru scikit-learn pandas numpy shap matplotlib joblib requests python-dotenv pyarrow"
}

# 3) Live data
if ($Data) {
  Write-Host "[3/5] Pulling live data (500 blocks, append)"
  Push-Location $RepoRoot
  Run "-m agents.ai_model.src.live_pipeline"
  Pop-Location
}

# 4) Train
if ($Train) {
  Write-Host "[4/5] Training models"
  Push-Location $RepoRoot
  Run "-m agents.ai_model.src.train"
  Pop-Location
}

# 5) API
$proc = $null
if ($Api) {
  Write-Host "[5/5] Starting API on port $Port"
  Push-Location $RepoRoot
  $proc = Start-Process -NoNewWindow -PassThru -FilePath $PythonPath -ArgumentList "-m","uvicorn","agents.ai_model.src.pipeline.api:app","--port",$Port,"--reload"
  Pop-Location
  Start-Sleep -Seconds 2
}

# test
if ($Test) {
  Write-Host "[test] POST /predict"
  try {
    $payload = '{ "tx_count_24h": 12, "total_value_24h": 5000000, "largest_value_24h": 2000000, "std_value_24h": 200000, "unique_counterparts_24h": 15, "entropy_of_destinations": 2.5, "share_of_daily_volume": 0.35, "relative_max_vs_global": 0.8 }'
    $response = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:$Port/predict" -ContentType "application/json" -Body $payload
    Write-Host "API response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
  } catch {
    Write-Host "Could not reach API. Visit http://127.0.0.1:$Port/docs" -ForegroundColor Yellow
  }
}

Write-Host "== Done ==" -ForegroundColor Cyan
if ($proc -ne $null) {
  Write-Host "API running. Press Ctrl+C in its window to stop." -ForegroundColor Cyan
}