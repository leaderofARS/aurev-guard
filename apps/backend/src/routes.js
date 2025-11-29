import express from 'express';
import {
  postScanAddress,
  postAgentDecision,
  postContractLog,
  getDecision,
  postAnchor
} from './controllers.js';

const router = express.Router();

// Main endpoints
router.post('/scan/address', postScanAddress);
router.post('/agent/decision', postAgentDecision);
router.post('/contract/log', postContractLog);
router.get('/v1/decisions/:proofId', getDecision);
router.post('/v1/anchor', postAnchor);

export default router;