# Blockfrost Setup Guide

## Overview
The LIVE Pipeline integrates with **Blockfrost** to fetch real Cardano blockchain data for wallet risk analysis. This guide shows how to set it up.

## What is Blockfrost?
Blockfrost is a blockchain API service for Cardano that allows you to:
- Query wallet transactions
- Get blockchain data without running a full node
- Access mainnet and testnet data
- Pay in testnet ADA for queries on preview/preprod networks

## Step 1: Get a Blockfrost API Key

### For Cardano Preview Testnet (Recommended)
1. Go to https://blockfrost.io
2. Sign up or log in
3. Create a new project
4. Select **Cardano Preview Testnet** as the network
5. Copy your **Project ID** (this is your API key)

### For Cardano Mainnet
1. Same steps as above but select **Cardano Mainnet**
2. Note: Mainnet queries may have costs

## Step 2: Set Environment Variables

### Windows PowerShell
```powershell
# Set the environment variable for your current session
$env:BLOCKFROST_API_KEY = "your_project_id_here"
$env:BLOCKFROST_PROJECT = "preview"  # or "mainnet"
$env:CARDANO_NETWORK = "testnet"     # or "mainnet"
```

### Or Add to .env File
Create/edit `.env` file in the project root:
```env
BLOCKFROST_API_KEY=your_project_id_here
BLOCKFROST_PROJECT=preview
CARDANO_NETWORK=testnet
```

## Step 3: Verify Setup

### Check Environment Variable
```powershell
echo $env:BLOCKFROST_API_KEY
```

### Test with curl
```powershell
$headers = @{"project_id" = "your_project_id"}
Invoke-WebRequest -Uri "https://cardano-preview.blockfrost.io/api/v0/blocks/latest" `
  -Headers $headers | Select-Object -ExpandProperty Content
```

### Test from Python
```python
import os
import requests

api_key = os.getenv("BLOCKFROST_API_KEY")
headers = {"project_id": api_key}
resp = requests.get(
    "https://cardano-preview.blockfrost.io/api/v0/blocks/latest",
    headers=headers
)
print(resp.json())
```

## Step 4: Start Services with Blockfrost

### Terminal 1: Orchestrator
```powershell
cd c:\Users\Asus\Desktop\hackathon\aurevguard
python -m uvicorn masumi.orchestrator.app:app --port 8080
```

### Terminal 2: Backend
```powershell
cd c:\Users\Asus\Desktop\hackathon\aurevguard\apps\backend
npm start
```

### Terminal 3: Frontend
```powershell
cd c:\Users\Asus\Desktop\hackathon\aurevguard\apps\frontend
npm run dev
```

### Terminal 4: AI Agent (Optional)
```powershell
cd c:\Users\Asus\Desktop\hackathon\aurevguard
python agents/ai_model/src/agent_stub.py
```

## Step 5: Use the Frontend

1. Navigate to http://localhost:5173
2. Go to **Risk** page
3. Enter a Cardano wallet address (testnet format: `addr_test1...`)
4. Click **Live Blockfrost (Real Data - costs ~0.17 ADA)**
5. Click **Analyze** button

### Getting Testnet Addresses
- Use Cardano Faucet: https://docs.cardano.org/cardano-testnet/tools/faucet/
- Request testnet ADA to fund test addresses
- Then query those addresses in the frontend

## Step 6: Monitor the Pipeline

The backend will:
1. ✅ Fetch live transactions from Blockfrost for the wallet
2. ✅ Extract 8-dimensional features (transaction counts, values, etc.)
3. ✅ Send features to orchestrator for ML prediction
4. ✅ Return risk score and anomaly detection results

## Troubleshooting

### Error: "Failed to fetch"
- **Cause**: Backend not running or CORS issue
- **Fix**: Ensure backend on port 5000 is running: `netstat -ano | Select-String ":5000"`

### Error: "Blockfrost API Key invalid"
- **Cause**: API key not set or incorrect
- **Fix**: Verify `$env:BLOCKFROST_API_KEY` is set correctly

### Error: "Rate limit exceeded"
- **Cause**: Too many requests to Blockfrost
- **Fix**: Free tier has rate limits; wait a minute or upgrade plan

### Error: "Wallet address not found"
- **Cause**: Address doesn't exist on the network or no transactions
- **Fix**: Use an address with transaction history

## Cost Information

### Blockfrost Preview Testnet
- **Cost**: ~0.17 testnet ADA per wallet analysis
- **Why**: Each query to Blockfrost costs UTXOs (micro-transactions)
- **Free Tier**: Includes enough for ~100 queries before needing more testnet ADA

### Blockfrost Mainnet
- **Cost**: Depends on query volume
- **Pricing**: Check https://blockfrost.io/pricing

## API Flow Diagram

```
Frontend
   ↓ (wallet address)
Backend (/api/real-pipeline/start)
   ↓ (spawn Python subprocess)
live_pipeline.py (Python)
   ↓ (HTTP requests)
Blockfrost API (HTTPS)
   ↓ (transaction data)
feature_engineering.py (Python)
   ↓ (8-dim features)
Orchestrator (/masumi/route)
   ↓ (ML models)
Response (risk_score, anomaly_score)
   ↓
Frontend (display results)
```

## Feature Dimensions

The pipeline extracts these 8 features from Blockfrost data:
1. **tx_count_24h**: Transaction count in last 24 hours
2. **total_value_24h**: Total ADA moved in last 24 hours
3. **largest_value_24h**: Largest single transaction value
4. **std_value_24h**: Standard deviation of transaction values
5. **unique_counterparts_24h**: Number of unique addresses interacted with
6. **entropy_of_destinations**: Randomness of destination patterns
7. **share_of_daily_volume**: Wallet's share of daily Cardano volume
8. **relative_max_vs_global**: Largest tx vs global max for that day

## Next Steps

1. ✅ Set `BLOCKFROST_API_KEY` environment variable
2. ✅ Start all services (orchestrator, backend, frontend, AI agent)
3. ✅ Navigate to Risk page on frontend
4. ✅ Select "Live Blockfrost (Real Data)" mode
5. ✅ Enter a testnet wallet address
6. ✅ Click Analyze and watch the pipeline run!

---

**Documentation Date**: November 30, 2025  
**Last Updated**: When you set up your Blockfrost API key
