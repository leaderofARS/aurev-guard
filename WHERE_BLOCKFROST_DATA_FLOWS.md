# 🔗 Where Does "Fetch Live Data From Cardano Preview" Happen?

## Quick Answer
**Fetch Live Data** button triggers the complete flow:

```
Frontend UI Button
    ↓
"Analyze" (Real Mode)
    ↓
Backend /api/real-pipeline/start
    ↓
Backend spawns Python subprocess
    ↓
live_pipeline.py queries BLOCKFROST API
    ↓
Blockfrost returns Cardano transactions
    ↓
feature_engineering.py extracts features
    ↓
Orchestrator processes features
    ↓
ML models generate risk score
    ↓
Results displayed in frontend
```

---

## 📍 Exact Locations of Each Component

### 1. Frontend UI (http://localhost:5173)
**File**: `apps/frontend/src/pages/Risk.jsx`
- **What**: Risk Analysis page with Live Pipeline section
- **Component**: `<WalletRiskAnalyzer />`
- **Button**: "Analyze" when in "Live Blockfrost" mode

**File**: `apps/frontend/src/components/WalletRiskAnalyzer.jsx`
- **What**: Mode selector (Mock ↔ Real Blockfrost)
- **Props**: `useRealData` flag controls which endpoint to call
- **Warning**: "costs ~0.17 testnet ADA"

**File**: `apps/frontend/src/components/LivePipelineProcessor.jsx`
- **What**: Unified pipeline processor
- **Endpoint when Real**: `POST http://localhost:5000/api/real-pipeline/start`
- **Polling**: Gets status from `/api/real-pipeline/status/:jobId`

---

### 2. Backend Routes & Controllers (http://localhost:5000)

**File**: `apps/backend/src/server.js`
- **What**: Main server file
- **Mounted Routes**: 
  - `/api/live-pipeline` → mock pipeline routes
  - `/api/real-pipeline` → real pipeline routes

**File**: `apps/backend/src/routes/realPipeline.js`
- **What**: Express router for real pipeline
- **Endpoints**:
  - `POST /start` → Start real pipeline job
  - `GET /status/:jobId` → Get job status
  - `GET /results/:walletAddress` → Get cached results

**File**: `apps/backend/src/controllers/realDataPipelineController.js`
- **What**: 4-stage pipeline orchestrator
- **Stage 1**: `fetchLiveBlockfrostData(walletAddress)`
  ```javascript
  // Spawns: python live_pipeline.py
  // Returns: Transaction data from Blockfrost
  ```
- **Stage 2**: `runFeatureEngineering(blockfrostData)`
  ```javascript
  // Spawns: python feature_engineering.py
  // Returns: 8-dimensional feature vector
  ```
- **Stage 3**: `callOrchestratorAIPrediction(features)`
  ```javascript
  // HTTP POST to: http://localhost:8080/masumi/route
  // Returns: Risk prediction
  ```
- **Stage 4**: `formatResults()` → Send to frontend

---

### 3. Python Pipeline (Subprocess spawned by backend)

**File**: `agents/ai_model/src/live_pipeline.py`
- **What**: Blockfrost API client
- **Key Functions**:
  ```python
  fetch_latest_block()              # Get latest block hash
  fetch_block_transactions()        # Get txs from block
  fetch_transaction_details()       # Get tx metadata
  fetch_transaction_utxos()         # Get tx inputs/outputs
  batch_pull_transactions()         # Pull last N blocks
  ```
- **Blockfrost API URLs**:
  ```
  https://cardano-preview.blockfrost.io/api/v0/blocks/latest
  https://cardano-preview.blockfrost.io/api/v0/blocks/{hash}/txs
  https://cardano-preview.blockfrost.io/api/v0/txs/{hash}
  https://cardano-preview.blockfrost.io/api/v0/txs/{hash}/utxos
  ```
- **Authentication**: Uses `BLOCKFROST_API_KEY` environment variable
- **Output**: JSON with raw transaction data

