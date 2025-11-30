# AUREV Guard - Complete Run Guide

## ✅ Features Implemented

All requested hackathon-safe features have been implemented:

1. ✅ Decision bundle saving with full metadata
2. ✅ Improved AI stub returning explanation, features, modelHash
3. ✅ Decision hash computation (SHA256 canonical JSON)
4. ✅ GET /v1/decisions/:proofId endpoint
5. ✅ Mock anchor endpoint
6. ✅ Frontend Proof panel with full display

## 📋 File List Created/Updated

### Backend
- `backend/src/server.js` - Express setup with CORS, JSON, requestId
- `backend/src/routes.js` - Route registration
- `backend/src/controllers.js` - All 5 endpoint handlers
- `backend/src/decisionStore.js` - In-memory bundle storage
- `backend/src/config/index.js` - Configuration (existing, no changes needed)
- `backend/README.md` - Complete documentation

### Python AI
- `python-ai/app.py` - Updated with explanation, features, modelHash
- `python-ai/README.md` - Run instructions

### Frontend
- `apps/frontend/src/pages/Proof.jsx` - Complete proof panel implementation

## 🚀 Run Commands

### Terminal A: Python AI Stub

```bash
cd python-ai
pip install -r requirements.txt
uvicorn app:app --port 5000
```

**Verify:**
```bash
curl http://localhost:5000/health
```

### Terminal B: Backend

```bash
cd backend
npm install
npm start
```

**Verify:**
```bash
curl http://localhost:3001/health
```

### Terminal C: Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

**Open browser:** http://localhost:5173

## 🧪 Test Example

### Complete Flow Test

```bash
# 1. Scan address (creates bundle)
RESPONSE=$(curl -s -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}')

echo "Scan Response:"
echo $RESPONSE | jq .

# Extract requestId (requires jq)
REQUEST_ID=$(echo $RESPONSE | jq -r '.requestId')
echo "Request ID: $REQUEST_ID"

# 2. Agent decision
curl -s -X POST http://localhost:3001/agent/decision \
  -H "Content-Type: application/json" \
  -d "{\"requestId\":\"$REQUEST_ID\",\"address\":\"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg\",\"riskScore\":72}" | jq .

# 3. Generate proof with contract log
PROOF_RESPONSE=$(curl -s -X POST http://localhost:3001/contract/log \
  -H "Content-Type: application/json" \
  -d "{\"requestId\":\"$REQUEST_ID\",\"address\":\"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg\",\"riskScore\":72,\"masumiDecision\":\"APPROVED\"}")

echo "Proof Response:"
echo $PROOF_RESPONSE | jq .

# Extract proofId
PROOF_ID=$(echo $PROOF_RESPONSE | jq -r '.proofId')
echo "Proof ID: $PROOF_ID"

# 4. Fetch full decision bundle
echo "Full Decision Bundle:"
curl -s http://localhost:3001/v1/decisions/$PROOF_ID | jq .

# 5. Anchor hash
echo "Anchor Response:"
curl -s -X POST http://localhost:3001/v1/anchor \
  -H "Content-Type: application/json" \
  -d "{\"proofId\":\"$PROOF_ID\"}" | jq .
```

### Expected Output from POST /contract/log

```json
{
  "unsignedTxHex": "FAKE_UNSIGNED_TX_1701349200000_a1b2c3d4e5f6...",
  "metadata": {
    "risk": 72,
    "level": "HIGH",
    "modelHash": "model-v1-2024-11-30"
  },
  "proofId": "proof-550e8400-e29b-41d4-a716-446655440000",
  "decisionHash": "8f4a6b7c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6"
}
```

## ✅ Acceptance Checks

All requirements met:

1. ✅ **POST /scan/address returns requestId**
   ```bash
   curl -X POST http://localhost:3001/scan/address \
     -H "Content-Type: application/json" \
     -d '{"address":"addr_test1..."}'
   # Returns: {..., "requestId": "abc-123"}
   ```

2. ✅ **POST /contract/log returns unsignedTxHex and decisionHash**
   ```bash
   # Returns: {
   #   "unsignedTxHex": "FAKE_UNSIGNED_TX_...",
   #   "decisionHash": "8f4a6b7c...",
   #   ...
   # }
   ```

