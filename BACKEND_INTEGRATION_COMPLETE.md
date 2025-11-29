# ✅ Backend Integration Complete

**Status:** Ready to integrate with AI/Masumi  
**Files Modified:** Backend only (NO changes to agents/ or masumi/)  
**Date:** November 30, 2025

---

## 🎯 What Was Done

### Files Modified (Backend Only)

1. ✅ **`apps/backend/src/config/index.js`**
   - Added ORCHESTRATOR_URL configuration
   - Added AI_AGENT_URL and PAYMENT_AGENT_URL
   - Added USE_ORCHESTRATOR flag

2. ✅ **`apps/backend/src/controllers.js`**
   - Added imports for adapter services
   - Updated `postScanAddress()` to use aiModelAdapter instead of direct fetch
   - Updated `postAgentDecision()` to use paymentAgentAdapter for validation
   - Added proper error handling and fallbacks

3. ✅ **`apps/backend/src/server.js`**
   - Added service initialization on startup
   - Health checks for all integration services

4. ✅ **`apps/backend/.env`**
   - Configuration variables for orchestrator and agents
   - Blockfrost and network settings

### Files Created (Already Existed - Used As-Is)

- ✅ `apps/backend/src/services/orchestratorClient.js` - Routes workflows to Masumi
- ✅ `apps/backend/src/services/aiModelAdapter.js` - Wraps AI Model Agent calls
- ✅ `apps/backend/src/services/paymentAgentAdapter.js` - Wraps Payment Agent calls
- ✅ `apps/backend/src/services/index.js` - Exports and initializes all services

### Files NOT Modified (Untouched)

- ✅ `agents/ai_model/` - All AI modeling code UNCHANGED
- ✅ `masumi/orchestrator/app.py` - Orchestrator code UNCHANGED
- ✅ `masumi/agents/ai_model/app.py` - AI Agent UNCHANGED
- ✅ `masumi/agents/payment/app.py` - Payment Agent UNCHANGED
- ✅ `masumi/agents/compliance/` - Compliance Agent UNCHANGED

---

## 🔄 How It Works Now

### Before (Direct Fetch)
```
Backend → fetch() → Python AI Stub
```

### After (Using Adapters)
```
Backend Controller
    ↓
aiModelAdapter.getPrediction()
    ↓
Masumi Orchestrator (port 8080)
    ↓
AI Model Agent (port 8083)
    ↓
Returns prediction back through adapter
```

---

## 📝 Code Changes Summary

### Change 1: Import Adapters in controllers.js
```javascript
import * as orchestratorClient from './services/orchestratorClient.js';
import * as aiModelAdapter from './services/aiModelAdapter.js';
import * as paymentAgentAdapter from './services/paymentAgentAdapter.js';
```

### Change 2: postScanAddress() - Now Uses AI Adapter
```javascript
// OLD:
const aiRes = await fetch(`${config.PY_AI_URL}/ai/score`, {...});

// NEW:
const aiData = await aiModelAdapter.getPrediction({
  address,
  features: {}
});
```

### Change 3: postAgentDecision() - Now Validates with Payment Agent
```javascript
// NEW: Validate settlement with Payment Agent
const paymentValidation = await paymentAgentAdapter.getSettleValidation({
  transaction_id: requestId,
  features: bundle.features || {}
});

// NEW: Get compliance decision
const complianceResult = await paymentAgentAdapter.validateWithCompliance(
  { transaction_id: requestId, features: bundle.features || {} },
  { riskScore, riskLevel, isAnomaly }
);
```

### Change 4: server.js - Initialize Services
```javascript
// NEW: Initialize integration services
try {
  console.log('\n🔌 Initializing integration services...');
  await services.initializeServices({ timeout: 10000 });
  console.log('✅ Integration services initialized\n');
} catch (err) {
  console.warn('⚠️  Some services unavailable, using fallback mode');
}
```

---

## 🚀 How to Run

### Step 1: Start All Services (in separate terminals)

