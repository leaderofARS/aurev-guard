import masumiMock from '../services/masumiMock.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// POST /agent/decision
export const getAgentDecision = asyncHandler(async (req, res) => {
  const { riskScore, address } = req.body;

  if (riskScore === undefined || !address) {
    return res.status(400).json({
      success: false,
      error: 'riskScore and address are required',
    });
  }

  // Get Masumi agent decision
  const decision = await masumiMock.getAgentDecision({ riskScore, address });

  res.json({
    success: true,
    data: decision,
  });
});
