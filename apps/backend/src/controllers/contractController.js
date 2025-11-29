import aikenMock from '../services/aikenMock.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// POST /contract/log
export const logContract = asyncHandler(async (req, res) => {
  const { address, action } = req.body;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'address is required',
    });
  }

  // Generate contract log and unsigned tx
  const contractLog = await aikenMock.generateContractLog({
    address,
    action: action || 'compliance_log',
  });

  res.json({
    success: true,
    data: contractLog,
  });
});
