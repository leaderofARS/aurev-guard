import express from 'express';
import { getAgentDecision } from '../controllers/agentController.js';

const router = express.Router();

// POST /agent/decision
router.post('/decision', getAgentDecision);

export default router;
