# 📝 Exact Code Changes Required

This document shows the EXACT lines to change in existing backend files.  
**No changes needed for AI/Masumi code - only backend files.**

---

## File 1: `apps/backend/src/controllers.js`

### Change 1: Add imports at the top

**Location:** Line 1-10 (Top of file)

**Add after existing imports:**

```javascript
// At the top, after other imports:
import { aiModelAdapter, paymentAgentAdapter, orchestratorClient } from './services/index.js';
```

### Change 2: Update `postScanAddress()` function

**Location:** Find the `postScanAddress` function

**Replace this section:**
```javascript
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
```

**With this:**
```javascript
try {
    // Call AI Model Adapter (handles direct or orchestrator routing)
    const aiData = await aiModelAdapter.getPrediction({
      address,
      features: {}
    });
```

### Change 3: Update the decision bundle in `postScanAddress()`

**Replace:**
```javascript
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
      proofId: null,
      decisionHash: null,
      unsignedTxHex: null,
      signedTxHex: null,
      anchoredTxId: null,
      status: 'scored'
    };
```

**With:**
```javascript
    const bundle = {
      requestId,
      timestamp: new Date().toISOString(),
      address,
      riskScore: aiData.riskScore,
      riskLevel: aiData.riskLevel,
      isAnomaly: aiData.isAnomaly,
      confidence: aiData.confidence,
      explanation: aiData.explanation || 'AI analysis performed',
      features: aiData.rawData || aiData.features || {},
      modelHash: aiData.modelHash || 'ai-v1-2024-11-30',
      masumiDecision: null,
      paymentStatus: null,
      proofId: null,
      decisionHash: null,
      unsignedTxHex: null,
      signedTxHex: null,
      anchoredTxId: null,
      status: 'scored'
    };
```

### Change 4: Update `postAgentDecision()` function

**Replace the entire function body** with:

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

---

## File 2: `apps/backend/src/server.js`

### Change 1: Add service initialization

**Add these imports at the top:**
```javascript
import { initializeServices } from './services/index.js';
```

**Find the app.listen() call and update it:**

**Replace:**
```javascript
const PORT = config.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ AUREV Guard Backend running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});
```

**With:**
```javascript
const PORT = config.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`✅ AUREV Guard Backend running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  
  // Initialize integration services
  try {
    console.log('\n🔌 Initializing integration services...');
    await initializeServices({ timeout: 10000 });
    console.log('✅ Integration services initialized\n');
  } catch (err) {
    console.warn('⚠️  Some integration services unavailable:', err.message);
    console.log('   System will use fallback mode\n');
  }
});
```

---

## File 3: `apps/backend/src/routes.js`

### Change 1: Add health check endpoint (Optional but recommended)

**Add after existing routes:**

```javascript
// Add this import at top if not already there:
import { orchestratorClient, aiModelAdapter, paymentAgentAdapter } from './services/index.js';

// Add this new route before export default:
router.get('/health/services', async (req, res) => {
  try {
    const [orchestrator, aiModel, payment] = await Promise.allSettled([
      orchestratorClient.checkHealth(),
      aiModelAdapter.checkHealth(),
      paymentAgentAdapter.checkHealth()
    ]);

    const services = {
      orchestrator: {
        ready: orchestrator.status === 'fulfilled' && orchestrator.value.healthy,
        ...(orchestrator.status === 'fulfilled' ? orchestrator.value : { error: orchestrator.reason?.message })
      },
      aiModel: {
        ready: aiModel.status === 'fulfilled' && aiModel.value.healthy,
        ...(aiModel.status === 'fulfilled' ? aiModel.value : { error: aiModel.reason?.message })
      },
      payment: {
        ready: payment.status === 'fulfilled' && payment.value.healthy,
        ...(payment.status === 'fulfilled' ? payment.value : { error: payment.reason?.message })
      }
    };

    const allReady = Object.values(services).every(s => s.ready);

    return res.json({
      status: allReady ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      services
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to check services',
      message: err.message,
      requestId: req.requestId
    });
  }
});
```

---

## File 4: `apps/backend/.env`

### Add new environment variables

**Add these lines to `.env`:**

```bash
# ============================================================================
# Integration Services Configuration
# ============================================================================

