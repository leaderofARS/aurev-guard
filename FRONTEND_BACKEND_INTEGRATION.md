# AUREV Guard: Frontend-Backend Integration Guide

## Architecture Overview

The AUREV Guard application is a **monorepo** with separated frontend (React/Vite) and backend (Express) that communicate via HTTP REST APIs.

```
aurev-guard/
├── apps/
│   ├── frontend/  (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/       (Wallet, Risk, Proof)
│   │   │   ├── components/  (RiskForm, RiskCard, WalletConnect, ComplianceModal)
│   │   │   ├── lib/         (api.js, cardano.js)
│   │   │   └── main.jsx
│   │   └── vite.config.js
│   └── backend/  (Express.js)
│       ├── src/
│       │   ├── index.js            (Entry point)
│       │   ├── server.js           (Express app)
│       │   ├── routes/             (5 endpoints)
│       │   ├── controllers/        (Request handlers)
│       │   ├── services/           (Mock integrations)
│       │   ├── middleware/         (Error handling)
│       │   ├── store/              (In-memory history)
│       │   └── config/             (Configuration)
│       └── package.json
```

---

## Current Communication Flow

### **Frontend → Backend (API Calls)**

The frontend makes HTTP requests to the backend via `src/lib/api.js`:

```javascript
const BASE = import.meta.env.VITE_API_BASE || "";
// Example: VITE_API_BASE="http://localhost:3000"

async function request(path, body = {}) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json();
}
```

**Current API functions:**
- `scanAddress(address)` → calls `POST /scan/address`
- `contractLog(payload)` → calls `POST /contract/log`

**Missing API functions** (need to be added):
- `getAiScore(address)` → calls `POST /ai/score`
- `getAgentDecision(riskScore, address)` → calls `POST /agent/decision`
- `getRiskHistory(address)` → calls `GET /risk/history/:address`

---

## 5 Backend Endpoints (Already Implemented)

| Method | Endpoint | Request | Response | Use |
|--------|----------|---------|----------|-----|
| `POST` | `/scan/address` | `{ address }` | `{ success, data: { riskScore, balance, txCount, ... } }` | Risk Checker page |
| `POST` | `/ai/score` | `{ address }` | `{ success, data: { complianceScore, riskFactors, ... } }` | AI scoring |
| `POST` | `/agent/decision` | `{ address, riskScore }` | `{ success, data: { riskLevel, recommendation, ... } }` | Agent logic |
| `POST` | `/contract/log` | `{ address, action }` | `{ success, data: { unsignedTxHex, contractId, ... } }` | Compliance Proof |
| `GET` | `/risk/history/:address` | (via URL param) | `{ success, data: { totalScans, history: [] } }` | History tracking |

---

## Frontend Pages & Components (Already Implemented)

### **1. Wallet Page** (`/` route)
- **Purpose:** Wallet connection & management
- **Components:**
  - `WalletConnect` - CIP-30 wallet connector (Nami, Flint, Lace)
  - Shows connected address

### **2. Risk Checker Page** (`/risk` route)
- **Purpose:** Scan addresses for risk
- **Components:**
  - `WalletConnect` - Wallet selector
  - `RiskForm` - Input address, calls `scanAddress()`
  - `RiskCard` - Displays risk score with status badge
- **Flow:**
  1. User connects wallet
  2. User enters address (or autofills from wallet)
  3. Frontend calls `POST /scan/address`
  4. Backend returns risk score & details
  5. Frontend renders risk status

### **3. Compliance Proof Page** (`/proof` route)
- **Purpose:** Generate unsigned transaction hex for compliance
- **Components:**
  - `RiskForm` - Input address
  - `ComplianceModal` - Calls `contractLog()`, displays `unsignedTxHex`
- **Flow:**
  1. User enters address
  2. Clicks "Generate Compliance Proof"
  3. Frontend calls `POST /contract/log`
  4. Backend returns `unsignedTxHex` (Aiken stub)
  5. User can copy/download hex

---

## How to Connect Frontend & Backend

### **Step 1: Start Backend**
```bash
cd apps/backend
npm install  # (if not done yet)
npm start    # Runs on http://localhost:3000
```

### **Step 2: Configure Frontend API Base URL**

