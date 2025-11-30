# Live Pipeline Transaction Data Guide

## Overview

This document explains how to set up the **Live Pipeline** (`agents/ai_model/src/live_pipeline.py`) to process real-time blockchain transaction data from the Cardano testnet, enabling continuous risk assessment and anomaly detection.

---

## Architecture

```
┌─────────────────────────┐
│   Frontend User         │
│   Pays 2 ADA            │
└────────────┬────────────┘
             │
             │ Payment transaction
             │
┌────────────▼────────────┐
│   Backend (Port 5000)   │
│   Payment Verified      │
└────────────┬────────────┘
             │
             │ Triggers live pipeline
             │
┌────────────▼────────────┐
│   Live Pipeline         │
│   (Async Job)           │
└────────────┬────────────┘
             │
             │ Queries blockchain
             │
┌────────────▼────────────┐
│   Blockfrost API        │
│   Cardano Testnet       │
└────────────┬────────────┘
             │
             │ Returns transactions
             │
┌────────────▼────────────┐
│   Feature Engineering   │
│   18 dimensions         │
└────────────┬────────────┘
             │
             │ Feeds data to
             │
┌────────────▼────────────┐
│   Orchestrator Port 8080│
│   AI Models             │
└────────────┬────────────┘
             │
             │ Risk + Anomaly scores
             │
┌────────────▼────────────┐
│   Store Results         │
│   Database              │
└────────────┬────────────┘
             │
             │ WebSocket to
             │
┌────────────▼────────────┐
│   Frontend Dashboard    │
│   Real-time updates     │
└─────────────────────────┘
```

---

## Step 1: Live Pipeline Module

**File:** `agents/ai_model/src/live_pipeline.py`