**File**: `agents/ai_model/src/feature_engineering.py`
- **What**: Feature extraction from raw blockchain data
- **Inputs**: Transaction data from live_pipeline.py
- **Processes**:
  - Count transactions in 24h window
  - Calculate ADA values (total, largest, std dev)
  - Extract destination addresses
  - Calculate entropy scores
  - Compute volume shares
- **Output**: 8-dimensional feature vector
  ```json
  {
    "tx_count_24h": 45,
    "total_value_24h": 5000000,
    "largest_value_24h": 2500000,
    "std_value_24h": 892300,
    "unique_counterparts_24h": 12,
    "entropy_of_destinations": 2.7,
    "share_of_daily_volume": 0.15,
    "relative_max_vs_global": 0.42
  }
  ```

---

### 4. Orchestrator (http://localhost:8080)

**File**: `masumi/orchestrator/app.py`
- **What**: FastAPI orchestrator
- **Main Route**: `POST /masumi/route`
- **Accepts**: Workflow type + feature payload
- **Processes**: Routes to appropriate AI agent

**File**: `masumi/orchestrator/router.py`
- **What**: Workflow router
- **Workflow**: `ai_predict`
- **Calls**: `call_agent()` function
- **Endpoint**: `/predict` on AI agent (port 8083)
- **Fallback**: Returns mock prediction if agent unavailable

---

### 5. AI Agent (http://localhost:8083)

**File**: `agents/ai_model/src/agent_stub.py`
- **What**: Mock AI agent (or real agent.py if sklearn working)
- **Endpoint**: `POST /predict`
- **Inputs**: 8-dimensional feature vector
- **Returns**:
  ```json
  {
    "risk_score": 0.73,
    "risk_label": "HIGH",
    "anomaly_score": 0.42,
    "is_anomaly": true,
    "confidence": 0.89
  }
  ```
- **Explanation**: `/explain` endpoint with SHAP values

---

## 🔄 Complete Request/Response Flow

### Frontend Sends Request
```javascript
// From LivePipelineProcessor.jsx
const response = await fetch('http://localhost:5000/api/real-pipeline/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: 'addr_test1qz2fxv2...',
    transactionId: 'txn_1234567890'
  })
});
```

### Backend Processes Request
```javascript
// realDataPipelineController.js
async function startRealPipeline(walletAddress) {
  // 1. Spawn live_pipeline.py
  const blockfrostData = await spawnPython('live_pipeline.py', [walletAddress]);
  
  // 2. Spawn feature_engineering.py
  const features = await spawnPython('feature_engineering.py', [blockfrostData]);
  
  // 3. Call Orchestrator
  const prediction = await fetch('http://localhost:8080/masumi/route', {
    method: 'POST',
    body: JSON.stringify({ workflow: 'ai_predict', payload: features })
  });
  
  // 4. Return results
  return {
    walletAddress,
    features,
    prediction,
    timestamp: new Date()
  };
}
```

### Python Queries Blockfrost
```python
# live_pipeline.py
import os
import requests

api_key = os.getenv('BLOCKFROST_API_KEY')
headers = {'project_id': api_key}

# Query Blockfrost API
response = requests.get(
    'https://cardano-preview.blockfrost.io/api/v0/blocks/latest',
    headers=headers
)
latest_block = response.json()

# Extract transactions
transactions = requests.get(
    f'https://cardano-preview.blockfrost.io/api/v0/blocks/{latest_block["hash"]}/txs',
    headers=headers
).json()

print(json.dumps({
    'wallet_address': wallet_address,
    'transactions': transactions,
    'timestamp': datetime.now().isoformat()
}))
```

### Blockfrost API Response
```json
{
  "hash": "e15de1e9e1a...",
  "height": 1245819,
  "transactions": [
    {
      "tx_hash": "45b0cdb436...",
      "block_time": 1701337200,
      "inputs": [...],
      "outputs": [...]
    },
    // ... more transactions
  ]
}
```

---

## 🔐 Authentication Setup

