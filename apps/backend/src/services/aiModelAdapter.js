/**
 * AI Model Adapter Service
 * 
 * Wraps calls to the AI Model Agent at port 8083
 * Can route through orchestrator or call directly
 * WITHOUT modifying the original AI Model code
 */

import fetch from 'node-fetch';
import * as orchestratorClient from './orchestratorClient.js';

const AI_AGENT_URL = process.env.AI_AGENT_URL || 'http://localhost:8083';
const USE_ORCHESTRATOR = process.env.USE_ORCHESTRATOR === 'true' || process.env.USE_ORCHESTRATOR === '1';
const REQUEST_TIMEOUT = parseInt(process.env.AI_AGENT_TIMEOUT || '30000');

/**
 * Health check for AI Model Agent
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${AI_AGENT_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`AI Agent health check failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      healthy: true,
      data
    };
  } catch (error) {
    console.error('[AIModelAdapter] Health check failed:', error.message);
    return {
      healthy: false,
      error: error.message
    };
  }
}

/**
 * Make a prediction using the AI Model Agent
 * 
 * @param {object} request - Prediction request
 *   - transaction_id: (optional) ID of transaction
 *   - features: (optional) Feature object with address metrics
 *   - address: (optional) Wallet address
 * @param {object} options - Optional config (useOrchestrator, timeout, etc.)
 * @returns {Promise<object>} - Prediction result with risk_score, anomaly_flag, etc.
 * 
 * @example
 * const result = await predict({
 *   address: 'addr_test1...',
 *   features: {
 *     amount: 5000,
 *     frequency: 10,
 *     balance: 100000
 *   }
 * });
 * // Returns: { risk_score, anomaly_flag, graph_features, ... }
 */
export async function predict(request, options = {}) {
  const useOrchestrator = options.useOrchestrator !== undefined 
    ? options.useOrchestrator 
    : USE_ORCHESTRATOR;

  if (useOrchestrator) {
    return predictViaOrchestrator(request, options);
  } else {
    return predictDirect(request, options);
  }
}

/**
 * Call AI Model Agent directly (port 8083)
 */
async function predictDirect(request, options = {}) {
  const timeout = options.timeout || REQUEST_TIMEOUT;

  try {
    console.log('[AIModelAdapter] Making direct prediction request');

    const response = await fetch(`${AI_AGENT_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': options.correlationId || generateId()
      },
      body: JSON.stringify(request),
      timeout
    });

    if (!response.ok) {
      throw new Error(`AI Agent returned ${response.status}`);
    }

    const result = await response.json();
    console.log('[AIModelAdapter] Direct prediction successful');

    return {
      success: true,
      source: 'direct',
      data: result
    };

  } catch (error) {
    console.error('[AIModelAdapter] Direct prediction failed:', error.message);
    throw {
      name: 'AIModelError',
      source: 'direct',
      message: `Direct AI prediction failed: ${error.message}`,
      originalError: error
    };
  }
}

/**
 * Call AI Model Agent through Orchestrator
 */
async function predictViaOrchestrator(request, options = {}) {
  try {
    console.log('[AIModelAdapter] Making prediction through orchestrator');

    const orchestratorResult = await orchestratorClient.predict(
      request.address,
      request.features,
      { timeout: options.timeout }
    );

    console.log('[AIModelAdapter] Orchestrator prediction successful');

    return {
      success: true,
      source: 'orchestrator',
      correlationId: orchestratorResult.correlationId,
      data: orchestratorResult.data
    };

  } catch (error) {
    console.error('[AIModelAdapter] Orchestrator prediction failed:', error.message);
    throw {
      name: 'AIModelError',
      source: 'orchestrator',
      message: `Orchestrator AI prediction failed: ${error.message}`,
      originalError: error
    };
  }
}

/**
 * Parse AI prediction response to standard format
 * Handles both direct and orchestrator responses
 * 
 * @param {object} rawResult - Raw result from predict()
 * @returns {object} - Standardized prediction format
 */
export function parseResult(rawResult) {
  if (!rawResult.success) {
    throw new Error('Prediction failed');
  }

  const data = rawResult.data;

  // Handle different response structures
  if (data.prediction) {
    // Orchestrator or direct response with nested prediction
    return parseRiskObject(data.prediction);
  } else if (data.risk_score !== undefined || data.anomaly_flag !== undefined) {
    // Direct response
    return parseRiskObject(data);
  } else {
    // Unknown structure
    console.warn('[AIModelAdapter] Unknown response structure:', data);
    return {
      riskScore: data.risk_score || 0,
      anomalyFlag: data.anomaly_flag || 1,
      graphFeatures: data.graph_features || {},
      rawData: data
    };
  }
}

/**
 * Internal: Parse risk object to standardized format
 */
function parseRiskObject(riskObj) {
  // Handle nested prediction object
  const pred = riskObj.prediction || riskObj;

  return {
    riskScore: pred.risk_score || 0,
    riskLevel: getRiskLevel(pred.risk_score || 0),
    anomalyFlag: pred.anomaly_flag || 1,  // 1 = normal, -1 = anomaly
    isAnomaly: (pred.anomaly_flag || 1) === -1,
    graphFeatures: pred.graph_features || {},
    anomalyScore: pred.anomaly_score || {},
    shapExplanation: pred.shap_explanation || null,
    confidence: parseFloat(pred.confidence || '0.5'),
    rawData: pred
  };
}

/**
 * Convert risk score (0-4) to risk level string
 */
function getRiskLevel(riskScore) {
  const score = parseInt(riskScore);
  switch (score) {
    case 0:
      return 'VERY_LOW';
    case 1:
      return 'LOW';
    case 2:
      return 'MEDIUM';
    case 3:
      return 'HIGH';
    case 4:
      return 'VERY_HIGH';
    default:
      return 'UNKNOWN';
  }
}

/**
 * High-level API: Get full prediction with parsed result
 * This is the main method to use in controllers
 * 
 * @param {object} request - Prediction request
 * @returns {Promise<object>} - Parsed prediction with standard fields
 */
export async function getPrediction(request, options = {}) {
  try {
    const result = await predict(request, options);
    return parseResult(result);
  } catch (error) {
    console.error('[AIModelAdapter] getPrediction failed:', error);
    
    // Return fallback prediction on error
    return {
      riskScore: 50,
      riskLevel: 'MEDIUM',
      anomalyFlag: 1,
      isAnomaly: false,
      confidence: 0.0,
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
        console.log('[AIModelAdapter] ✅ AI Model Agent is ready');
        return true;
      }
    } catch (error) {
      console.log(`[AIModelAdapter] Attempt ${i}/${maxAttempts}: Agent not ready yet...`);
      if (i < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error('AI Model Agent did not become ready in time');
}

export default {
  checkHealth,
  predict,
  getPrediction,
  parseResult,
  waitForReady
};
