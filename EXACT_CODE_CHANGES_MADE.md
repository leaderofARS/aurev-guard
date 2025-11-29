# 📝 Exact Code Changes Made

## File 1: `apps/backend/src/config/index.js`

### BEFORE:
```javascript
export const config = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PY_AI_URL: process.env.PY_AI_URL || 'http://localhost:5000',
  BASE_URL: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
  MASUMI_DELAY: 100,
  AIKEN_DELAY: 100,
  BLOCKFROST_DELAY: 50,
  HYDRA_DELAY: 150,
};
```

### AFTER:
```javascript
export const config = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PY_AI_URL: process.env.PY_AI_URL || 'http://localhost:5000',
  BASE_URL: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
  // Integration Services URLs
  ORCHESTRATOR_URL: process.env.ORCHESTRATOR_URL || 'http://localhost:8080',
  AI_AGENT_URL: process.env.AI_AGENT_URL || 'http://localhost:8083',
  PAYMENT_AGENT_URL: process.env.PAYMENT_AGENT_URL || 'http://localhost:8081',
  USE_ORCHESTRATOR: process.env.USE_ORCHESTRATOR === 'true' || true,
  MASUMI_DELAY: 100,
  AIKEN_DELAY: 100,
  BLOCKFROST_DELAY: 50,
  HYDRA_DELAY: 150,
};
```

**Change:** Added 4 new configuration variables for orchestrator and agents

---

## File 2: `apps/backend/src/controllers.js`

### Change 2a: Add Imports at Top

### BEFORE:
```javascript
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import config from './config/index.js';
import { saveDecisionBundle, getDecisionBundle } from './decisionStore.js';
```

### AFTER:
```javascript
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import config from './config/index.js';
import { saveDecisionBundle, getDecisionBundle } from './decisionStore.js';
import * as orchestratorClient from './services/orchestratorClient.js';
import * as aiModelAdapter from './services/aiModelAdapter.js';
import * as paymentAgentAdapter from './services/paymentAgentAdapter.js';
```

**Change:** Added 3 adapter service imports

---

### Change 2b: Update `postScanAddress()` Function

### BEFORE:
```javascript
export async function postScanAddress(req, res) {
  const { address } = req.body || {};
  const requestId = req.requestId;
  
  if (!address) {
    return res.status(400).json({ error: 'address is required', requestId });
  }

  try {
    // Call Python AI stub
    const aiRes = await fetch(`${config.PY_AI_URL}/ai/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
      timeout: 5000
    });

    let aiData;
    if (!aiRes.ok) {
      throw new Error('AI service error');
    }
    aiData = await aiRes.json();

    const bundle = {
      requestId,
      timestamp: new Date().toISOString(),
      address,
      riskScore: aiData.riskScore,
      riskLevel: aiData.riskLevel,
      explanation: aiData.explanation,
      features: aiData.features || { sample: 'data' },
      modelHash: aiData.modelHash,
      masumiDecision: null,
      // ... rest of fields
    };
