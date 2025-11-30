# AUREV Guard - Fully Integrated System 🚀

> **Status**: ✅ **READY TO RUN** — All Backend, Frontend, Orchestrator, and AI components are integrated and tested.

---

## 📖 Documentation

Start with **one of these**:

### 🎯 **I want to RUN the system RIGHT NOW**
→ Open **[`INTEGRATION_QUICK_START.md`](./INTEGRATION_QUICK_START.md)**
- Copy-paste 3 commands into 3 PowerShell terminals
- Takes 2 minutes to have everything running

### 📚 **I want the FULL DETAILED GUIDE**
→ Open **[`FULL_INTEGRATION_STARTUP.md`](./FULL_INTEGRATION_STARTUP.md)**
- Architecture diagrams
- Step-by-step setup
- Troubleshooting for every scenario
- Environment variables explained

### ✅ **I want to see what's INTEGRATED**
→ Open **[`INTEGRATION_COMPLETE.md`](./INTEGRATION_COMPLETE.md)**
- What components are working together
- Integration points verified
- Configuration details
- Production checklist

---

## 🚀 Quick Start (30 seconds)

### Open 3 PowerShell Terminals

**Terminal 1 - Orchestrator:**
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard
python -m uvicorn masumi.orchestrator.app:app --reload --port 8080
```

**Terminal 2 - Backend:**
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\backend
npm start
```

**Terminal 3 - Frontend:**
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\frontend
npm run dev
```

### Open Browser
```
http://localhost:5173
```

That's it! 🎉

---

## 📊 System Architecture

```
FRONTEND (React/Vite)                 BACKEND (Express)               ORCHESTRATOR (FastAPI)
http://localhost:5173                 http://localhost:5000           http://localhost:8080
                                                                              
   [Landing Page]                        [Health]                        [Health]
   [Connect Wallet]     ←→ [Live Pipeline] ←→ [Route Request]
   [Risk Check]         ←→ [/scan/address] ←→ [AI Model + Agents]
   [View Results]       ←→ [/risk/wallet]  ←→ [Response]
```

---

## ✨ What Works

| Feature | Status | Details |
|---------|--------|---------|
| Frontend loads | ✅ | React app at localhost:5173 |
| Backend API | ✅ | Express running on port 5000 |
| Orchestrator | ✅ | FastAPI with 3 registered agents |
| Live Pipeline | ✅ | Backend ↔ Orchestrator communication |
| AI Model | ✅ | Models loaded, predictions working |
| Error Handling | ✅ | ErrorBoundary catches render errors |
| Wallet Connection | ✅ | CIP-30 wallet support |
| Risk Assessment | ✅ | Powered by AI orchestrator |

---

## 🔧 Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Orchestrator**: FastAPI + Python
- **AI**: scikit-learn + SHAP explanations
- **Database**: In-memory (dev) / Postgres (production ready)
- **Blockchain**: Cardano (Blockfrost integration)

---

## 📁 Project Structure

```
aurevguard/
├── apps/
│   ├── backend/                    ← Express server (port 5000)
│   │   └── src/
│   │       ├── routes/             ← Live pipeline routes
│   │       ├── controllers/        ← Business logic
│   │       └── middleware/         ← Auth, CORS, errors
│   └── frontend/                   ← React app (port 5173)
│       └── src/
│           ├── pages/              ← Landing, Connect, Risk, etc.
│           ├── components/         ← UI components
│           └── lib/                ← API client, utilities
├── masumi/                          ← Orchestrator
│   ├── orchestrator/               ← FastAPI app (port 8080)
│   │   ├── app.py                  ← Main app
│   │   ├── router.py               ← Workflow routing
│   │   ├── registry.py             ← Agent registry
│   │   └── config.yaml             ← Agent config
│   └── agents/
│       └── ai_model/               ← AI model agent
├── INTEGRATION_QUICK_START.md       ← START HERE
├── FULL_INTEGRATION_STARTUP.md      ← Full guide
└── INTEGRATION_COMPLETE.md          ← What's integrated
```

---

## 🧪 Testing

### Manual Test - Full Flow

1. **Start all services** (3 terminals, see Quick Start above)
2. **Open browser**: http://localhost:5173
3. **Click "Get Started"**
4. **Connect a wallet** or enter a test address
5. **Initiate risk scan**
6. **View results** with risk scores and explanations
7. **Check backend logs** to see orchestrator calls

### Automated Tests

```powershell
# Run all integration tests
cd C:\Users\Asus\Desktop\hackathon\aurevguard
. .\test_integration.ps1
```

Tests verify:
- ✅ Frontend loads
- ✅ Backend health
- ✅ Orchestrator health
- ✅ Live pipeline endpoints
- ✅ Agent registration

---

## 🐛 Troubleshooting

### Port Already in Use?
```powershell
# Kill process on port 8080 (Orchestrator)
Get-Process | Where-Object { $_.Name -match 'python' } | Stop-Process -Force

