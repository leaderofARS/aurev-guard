# Backend ↔ AI Modeling & Masumi Agent Integration

## 🎯 Integration Strategy (No Code Changes to Existing AI/Masumi)

The key principle: **Use adapter/wrapper services** to bridge the backend with existing AI models and Masumi agents. This way, the original code remains untouched.

---

## 📊 Current State

### AI Modeling (Untouched)
- **Location:** `agents/ai_model/src/train.py`
- **Port:** (runs as FastAPI)
- **Endpoints:**
  - `GET /health`
  - `POST /predict` (accepts transaction_id & features)
- **Returns:** risk_score, anomaly_flag, dataset lookups

### Masumi Agents (Untouched)
- **Payment Agent:** `masumi/agents/payment/app.py` (port 8081)
  - `POST /validate_settle` (validates settlement)
  
- **AI Model Agent:** `masumi/agents/ai_model/app.py` (port 8083)
  - `POST /predict` (same as agents/ai_model)
  
- **Compliance Agent:** `masumi/agents/compliance/` (port 8082)

- **Orchestrator:** `masumi/orchestrator/app.py` (port 8080)
  - Routes workflows to appropriate agents
  - Manages agent registry

### Backend (Needs Integration Layer)
- **Location:** `apps/backend/src/`
- **Port:** 3001
- **Current endpoints:**
  - `POST /scan/address` → calls Python AI stub (PY_AI_URL)
  - `POST /agent/decision`
  - `POST /contract/log`
  - `GET /v1/decisions/:proofId`
  - `POST /v1/anchor`

---

## 🔄 Integration Architecture (WITHOUT Code Changes)

```
Frontend (React)
    ↓
Backend API (Node.js)
    ├─→ [NEW] OrchestratorClient Service
    │      └─→ POST http://localhost:8080/masumi/route
    │          (calls /masumi/route which routes to agents)
    │
    ├─→ [NEW] AIModelClient Service
    │      └─→ POST http://localhost:8083/predict
    │          OR POST http://localhost:8080/masumi/route + workflow=ai_predict
    │
    └─→ [NEW] PaymentAgent Client Service
           └─→ POST http://localhost:8081/validate_settle
               OR POST http://localhost:8080/masumi/route + workflow=settle
```

---

## 📦 Integration Layer Components (To Create)

### 1. **Orchestrator Client** (`apps/backend/src/services/orchestratorClient.js`)
Communicates with the Masumi Orchestrator (port 8080)

```javascript
// This service wraps calls to the orchestrator
// Routes workflows like: ai_predict, ai_train, settle, etc.
```

**Usage:**
```javascript
const result = await orchestratorClient.route({
  workflow: 'ai_predict',
  payload: {
    address: 'addr_test1...',
    features: { /* 18 features */ }
  }
});
```

---

### 2. **AI Model Adapter** (`apps/backend/src/services/aiModelAdapter.js`)
Direct wrapper around AI Model endpoint (port 8083)

```javascript
// Calls either:
// - Direct: POST http://localhost:8083/predict
// - Via Orchestrator: POST http://localhost:8080/masumi/route + ai_predict workflow
```

**Usage:**
```javascript
const prediction = await aiModelAdapter.predict({
  transaction_id: 'tx_123',
  features: { amount: 5000, frequency: 10, /* ... */ }
});
// Returns: { risk_score, anomaly_flag, graph_features, ... }
```

---

### 3. **Payment Agent Adapter** (`apps/backend/src/services/paymentAgentAdapter.js`)
Direct wrapper around Payment Agent (port 8081)

```javascript
// Calls either:
// - Direct: POST http://localhost:8081/validate_settle
// - Via Orchestrator: POST http://localhost:8080/masumi/route + settle workflow
```

**Usage:**
```javascript
const validation = await paymentAgentAdapter.validateSettle({
  transaction_id: 'tx_123',
  features: { amount: 5000, user_id: 'user_456' }
});
// Returns: { status: 'valid'|'invalid', payment_id, checked_features }
```

---

## 🔌 How Backend Endpoints Will Use Integration

### Current: `POST /scan/address`

