/**
 * Pipeline Models
 * In-memory data structures for live pipeline processing
 * Can be replaced with MongoDB models later
 */

/**
 * PipelineJob - Represents a single pipeline processing job
 */
export class PipelineJob {
  constructor({
    jobId,
    walletAddress,
    transactionId = null,
    status = 'pending', // pending, processing, completed, failed
    startTime = new Date(),
    completedTime = null,
    paymentVerified = false,
    progress = 0,
    results = null,
    error = null,
  } = {}) {
    this.jobId = jobId;
    this.walletAddress = walletAddress;
    this.transactionId = transactionId;
    this.status = status;
    this.startTime = startTime;
    this.completedTime = completedTime;
    this.paymentVerified = paymentVerified;
    this.progress = progress;
    this.results = results;
    this.error = error;
  }

  async save() {
    // Mock save - in production this would persist to MongoDB
    return this;
  }

  static async findById(id) {
    // Mock find - in production this would query MongoDB
    return null;
  }

  static async findByIdAndUpdate(id, update) {
    // Mock update - in production this would update MongoDB
    return null;
  }
}

/**
 * PipelineResult - Stores the result of a pipeline analysis
 */
export class PipelineResult {
  constructor({
    resultId,
    walletAddress,
    jobId,
    timestamp = new Date(),
    features = {},
    prediction = {},
    transactionCount = 0,
    utxoCount = 0,
    processingTime = 0, // in seconds
    orchestratorResponse = null,
  } = {}) {
    this.resultId = resultId;
    this.walletAddress = walletAddress;
    this.jobId = jobId;
    this.timestamp = timestamp;
    this.features = features;
    this.prediction = prediction;
    this.transactionCount = transactionCount;
    this.utxoCount = utxoCount;
    this.processingTime = processingTime;
    this.orchestratorResponse = orchestratorResponse;
  }

  async save() {
    // Mock save - in production this would persist to MongoDB
    return this;
  }

  static async find(query) {
    // Mock find - in production this would query MongoDB
    return [];
  }
}

/**
 * PipelineFeatures - Data structure for the 18 extracted features
 */
export class PipelineFeatures {
  constructor(data = {}) {
    this.tx_count_24h = data.tx_count_24h || 0;
    this.total_received = data.total_received || 0;
    this.total_sent = data.total_sent || 0;
    this.max_tx_size = data.max_tx_size || 0;
    this.avg_tx_size = data.avg_tx_size || 0;
    this.net_balance_change = data.net_balance_change || 0;
    this.unique_counterparties = data.unique_counterparties || 0;
    this.tx_per_day = data.tx_per_day || 0;
    this.active_days = data.active_days || 0;
    this.burstiness = data.burstiness || 0;
    this.collateral_ratio = data.collateral_ratio || 0;
    this.smart_contract_flag = data.smart_contract_flag || 0;
    this.high_value_ratio = data.high_value_ratio || 0;
    this.counterparty_diversity = data.counterparty_diversity || 0;
    this.inflow_outflow_asymmetry = data.inflow_outflow_asymmetry || 0;
    this.timing_entropy = data.timing_entropy || 0;
    this.velocity_hours = data.velocity_hours || 0;
  }

  toArray() {
    return [
      this.tx_count_24h,
      this.total_received,
      this.total_sent,
      this.max_tx_size,
      this.avg_tx_size,
      this.net_balance_change,
      this.unique_counterparties,
      this.tx_per_day,
      this.active_days,
      this.burstiness,
      this.collateral_ratio,
      this.smart_contract_flag,
      this.high_value_ratio,
      this.counterparty_diversity,
      this.inflow_outflow_asymmetry,
      this.timing_entropy,
      this.velocity_hours,
    ];
  }

  toObject() {
    return {
      tx_count_24h: this.tx_count_24h,
      total_received: this.total_received,
      total_sent: this.total_sent,
      max_tx_size: this.max_tx_size,
      avg_tx_size: this.avg_tx_size,
      net_balance_change: this.net_balance_change,
      unique_counterparties: this.unique_counterparties,
      tx_per_day: this.tx_per_day,
      active_days: this.active_days,
      burstiness: this.burstiness,
      collateral_ratio: this.collateral_ratio,
      smart_contract_flag: this.smart_contract_flag,
      high_value_ratio: this.high_value_ratio,
      counterparty_diversity: this.counterparty_diversity,
      inflow_outflow_asymmetry: this.inflow_outflow_asymmetry,
      timing_entropy: this.timing_entropy,
      velocity_hours: this.velocity_hours,
    };
  }
}

/**
 * PipelineConfig - Configuration for pipeline execution
 */
export class PipelineConfig {
  constructor({
    blockfrostApiKey = process.env.BLOCKFROST_API_KEY || '',
    orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://localhost:8080',
    cardanoNetwork = process.env.CARDANO_NETWORK || 'testnet',
    timeoutSeconds = 300,
    pollIntervalMs = 2000,
  } = {}) {
    this.blockfrostApiKey = blockfrostApiKey;
    this.orchestratorUrl = orchestratorUrl;
    this.cardanoNetwork = cardanoNetwork;
    this.timeoutSeconds = timeoutSeconds;
    this.pollIntervalMs = pollIntervalMs;
  }
}

export default {
  PipelineJob,
  PipelineResult,
  PipelineFeatures,
  PipelineConfig,
};