3. ✅ **GET /v1/decisions/:proofId returns full bundle**
   - Contains: explanation, features, modelHash, decisionHash, unsignedTxHex

4. ✅ **Frontend Proof panel displays all fields**
   - RequestId, timestamp, address
   - Risk score with colored badge
   - Explanation text
   - Features table
   - ModelHash, decisionHash (copyable)
   - UnsignedTxHex textarea with copy button
   - SignedTxHex display (when available)

5. ✅ **POST /v1/anchor returns anchoredTxId**
   ```bash
   # Returns: {
   #   "anchoredTxId": "ANCHOR_TX_...",
   #   "status": "pending"
   # }
   ```

6. ✅ **Wallet signing remains local**
   - No network submission (demo-safe)

## 🔧 Error & Fallback Implementation

### Python AI Unreachable
```javascript
// Backend automatically falls back to:
{
  riskScore: 50,
  riskLevel: "MEDIUM",
  explanation: "AI unavailable fallback",
  features: { fallback: true },
  modelHash: "fallback-v1"
}
```

### Frontend Sign Fallback
- If wallet.signTx() fails, shows error message
- UnsignedTxHex remains copyable
- User can sign externally

### Missing Parameters
- All endpoints return 400 with clear error message
- All responses include requestId for tracing

## 📦 Dependencies Added

### Backend (package.json)
```json
{
  "dependencies": {
    "uuid": "^9.0.0"
  }
}
```

Run: `cd backend && npm install`

## 🎯 Frontend Integration

### Using the Proof Panel

1. Run a complete scan flow (use Risk page or curl)
2. Copy the `proofId` from the contract log response
3. Navigate to `/proof` page
4. Paste the proofId
5. Click "Fetch Decision Bundle"
6. View all explainability data
7. Click "Anchor Hash" to mock on-chain recording

### Direct URL Access
```
http://localhost:5173/proof
```

## 📊 Decision Bundle Structure

Complete bundle saved and retrievable:

```json
{
  "requestId": "req-uuid",
  "timestamp": "ISO-8601",
  "address": "addr...",
  "riskScore": 0-100,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "explanation": "human-readable text",
  "features": {
    "velocity": 0.82,
    "tx_count_24h": 12,
    "avg_tx_size": 500,
    "unique_counterparties": 8,
    "risk_pattern_match": true
  },
  "modelHash": "model-v1-YYYY-MM-DD",
  "masumiDecision": "APPROVED|REJECTED",
  "proofId": "proof-uuid",
  "decisionHash": "sha256-hex",
  "unsignedTxHex": "FAKE_TX_...",
  "signedTxHex": null,
  "anchoredTxId": "ANCHOR_TX_...",
  "status": "scored|approved|proof_generated|anchored"
}
```

## 🎨 Frontend Features

- Full proof panel with sections for each data type
- Color-coded risk badges (red/yellow/green)
- Copyable hashes and transaction hex
- Feature table display
- Anchor button with loading state
- Error handling and validation
- Responsive design

## 🔐 Security Notes

- All data in-memory (demo-safe, no persistence)
- Decision hash uses SHA256 with canonical JSON (sorted keys)
- No actual blockchain submission
- Mock transaction hex for safety
- No private keys required

## ⚠️ Known Limitations (Demo-Safe)

1. In-memory storage resets on restart
2. Mock transaction hex (not real Cardano CBOR)
3. No actual wallet signing integration
4. No real blockchain anchoring
5. Python AI uses deterministic algorithm (not ML)

## 🎓 Manual Workarounds

None required - all features work locally without external dependencies.

## 📝 README Updates

- `backend/README.md` - Complete API documentation
- `python-ai/README.md` - Updated with new response fields

## ✨ Summary

All requested features have been successfully implemented:
- ✅ Decision bundles saved with full metadata
- ✅ AI returns explanation + features + modelHash  
- ✅ Decision hash (SHA256) computed and included
- ✅ GET endpoint retrieves full bundles
- ✅ Mock anchor endpoint functional
- ✅ Frontend Proof panel displays everything
- ✅ All error handling and fallbacks in place
- ✅ Local development only (no Docker for frontend/wallet)

Ready for hackathon demo! 🚀