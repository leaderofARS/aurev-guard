import { config } from '../config/index.js';

// Mock Aiken validator service
class AikenMock {
  async generateContractLog(contractData) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, config.AIKEN_DELAY));

    // Mock unsigned transaction hex
    const unsignedTxHex = this.generateMockTxHex();

    return {
      contractId: this.generateContractId(),
      unsignedTxHex: unsignedTxHex,
      logEntry: {
        action: contractData.action || 'compliance_log',
        address: contractData.address,
        timestamp: new Date().toISOString(),
        status: 'pending_signature',
      },
      validationStatus: 'passed',
    };
  }

  generateMockTxHex() {
    return (
      '84a4' +
      Math.random().toString(16).substring(2).padEnd(64, '0').substring(0, 64) +
      Math.random().toString(16).substring(2).padEnd(64, '0').substring(0, 64)
    );
  }

  generateContractId() {
    return 'contract_' + Math.random().toString(36).substr(2, 9);
  }
}

export default new AikenMock();