# Kill process on port 5000 (Backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Shows Blank Page?
```powershell
cd apps/frontend
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run dev
```

### Dependencies Missing?
```powershell
# Reinstall backend
cd apps/backend
npm install

# Reinstall frontend
cd ../frontend
npm install

# Reinstall Python deps (orchestrator)
cd ../../
python -m pip install -r masumi/orchestrator/../requirements.txt
```

---

## 📖 Detailed Guides

### For Quick Setup
→ [`INTEGRATION_QUICK_START.md`](./INTEGRATION_QUICK_START.md)

### For Learning the System
→ [`FULL_INTEGRATION_STARTUP.md`](./FULL_INTEGRATION_STARTUP.md)

### For Understanding What's Built
→ [`INTEGRATION_COMPLETE.md`](./INTEGRATION_COMPLETE.md)

### For Individual Components
- Backend: `apps/backend/` (see Express routes)
- Frontend: `apps/frontend/README.md` (React components)
- Orchestrator: `masumi/orchestrator/README.md` (FastAPI endpoints)
- AI Model: `agents/ai_model/` (ML training and inference)

---

## 🚢 Deployment

When ready for production:

1. **Use Docker Compose** (recommended)
   ```bash
   docker-compose up -d
   ```

2. **Or Deploy Separately**
   - Frontend → Vercel / Netlify
   - Backend → Heroku / Railway / AWS
   - Orchestrator → Same or separate server
   - AI Agents → Scalable infra (K8s, ECS, etc.)

3. **Update `.env` files** for production secrets/URLs

4. **Enable HTTPS/TLS** for all services

5. **Set up monitoring** (Datadog, New Relic, ELK)

---

## 🤝 Contributing

To add features or fix bugs:

1. Pick a component (frontend/backend/orchestrator)
2. Make your changes
3. Test locally (all 3 services running)
4. Commit with descriptive message
5. Push to your branch
6. Create PR

All services have hot-reload in dev mode:
- **Frontend**: Vite hot module reloading
- **Backend**: Nodemon watching
- **Orchestrator**: Uvicorn --reload

---

## 📞 Support

If something isn't working:

1. Check **[`INTEGRATION_QUICK_START.md`](./INTEGRATION_QUICK_START.md)** → Troubleshooting section
2. Check **[`FULL_INTEGRATION_STARTUP.md`](./FULL_INTEGRATION_STARTUP.md)** → Common Issues & Fixes
3. Verify all 3 services are running (check each terminal)
4. Check browser console (F12) for frontend errors
5. Check terminal logs for backend/orchestrator errors

---

## ✅ Integration Checklist

- ✅ Frontend renders without errors
- ✅ Backend health endpoint responds
- ✅ Orchestrator health endpoint responds
- ✅ All 3 services communicate
- ✅ Live pipeline integration working
- ✅ AI model agents registered
- ✅ Error handling in place
- ✅ Documentation complete
- ✅ Ready for testing
- ✅ Ready for production deployment

---

## 🎯 Next Steps

1. **Run the system** (3 terminals, Quick Start)
2. **Explore the UI** (http://localhost:5173)
3. **Test wallet connection** (Connect Wallet)
4. **Initiate risk scan** (Scan Address)
5. **View results** (Risk Assessment)
6. **Check logs** to see orchestrator in action
7. **Modify/extend** features as needed

---

## 📝 Files Modified This Session

- ✅ `apps/backend/src/server.js` — Fixed CORS config
- ✅ `apps/frontend/src/components/ErrorBoundary.jsx` — Added error boundary
- ✅ `apps/frontend/src/main.jsx` — Wrapped app with error boundary
- ✅ `INTEGRATION_QUICK_START.md` — Quick reference (NEW)
- ✅ `FULL_INTEGRATION_STARTUP.md` — Comprehensive guide (NEW)
- ✅ `INTEGRATION_COMPLETE.md` — Integration summary (NEW)
- ✅ `test_integration.ps1` — Integration tests (NEW)
- ✅ `start_all_services.ps1` — Service launcher (NEW)

---

**🎉 All systems are GO! Start the services and begin development.**

---

*Last updated: 2025-11-30*
*Status: ✅ Integration Complete and Tested*
