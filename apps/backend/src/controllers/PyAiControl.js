import { asyncHandler } from '../middleware/errorHandler.js';

// POST /ai/score (Python stub – returns mock response)
export const getScore = asyncHandler(async (req, res) => {
  const { address, data } = req.body;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'address is required',
    });
  }

  // Mock AI scoring response
  const aiScore = {
    address,
    complianceScore: Math.floor(Math.random() * 100),
    riskFactors: [
      'high_transaction_frequency',
      'unusual_amount_patterns',
      'sanctioned_wallet_interaction',
    ],
    modelVersion: '1.0.0',
    computedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: aiScore,
  });
});
