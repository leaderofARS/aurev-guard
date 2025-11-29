# 🧪 Integration Testing Guide

## ✅ Quick Start (5 minutes)

### Step 1: Start Services (4 terminals)

```bash
# Terminal 1: Masumi Orchestrator
cd masumi/orchestrator
python app.py
# Expected output: ✅ Registered X agents

# Terminal 2: AI Model Agent
cd agents/ai_model/src
uvicorn train:app --port 8083
# Expected output: Uvicorn running on 0.0.0.0:8083

# Terminal 3: Payment Agent
cd masumi/agents/payment
uvicorn app:app --port 8081
# Expected output: Uvicorn running on 0.0.0.0:8081

# Terminal 4: Backend API
cd apps/backend
npm install
npm start
# Expected output: ✅ AUREV Guard Backend running on http://localhost:3001
```

### Step 2: Verify Integration

```bash
# Test 1: Health Check
curl http://localhost:3001/health/services
# Expected: All services showing "ready": true

# Test 2: Scan Address (Tests AI Integration)
curl -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}'

# Expected output:
# {
#   "address": "addr_test1qz...",
#   "riskScore": 45,
#   "riskLevel": "MEDIUM",
#   "isAnomaly": false,
#   "confidence": 0.85,
#   "requestId": "req-abc-123"
# }

# Test 3: Agent Decision (Tests Payment Integration)
curl -X POST http://localhost:3001/agent/decision \
  -H "Content-Type: application/json" \
  -d '{
    "requestId":"req-abc-123",
    "address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg",
    "riskScore":45
  }'

# Expected output:
# {
#   "masumiRequestId": "req-abc-123",
#   "status": "completed",
#   "decision": "APPROVED",
#   "paymentValidation": "valid"
# }
```

---

## 🔍 Detailed Testing

### Test Suite A: Service Health

#### A1: Check Orchestrator
```bash
curl http://localhost:8080/masumi/health
# Expected: status: "ready", agents_registered: 3
```

#### A2: Check AI Agent
```bash
curl http://localhost:8083/health
# Expected: status: "ready", service: "ai-model-agent"
```

#### A3: Check Payment Agent
```bash
curl http://localhost:8081/health
# Expected: status: "ready", service: "payment-agent"
```

#### A4: Check Backend Integration
```bash
curl http://localhost:3001/health/services
# Expected: All three services should show "ready": true
```

---

### Test Suite B: AI Model Integration

#### B1: Direct AI Scan (No Masumi)
```bash
curl -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}'
```

**Expected Response:**
```json
{
  "address": "addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg",
  "riskScore": 30-70,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "isAnomaly": true|false,
  "confidence": 0.0-1.0,
  "requestId": "req-xxxxx"
}
```

**What's happening:**
1. Backend calls `aiModelAdapter.getPrediction({address})`
2. Adapter routes to orchestrator: `POST /masumi/route` with workflow=`ai_predict`
3. Orchestrator calls AI Agent (port 8083)
4. AI Agent runs prediction
5. Result flows back through adapter
6. Backend returns to frontend

#### B2: Verify Adapter Is Being Used
```bash
# Watch backend console output
# You should see:
# [OrchestratorClient] Routing workflow 'ai_predict'
# [AIModelAdapter] Making prediction through orchestrator
# Workflow 'ai_predict' completed successfully
```

---

### Test Suite C: Payment Validation Integration

#### C1: Get Request ID First
```bash
# Step 1: Scan address to get requestId
curl -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}' \
  | jq '.requestId'
# Output: req-abc-123
```

#### C2: Submit Agent Decision
```bash
# Step 2: Submit decision with requestId from step 1
curl -X POST http://localhost:3001/agent/decision \
  -H "Content-Type: application/json" \
  -d '{
    "requestId":"req-abc-123",
    "address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg",
    "riskScore":45
  }'
```

**Expected Response:**
```json
{
  "masumiRequestId": "req-abc-123",
  "status": "completed",
  "decision": "APPROVED|REJECTED",
  "paymentValidation": "valid|invalid"
}
```

**What's happening:**
1. Backend calls `paymentAgentAdapter.getSettleValidation({transaction_id, features})`
2. Adapter validates with Payment Agent (port 8081)
3. If valid, calls `validateWithCompliance()` through orchestrator
4. Orchestrator routes to Compliance Agent (port 8082)
5. Result flows back with decision
6. Bundle updated with Masumi decision
7. Backend returns to frontend

#### C3: Verify Payment Adapter Is Being Used
```bash
# Watch backend console output
# You should see:
# [PaymentAgentAdapter] Making validation through orchestrator
# [PaymentAgentAdapter] Settlement validation with compliance successful
# Payment validation: valid|invalid
# Compliance decision: APPROVED|REJECTED
```

---

### Test Suite D: Fallback Mode Testing

#### D1: Test AI Fallback (Stop AI Agent)
```bash
# 1. Stop AI Agent (Ctrl+C in Terminal 2)
# 2. Try scanning address again:
curl -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1..."}'

# Expected: Returns fallback prediction
# {
#   "address": "addr_test1...",
#   "riskScore": 50,
#   "riskLevel": "MEDIUM",
#   "confidence": 0,
#   "fallback": true  ← Note this field
# }
```

