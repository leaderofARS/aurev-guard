import { spawn } from 'child_process';
import { asyncHandler } from '../middleware/errorHandler.js';
import { PipelineJob, PipelineResult } from '../models/Pipeline.js';

// In-memory job tracking (will be replaced with database)
const jobsMap = new Map();

/**
 * Start live pipeline analysis for a wallet
 * POST /api/live-pipeline/start
 */
export const startPipeline = asyncHandler(async (req, res) => {
  const { walletAddress, transactionId } = req.body;

  if (!walletAddress) {
    return res.status(400).json({
      success: false,
      error: 'walletAddress is required',
    });
  }

  try {
    // Create job record
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      jobId,
      walletAddress,
      transactionId: transactionId || '',
      status: 'processing',
      startTime: new Date(),
      completedTime: null,
      progress: 10,
      paymentVerified: true,
      results: null,
      error: null,
    };

    jobsMap.set(jobId, job);

    // Trigger Python live pipeline asynchronously
    startPythonPipeline(walletAddress, jobId);

    res.json({
      success: true,
      jobId,
      walletAddress,
      status: 'started',
      message: 'Live pipeline processing started',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get pipeline job status
 * GET /api/live-pipeline/status/:jobId
 */
export const getPipelineStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    return res.status(400).json({
      success: false,
      error: 'jobId is required',
    });
  }

  try {
    const job = jobsMap.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      jobId: job.jobId,
      walletAddress: job.walletAddress,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      completedTime: job.completedTime,
      results: job.results,
      error: job.error,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get all pipeline results for a wallet
 * GET /api/live-pipeline/results/:walletAddress
 */
export const getPipelineResults = asyncHandler(async (req, res) => {
  const { walletAddress } = req.params;

  if (!walletAddress) {
    return res.status(400).json({
      success: false,
      error: 'walletAddress is required',
    });
  }

  try {
    const results = Array.from(jobsMap.values())
      .filter(job => job.walletAddress === walletAddress)
      .filter(job => job.status === 'completed' && job.results)
      .sort((a, b) => b.completedTime - a.completedTime)
      .slice(0, 50)
      .map(job => ({
        jobId: job.jobId,
        timestamp: job.completedTime,
        results: job.results,
      }));

    res.json({
      success: true,
      walletAddress,
      results,
      count: results.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Helper function to spawn Python process
 */
function startPythonPipeline(walletAddress, jobId) {
  const job = jobsMap.get(jobId);
  if (!job) return;

  try {
    // Simulate async processing
    const processingSimulation = setInterval(() => {
      const currentJob = jobsMap.get(jobId);
      if (!currentJob) {
        clearInterval(processingSimulation);
        return;
      }

      if (currentJob.progress < 90) {
        currentJob.progress += Math.random() * 20;
      }

      if (currentJob.progress >= 90 && currentJob.status === 'processing') {
        currentJob.progress = 100;
        currentJob.status = 'completed';
        currentJob.completedTime = new Date();

        // Mock orchestrator response
        currentJob.results = {
          wallet_address: walletAddress,
          timestamp: new Date().toISOString(),
          features: {
            tx_count_24h: Math.floor(Math.random() * 50),
            total_received: Math.floor(Math.random() * 1000),
            total_sent: Math.floor(Math.random() * 800),
            max_tx_size: Math.floor(Math.random() * 500000),
            avg_tx_size: Math.floor(Math.random() * 200000),
            net_balance_change: Math.random() * 1000 - 500,
            unique_counterparties: Math.floor(Math.random() * 30),
            tx_per_day: (Math.random() * 10).toFixed(2),
            active_days: Math.floor(Math.random() * 365),
            burstiness: Math.random(),
            collateral_ratio: Math.random(),
            smart_contract_flag: Math.random() > 0.7 ? 1 : 0,
            high_value_ratio: Math.random(),
            counterparty_diversity: Math.random(),
            inflow_outflow_asymmetry: Math.random(),
            timing_entropy: Math.random() * 1000,
            velocity_hours: Math.random() * 50,
          },
          prediction: {
            risk_score: Math.random(),
            anomaly_score: Math.random(),
            prediction: Math.random() > 0.5 ? 'HIGH_RISK' : 'LOW_RISK',
            shap_values: {
              feature_importance: {
                tx_count_24h: Math.random(),
                total_received: Math.random(),
                total_sent: Math.random(),
                unique_counterparties: Math.random(),
                tx_per_day: Math.random(),
              },
            },
          },
          transaction_count: Math.floor(Math.random() * 200),
          utxo_count: Math.floor(Math.random() * 50),
          status: 'success',
        };

        clearInterval(processingSimulation);
      }
    }, 1000);

    // Fallback timeout
    setTimeout(() => {
      const timeoutJob = jobsMap.get(jobId);
      if (timeoutJob && timeoutJob.status === 'processing') {
        timeoutJob.status = 'failed';
        timeoutJob.error = 'Processing timeout';
        timeoutJob.completedTime = new Date();
      }
    }, 60000); // 60 second timeout

  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    job.completedTime = new Date();
  }
}

export default {
  startPipeline,
  getPipelineStatus,
  getPipelineResults,
};
