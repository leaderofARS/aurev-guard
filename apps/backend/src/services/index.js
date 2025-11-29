/**
 * Services Index
 * 
 * Central export point for all adapter services
 * Simplifies imports in controllers and other modules
 */

export * as orchestratorClient from './orchestratorClient.js';
export * as aiModelAdapter from './aiModelAdapter.js';
export * as paymentAgentAdapter from './paymentAgentAdapter.js';

// Convenience re-exports for common imports
export {
  route,
  predict as predictViaOrchestrator,
  settlePayment,
  checkHealth as checkOrchestratorHealth
} from './orchestratorClient.js';

export {
  predict,
  getPrediction,
  checkHealth as checkAIHealth
} from './aiModelAdapter.js';

export {
  validateSettle,
  getSettleValidation,
  validateWithCompliance,
  checkHealth as checkPaymentHealth
} from './paymentAgentAdapter.js';

/**
 * Initialize all services (check health, wait for readiness)
 * Call this in server startup
 */
export async function initializeServices(options = {}) {
  const timeout = options.timeout || 30000;
  const results = {};

  console.log('\n🔌 [Services] Initializing integration services...\n');

  // Check each service with timeout
  const checks = [
    checkOrchestratorHealth()
      .then(result => {
        results.orchestrator = result;
        return result;
      })
      .catch(err => {
        results.orchestrator = { healthy: false, error: err.message };
        return results.orchestrator;
      }),

    checkAIHealth()
      .then(result => {
        results.aiModel = result;
        return result;
      })
      .catch(err => {
        results.aiModel = { healthy: false, error: err.message };
        return results.aiModel;
      }),

    checkPaymentHealth()
      .then(result => {
        results.payment = result;
        return result;
      })
      .catch(err => {
        results.payment = { healthy: false, error: err.message };
        return results.payment;
      })
  ];

  // Wait for all checks with timeout
  try {
    await Promise.race([
      Promise.all(checks),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Service initialization timeout')), timeout)
      )
    ]);
  } catch (error) {
    console.warn('⚠️  Service initialization warning:', error.message);
  }

  // Print status
  console.log('📊 [Services] Health Check Results:');
  console.log(`  Orchestrator: ${results.orchestrator.healthy ? '✅ Ready' : '❌ Unavailable'}`);
  console.log(`  AI Model:     ${results.aiModel.healthy ? '✅ Ready' : '❌ Unavailable'}`);
  console.log(`  Payment:      ${results.payment.healthy ? '✅ Ready' : '❌ Unavailable'}`);
  console.log('');

  // Warning if any critical service is down
  const allHealthy = Object.values(results).every(r => r.healthy);
  if (!allHealthy) {
    console.warn('⚠️  [Services] Some services are unavailable. System will use fallbacks.\n');
  } else {
    console.log('✅ [Services] All integration services ready!\n');
  }

  return results;
}

export default {
  orchestratorClient: require('./orchestratorClient.js'),
  aiModelAdapter: require('./aiModelAdapter.js'),
  paymentAgentAdapter: require('./paymentAgentAdapter.js'),
  initializeServices
};