Edit `.env` (create if doesn't exist) in `apps/frontend/`:
```env
VITE_API_BASE=http://localhost:3000
```

Or set environment variable before running:
```bash
export VITE_API_BASE=http://localhost:3000
```

### **Step 3: Start Frontend**
```bash
cd apps/frontend
npm install  # (if not done yet)
npm run dev  # Runs on http://localhost:5173
```

### **Step 4: Open Browser**
Navigate to `http://localhost:5173`

---

## Complete Integration Checklist

- [x] **Backend:** 5 endpoints implemented & working
- [x] **Frontend:** 3 pages & 6 components implemented
- [x] **API Client:** `src/lib/api.js` with `scanAddress()` & `contractLog()`
- [ ] **Complete API Client:** Add missing functions:
  - [ ] `getAiScore(address)`
  - [ ] `getAgentDecision(riskScore, address)`
  - [ ] `getRiskHistory(address)`
- [ ] **Frontend Components:** Use missing API functions (if needed)
- [ ] **CORS:** Ensure backend allows frontend origin (currently enabled)
- [ ] **Error Handling:** Both sides handle failures gracefully
- [ ] **Environment Config:** Frontend reads `VITE_API_BASE`

---

## Data Flow Diagrams

### **Risk Scanning Flow**
```
User (Browser)
    ↓
[RiskForm Component]
    ↓ scanAddress(address)
[POST /scan/address] ← Frontend API Client
    ↓
[Backend: scanController.scanAddress()]
    ↓ (calls BlockfrostMock.getAddressInfo())
[Returns: { riskScore, balance, txCount, ... }]
    ↓
[RiskCard Component] displays risk badge
```

### **Compliance Proof Flow**
```
User (Browser)
    ↓
[ComplianceModal Component]
    ↓ contractLog({ address, score, metadata })
[POST /contract/log] ← Frontend API Client
    ↓
[Backend: contractController.logContract()]
    ↓ (calls AikenMock.generateContractLog())
[Returns: { unsignedTxHex, contractId, ... }]
    ↓
[User: Copy/Download unsignedTxHex]
```

---

## Missing Features to Complete Integration

### **1. Add Missing API Functions** (Priority: High)
**File:** `apps/frontend/src/lib/api.js`

```javascript
export async function getAiScore(address) {
  return request("/ai/score", { address });
}

export async function getAgentDecision(address, riskScore) {
  return request("/agent/decision", { address, riskScore });
}

export async function getRiskHistory(address) {
  // This is a GET request, not POST
  const res = await fetch(`${BASE}/risk/history/${address}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
```

### **2. Enhance RiskCard Component** (Priority: Medium)
Currently only displays `score`. Could show:
- AI compliance score (from `getAiScore()`)
- Agent recommendation (from `getAgentDecision()`)
- Risk history (from `getRiskHistory()`)

### **3. Production Deployment** (Priority: Medium)
- Backend: Deploy to hosting (Vercel, Railway, Heroku, etc.)
- Frontend: Update `VITE_API_BASE` to production backend URL
- Enable CORS for frontend domain

---

## Quick Test Commands

### **Backend Health Check**
```bash
curl http://localhost:3000/health
```

### **Test Scan Endpoint**
```bash
curl -X POST http://localhost:3000/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2..."}'
```

### **Test Contract Log Endpoint**
```bash
curl -X POST http://localhost:3000/contract/log \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv...","action":"compliance_check"}'
```

### **Test Risk History Endpoint**
```bash
curl http://localhost:3000/risk/history/addr_test1qz2fxv...
```

---

## Environment Variables Summary

### **Frontend** (`.env`)
```
VITE_API_BASE=http://localhost:3000  (dev)
VITE_API_BASE=https://api.aurev-guard.io  (production)
```

### **Backend** (`.env`)
```
PORT=3000
NODE_ENV=development
```

---

## Current Status

✅ **Connected & Working:**
- Frontend pages load
- Wallet connection works (CIP-30)
- `scanAddress()` endpoint integrated
- `contractLog()` endpoint integrated
- Backend CORS enabled

⚠️ **Partial Integration:**
- `getAiScore()` function missing from frontend API client
- `getAgentDecision()` function missing from frontend API client
- `getRiskHistory()` function missing from frontend API client

⚠️ **Not Yet Integrated:**
- RiskCard only displays basic score (could show AI score, history)
- No real Cardano wallet integration (just CIP-30 stub)
- No real transaction signing (uses mock hex)

---

## Next Steps

1. **Add missing API functions** to `apps/frontend/src/lib/api.js`
2. **Update RiskCard** to display multi-source risk data
3. **Test end-to-end** with both frontend and backend running
4. **Deploy both** to production environment
5. **Integrate real Blockfrost** (replace mock) when ready

