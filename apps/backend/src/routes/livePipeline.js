import express from 'express';
import {
  startPipeline,
  getPipelineStatus,
  getPipelineResults,
} from '../controllers/livePipelineController.js';

const router = express.Router();

// Start live pipeline analysis
router.post('/start', startPipeline);

// Get pipeline job status
router.get('/status/:jobId', getPipelineStatus);

// Get all pipeline results for wallet
router.get('/results/:walletAddress', getPipelineResults);

export default router;
