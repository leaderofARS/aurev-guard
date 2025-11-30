import { asyncHandler } from './errorHandler.js';

/**
 * Middleware to verify wallet payment
 * In production, this would check blockchain transaction
 */
export const checkPayment = asyncHandler(async (req, res, next) => {
  try {
    const { walletAddress, transactionId } = req.body;

    // Validate required fields
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress is required',
      });
    }

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'transactionId is required for payment verification',
      });
    }

    // Mock payment verification
    // In production, this would:
    // 1. Query the blockchain via Blockfrost
    // 2. Verify the transaction exists
    // 3. Verify it was sent to the designated payment address
    // 4. Verify the amount (2 ADA minimum)
    // 5. Check if transaction is confirmed

    const paymentVerified = await verifyPaymentTransaction(
      walletAddress,
      transactionId
    );

    if (!paymentVerified) {
      return res.status(402).json({
        success: false,
        error: 'Payment verification failed',
        message: 'Please ensure you sent 2 ADA to the payment address',
      });
    }

    // Attach verification info to request
    req.paymentVerified = true;
    req.walletAddress = walletAddress;
    req.transactionId = transactionId;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Payment verification error',
      message: error.message,
    });
  }
});

/**
 * Mock payment verification function
 * In production, integrate with Blockfrost API
 */
async function verifyPaymentTransaction(walletAddress, transactionId) {
  try {
    // Simulate API call to verify payment
    // For now, mock success for testing
    // In production:
    /*
    const response = await fetch(
      `https://cardano-testnet.blockfrost.io/api/v0/txs/${transactionId}`,
      {
        headers: {
          'project_id': process.env.BLOCKFROST_API_KEY,
        },
      }
    );
    
    const txData = await response.json();
    
    // Verify transaction details
    // - Check if outputs contain payment address
    // - Check if amount >= 2 ADA (2,000,000 lovelace)
    // - Check if transaction is confirmed (block height exists)
    
    return txData.block && txData.output_amount[0].quantity >= 2000000;
    */

    // Mock implementation - always returns true for demo
    return true;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}

/**
 * Optional: Middleware to check if wallet is allowed
 * Could be used for rate limiting per wallet
 */
export const checkWalletWhitelist = asyncHandler(async (req, res, next) => {
  const { walletAddress } = req.body || req.params;

  if (!walletAddress) {
    return res.status(400).json({
      success: false,
      error: 'walletAddress is required',
    });
  }

  // Mock whitelist check
  // In production, this could query a database of allowed wallets
  const isWhitelisted = true; // Always true for demo

  if (!isWhitelisted) {
    return res.status(403).json({
      success: false,
      error: 'Wallet not whitelisted',
    });
  }

  next();
});

export default {
  checkPayment,
  checkWalletWhitelist,
};