```javascript
// OLD (calls Python AI stub)
const aiRes = await fetch(`${config.PY_AI_URL}/ai/score`, { ... });

// NEW (calls Masumi AI Agent via Orchestrator)
const prediction = await orchestratorClient.route({
  workflow: 'ai_predict',
  payload: {
    address: body.address,
    features: extractedFeatures  // 18 features from Blockfrost
  }
});
```

### Current: `POST /agent/decision`

```javascript
// OLD (just updates local bundle)
bundle.masumiDecision = 'APPROVED';

// NEW (actually calls Masumi agents for real decision)
const paymentValidation = await paymentAgentAdapter.validateSettle({
  transaction_id: requestId,
  features: bundle.features
});

const decision = await orchestratorClient.route({
  workflow: 'settle',
  payload: {
    payment_id: requestId,
    risk_score: bundle.riskScore,
    validation: paymentValidation
  }
});
// Updates: bundle.masumiDecision, bundle.signature, etc.
```

---

## 📝 Implementation Steps

### Step 1: Create Service Layer (NO CHANGES TO EXISTING CODE)

**Create these new files:**

1. `apps/backend/src/services/orchestratorClient.js`
   - Wraps calls to `http://localhost:8080/masumi/route`
   - Handles routing workflows to agents
   - Error handling & retries

2. `apps/backend/src/services/aiModelAdapter.js`
   - Direct calls to `http://localhost:8083/predict`
   - Or routes through orchestrator
   - Parses AI responses into standardized format

3. `apps/backend/src/services/paymentAgentAdapter.js`
   - Direct calls to `http://localhost:8081/validate_settle`
   - Or routes through orchestrator
   - Validates payment/settlement decisions

4. `apps/backend/src/services/index.js`
   - Exports all adapters
   - Single import point for controllers

---

### Step 2: Update Controllers to Use Adapters

**Modify `apps/backend/src/controllers.js`:**

- `postScanAddress()` → calls `aiModelAdapter.predict()`
- `postAgentDecision()` → calls `paymentAgentAdapter.validateSettle()` + orchestrator
- Keep everything else the same

---

### Step 3: Add Environment Variables

**`.env` (Backend):**
```bash
# Orchestrator settings
ORCHESTRATOR_URL=http://localhost:8080
ORCHESTRATOR_ROUTE_ENDPOINT=/masumi/route

# Agent endpoints (optional, for direct calls)
AI_AGENT_URL=http://localhost:8083
PAYMENT_AGENT_URL=http://localhost:8081

# Feature extraction mode
USE_ORCHESTRATOR=true  # true = route through orchestrator, false = direct calls
```

---

## 🚀 Full Data Flow (With Integration)

```
1. User submits wallet address via Frontend
   ↓
2. Backend POST /scan/address
   ├─→ Extract address from request
   ├─→ Fetch transaction data from Blockfrost (optional, or get from features)
   ├─→ Call aiModelAdapter.predict({address, features})
   │   ├─→ (Option A) Direct HTTP: POST http://localhost:8083/predict
   │   └─→ (Option B) Via Orchestrator: POST http://localhost:8080/masumi/route
   │       { workflow: 'ai_predict', payload: {...} }
   ├─→ AI Model Agent returns: {risk_score, anomaly_flag, graph_features, ...}
   ├─→ Save to decision bundle
   └─→ Return to Frontend: {riskScore, riskLevel, features, modelHash, ...}

3. User reviews risk and clicks "Approve"
   ↓
4. Backend POST /agent/decision
   ├─→ Get decision bundle
   ├─→ Call paymentAgentAdapter.validateSettle({transaction_id, features})
   │   └─→ Payment Agent validates: {status, payment_id, ...}
   ├─→ Call orchestratorClient.route({workflow: 'settle', payload: {...}})
   │   └─→ Orchestrator routes to compliance agent
   │       ├─→ Checks risk vs policies
   │       └─→ Returns: {decision, signature, model_hash}
   ├─→ Update bundle: {masumiDecision, signature, ...}
   └─→ Return to Frontend: {status: 'approved', decision: {...}}

5. Frontend receives approval, can trigger settlement
   ↓
6. Backend POST /contract/log
   ├─→ Get approved bundle
   ├─→ Generate proof hash (if needed)
   ├─→ Create unsigned transaction (mock for now)
   └─→ Return: {proofId, decisionHash, unsignedTxHex, ...}

7. User can view decision via GET /v1/decisions/:proofId
   └─→ Returns: full decision bundle with all AI/Masumi data
```

