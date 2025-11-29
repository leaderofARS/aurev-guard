import express from 'express';
import { scanAddress } from '../controllers/scanController.js';

const router = express.Router();

// POST /scan/address
router.post('/address', scanAddress);

export default router;