```python
import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import aiohttp
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import requests

logger = logging.getLogger(__name__)

class LivePipeline:
    """
    Real-time transaction data pipeline for blockchain analysis.
    Fetches data from Blockfrost, processes it, and sends to orchestrator.
    """
    
    def __init__(
        self,
        blockfrost_api_key: str,
        orchestrator_url: str = "http://localhost:8080",
        network: str = "testnet"
    ):
        self.blockfrost_api_key = blockfrost_api_key
        self.orchestrator_url = orchestrator_url
        self.network = network
        self.base_url = f"https://cardano-{network}.blockfrost.io/api/v0"
        self.session = None
        
    async def init_session(self):
        """Initialize aiohttp session"""
        if self.session is None:
            self.session = aiohttp.ClientSession(
                headers={'project_id': self.blockfrost_api_key}
            )
    
    async def close_session(self):
        """Close aiohttp session"""
        if self.session:
            await self.session.close()
    
    async def fetch_wallet_transactions(
        self,
        wallet_address: str,
        count: int = 100
    ) -> List[Dict]:
        """Fetch transactions for a wallet from Blockfrost"""
        try:
            url = f"{self.base_url}/addresses/{wallet_address}/transactions"
            async with self.session.get(url, params={'count': count}) as resp:
                if resp.status != 200:
                    logger.error(f"Failed to fetch transactions: {resp.status}")
                    return []
                
                transactions = await resp.json()
                return transactions
        except Exception as e:
            logger.error(f"Error fetching transactions: {e}")
            return []
    
    async def fetch_transaction_details(
        self,
        tx_hash: str
    ) -> Dict:
        """Fetch detailed information about a transaction"""
        try:
            url = f"{self.base_url}/txs/{tx_hash}"
            async with self.session.get(url) as resp:
                if resp.status != 200:
                    return {}
                
                return await resp.json()
        except Exception as e:
            logger.error(f"Error fetching transaction details: {e}")
            return {}
    
    async def fetch_utxos(self, wallet_address: str) -> List[Dict]:
        """Fetch current UTXOs for wallet"""
        try:
            url = f"{self.base_url}/addresses/{wallet_address}/utxos"
            async with self.session.get(url) as resp:
                if resp.status != 200:
                    return []
                
                return await resp.json()
        except Exception as e:
            logger.error(f"Error fetching UTXOs: {e}")
            return []
    
    def extract_features(
        self,
        wallet_address: str,
        transactions: List[Dict],
        utxos: List[Dict]
    ) -> Dict:
        """Extract 18 features from transaction data"""
        
        features = {}
        
        # Feature 1: Transaction count (last 24h)
        now = datetime.now()
        day_ago = now - timedelta(hours=24)
        recent_txs = [
            tx for tx in transactions
            if datetime.fromisoformat(tx.get('block_time', now)) > day_ago
        ]
        features['tx_count_24h'] = len(recent_txs)
        
        # Feature 2-3: Total received and sent
        total_received = sum(
            int(utxo['amount'][0]['quantity'])
            for utxo in utxos
        ) // 1000000  # Convert to ADA
        features['total_received'] = total_received
        
        total_sent = 0
        for tx in transactions:
            if 'output_amount' in tx:
                sent = sum(
                    int(amt['quantity'])
                    for amt in tx['output_amount']
                ) // 1000000
                total_sent += sent
        features['total_sent'] = total_sent
        
        # Feature 4-5: Transaction size statistics
        tx_sizes = [
            int(tx.get('size', 0))
            for tx in transactions
        ]
        features['max_tx_size'] = max(tx_sizes) if tx_sizes else 0
        features['avg_tx_size'] = np.mean(tx_sizes) if tx_sizes else 0
        
        # Feature 6: Net balance change
        features['net_balance_change'] = total_received - total_sent
        
        # Feature 7: Unique counterparties
        counterparties = set()
        for tx in transactions:
            if 'inputs' in tx:
                for input_addr in tx['inputs']:
                    counterparties.add(input_addr.get('address', ''))
            if 'outputs' in tx:
                for output_addr in tx['outputs']:
                    counterparties.add(output_addr.get('address', ''))
        features['unique_counterparties'] = len(counterparties)
        
        # Feature 8: Transactions per day
        if len(transactions) > 0:
            time_span_days = max(
                (datetime.now() - datetime.fromisoformat(
                    transactions[-1].get('block_time', now)
                )).days,
                1
            )
            features['tx_per_day'] = len(transactions) / max(time_span_days, 1)
        else:
            features['tx_per_day'] = 0
        
        # Feature 9: Active days
        active_days = set()
        for tx in transactions:
            tx_date = datetime.fromisoformat(
                tx.get('block_time', now)
            ).date()
            active_days.add(tx_date)
        features['active_days'] = len(active_days)
        
        # Feature 10: Burstiness
        if len(tx_sizes) > 1:
            features['burstiness'] = np.std(tx_sizes) ** 2
        else:
            features['burstiness'] = 0
        
        # Feature 11: Collateral ratio
        collateral = sum(
            int(utxo.get('amount', [{'quantity': 0}])[0].get('quantity', 0))
            for utxo in utxos
        ) // 1000000
        features['collateral_ratio'] = (
            collateral / total_received if total_received > 0 else 0
        )
        
        # Feature 12: Smart contract flag
        smart_contract_flag = 0
        for tx in transactions:
            if 'script_hash' in tx:
                smart_contract_flag = 1
                break
        features['smart_contract_flag'] = smart_contract_flag
        
        # Feature 13: High value ratio
        high_value = sum(
            1 for tx in transactions
            if int(tx.get('fees', 0)) > 1000000
        )
        features['high_value_ratio'] = (
            high_value / len(transactions) if transactions else 0
        )
        
        # Feature 14: Counterparty diversity
        features['counterparty_diversity'] = (
            features['unique_counterparties'] /
            max(features['tx_count_24h'], 1)
        )
        
        # Feature 15: Inflow/outflow asymmetry
        total_flow = total_received + total_sent
        features['inflow_outflow_asymmetry'] = (
            abs(total_received - total_sent) /
            max(total_flow, 1)
        )
        
        # Feature 16: Timing entropy
        if transactions:
            tx_times = [
                datetime.fromisoformat(tx.get('block_time', now))
                for tx in transactions
            ]
            time_diffs = [
                (tx_times[i] - tx_times[i+1]).total_seconds()
                for i in range(len(tx_times)-1)
            ]
            if time_diffs:
                features['timing_entropy'] = np.var(time_diffs)
            else:
                features['timing_entropy'] = 0
        else:
            features['timing_entropy'] = 0
        
        # Feature 17: Velocity (transactions per hour)
        if transactions:
            time_span_hours = max(
                (datetime.now() - datetime.fromisoformat(
                    transactions[-1].get('block_time', now)
                )).total_seconds() / 3600,
                1
            )
            features['velocity_hours'] = len(transactions) / time_span_hours
        else:
            features['velocity_hours'] = 0
        
        return features
    
    async def send_to_orchestrator(
        self,
        wallet_address: str,
        features: Dict
    ) -> Dict:
        """Send features to orchestrator for prediction"""
        try:
            url = f"{self.orchestrator_url}/masumi/predict"
            
            payload = {
                'wallet_address': wallet_address,
                'features': features
            }
            
            # Use requests library (synchronous wrapper around async)
            response = requests.post(
                url,
                json=payload,
                timeout=30,
                params={'include_shap': True}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Orchestrator request failed: {response.status_code}")
                return {'error': 'Orchestrator request failed'}
                
        except Exception as e:
            logger.error(f"Error sending to orchestrator: {e}")
            return {'error': str(e)}
    
    async def process_wallet(
        self,
        wallet_address: str
    ) -> Dict:
        """Process a single wallet through the entire pipeline"""
        logger.info(f"Processing wallet: {wallet_address}")
        
        try:
            # Initialize session if needed
            await self.init_session()
            
            # Step 1: Fetch transaction data
            logger.info("Fetching transactions...")
            transactions = await self.fetch_wallet_transactions(
                wallet_address,
                count=100
            )
            
            # Step 2: Fetch current UTXOs
            logger.info("Fetching UTXOs...")
            utxos = await self.fetch_utxos(wallet_address)
            
            # Step 3: Extract features
            logger.info("Extracting features...")
            features = self.extract_features(
                wallet_address,
                transactions,
                utxos
            )
            
            # Step 4: Send to orchestrator
            logger.info("Sending to orchestrator...")
            prediction = await self.send_to_orchestrator(
                wallet_address,
                features
            )
            
            # Step 5: Return results
            result = {
                'wallet_address': wallet_address,
                'timestamp': datetime.now().isoformat(),
                'features': features,
                'prediction': prediction,
                'transaction_count': len(transactions),
                'utxo_count': len(utxos),
                'status': 'success'
            }
            
            logger.info(f"Processing complete for {wallet_address}")
            return result
            
        except Exception as e:
            logger.error(f"Error processing wallet: {e}")
            return {
                'wallet_address': wallet_address,
                'error': str(e),
                'status': 'failed'
            }
    
    async def process_batch(
        self,
        wallet_addresses: List[str],
        concurrent: int = 5
    ) -> List[Dict]:
        """Process multiple wallets concurrently"""
        logger.info(f"Processing {len(wallet_addresses)} wallets")
        
        await self.init_session()
        
        results = []
        semaphore = asyncio.Semaphore(concurrent)
        
        async def process_with_semaphore(addr):
            async with semaphore:
                return await self.process_wallet(addr)
        
        tasks = [process_with_semaphore(addr) for addr in wallet_addresses]
        results = await asyncio.gather(*tasks)
        
        await self.close_session()
        
        return results


# Example usage
async def main():
    pipeline = LivePipeline(
        blockfrost_api_key='your_api_key',
        orchestrator_url='http://localhost:8080',
        network='testnet'
    )
    
    # Process single wallet
    result = await pipeline.process_wallet(
        'addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl'
    )
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    asyncio.run(main())
```

