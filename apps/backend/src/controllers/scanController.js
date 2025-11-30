import blockfrostMock from '../services/blockfrostMock.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import historyStore from '../store/HistoryStore.js';

// POST /scan/address
export const scanAddress = asyncHandler(async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ success: false, error: 'address is required' });
  }

  // Get blockchain data
  const addressInfo = await blockfrostMock.getAddressInfo(address);
  const transactions = await blockfrostMock.getAddressTransactions(address, 5);

  // Calculate risk score (mock logic)
  const riskScore = Math.floor(Math.random() * 100);

  // Determine risk level
  let riskLevel = 'LOW';
  if (riskScore > 80) riskLevel = 'HIGH';
  else if (riskScore > 50) riskLevel = 'MEDIUM';

  const scanResult = {
    requestId: req.requestId,
    address,
    riskScore,
    riskLevel,
    explanation: `Risk score calculated based on ${transactions.transactions.length} recent transactions.`,
    modelHash: 'mock-model-v1',
    transactionCount: transactions.transactions.length,
    balance: addressInfo.balance,
    firstSeen: addressInfo.firstTx,
    lastActivity: addressInfo.lastTx,
    scanTimestamp: new Date().toISOString(),
  };

  // Store in history
  historyStore.addScan(address, scanResult);

  // Return flattened result for frontend compatibility
  res.json(scanResult);
});