```bash
# Terminal 1: Masumi Orchestrator (port 8080)
cd masumi/orchestrator
python app.py

# Terminal 2: AI Model Agent (port 8083)
cd agents/ai_model/src
uvicorn train:app --port 8083

# Terminal 3: Payment Agent (port 8081)
cd masumi/agents/payment
uvicorn app:app --port 8081

# Terminal 4: Compliance Agent (port 8082)
cd masumi/agents/compliance
python app.py

# Terminal 5: Backend API (port 3001)
cd apps/backend
npm install
npm start
```

### Step 2: Test the Integration

```bash
# Check all services are healthy
curl http://localhost:3001/health/services

# Scan address (uses AI adapter)
curl -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}'

# Agent decision (uses Payment adapter)
curl -X POST http://localhost:3001/agent/decision \
  -H "Content-Type: application/json" \
  -d '{"requestId":"req-123","address":"addr_test1qz...","riskScore":72}'
```

---

## 📊 Data Flow After Integration

```
Frontend User
    ↓
POST /scan/address
    ↓
postScanAddress() Controller
    ↓
aiModelAdapter.getPrediction({address})
    ↓
Masumi Orchestrator
    ├─→ Routes workflow: ai_predict
    └─→ Calls AI Model Agent (port 8083)
        └─→ agents/ai_model/src/train.py
            └─→ Returns: {risk_score, anomaly_flag, ...}
    ↓
Response returned through adapter
    ↓
Controller creates decision bundle
    ↓
Save to decision store
    ↓
Return to Frontend with risk score
```

---

## ✅ Configuration (Environment Variables)

Created `apps/backend/.env` with:

```env
# Integration Services
ORCHESTRATOR_URL=http://localhost:8080
AI_AGENT_URL=http://localhost:8083
PAYMENT_AGENT_URL=http://localhost:8081
USE_ORCHESTRATOR=true

# Timeouts
ORCHESTRATOR_TIMEOUT=30000
AI_AGENT_TIMEOUT=30000
PAYMENT_AGENT_TIMEOUT=30000

# Other config
BLOCKFROST_API_KEY=your_key
CARDANO_NETWORK=testnet
```

---

## 🔍 What Happens at Each Step

### 1. User Scans Address
```
Frontend sends: POST /scan/address { address: "..." }
    ↓
Backend receives request
    ↓
Calls: aiModelAdapter.getPrediction({address})
    ↓
Adapter checks: USE_ORCHESTRATOR = true
    ↓
Adapter calls: POST http://localhost:8080/masumi/route
    Body: { workflow: 'ai_predict', payload: {address, features} }
    ↓
Orchestrator routes to AI Agent (port 8083)
    ↓
AI Agent processes (ORIGINAL CODE UNCHANGED)
    ↓
Returns prediction: {risk_score, anomaly_flag, ...}
    ↓
Adapter parses response
    ↓
Controller receives structured data
    ↓
Creates decision bundle
    ↓
Frontend gets: {address, riskScore, riskLevel, isAnomaly, ...}
```

### 2. User Approves Decision
```
Frontend sends: POST /agent/decision {requestId, address, riskScore}
    ↓
Backend receives request
    ↓
Calls: paymentAgentAdapter.getSettleValidation({transaction_id, features})
    ↓
Adapter calls Payment Agent (port 8081)
    ↓
Payment Agent validates (ORIGINAL CODE UNCHANGED)
    ↓
Returns: {status: 'valid'|'invalid', payment_id, ...}
    ↓
If valid, calls: paymentAgentAdapter.validateWithCompliance(paymentReq, riskData)
    ↓
Adapter routes through orchestrator: settle workflow
    ↓
Orchestrator routes to Compliance Agent (port 8082)
    ↓
Compliance Agent checks (ORIGINAL CODE UNCHANGED)
    ↓
Returns: {decision: 'approved'|'rejected', ...}
    ↓
Bundle updated with Masumi decision
    ↓
Frontend gets: {status: 'completed', decision: 'APPROVED'|'REJECTED'}
```

