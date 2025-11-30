# Orchestrator → Backend Integration Guide

## Overview

This document explains how the **Masumi Orchestrator** (Port 8080) connects to the **Node.js Backend** (Port 5000) to enable AI model predictions, risk scoring, and anomaly detection for blockchain transactions.

---

## Architecture Diagram

```
┌─────────────────────┐
│  Frontend React App │
│   (Port 3000)       │
└──────────┬──────────┘
           │
           │ REST API Calls
           │
┌──────────▼──────────┐
│  Backend (Express)  │
│   (Port 5000)       │
└──────────┬──────────┘
           │
           │ HTTP Requests
           │
┌──────────▼──────────┐
│   Orchestrator      │
│   (FastAPI 8080)    │
└─────────────────────┘
           │
           │ Routes to
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐  ┌─────▼───┐
│  RF   │  │   ISO   │
│ Model │  │ Model   │
└───────┘  └─────────┘
```

---

## Backend Endpoints That Connect to Orchestrator

### 1. **Prediction Route** `/api/predictions`

**File:** `apps/backend/src/routes/predictions.js`

```javascript
// Make request to orchestrator
const response = await axios.post(
  'http://localhost:8080/masumi/predict',
  {
    wallet_address: walletAddress,
    features: blockchainData.features,
    include_shap: true
  },
  { timeout: 30000 }
);

// Response includes:
// {
//   "risk_score": 0.75,
//   "anomaly_score": 0.42,
//   "shap_values": {...},
//   "prediction": "HIGH_RISK"
// }
```

---

## Step-by-Step Integration Flow

### Step 1: Prepare Blockchain Data

**Backend Function:** `apps/backend/src/services/dataService.js`

```javascript
async function prepareBlockchainData(walletAddress) {
  // Fetch from Cardano node or cache
  const txHistory = await getTransactionHistory(walletAddress);
  
  // Extract 18 features
  const features = {
    tx_count: txHistory.length,
    total_received: sum(txHistory.map(t => t.received)),
    total_sent: sum(txHistory.map(t => t.sent)),
    max_tx_size: max(txHistory.map(t => t.size)),
    avg_tx_size: average(txHistory.map(t => t.size)),
    net_balance_change: calculateNetChange(txHistory),
    unique_counterparties: new Set(txHistory.map(t => t.counterparty)).size,
    tx_per_day: calculateTxPerDay(txHistory),
    active_days: calculateActiveDays(txHistory),
    burstiness: calculateBurstiness(txHistory),
    collateral_ratio: calculateCollateralRatio(walletAddress),
    smart_contract_flag: hasSmartContract(walletAddress) ? 1 : 0,
    high_value_ratio: calculateHighValueRatio(txHistory),
    counterparty_diversity: calculateDiversity(txHistory),
    inflow_outflow_asymmetry: calculateAsymmetry(txHistory),
    timing_entropy: calculateTimingEntropy(txHistory),
    velocity_hours: calculateVelocity(txHistory),
    // 18 features total
  };
  
  return features;
}
```

---

### Step 2: Send to Orchestrator

**Backend Endpoint Implementation:**

```javascript
app.post('/api/predictions/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { include_shap } = req.query;
    
    // Step 1: Prepare data
    const blockchainData = await prepareBlockchainData(walletAddress);
    
    // Step 2: Send to Orchestrator
    const orchestratorResponse = await axios.post(
      `http://localhost:8080/masumi/predict?wallet_address=${walletAddress}&include_shap=${include_shap}`,
      blockchainData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ORCHESTRATOR_TOKEN}`
        },
        timeout: 30000
      }
    );
    
    // Step 3: Process response
    const predictions = {
      walletAddress,
      riskScore: orchestratorResponse.data.risk_score,
      anomalyScore: orchestratorResponse.data.anomaly_score,
      prediction: orchestratorResponse.data.prediction,
      shapValues: include_shap ? orchestratorResponse.data.shap_values : null,
      timestamp: new Date().toISOString(),
      blockchainData
    };
    
    // Step 4: Store in database
    await savePredictionToDB(predictions);
    
    // Step 5: Return to client
    res.json(predictions);
    
  } catch (error) {
    console.error('Orchestrator request failed:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

### Step 3: Handle Orchestrator Response

**Response Structure:**

```json
{
  "wallet_address": "addr_test1qpredicted56574149",
  "risk_score": 0.75,
  "anomaly_score": 0.42,
  "prediction": "HIGH_RISK",
  "model_confidence": 0.89,
  "shap_values": {
    "inflow_outflow_asymmetry": 0.45,
    "burstiness": 0.38,
    "unique_counterparties": -0.22,
    "tx_count": 0.15,
    "net_balance_change": -0.08
  },
  "timestamp": "2025-11-30T12:00:00Z",
  "models_used": ["RandomForest", "IsolationForest", "SVM", "LOF"],
  "ensemble_agreement": 0.92
}
```

---

## Key Configuration Variables

**Backend `.env` File:**

```env
# Orchestrator Connection
ORCHESTRATOR_URL=http://localhost:8080
ORCHESTRATOR_PORT=8080
ORCHESTRATOR_TOKEN=your_secure_token