# Orchestrator Settings
ORCHESTRATOR_URL=http://localhost:8080
ORCHESTRATOR_ROUTE_ENDPOINT=/masumi/route
ORCHESTRATOR_TIMEOUT=30000

# AI Model Agent (optional, for direct calls)
AI_AGENT_URL=http://localhost:8083
AI_AGENT_TIMEOUT=30000

# Payment Agent (optional, for direct calls)
PAYMENT_AGENT_URL=http://localhost:8081
PAYMENT_AGENT_TIMEOUT=30000

# Routing Mode
# true = route through orchestrator (recommended)
# false = call agents directly (for debugging)
USE_ORCHESTRATOR=true
```

---

## Summary of Changes

| File | Type | Lines Changed | Complexity |
|------|------|---------------|-----------|
| `controllers.js` | Update | ~80 lines | Medium |
| `server.js` | Update | ~10 lines | Low |
| `routes.js` | Add | ~40 lines (optional) | Low |
| `.env` | Add | ~12 lines | Very Low |
| **No changes** | - | - | - |
| `agents/ai_model/` | - | - | ✅ UNTOUCHED |
| `masumi/` | - | - | ✅ UNTOUCHED |
| `masumi/orchestrator/` | - | - | ✅ UNTOUCHED |

---

## ✅ Files Already Created

These files are ALREADY created and ready to use:

- ✅ `apps/backend/src/services/orchestratorClient.js` (200+ lines)
- ✅ `apps/backend/src/services/aiModelAdapter.js` (250+ lines)
- ✅ `apps/backend/src/services/paymentAgentAdapter.js` (280+ lines)
- ✅ `apps/backend/src/services/index.js` (60+ lines)

**No need to create these - they're already there!**

---

## How to Apply These Changes

### Option 1: Manual (Recommended for first time)
1. Open `apps/backend/src/controllers.js`
2. Follow the changes above one by one
3. Test each change
4. Repeat for other files

### Option 2: Copy-Paste (Fastest)
1. Copy the exact sections from this document
2. Paste them into the target files
3. Make sure indentation matches

### Option 3: Diff View
1. Use your IDE's diff viewer
2. Compare old vs new versions
3. Accept changes one by one

---

## Testing After Changes

After applying all changes, test like this:

```bash
# Terminal 1: Start Orchestrator
cd masumi/orchestrator
python app.py

# Terminal 2: Start AI Agent
cd agents/ai_model
python -m src.train  # or: uvicorn src.train:app --port 8083

# Terminal 3: Start Payment Agent
cd masumi/agents/payment
uvicorn app:app --port 8081

# Terminal 4: Start Backend
cd apps/backend
npm install
npm start
```

Then test endpoints:

```bash
# Check all services
curl http://localhost:3001/health/services

# Scan address (uses AI adapter)
curl -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}'

# Agent decision (uses Payment adapter)
curl -X POST http://localhost:3001/agent/decision \
  -H "Content-Type: application/json" \
  -d '{"requestId":"req-123","address":"addr_test1...","riskScore":72}'
```

---

## ⚠️ Important Notes

1. **Don't modify** files in `agents/` or `masumi/` - they're untouched
2. **Services are already created** - just use them from controllers
3. **Environment variables** control routing behavior
4. **Fallbacks are automatic** - adapters handle errors gracefully
5. **Correlation IDs** are logged for request tracing

---

## 🎉 That's It!

After these changes, your backend will be **fully integrated** with:
- ✅ AI Model Agent (via adapter)
- ✅ Payment Agent (via adapter)
- ✅ Masumi Orchestrator (routes workflows)
- ✅ Wallet integration (already done)

**Without modifying ANY existing AI or Masumi code!**