#### D2: Test Payment Fallback (Stop Payment Agent)
```bash
# 1. Stop Payment Agent (Ctrl+C in Terminal 3)
# 2. Try agent decision again:
curl -X POST http://localhost:3001/agent/decision \
  -H "Content-Type: application/json" \
  -d '{
    "requestId":"req-abc-123",
    "address":"addr_test1...",
    "riskScore":45
  }'

# Expected: Returns fallback decision
# {
#   "masumiRequestId": "req-abc-123",
#   "status": "completed",
#   "decision": "PENDING"  ← Fallback decision
# }
```

---

### Test Suite E: Error Handling

#### E1: Invalid Request (Missing Address)
```bash
curl -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 Bad Request
# {
#   "error": "address is required",
#   "requestId": "req-xxx"
# }
```

#### E2: Missing Bundle
```bash
curl -X POST http://localhost:3001/agent/decision \
  -H "Content-Type: application/json" \
  -d '{
    "requestId":"nonexistent-123",
    "address":"addr_test1...",
    "riskScore":45
  }'

# Expected: 404 Not Found
# {
#   "error": "Decision bundle not found",
#   "requestId": "req-yyy"
# }
```

---

### Test Suite F: End-to-End Flow

#### Complete workflow:
```bash
# 1. User scans address
REQUEST_ID=$(curl -s -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}' \
  | jq -r '.requestId')

echo "Request ID: $REQUEST_ID"

# 2. Get the decision
DECISION=$(curl -s -X POST http://localhost:3001/agent/decision \
  -H "Content-Type: application/json" \
  -d "{
    \"requestId\":\"$REQUEST_ID\",
    \"address\":\"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg\",
    \"riskScore\":72
  }" \
  | jq '.')

echo "Decision: $DECISION"

# 3. View full decision bundle
curl -s http://localhost:3001/v1/decisions/$REQUEST_ID | jq '.'
```

---

## 📊 Console Log Markers (What to Look For)

### AI Integration
```
[OrchestratorClient] Routing workflow 'ai_predict' | CID: corr-xxxx
[AIModelAdapter] Making prediction through orchestrator
Workflow 'ai_predict' completed successfully | CID: corr-xxxx
[req-xxxx] Scan complete: score=45
```

### Payment Integration
```
[PaymentAgentAdapter] Making validation through orchestrator
[PaymentAgentAdapter] Settlement validation with compliance successful
[req-xxxx] Payment validation: valid
[req-xxxx] Compliance decision: APPROVED
[req-xxxx] Agent decision: APPROVED
```

### Service Initialization
```
🔌 Initializing integration services...
📊 [Services] Health Check Results:
  Orchestrator: ✅ Ready
  AI Model:     ✅ Ready
  Payment:      ✅ Ready
✅ Integration services ready!
```

---

## ✅ Checklist - All Tests Passing

- [ ] Orchestrator health check (port 8080)
- [ ] AI Agent health check (port 8083)
- [ ] Payment Agent health check (port 8081)
- [ ] Backend health check (port 3001)
- [ ] Backend integration health (all services ready)
- [ ] Scan address returns risk score
- [ ] Agent decision validates and returns decision
- [ ] Fallback works when AI Agent down
- [ ] Fallback works when Payment Agent down
- [ ] Error handling for invalid requests
- [ ] Error handling for missing bundles
- [ ] End-to-end flow works (scan → decision → bundle)
- [ ] Console logs show adapter being used
- [ ] No errors in orchestrator logs
- [ ] No errors in agent logs
- [ ] No changes to agents/ or masumi/ code

---

## 🐛 Troubleshooting

### Issue: "Orchestrator not found"
```bash
# Solution:
cd masumi/orchestrator
python app.py
# Check: curl http://localhost:8080/masumi/health
```

### Issue: "AI predictions timing out"
```bash
# Solution:
cd agents/ai_model/src
uvicorn train:app --port 8083
# Check: curl http://localhost:8083/health
```

### Issue: "All services returning fallback"
```bash
# Solution:
# Check that all 4 services are running
curl http://localhost:8080/masumi/health     # Orchestrator
curl http://localhost:8083/health            # AI Agent
curl http://localhost:8081/health            # Payment Agent
curl http://localhost:3001/health/services   # Backend integration
```

### Issue: "Decision always returns PENDING"
```bash
# Solution:
# Ensure payment validation is returning valid
# Check Payment Agent logs
# Verify features include required fields
```

### Issue: "Adapter not being called"
```bash
# Solution:
# Check imports in controllers.js
# Verify npm start includes updated code (may need npm install)
# Check console logs show [OrchestratorClient] messages
```

---

## 📈 Performance Testing

### Load Test: Scan 10 Addresses
```bash
for i in {1..10}; do
  echo "Request $i:"
  curl -s -X POST http://localhost:3001/scan/address \
    -H "Content-Type: application/json" \
    -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}' \
    | jq '.riskScore'
done
```

**Expected:** All requests complete successfully, risk scores vary normally

---

## ✨ Integration Complete!

If all tests pass:
- ✅ Backend is fully integrated with AI/Masumi
- ✅ No changes made to original code
- ✅ Error handling and fallbacks working
- ✅ System ready for production

🎉 **You're all set!**
