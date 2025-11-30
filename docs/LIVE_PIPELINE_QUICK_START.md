# LIVE Pipeline - Quick Start Guide

## Quick Setup (5 minutes)

### 1. Backend Setup

```bash
cd apps/backend

# Copy and configure environment
cp .env.example .env

# Edit .env with your values:
# - BLOCKFROST_API_KEY: Get from https://blockfrost.io
# - ORCHESTRATOR_URL: Your orchestrator endpoint
```

### 2. Start Services

```bash
# Terminal 1: Backend
cd apps/backend
npm install
npm start

# Terminal 2: Frontend  
cd apps/frontend
npm install
npm run dev

# Terminal 3: Orchestrator (if not already running)
cd masumi/orchestrator
python app.py
```

### 3. Use in Frontend

```jsx
import LivePipelineProcessor from '@/components/LivePipelineProcessor';

export default function Dashboard() {
  const [walletAddress] = useState('addr_test1qz...');
  
  return (
    <LivePipelineProcessor
      walletAddress={walletAddress}
      onComplete={(results) => {
        console.log('Analysis results:', results);
      }}
    />
  );
}
```

## API Quick Reference

### Start Pipeline
```bash
curl -X POST http://localhost:5000/api/live-pipeline/start \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "addr_test1qz2fxv...",
    "transactionId": "txn_123"
  }'
```

### Check Status
```bash
curl http://localhost:5000/api/live-pipeline/status/job_123
```

### Get Results
```bash
curl http://localhost:5000/api/live-pipeline/results/addr_test1qz...
```

## Response Example

```json
{
  "success": true,
  "jobId": "job_1701343400123_abc123",
  "walletAddress": "addr_test1qz2fxv...",
  "status": "completed",
  "progress": 100,
  "results": {
    "wallet_address": "addr_test1qz2fxv...",
    "timestamp": "2025-11-30T10:30:00Z",
    "features": {
      "tx_count_24h": 15,
      "total_received": 500,
      "total_sent": 300,
      ...
    },
    "prediction": {
      "risk_score": 0.35,
      "anomaly_score": 0.12,
      "prediction": "LOW_RISK"
    },
    "transaction_count": 47,
    "utxo_count": 8
  }
}
```

## Component Props

```jsx
<LivePipelineProcessor
  walletAddress={string}        // Required: Cardano address
  onComplete={function}         // Optional: Callback with results
/>
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check if backend is running on port 5000 |
| Timeout error | Increase `LIVE_PIPELINE_TIMEOUT` in .env |
| No results | Verify orchestrator is running on port 8080 |
| 404 Not Found | Check API endpoint path is `/api/live-pipeline/...` |

## Features Extracted (18 dimensions)

The system analyzes these metrics:
- Transaction counts and velocity
- Amount flows (received/sent)
- Address diversity
- Pattern analysis (burstiness, timing)
- Smart contract interactions
- And 11 more dimensions...

## Next Steps

1. ✅ Set up environment variables
2. ✅ Start all services
3. ✅ Test with a sample wallet address
4. ✅ Integrate component into dashboard
5. 🔄 Monitor results and optimize

---

**Need help?** Check `LIVE_PIPELINE_INTEGRATION_COMPLETE.md` for detailed documentation.
