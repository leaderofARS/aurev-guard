# Full Integration - Start All Services

## Quick Start (Copy-Paste into 3 PowerShell Terminals)

### Terminal 1: Orchestrator
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard
python -m uvicorn masumi.orchestrator.app:app --reload --port 8080
```

### Terminal 2: Backend
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\backend
npm start
```

### Terminal 3: Frontend
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\frontend
npm run dev
```

---

## Verify Services are Running

Once all three terminals show "ready/running":

```powershell
# Test Frontend
Invoke-WebRequest -UseBasicParsing http://localhost:5173

# Test Backend
Invoke-WebRequest -UseBasicParsing http://localhost:5000/health

# Test Orchestrator
Invoke-WebRequest -UseBasicParsing http://localhost:8080/masumi/health
```

---

## Test Live Pipeline Integration (Backend → Orchestrator)

```powershell
$body = @{
    walletAddress = "addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl"
    transactionId = "tx_test_12345"
} | ConvertTo-Json

Invoke-WebRequest -UseBasicParsing -Method POST `
    -Uri http://localhost:5000/api/live-pipeline/start `
    -ContentType 'application/json' `
    -Body $body
```

Expected response:
```json
{
  "success": true,
  "jobId": "job_...",
  "walletAddress": "addr_test1...",
  "status": "started",
  "message": "Live pipeline processing started"
}
```

---

## Open Frontend in Browser

Once all services are running, navigate to:
```
http://localhost:5173
```

You should see:
- ✅ Landing page (not blank)
- ✅ "Get Started" and "Open Dashboard" buttons
- ✅ No console errors (press F12 to check)
- ✅ Able to connect wallet, scan address, and view risk assessments

---

## Service Details

| Service | URL | Port | Technology | Status |
|---------|-----|------|-----------|--------|
| Frontend | http://localhost:5173 | 5173 | React + Vite | ✅ Running |
| Backend | http://localhost:5000/health | 5000 | Express.js | ✅ Running |
| Orchestrator | http://localhost:8080/masumi/health | 8080 | FastAPI | ✅ Running |

---

## Troubleshooting

### Port Already in Use
```powershell
# Find and kill process on port
netstat -ano | findstr :<PORT>
taskkill /PID <PID> /F
```

### Orchestrator Won't Start (ImportError)
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard
python -m pip install -r masumi/orchestrator/../requirements.txt
python -m uvicorn masumi.orchestrator.app:app --reload --port 8080
```

### Frontend Blank Page
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\frontend
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run dev
```

### Backend Can't Find Config
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\backend
# Ensure .env exists or uses defaults from config/index.js
npm start
```

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│              React Frontend (Vite)                    │
│           http://localhost:5173                       │
│         - Connect Wallet                              │
│         - Scan Wallet Address                         │
│         - View Risk Assessment                        │
└──────────────────┬─────────────────────────────────────┘
                   │ HTTP/JSON
                   ▼
    ┌──────────────────────────────────────┐
    │    Express Backend (Node.js)         │
    │    http://localhost:5000             │
    │                                      │
    │ Routes:                              │
    │ POST /api/live-pipeline/start        │
    │ GET  /api/live-pipeline/status/:jobId
    │ GET  /api/live-pipeline/results/:addr
    └──────────────┬───────────────────────┘
                   │ HTTP/JSON
                   ▼
        ┌─────────────────────────────┐
        │ FastAPI Orchestrator        │
        │ http://localhost:8080       │
        │                             │
        │ Agents:                     │
        │ - AI Model (predict)        │
        │ - Compliance (score)        │
        │ - Payment (validate)        │
        └─────────────────────────────┘
         │         │         │
         ▼         ▼         ▼
      ┌────┐   ┌────┐   ┌────┐
      │AI  │   │Comp│   │Pay │
      │8083│   │8082│   │8081│
      └────┘   └────┘   └────┘
```

---

## Next Steps

1. ✅ Start all 3 services in separate terminals
2. ✅ Verify health endpoints respond
3. ✅ Open frontend at http://localhost:5173
4. ✅ Connect a wallet (or enter a test address)
5. ✅ Initiate a risk scan
6. ✅ View the assessment results
7. ✅ Confirm orchestrator is being called (check backend terminal logs)

---

## Production Deployment

For production use:
- Use Docker Compose to orchestrate all services
- Set environment-specific `.env` files
- Enable authentication/authorization
- Use a database instead of in-memory job tracking
- Deploy agents to separate, scalable infrastructure
- Add monitoring, logging, and alerting (Datadog, ELK, etc.)
- Use HTTPS/TLS for all communication
- Implement rate limiting and API keys

