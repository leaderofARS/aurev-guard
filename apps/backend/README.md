# AUREV Guard Backend

Complete backend implementation with auditability and explainability features.

## Features Implemented

✅ Decision bundle saving with full metadata  
✅ Improved AI stub returning explanation, features, and modelHash  
✅ Decision hash computation (SHA256 of canonical JSON)  
✅ GET endpoint to fetch full decision bundles  
✅ Mock anchor endpoint for on-chain recording  
✅ Request ID tracking for all operations  
✅ In-memory persistence (demo-safe)  

## Quick Start

```bash
cd backend
npm install
npm start
```

Backend runs on **port 3001** by default.

## Environment Variables

Create `.env` file (optional):

```env
PORT=3001
PY_AI_URL=http://localhost:5000
NODE_ENV=development
```

## API Endpoints

### 1. POST /scan/address
Initiates risk scan and creates decision bundle.

**Request:**
```json
{
  "address": "addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"
}
```

**Response:**
```json
{
  "address": "addr_test1...",
  "riskScore": 72,
  "riskLevel": "HIGH",
  "explanation": "High transfer velocity...",
  "features": {
    "velocity": 0.82,
    "tx_count_24h": 12
  },
  "modelHash": "model-v1-2024-11-30",
  "timestamp": "2024-11-30T12:00:00.000Z",
  "requestId": "abc-123-def"
}
```

### 2. POST /agent/decision
Records Masumi agent decision.

**Request:**
```json
{
  "requestId": "abc-123-def",
  "address": "addr_test1...",
  "riskScore": 72
}
```

**Response:**
```json
{
  "masumiRequestId": "abc-123-def",
  "status": "queued",
  "decision": "APPROVED"
}
```

### 3. POST /contract/log
Generates proof with unsigned transaction and decision hash.

**Request:**
```json
{
  "requestId": "abc-123-def",
  "address": "addr_test1...",
  "riskScore": 72,
  "masumiDecision": "APPROVED"
}
```

**Response:**
```json
{
  "unsignedTxHex": "FAKE_UNSIGNED_TX_1701349200000_a1b2c3...",
  "metadata": {
    "risk": 72,
    "level": "HIGH",
    "modelHash": "model-v1-2024-11-30"
  },
  "proofId": "proof-550e8400-e29b-41d4-a716-446655440000",
  "decisionHash": "8f4a6b7c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6"
}
```

### 4. GET /v1/decisions/:proofId
Retrieves full decision bundle.

**Response:**
```json
{
  "requestId": "abc-123-def",
  "timestamp": "2024-11-30T12:00:00.000Z",
  "address": "addr_test1...",
  "riskScore": 72,
  "riskLevel": "HIGH",
  "explanation": "High transfer velocity...",
  "features": {
    "velocity": 0.82,
    "tx_count_24h": 12
  },
  "modelHash": "model-v1-2024-11-30",
  "masumiDecision": "APPROVED",
  "proofId": "proof-550e8400-...",
  "decisionHash": "8f4a6b7c3d2e...",
  "unsignedTxHex": "FAKE_UNSIGNED_TX_...",
  "signedTxHex": null,
  "anchoredTxId": null,
  "status": "proof_generated"
}
```

### 5. POST /v1/anchor
Mock anchors decision hash to blockchain.

**Request:**
```json
{
  "proofId": "proof-550e8400-...",
  "strategy": "hash-only"
}
```

**Response:**
```json
{
  "anchoredTxId": "ANCHOR_TX_1701349200000_abc123",
  "status": "pending"
}
```

## Testing

Example curl request for full flow:

```bash
# 1. Scan address
curl -X POST http://localhost:3001/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}'

# Save the requestId from response

# 2. Agent decision
curl -X POST http://localhost:3001/agent/decision \
  -H "Content-Type: application/json" \
  -d '{"requestId":"<REQUEST_ID>","address":"addr_test1...","riskScore":72}'

# 3. Generate proof
curl -X POST http://localhost:3001/contract/log \
  -H "Content-Type: application/json" \
  -d '{"requestId":"<REQUEST_ID>","address":"addr_test1...","riskScore":72,"masumiDecision":"APPROVED"}'

# Save the proofId from response

# 4. Fetch full bundle
curl http://localhost:3001/v1/decisions/<PROOF_ID>

# 5. Anchor hash
curl -X POST http://localhost:3001/v1/anchor \
  -H "Content-Type: application/json" \
  -d '{"proofId":"<PROOF_ID>"}'
```

## Architecture

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ HTTP
┌──────▼──────────────┐
│   Backend (3001)    │
│  ┌───────────────┐  │
│  │ Controllers   │  │
│  │ - Scan        │  │
│  │ - Decision    │  │
│  │ - Contract    │  │
│  │ - Proof Fetch │  │
│  │ - Anchor      │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼───────┐  │
│  │Decision Store │  │
│  │ (in-memory)   │  │
│  └───────────────┘  │
└──────┬──────────────┘
       │ HTTP
┌──────▼──────┐
│ Python AI   │
│  (port 5000)│
└─────────────┘
```

## Error Handling

- **400**: Missing required parameters
- **404**: Decision bundle not found
- **500**: Internal server error (with fallback for AI service)

All responses include `requestId` header for tracing.

## Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.0.3",
  "node-fetch": "^3.2.10",
  "uuid": "^9.0.0"
}
```

## Notes

- In-memory store resets on server restart (demo-safe)
- All external integrations are mocked
- Decision hashes use SHA256 of canonical JSON (sorted keys)
- UnsignedTxHex format is mock for demo purposes