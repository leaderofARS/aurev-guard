import express from 'express';
import { logContract } from '../controllers/contractController.js';

const router = express.Router();

// POST /contract/log
router.post('/log', logContract);

export default router;
