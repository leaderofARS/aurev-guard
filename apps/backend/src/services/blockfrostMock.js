import { config } from '../config/index.js';

// Mock Blockfrost blockchain data service
class BlockfrostMock {
  async getAddressInfo(address) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, config.BLOCKFROST_DELAY));

    return {
      address: address,
      balance: Math.floor(Math.random() * 10000000), // Random balance in lovelace
      txCount: Math.floor(Math.random() * 500),
      stakingAddress: `stake1${Math.random().toString(36).substr(2, 50)}`,
      firstTx: '2021-01-15T12:30:00Z',
      lastTx: new Date().toISOString(),
    };
  }

  async getAddressTransactions(address, limit = 10) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, config.BLOCKFROST_DELAY));

    return {
      address: address,
      transactions: Array.from({ length: limit }, (_, i) => ({
        txHash: `tx${Math.random().toString(36).substr(2, 60)}`,
        blockHeight: 8000000 + i,
        timestamp: new Date(Date.now() - i * 86400000).toISOString(),
        amount: Math.floor(Math.random() * 5000000),
      })),
    };
  }
}

export default new BlockfrostMock();
