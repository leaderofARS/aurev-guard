import express from 'express';
import {
  startRealPipeline,
  getRealPipelineStatus,
  getRealPipelineResults,
} from '../controllers/realDataPipelineController.js';

const router = express.Router();

// Start real pipeline (Blockfrost + feature engineering + orchestrator)
router.post('/start', startRealPipeline);

// Get real pipeline job status
router.get('/status/:jobId', getRealPipelineStatus);

// Get all real pipeline results for wallet
router.get('/results/:walletAddress', getRealPipelineResults);

export default router;