---

## ✅ Why This Approach Works

1. **No Changes to Existing Code**
   - `agents/ai_model/` remains as-is
   - `masumi/` agents remain as-is
   - Only NEW adapter/service files added

2. **Flexible Routing**
   - Can call agents directly OR through orchestrator
   - Easy to switch between strategies
   - Easy to add new agents later

3. **Clean Separation**
   - Backend controllers don't need to know agent details
   - Services handle all orchestration logic
   - Easy to test & mock

4. **Error Handling**
   - Fallbacks if agents unavailable
   - Graceful degradation
   - Request tracing with IDs

5. **Extensible**
   - Adding new agents = create new adapter
   - Adding new workflows = update orchestrator config
   - No backend code changes needed

---

## 🔧 Pseudo-Code Examples

### orchestratorClient.js
```javascript
export async function route(workflow, payload) {
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/masumi/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': generateId()
      },
      body: JSON.stringify({
        workflow,
        payload
      }),
      timeout: 30000
    });
    
    if (!response.ok) throw new Error(`Orchestrator error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Orchestrator routing failed:`, error);
    throw error;
  }
}
```

### aiModelAdapter.js
```javascript
export async function predict(request) {
  // Option 1: Direct call
  if (process.env.USE_DIRECT_CALL === 'true') {
    return await directAICall(request);
  }
  
  // Option 2: Via orchestrator
  return await orchestratorClient.route('ai_predict', {
    address: request.address,
    features: request.features,
    transaction_id: request.transaction_id
  });
}

async function directAICall(request) {
  const response = await fetch(`${AI_AGENT_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  return await response.json();
}
```

### Updated controllers.js (postScanAddress)
```javascript
export async function postScanAddress(req, res) {
  const { address } = req.body;
  const requestId = req.requestId;

  try {
    // Call AI Model adapter (no change to controller logic!)
    const aiData = await aiModelAdapter.predict({
      address,
      features: {} // Features passed from frontend or extracted from chain
    });

    // Create bundle (same as before)
    const bundle = {
      requestId,
      timestamp: new Date().toISOString(),
      address,
      riskScore: aiData.risk_score,
      anomalyFlag: aiData.anomaly_flag,
      // ... other fields
      status: 'scored'
    };

    saveDecisionBundle(requestId, bundle);
    return res.json({ ...aiData, requestId });

  } catch (err) {
    console.error(`AI prediction failed:`, err);
    // Fallback logic (same as before)
    return res.json({ /* fallback */ });
  }
}
```

---

## 📋 File Structure (After Integration)

```
apps/backend/src/
├── controllers/
│   ├── scanController.js (optional refactoring)
│   └── decisionController.js (optional refactoring)
├── controllers.js (existing, minimal changes)
├── routes.js (existing, no changes)
├── server.js (existing, no changes)
├── services/
│   ├── index.js (exports all)
│   ├── orchestratorClient.js [NEW]
│   ├── aiModelAdapter.js [NEW]
│   ├── paymentAgentAdapter.js [NEW]
│   └── complianceAgentAdapter.js (optional, for future)
├── config/
│   └── index.js (updated with new env vars)
└── ... (other existing files)
```

---

## 🎬 Summary

**To integrate without changing AI/Masumi code:**

1. ✅ Create 3 new adapter services (orchestratorClient, aiModelAdapter, paymentAgentAdapter)
2. ✅ Update controllers to call adapters instead of direct URLs
3. ✅ Add environment variables for agent endpoints
4. ✅ Keep all existing AI and Masumi code untouched
5. ✅ Full end-to-end integration works seamlessly

**The beauty:** Old code (frontend/controllers) just calls new services. New services handle all the Masumi/AI orchestration. Clean, simple, extensible.