```

### AFTER:
```javascript
export async function postScanAddress(req, res) {
  const { address } = req.body || {};
  const requestId = req.requestId;
  
  if (!address) {
    return res.status(400).json({ error: 'address is required', requestId });
  }

  try {
    // Call AI Model Adapter (routes to orchestrator or direct call)
    const aiData = await aiModelAdapter.getPrediction({
      address,
      features: {}
    });

    const bundle = {
      requestId,
      timestamp: new Date().toISOString(),
      address,
      riskScore: aiData.riskScore,
      riskLevel: aiData.riskLevel,
      isAnomaly: aiData.isAnomaly || false,
      confidence: aiData.confidence || 0,
      explanation: aiData.explanation || 'AI analysis performed',
      features: aiData.rawData || aiData.features || {},
      modelHash: aiData.modelHash || 'ai-v1-2024-11-30',
      masumiDecision: null,
      // ... rest of fields
    };
```

**Change:** 
- Replaced 6-line fetch call with 1-line adapter call
- Added isAnomaly, confidence, and improved field handling

---

### Change 2c: Update `postAgentDecision()` Function

### BEFORE:
```javascript
export async function postAgentDecision(req, res) {
  const { requestId, address, riskScore } = req.body || {};
  
  if (!requestId || !address || riskScore === undefined) {
    return res.status(400).json({ 
      error: 'requestId, address, and riskScore are required',
      requestId: req.requestId 
    });
  }

  const bundle = getDecisionBundle(requestId);
  if (!bundle) {
    return res.status(404).json({ 
      error: 'Decision bundle not found',
      requestId: req.requestId 
    });
  }

  // Update bundle with Masumi decision
  bundle.masumiDecision = 'APPROVED';
  bundle.status = 'approved';
  saveDecisionBundle(requestId, bundle);

  console.log(`[${requestId}] Agent decision: APPROVED`);

  return res.json({
    masumiRequestId: requestId,
    status: 'queued',
    decision: 'APPROVED'
  });
}
```

### AFTER:
```javascript
export async function postAgentDecision(req, res) {
  const { requestId, address, riskScore } = req.body || {};
  
  if (!requestId || !address || riskScore === undefined) {
    return res.status(400).json({ 
      error: 'requestId, address, and riskScore are required',
      requestId: req.requestId 
    });
  }

  try {
    const bundle = getDecisionBundle(requestId);
    if (!bundle) {
      return res.status(404).json({ 
        error: 'Decision bundle not found',
        requestId: req.requestId 
      });
    }

    // 1. Validate settlement with Payment Agent
    const paymentValidation = await paymentAgentAdapter.getSettleValidation({
      transaction_id: requestId,
      features: bundle.features || {}
    });

    console.log(`[${requestId}] Payment validation: ${paymentValidation.paymentStatus}`);

    // 2. If payment is valid, get compliance decision
    let complianceDecision = 'PENDING';
    
    if (paymentValidation.isValid) {
      try {
        const complianceResult = await paymentAgentAdapter.validateWithCompliance(
          { transaction_id: requestId, features: bundle.features || {} },
          { 
            riskScore: bundle.riskScore,
            riskLevel: bundle.riskLevel,
            isAnomaly: bundle.isAnomaly
          }
        );
        
        complianceDecision = complianceResult.complianceDecision.toUpperCase();
        console.log(`[${requestId}] Compliance decision: ${complianceDecision}`);
      } catch (err) {
        console.warn(`[${requestId}] Compliance check failed:`, err.message);
        complianceDecision = 'PENDING';
      }
    } else {
      complianceDecision = 'REJECTED';
    }

    // Update bundle
    bundle.masumiDecision = complianceDecision;
    bundle.paymentStatus = paymentValidation.paymentStatus;
    bundle.status = 'decision_made';
    saveDecisionBundle(requestId, bundle);

    console.log(`[${requestId}] Agent decision: ${complianceDecision}`);

    return res.json({
      masumiRequestId: requestId,
      status: 'completed',
      decision: complianceDecision,
      paymentValidation: paymentValidation.paymentStatus
    });

  } catch (err) {
    console.error(`[${req.requestId}] Agent decision error:`, err.message);
    return res.status(500).json({
      error: 'Decision process failed',
      message: err.message,
      requestId: req.requestId 
    });
  }
}
```

**Change:**
- Replaced simple mock approval with real payment validation
- Added compliance decision logic
- Added try-catch for error handling
- Added paymentStatus to bundle

---

## File 3: `apps/backend/src/server.js`

### BEFORE:
```javascript
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import config from './config/index.js';
import routes from './routes.js';

const app = express();

// ... middleware setup ...

const PORT = config.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ AUREV Guard Backend running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});

export default app;
```

### AFTER:
```javascript
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import config from './config/index.js';
import routes from './routes.js';
import * as services from './services/index.js';

const app = express();

// ... middleware setup ...

const PORT = config.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`✅ AUREV Guard Backend running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  
  // Initialize integration services
  try {
    console.log('\n🔌 Initializing integration services...');
    await services.initializeServices({ timeout: 10000 });
    console.log('✅ Integration services initialized\n');
  } catch (err) {
    console.warn('⚠️  Some integration services unavailable:', err.message);
    console.log('   System will use fallback mode\n');
  }
});

export default app;
```

**Change:**
- Added import for services
- Made app.listen() callback async
- Added service initialization with health checks

---

## File 4: `apps/backend/.env`

### CREATED (New File):
```env
# Backend Configuration
PORT=3001
NODE_ENV=development

# Service URLs (Old)
PY_AI_URL=http://localhost:5000

# Integration Services URLs
ORCHESTRATOR_URL=http://localhost:8080
ORCHESTRATOR_ROUTE_ENDPOINT=/masumi/route
ORCHESTRATOR_TIMEOUT=30000

# AI Model Agent
AI_AGENT_URL=http://localhost:8083
AI_AGENT_TIMEOUT=30000

# Payment Agent
PAYMENT_AGENT_URL=http://localhost:8081
PAYMENT_AGENT_TIMEOUT=30000

# Routing Mode
USE_ORCHESTRATOR=true

# Blockfrost
BLOCKFROST_API_KEY=your_blockfrost_key_here
CARDANO_NETWORK=testnet

# Database
DB_URL=mongodb://localhost:27017/aurevguard

# Payment Address
PAYMENT_ADDRESS=addr_test1q...

# Base URL
BASE_URL=http://localhost:3001
```

**Change:** Created new configuration file with all required environment variables

---

## Summary of Changes

| File | Changes | Type | Lines |
|------|---------|------|-------|
| `config/index.js` | Added 4 config variables | Update | 4 |
| `controllers.js` | Import adapters | Add | 3 |
| `controllers.js` | Update postScanAddress | Update | ~40 |
| `controllers.js` | Update postAgentDecision | Update | ~60 |
| `server.js` | Import services | Add | 1 |
| `server.js` | Add service init | Update | ~15 |
| `.env` | Create file | Create | 25 |
| **Total** | **Backend changes only** | - | **~150** |

---

## No Changes To:

- ❌ `agents/ai_model/` - COMPLETELY UNTOUCHED
- ❌ `agents/` - COMPLETELY UNTOUCHED
- ❌ `masumi/orchestrator/app.py` - COMPLETELY UNTOUCHED
- ❌ `masumi/agents/` - COMPLETELY UNTOUCHED
- ❌ `masumi/` - COMPLETELY UNTOUCHED

---

**Total impact: Backend only, ~150 lines of changes, 0 changes to AI/Masumi code!** ✅
