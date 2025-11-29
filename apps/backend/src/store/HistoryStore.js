// In-memory store for scan history
class HistoryStore {
  constructor() {
    this.history = {}; // { address: [scan results] }
  }

  addScan(address, scanData) {
    if (!this.history[address]) {
      this.history[address] = [];
    }
    this.history[address].push({
      ...scanData,
      timestamp: new Date().toISOString(),
    });
  }

  getHistory(address) {
    return this.history[address] || [];
  }

  clearHistory(address) {
    if (this.history[address]) {
      delete this.history[address];
    }
  }
}

export default new HistoryStore();
