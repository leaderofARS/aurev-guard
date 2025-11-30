import { config } from '../config/index.js';

// Mock Masumi Agent service
class MasumiMock {
  async getAgentDecision(scanData) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, config.MASUMI_DELAY));

    return {
      agentId: 'masumi-agent-001',
      riskAssessment: {
        riskLevel: this.calculateRiskLevel(scanData.riskScore),
        confidence: 0.95,
        recommendation: this.getRecommendation(scanData.riskScore),
      },
      agentTimestamp: new Date().toISOString(),
    };
  }

  calculateRiskLevel(riskScore) {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    return 'LOW';
  }

  getRecommendation(riskScore) {
    if (riskScore >= 80) return 'Block immediately';
    if (riskScore >= 60) return 'Review and potentially block';
    if (riskScore >= 40) return 'Monitor closely';
    return 'Allow with standard monitoring';
  }
}

export default new MasumiMock();
