# Full Integration Startup Guide
## AUREV Guard - Backend, Frontend, Orchestrator, and AI Model

This guide walks you through starting all services for a complete end-to-end workflow.

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend (Vite)                  │
│                   http://localhost:5173                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────┐
         │   Express Backend (Node.js)           │
         │   http://localhost:3001               │
         │                                       │
         │ Routes:                               │
         │  /scan/address                        │
         │  /risk/wallet                         │
         │  /api/live-pipeline/start             │
         │  /api/live-pipeline/status/:jobId     │
         └─────────────┬──────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │  FastAPI Orchestrator (Python)       │
        │  http://localhost:8080               │
        │                                      │
        │  Coordinates:                        │
        │   - AI Model (8083)                  │
        │   - Compliance Agent (8082)          │
        │   - Payment Agent (8081)             │
        └──────────────────────────────────────┘
         │       │       │
         ▼       ▼       ▼
      ┌────┐ ┌────┐ ┌────┐
      │ AI │ │Comp│ │Pay │
      │    │ │liance
      │    │ │   │ │    │
      └────┘ └────┘ └────┘
```

---

## Prerequisites

1. **Python 3.10+** installed
2. **Node.js 18+** and npm installed
3. **Git** and **PowerShell 5.1+** (Windows)

---

## Step-by-Step Startup

### 1. Start the Orchestrator (FastAPI)

**Terminal 1: Orchestrator**

```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard
python -m uvicorn masumi.orchestrator.app:app --reload --port 8080
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8080
...
✅ Registered 3 agents
```

Verify health:
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8080/masumi/health
# Should return: {"status":"ready","service":"masumi-orchestrator",...}
```

---

### 2. Start the Backend (Express)

**Terminal 2: Backend**

```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\backend
npm install
npm start
```

Expected output:
```
✅ AUREV Guard Backend running on http://localhost:3001
📝 Health check: http://localhost:3001/health
```

Verify health:
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3001/health
# Should return: {"status":"ok",...}
```

---

### 3. Start the Frontend (Vite)

**Terminal 3: Frontend**

```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\frontend
npm install
npm run dev
```

Expected output:
```
✅ dev server running at:
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open in browser:
```
http://localhost:5173
```

---

## Testing the Integration

### Test 1: Frontend Page Loads
```
Open http://localhost:5173 in your browser
Should see: AUREV Guard landing page with "Get Started" buttons
No blank page or console errors
```

### Test 2: Backend Health
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3001/health
```

### Test 3: Orchestrator Health
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8080/masumi/health
```

### Test 4: Live Pipeline (Backend → Orchestrator)
```powershell
$body = @{
    walletAddress = "addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl"
    transactionId = "tx_12345"
} | ConvertTo-Json

Invoke-WebRequest -UseBasicParsing -Method POST `
    -Uri http://localhost:3001/api/live-pipeline/start `
    -ContentType 'application/json' `
    -Body $body
```

Expected response: `{"success":true,"jobId":"job_...",status":"started"}`

---

## Common Issues & Fixes

### Issue: Orchestrator fails to start (ImportError)
**Solution:**
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard
python -m pip install -r masumi/orchestrator/../requirements.txt
python -m uvicorn masumi.orchestrator.app:app --reload --port 8080
```

### Issue: Backend can't connect to Orchestrator
**Solution:** Check `.env` file has:
```
ORCHESTRATOR_URL=http://localhost:8080
```

### Issue: Frontend shows blank page
**Solution:**
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\frontend
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run dev
```

Then open browser console (F12) and check for errors. Share console output in chat.

### Issue: Port already in use
Find and kill the process:
```powershell
# For port 8080 (Orchestrator)
Get-Process | Where-Object { $_.Name -match 'python' } | Stop-Process -Force

# For port 3001 (Backend)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# For port 5173 (Frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## Environment Variables

### Backend (`.env`)
```dotenv
PORT=3001
NODE_ENV=development
ORCHESTRATOR_URL=http://localhost:8080
BLOCKFROST_API_KEY=your_key_here
```

### Orchestrator (no explicit `.env`, reads from `config.yaml`)
- Agent endpoints: payment (8081), compliance (8082), ai_model (8083)
- These are mocked/not running by default; orchestrator just routes

---

## Next Steps

1. **Connect a wallet** in the frontend (Navigate → Connect)
2. **Scan a wallet address** for risk assessment
3. **View risk scores and explanations** (backed by orchestrator)
4. **Generate and anchor proofs** on-chain

---

## Troubleshooting Checklist

- [ ] All 3 terminals are running without errors
- [ ] Backend `/health` endpoint returns 200
- [ ] Orchestrator `/masumi/health` endpoint returns 200
- [ ] Frontend loads at `http://localhost:5173` without blank page
- [ ] Browser console (F12) has no critical errors
- [ ] Can POST to `/api/live-pipeline/start` and get back a `jobId`

If any checks fail, check the terminal output and report the exact error message.

---

## Production Deployment Notes

For production:
1. Use environment-specific `.env` files
2. Enable database persistence (replace in-memory job tracking)
3. Add authentication/authorization
4. Deploy orchestrator agents to separate servers
5. Use a load balancer or API gateway
6. Enable HTTPS/TLS
7. Set up monitoring and logging (ELK stack, Datadog, etc.)