### Step 1: Get Blockfrost API Key
1. Visit https://blockfrost.io
2. Sign up / Log in
3. Create new project
4. Select: **Cardano Preview Testnet**
5. Copy **Project ID** (20-40 character string)

### Step 2: Set Environment Variable
```powershell
# In PowerShell
$env:BLOCKFROST_API_KEY = "your_project_id_here"

# Or in .env file
BLOCKFROST_API_KEY=your_project_id_here
```

### Step 3: Backend Reads Environment
```javascript
// In realDataPipelineController.js
const blockfrostApiKey = process.env.BLOCKFROST_API_KEY;
// Passed to Python subprocess which uses it
```

### Step 4: Python Uses API Key
```python
# In live_pipeline.py
api_key = os.getenv('BLOCKFROST_API_KEY')
headers = {'project_id': api_key}
# All Blockfrost API calls authenticated with this header
```

---

## 💰 Cost Calculation

### What Costs ADA?
- **Each wallet analysis**: ~0.17 testnet ADA
- **Why**: Blockfrost charges for API requests on paid networks
- **Free tier**: Can query ~100 wallets before needing more ADA

### Where to Get Testnet ADA
1. Visit: https://docs.cardano.org/cardano-testnet/tools/faucet/
2. Enter your testnet wallet address
3. Receive ~10 testnet ADA
4. Use for: Multiple wallet analyses

### Example Costs
- 1 wallet analysis: 0.17 testnet ADA
- 10 wallet analyses: 1.7 testnet ADA
- 100 wallet analyses: 17 testnet ADA

---

## 🧪 Testing Each Component

### Test 1: Blockfrost Connection
```powershell
$headers = @{"project_id" = "your_api_key"}
Invoke-WebRequest -Uri "https://cardano-preview.blockfrost.io/api/v0/blocks/latest" `
  -Headers $headers | Select-Object -ExpandProperty Content
```

### Test 2: Backend Real Pipeline
```powershell
$body = @{ walletAddress = "addr_test1..."; transactionId = "test" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/real-pipeline/start" `
  -Method POST -ContentType "application/json" -Body $body
```

### Test 3: Full Pipeline
```powershell
.\test_blockfrost_setup.ps1 -BlockfrostApiKey "your_key" -WalletAddress "addr_test1..."
```

---

## 📊 Data Flow Summary

```
USER INTERFACE
├─ Selects "Live Blockfrost (Real Data)"
├─ Enters wallet address: addr_test1qz2fxv2...
└─ Clicks "Analyze"

BACKEND (/api/real-pipeline/start)
├─ Receives wallet address
├─ Spawns: python live_pipeline.py
│  ├─ Reads: $env:BLOCKFROST_API_KEY
│  ├─ Calls: https://cardano-preview.blockfrost.io/api/v0/...
│  └─ Returns: Transaction JSON
├─ Spawns: python feature_engineering.py
│  ├─ Reads: Transaction JSON
│  └─ Returns: 8-dim feature vector
└─ Calls: http://localhost:8080/masumi/route
   ├─ Sends: Features to orchestrator
   ├─ Orchestrator calls: http://localhost:8083/predict
   └─ Returns: Risk score + anomaly detection

FRONTEND
├─ Receives: Risk score, anomaly flag, confidence
├─ Displays: Risk badge, feature importance, top drivers
└─ Shows: SHAP narrative explanation
```

---

## ✅ Verification Checklist

Before running "Fetch Live Data":

- [ ] **API Key Set**: `echo $env:BLOCKFROST_API_KEY` returns your key
- [ ] **Backend Running**: `netstat -ano | Select-String ":5000"` shows listening
- [ ] **Orchestrator Running**: `netstat -ano | Select-String ":8080"` shows listening
- [ ] **Testnet ADA Available**: ~0.17 testnet ADA in your wallet
- [ ] **Wallet Address Valid**: Formatted as `addr_test1...` (testnet format)

Once all checked, click "Analyze" and the magic happens! 🎉

---

**Everything is ready. Just need the Blockfrost API key to go live!**
