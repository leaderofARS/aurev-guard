import fetch from 'node-fetch';
import { asyncHandler } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';

// In-memory job tracking (simple Map)
const jobsMap = new Map();

// Helper: simple feature extractor (mock). Replace with Blockfrost feature extraction later.
function extractWalletFeatures(walletAddress) {
  return {
    wallet_address: walletAddress,
    tx_count_24h: Math.floor(Math.random() * 50),
    total_value_24h: Math.floor(Math.random() * 10000000),
    largest_value_24h: Math.floor(Math.random() * 5000000),
    std_value_24h: Math.floor(Math.random() * 500000),
    unique_counterparts_24h: Math.floor(Math.random() * 30),
    entropy_of_destinations: Math.random() * 5,
    share_of_daily_volume: Math.random(),
    relative_max_vs_global: Math.random(),
  };
}

// Call orchestrator for AI prediction (route workflow)
async function callOrchestratorAIPrediction(features) {
  try {
    const orchestratorUrl = config.ORCHESTRATOR_URL || 'http://localhost:8080';
    const payload = { workflow: 'ai_predict', payload: features };
    const resp = await fetch(`${orchestratorUrl}/masumi/route` .replace('/masumi','/masumi') , {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error(`Orchestrator error: ${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
  } catch (err) {
    console.error('Orchestrator call failed:', err);
    // fallback mock
    return {
      workflow: 'ai_predict',
      status: 'error',
      error: err.message,
      prediction: {
        data: {
          wallet_address: features.wallet_address,
          risk_score: Math.random(),
          risk_label: Math.random() > 0.6 ? 'HIGH' : 'LOW',
          anomaly_score: Math.random(),
          is_anomaly: Math.random() > 0.8,
          confidence: Math.random(),
        },
      },
    };
  }
}

// Utility sleep
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Simulate processing asynchronously and call orchestrator when done
async function simulateProcessingAndPredict(jobId, walletAddress, features) {
  const job = jobsMap.get(jobId);
  if (!job) return;

  try {
    // Simulate staged progress
    for (let p = 10; p < 95; p += Math.floor(Math.random() * 20) + 5) {
      await sleep(800 + Math.floor(Math.random() * 400));
      const current = jobsMap.get(jobId);
      if (!current) return;
      current.progress = Math.min(95, p);
      jobsMap.set(jobId, current);
    }

    // Finalize
    const orchestratorResult = await callOrchestratorAIPrediction({ wallet_address: walletAddress, ...features });

    const aiPrediction = (orchestratorResult && orchestratorResult.prediction) ? (orchestratorResult.prediction.data || orchestratorResult.prediction) : {};

    const finalJob = jobsMap.get(jobId) || job;
    finalJob.progress = 100;
    finalJob.status = 'completed';
    finalJob.completedTime = new Date();
    finalJob.results = {
      wallet_address: walletAddress,
      timestamp: new Date().toISOString(),
      features,
      prediction: {
        risk_score: aiPrediction.risk_score ?? Math.random(),
        risk_label: aiPrediction.risk_label ?? (Math.random() > 0.6 ? 'HIGH' : 'LOW'),
        anomaly_score: aiPrediction.anomaly_score ?? 0,
        is_anomaly: aiPrediction.is_anomaly ?? false,
        confidence: aiPrediction.confidence ?? 0.5,
      },
      status: 'success',
      orchestrator_response: aiPrediction,
    };
    jobsMap.set(jobId, finalJob);
    console.log(`✅ Pipeline completed for ${walletAddress}:`, finalJob.results);
  } catch (err) {
    const failed = jobsMap.get(jobId) || job;
    failed.status = 'failed';
    failed.error = err.message;
    failed.completedTime = new Date();
    jobsMap.set(jobId, failed);
    console.error('Processing failed for job', jobId, err);
  }
}

// Start pipeline handler
const startPipeline = asyncHandler(async (req, res) => {
  const { walletAddress, transactionId } = req.body || {};
  if (!walletAddress) {
    return res.status(400).json({ success: false, error: 'walletAddress is required' });
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const features = extractWalletFeatures(walletAddress);

  const jobRecord = {
    jobId,
    walletAddress,
    transactionId: transactionId || '',
    status: 'processing',
    startTime: new Date(),
    completedTime: null,
    progress: 10,
    results: null,
    error: null,
  };

  jobsMap.set(jobId, jobRecord);

  // Run simulation in background
  simulateProcessingAndPredict(jobId, walletAddress, features);

  return res.json({ success: true, jobId, walletAddress, status: 'started', message: 'Live pipeline processing started' });
});

// Status endpoint
const getPipelineStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!jobId) return res.status(400).json({ success: false, error: 'jobId is required' });
  const job = jobsMap.get(jobId);
  if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
  return res.json({ success: true, jobId: job.jobId, walletAddress: job.walletAddress, status: job.status, progress: job.progress, startTime: job.startTime, completedTime: job.completedTime, results: job.results, error: job.error });
});

// Results endpoint
const getPipelineResults = asyncHandler(async (req, res) => {
  const { walletAddress } = req.params;
  if (!walletAddress) return res.status(400).json({ success: false, error: 'walletAddress is required' });
  const results = Array.from(jobsMap.values()).filter(j => j.walletAddress === walletAddress && j.status === 'completed' && j.results).sort((a,b) => b.completedTime - a.completedTime).slice(0,50).map(j => ({ jobId: j.jobId, timestamp: j.completedTime, results: j.results }));
  return res.json({ success: true, walletAddress, results, count: results.length });
});

export { startPipeline, getPipelineStatus, getPipelineResults };