---

## Step 2: Backend Live Pipeline Endpoint

**File:** `apps/backend/src/routes/livePipeline.js`

```javascript
import express from 'express';
import { spawn } from 'child_process';
import { checkPayment } from '../middleware/walletAuth.js';
import { PipelineJob, PipelineResult } from '../models/Pipeline.js';

const router = express.Router();

// Start live pipeline analysis
router.post('/api/live-pipeline/start', checkPayment, async (req, res) => {
  try {
    const { walletAddress, transactionId } = req.body;
    
    // Create job record
    const job = new PipelineJob({
      walletAddress,
      transactionId,
      status: 'processing',
      startTime: new Date(),
      paymentVerified: true
    });
    
    await job.save();
    
    // Trigger Python live pipeline asynchronously
    startPythonPipeline(walletAddress, job._id);
    
    res.json({
      jobId: job._id,
      walletAddress,
      status: 'started',
      message: 'Live pipeline processing started'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pipeline job status
router.get('/api/live-pipeline/status/:jobId', async (req, res) => {
  try {
    const job = await PipelineJob.findById(req.params.jobId)
      .populate('results');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({
      jobId: job._id,
      walletAddress: job.walletAddress,
      status: job.status,
      startTime: job.startTime,
      completedTime: job.completedTime,
      results: job.results,
      progress: job.progress
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pipeline results for wallet
router.get('/api/live-pipeline/results/:walletAddress', async (req, res) => {
  try {
    const results = await PipelineResult.find({
      walletAddress: req.params.walletAddress
    }).sort({ timestamp: -1 }).limit(50);
    
    res.json({
      walletAddress: req.params.walletAddress,
      results,
      count: results.length
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to spawn Python process
function startPythonPipeline(walletAddress, jobId) {
  const pythonProcess = spawn('python', [
    'agents/ai_model/src/live_pipeline.py',
    '--wallet', walletAddress,
    '--job-id', jobId,
    '--orchestrator-url', process.env.ORCHESTRATOR_URL
  ]);
  
  pythonProcess.stdout.on('data', (data) => {
    console.log(`[${walletAddress}] ${data}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    console.error(`[${walletAddress}] Error: ${data}`);
  });
  
  pythonProcess.on('close', async (code) => {
    if (code === 0) {
      await updateJobStatus(jobId, 'completed');
    } else {
      await updateJobStatus(jobId, 'failed');
    }
  });
}

