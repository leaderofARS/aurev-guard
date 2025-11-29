import express from 'express';
import { getHistory } from '../controllers/riskController.js';

const router = express.Router();

// GET /risk/history/:address
router.get('/history/:address', getHistory);

export default router;
