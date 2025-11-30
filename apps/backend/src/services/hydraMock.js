import { config } from '../config/index.js';

// Mock Hydra L2 query service
class HydraMock {
  async queryState(stateKey) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, config.HYDRA_DELAY));

    return {
      stateKey: stateKey,
      value: {
        complianceScore: Math.floor(Math.random() * 100),
        lastUpdated: new Date().toISOString(),
        nodeId: 'hydra-node-' + Math.floor(Math.random() * 10),
      },
      proofData: {
        headId: `head_${Math.random().toString(36).substr(2, 20)}`,
        utxo: Math.floor(Math.random() * 1000),
      },
    };
  }

  async submitSnapshot(snapshotData) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, config.HYDRA_DELAY));

    return {
      snapshotId: 'snap_' + Math.random().toString(36).substr(2, 15),
      status: 'submitted',
      confirmedAt: new Date().toISOString(),
      onChainAnchor: {
        txHash: `tx${Math.random().toString(36).substr(2, 60)}`,
        blockHeight: 8000000 + Math.floor(Math.random() * 1000),
      },
    };
  }
}

export default new HydraMock();