async function updateJobStatus(jobId, status) {
  await PipelineJob.findByIdAndUpdate(jobId, {
    status,
    completedTime: new Date()
  });
}

export default router;
```

---

## Step 3: Frontend Live Pipeline Component

**File:** `apps/frontend/src/components/LivePipelineProcessor.jsx`

```javascript
import React, { useState } from 'react';
import { Play, Pause, RefreshCw } from 'lucide-react';
import axios from 'axios';

const LivePipelineProcessor = ({ walletAddress, onComplete }) => {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const startPipeline = async (transactionId) => {
    setStatus('processing');
    setError(null);
    
    try {
      const response = await axios.post(
        'http://localhost:5000/api/live-pipeline/start',
        {
          walletAddress,
          transactionId
        }
      );
      
      setJobId(response.data.jobId);
      
      // Poll for status
      pollJobStatus(response.data.jobId);
      
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setStatus('error');
    }
  };

  const pollJobStatus = async (jId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/live-pipeline/status/${jId}`
        );
        
        setProgress(response.data.progress || 0);
        
        if (response.data.status === 'completed') {
          clearInterval(interval);
          setStatus('completed');
          setResults(response.data.results);
          if (onComplete) onComplete(response.data.results);
        } else if (response.data.status === 'failed') {
          clearInterval(interval);
          setStatus('error');
          setError('Pipeline processing failed');
        }
        
      } catch (err) {
        console.error('Status check failed:', err);
      }
    }, 2000); // Check every 2 seconds
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Live Pipeline Processing
      </h3>

      {status === 'idle' && (
        <button
          onClick={() => startPipeline('txn_id_here')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
        >
          <Play size={18} />
          Start Analysis
        </button>
      )}

      {status === 'processing' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="animate-spin text-blue-600" />
            <span className="text-blue-800">Processing...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">{progress}% complete</p>
        </div>
      )}

      {status === 'completed' && results && (
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-800 font-semibold">Analysis Complete!</p>
          <div className="mt-3 space-y-2 text-sm">
            <p>Risk Score: <strong>{(results.prediction.risk_score * 100).toFixed(1)}%</strong></p>
            <p>Anomaly Score: <strong>{(results.prediction.anomaly_score * 100).toFixed(1)}%</strong></p>
            <p>Transactions: <strong>{results.transaction_count}</strong></p>
            <p>Timestamp: <strong>{new Date(results.timestamp).toLocaleString()}</strong></p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default LivePipelineProcessor;
```

---

## Configuration

**Backend `.env`:**

```env
BLOCKFROST_API_KEY=your_blockfrost_key
ORCHESTRATOR_URL=http://localhost:8080
CARDANO_NETWORK=testnet
LIVE_PIPELINE_TIMEOUT=300
LIVE_PIPELINE_POLL_INTERVAL=2000
```

---

## Testing

```bash
# Test live pipeline directly
python agents/ai_model/src/live_pipeline.py \
  --wallet addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl \
  --blockfrost-key your_key

# Test via backend
curl -X POST http://localhost:5000/api/live-pipeline/start \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "addr_test1qz...",
    "transactionId": "txn_id_here"
  }'
```

---

## Next Steps

1. Deploy live pipeline service
2. Set up WebSocket for real-time updates
3. Configure job scheduling and retention
4. Implement result storage and retrieval