# Timeouts
ORCHESTRATOR_TIMEOUT=30000
REQUEST_MAX_RETRIES=3

# Cardano Node
CARDANO_NODE_HOST=localhost
CARDANO_NODE_PORT=8090

# Database
DB_URL=mongodb://localhost:27017/aurevguard
```

---

## Error Handling

**Backend Error Handler:**

```javascript
async function handleOrchestratorError(error, walletAddress) {
  if (error.code === 'ECONNREFUSED') {
    return {
      error: 'Orchestrator service unavailable',
      status: 503,
      fallback: await getCachedPrediction(walletAddress)
    };
  }
  
  if (error.response?.status === 400) {
    return {
      error: 'Invalid input data',
      status: 400,
      details: error.response.data
    };
  }
  
  if (error.response?.status === 500) {
    return {
      error: 'Orchestrator processing error',
      status: 500,
      retryable: true
    };
  }
  
  return {
    error: 'Unknown error',
    status: 500,
    message: error.message
  };
}
```

---

## Testing the Integration

### Test 1: Simple Prediction

```bash
curl -X POST http://localhost:5000/api/predictions/addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl \
  -H "Content-Type: application/json"
```

### Test 2: Prediction with SHAP

```bash
curl -X POST http://localhost:5000/api/predictions/addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl?include_shap=true \
  -H "Content-Type: application/json"
```

### Test 3: Batch Predictions

```javascript
const wallets = [
  'addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl',
  'addr_test1qpredicted56574149'
];

const predictions = await Promise.all(
  wallets.map(wallet => 
    fetch(`http://localhost:5000/api/predictions/${wallet}?include_shap=true`)
  )
);
```

---

## Performance Optimization

### Caching Strategy

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

app.get('/api/predictions/:walletAddress', async (req, res) => {
  const cacheKey = `prediction_${req.params.walletAddress}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  
  // If not cached, fetch from orchestrator
  const result = await fetchFromOrchestrator(...);
  
  // Cache the result
  cache.set(cacheKey, result);
  
  res.json(result);
});
```

### Batch Processing

```javascript
async function batchPredictions(walletAddresses) {
  const results = await Promise.allSettled(
    walletAddresses.map(addr => 
      fetchFromOrchestrator(addr)
    )
  );
  
  return {
    successful: results.filter(r => r.status === 'fulfilled'),
    failed: results.filter(r => r.status === 'rejected')
  };
}
```

---

## Health Checks

### Orchestrator Health Endpoint

```javascript
app.get('/health/orchestrator', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:8080/health', {
      timeout: 5000
    });
    
    res.json({
      status: 'healthy',
      orchestrator_status: response.data.status,
      models_loaded: response.data.models_loaded,
      uptime: response.data.uptime
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

---

## Logging

**Request/Response Logging:**

```javascript
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode}`);
  });
  
  next();
});
```

---

## Security Considerations

1. **Authentication:** Use Bearer tokens for orchestrator requests
2. **Rate Limiting:** Implement rate limits to prevent DoS
3. **Input Validation:** Validate wallet addresses before sending to orchestrator
4. **TLS/SSL:** Use HTTPS in production
5. **Token Rotation:** Rotate orchestrator tokens regularly

---

## Deployment Checklist

- [ ] Orchestrator running on port 8080
- [ ] Backend running on port 5000
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Health checks passing
- [ ] Error handling in place
- [ ] Caching configured
- [ ] Logging enabled
- [ ] Rate limiting active
- [ ] Security headers set

---

## Next Steps

1. Implement backend-frontend integration (see `BACKEND_FRONTEND_INTEGRATION.md`)
2. Set up wallet integration (see `WALLET_INTEGRATION_GUIDE.md`)
3. Configure live pipeline for testnet transactions (see `LIVE_PIPELINE_GUIDE.md`)

