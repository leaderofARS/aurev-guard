/**
 * Payment Agent Adapter Service
 * 
 * Wraps calls to the Payment Agent at port 8081
 * Validates settlements and payment decisions
 * WITHOUT modifying the original Payment Agent code
 */

import fetch from 'node-fetch';
import * as orchestratorClient from './orchestratorClient.js';

const PAYMENT_AGENT_URL = process.env.PAYMENT_AGENT_URL || 'http://localhost:8081';
const USE_ORCHESTRATOR = process.env.USE_ORCHESTRATOR === 'true' || process.env.USE_ORCHESTRATOR === '1';
const REQUEST_TIMEOUT = parseInt(process.env.PAYMENT_AGENT_TIMEOUT || '30000');

/**
 * Health check for Payment Agent
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${PAYMENT_AGENT_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Payment Agent health check failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      healthy: true,
      data
    };
  } catch (error) {
    console.error('[PaymentAgentAdapter] Health check failed:', error.message);
    return {
      healthy: false,
      error: error.message
    };
  }
}

/**
 * Validate a settlement/payment request
 * 
 * @param {object} request - Settlement validation request
 *   - transaction_id: ID of transaction/payment
 *   - features: Feature object with amount, user_id, etc.
 * @param {object} options - Optional config (useOrchestrator, timeout, etc.)
 * @returns {Promise<object>} - Validation result {status, payment_id, checked_features}
 * 
 * @example
 * const result = await validateSettle({
 *   transaction_id: 'tx_123',
 *   features: {
 *     amount: 5000,
 *     user_id: 'user_456',
 *     frequency: 10
 *   }
 * });
 * // Returns: { status: 'valid'|'invalid', payment_id, checked_features }
 */
export async function validateSettle(request, options = {}) {
  const useOrchestrator = options.useOrchestrator !== undefined 
    ? options.useOrchestrator 
    : USE_ORCHESTRATOR;

  if (useOrchestrator) {
    return validateSettleViaOrchestrator(request, options);
  } else {
    return validateSettleDirect(request, options);
  }
}

/**
 * Call Payment Agent directly (port 8081)
 */
async function validateSettleDirect(request, options = {}) {
  const timeout = options.timeout || REQUEST_TIMEOUT;

  try {
    console.log('[PaymentAgentAdapter] Making direct settlement validation');

    const response = await fetch(`${PAYMENT_AGENT_URL}/validate_settle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': options.correlationId || generateId()
      },
      body: JSON.stringify(request),
      timeout
    });

    if (!response.ok) {
      throw new Error(`Payment Agent returned ${response.status}`);
    }

    const result = await response.json();
    console.log('[PaymentAgentAdapter] Direct validation successful');

    return {
      success: true,
      source: 'direct',
      data: result
    };

  } catch (error) {
    console.error('[PaymentAgentAdapter] Direct validation failed:', error.message);
    throw {
      name: 'PaymentAgentError',
      source: 'direct',
      message: `Direct payment validation failed: ${error.message}`,
      originalError: error
    };
  }
}

/**
 * Call Payment Agent through Orchestrator (settle workflow)
 */
async function validateSettleViaOrchestrator(request, options = {}) {
  try {
    console.log('[PaymentAgentAdapter] Making validation through orchestrator');

    const orchestratorResult = await orchestratorClient.settlePayment(
      request.transaction_id,
      request.features,
      {},
      { timeout: options.timeout }
    );

    console.log('[PaymentAgentAdapter] Orchestrator validation successful');

    return {
      success: true,
      source: 'orchestrator',
      correlationId: orchestratorResult.correlationId,
      data: orchestratorResult.data
    };

  } catch (error) {
    console.error('[PaymentAgentAdapter] Orchestrator validation failed:', error.message);
    throw {
      name: 'PaymentAgentError',
      source: 'orchestrator',
      message: `Orchestrator payment validation failed: ${error.message}`,
      originalError: error
    };
  }
}

/**
 * Parse payment validation response to standard format
 * 
 * @param {object} rawResult - Raw result from validateSettle()
 * @returns {object} - Standardized validation format
 */
export function parseResult(rawResult) {
  if (!rawResult.success) {
    throw new Error('Validation failed');
  }

  const data = rawResult.data;

  return {
    paymentStatus: data.status || 'unknown',
    isValid: data.status === 'valid',
    paymentId: data.payment_id || data.transaction_id,
    checkedFeatures: data.checked_features || {},
    rawData: data
  };
}

/**
 * High-level API: Validate settlement with parsed result
 * This is the main method to use in controllers
 * 
 * @param {object} request - Settlement validation request
 * @returns {Promise<object>} - Parsed validation with standard fields
 */
export async function getSettleValidation(request, options = {}) {
  try {
    const result = await validateSettle(request, options);
    return parseResult(result);
  } catch (error) {
    console.error('[PaymentAgentAdapter] getSettleValidation failed:', error);
    
    // Return fallback validation on error
    return {
      paymentStatus: 'pending',
      isValid: false,
      paymentId: request.transaction_id,
      checkedFeatures: request.features || {},
      error: error.message,
      fallback: true
    };
  }
}

/**
 * Composite: Validate payment AND check compliance using orchestrator
 * 
 * This combines payment validation with compliance check in a single orchestrator call
 * 
 * @param {object} paymentRequest - Payment validation request
 * @param {object} riskData - Risk assessment data from AI
 * @returns {Promise<object>} - Combined validation and compliance result
 */
export async function validateWithCompliance(paymentRequest, riskData, options = {}) {
  try {
    console.log('[PaymentAgentAdapter] Validating settlement with compliance check');

    // Call orchestrator settle workflow with risk data
    const result = await orchestratorClient.settlePayment(
      paymentRequest.transaction_id,
      paymentRequest.features,
      {
        risk_score: riskData.riskScore,
        risk_level: riskData.riskLevel,
        is_anomaly: riskData.isAnomaly
      },
      options
    );

    console.log('[PaymentAgentAdapter] Settlement validation with compliance successful');

    return {
      success: true,
      paymentId: paymentRequest.transaction_id,
      paymentValidation: parseResult({ success: true, data: result.data }),
      complianceDecision: result.data.decision || 'approved',
      correlationId: result.correlationId
    };

  } catch (error) {
    console.error('[PaymentAgentAdapter] Compliance validation failed:', error);
    
    return {
      success: false,
      paymentId: paymentRequest.transaction_id,
      paymentValidation: {
        isValid: false,
        paymentStatus: 'failed',
        error: error.message
      },
      complianceDecision: 'rejected',
      error: error.message,
      fallback: true
    };
  }
}

/**
 * Helper: Generate request ID
 */
function generateId() {
  return `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Health check with retries
 */
export async function waitForReady(maxAttempts = 5, delayMs = 2000) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const health = await checkHealth();
      if (health.healthy) {
        console.log('[PaymentAgentAdapter] ✅ Payment Agent is ready');
        return true;
      }
    } catch (error) {
      console.log(`[PaymentAgentAdapter] Attempt ${i}/${maxAttempts}: Agent not ready yet...`);
      if (i < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error('Payment Agent did not become ready in time');
}

export default {
  checkHealth,
  validateSettle,
  getSettleValidation,
  validateWithCompliance,
  parseResult,
  waitForReady
};
