import { asyncHandler } from '../middleware/errorHandler.js';
import historyStore from '../store/HistoryStore.js';

// GET /risk/history/:address
export const getHistory = asyncHandler(async (req, res) => {
  const { address } = req.params;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'address is required',
    });
  }

  const history = historyStore.getHistory(address);

  res.json({
    success: true,
    data: {
      address,
      totalScans: history.length,
      history: history,
    },
  });
});