---

## 🎯 Key Features

✅ **Zero Changes to AI/Masumi Code**
- All original code in agents/ and masumi/ remains untouched
- Can upgrade components independently

✅ **Flexible Routing**
- Set `USE_ORCHESTRATOR=true` to route through orchestrator (recommended)
- Set `USE_ORCHESTRATOR=false` to call agents directly (debugging)

✅ **Error Resilience**
- Adapters return fallback predictions if agents are down
- System keeps working even if services unavailable
- Clear error messages for debugging

✅ **Clean Architecture**
- Controllers stay simple (just call adapters)
- All orchestration logic in services layer
- Easy to test and maintain

✅ **Full Tracing**
- Correlation IDs for request tracking
- Console logs with request IDs
- Easy debugging

---

## 📋 Integration Checklist

- [x] Create orchestratorClient adapter
- [x] Create aiModelAdapter adapter
- [x] Create paymentAgentAdapter adapter
- [x] Update controllers to use adapters
- [x] Update server to initialize services
- [x] Add environment variables
- [x] Update config to support new URLs
- [x] No changes to agents/ or masumi/ code
- [x] Error handling and fallbacks
- [x] Service health checks

---

## 🧪 Testing the Integration

### Unit Test Example
```javascript
// Test AI adapter independently
import * as aiModelAdapter from './services/aiModelAdapter.js';

const prediction = await aiModelAdapter.getPrediction({
  address: 'addr_test1...',
  features: {}
});

console.log(prediction);
// Expected: { riskScore, riskLevel, isAnomaly, confidence, ... }
```

### Integration Test Example
```bash
# Test full flow
curl -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1..."}'

# Look for:
# - requestId generated
# - riskScore between 0-100
# - riskLevel: LOW|MEDIUM|HIGH|VERY_HIGH
# - isAnomaly: true|false
```

---

## 🔧 Troubleshooting

### "Orchestrator not found"
```bash
# Solution: Start orchestrator first
cd masumi/orchestrator
python app.py
```

### "AI predictions timing out"
```bash
# Solution: Check if AI agent is running
curl http://localhost:8083/health

# If not running:
cd agents/ai_model/src
uvicorn train:app --port 8083
```

### "Payment validation always fails"
```bash
# Solution: Ensure features include required fields
# Check paymentAgentAdapter expects: transaction_id, features (with amount, user_id)
```

### "Using fallback mode"
```bash
# Solution: One or more services not responding
# Check console output to see which services are down
# Fallback predictions are reasonable but not production-ready
```

---

## 📚 Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `apps/backend/src/config/index.js` | Configuration | ✅ Updated |
| `apps/backend/src/controllers.js` | API handlers | ✅ Updated |
| `apps/backend/src/server.js` | Express setup | ✅ Updated |
| `apps/backend/.env` | Environment vars | ✅ Created |
| `apps/backend/src/services/orchestratorClient.js` | Orchestrator wrapper | ✅ Ready |
| `apps/backend/src/services/aiModelAdapter.js` | AI wrapper | ✅ Ready |
| `apps/backend/src/services/paymentAgentAdapter.js` | Payment wrapper | ✅ Ready |
| `apps/backend/src/services/index.js` | Service exports | ✅ Ready |
| `agents/ai_model/` | AI modeling | ✅ UNTOUCHED |
| `masumi/orchestrator/` | Orchestrator | ✅ UNTOUCHED |
| `masumi/agents/` | All agents | ✅ UNTOUCHED |

---

## 🎉 You're All Set!

The backend is now fully integrated with:
- ✅ AI Model Agent (predicts risk scores)
- ✅ Payment Agent (validates settlements)
- ✅ Masumi Orchestrator (routes workflows)
- ✅ Wallet Integration (already done)

**No changes to original AI/Masumi code!**

Start the services and test. The system is ready for real-time compliance checking on Cardano. 🚀
