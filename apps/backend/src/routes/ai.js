import express from 'express';
import { getScore } from '../controllers/PyAiControl.js';

const router = express.Router();

// POST /ai/score
router.post('/score', getScore);

export default router;
