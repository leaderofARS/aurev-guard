/**
 * Orchestrator Client Service
 * 
 * Communicates with Masumi Orchestrator at port 8080
 * Routes workflows to registered agents without modifying their code
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:8080';
const ORCHESTRATOR_ROUTE_ENDPOINT = process.env.ORCHESTRATOR_ROUTE_ENDPOINT || '/masumi/route';
const REQUEST_TIMEOUT = parseInt(process.env.ORCHESTRATOR_TIMEOUT || '30000');

/**
 * Health check for orchestrator
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/masumi/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': generateCorrelationId()
      },
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Orchestrator health check failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      healthy: true,
      data
    };
  } catch (error) {
    console.error('[OrchestratorClient] Health check failed:', error.message);
    return {
      healthy: false,
      error: error.message
    };
  }
}

/**
 * List all registered agents
 */
export async function listAgents() {
  try {
    const response = await fetch(`${ORCHESTRATOR_URL}/masumi/agents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': generateCorrelationId()
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`Failed to list agents: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[OrchestratorClient] List agents failed:', error.message);
    throw error;
  }
}

/**
 * Route a workflow request to the orchestrator
 * 
 * @param {string} workflow - Workflow name (e.g., 'ai_predict', 'settle', 'ai_train')
 * @param {object} payload - Workflow-specific payload
 * @param {object} options - Optional config (timeout, retries, etc.)
 * @returns {Promise<object>} - Orchestrator response
 * 
 * @example
 * const result = await route('ai_predict', {
 *   address: 'addr_test1...',
 *   features: { amount: 5000, frequency: 10 }
 * });
 */
export async function route(workflow, payload, options = {}) {
  const correlationId = generateCorrelationId();
  const timeout = options.timeout || REQUEST_TIMEOUT;
  const retries = options.retries || 2;

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `[OrchestratorClient] Routing workflow '${workflow}' (attempt ${attempt}/${retries}) | CID: ${correlationId}`
      );

      const requestBody = {
        workflow,
        payload,
        correlation_id: correlationId,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${ORCHESTRATOR_URL}${ORCHESTRATOR_ROUTE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
          'X-Request-ID': correlationId
        },
        body: JSON.stringify(requestBody),
        timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Orchestrator returned ${response.status}: ${errorText.substring(0, 200)}`
        );
      }

      const result = await response.json();
      console.log(
        `[OrchestratorClient] Workflow '${workflow}' completed successfully | CID: ${correlationId}`
      );

      return {
        success: true,
        workflow,
        correlationId,
        data: result
      };

    } catch (error) {
      lastError = error;
      console.warn(
        `[OrchestratorClient] Attempt ${attempt}/${retries} failed for workflow '${workflow}': ${error.message}`
      );

      // Don't retry on 4xx errors (client errors)
      if (error.message && error.message.includes('returned 4')) {
        break;
      }

      // Wait before retrying
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries exhausted
  console.error(
    `[OrchestratorClient] Failed to route workflow '${workflow}' after ${retries} attempts | CID: ${correlationId}`
  );

  throw {
    name: 'OrchestratorError',
    workflow,
    message: `Failed to route workflow '${workflow}': ${lastError.message}`,
    correlationId,
    lastError
  };
}

/**
 * Convenience methods for common workflows
 */

export async function predict(address, features, options = {}) {
  return route('ai_predict', {
    address,
    features
  }, options);
}

export async function initializeTraining(pipelineName, config = {}, options = {}) {
  return route('ai_train', {
    pipeline_name: pipelineName,
    config
  }, options);
}

export async function runTraining(pipelineId, options = {}) {
  return route('ai_train_run', {
    pipeline_id: pipelineId
  }, options);
}

export async function settlePayment(paymentId, features, decision = {}, options = {}) {
  return route('settle', {
    payment_id: paymentId,
    features,
    decision
  }, options);
}

export async function assessDataQuality(data, options = {}) {
  return route('data_quality', {
    data
  }, options);
}

/**
 * Helper: Generate correlation ID for request tracing
 */
function generateCorrelationId() {
  return `corr-${uuidv4()}`;
}

/**
 * Health check with retries
 */
export async function waitForOrchestratorReady(maxAttempts = 5, delayMs = 2000) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const health = await checkHealth();
      if (health.healthy) {
        console.log('[OrchestratorClient] ✅ Orchestrator is ready');
        return true;
      }
    } catch (error) {
      console.log(`[OrchestratorClient] Attempt ${i}/${maxAttempts}: Orchestrator not ready yet...`);
      if (i < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error('Orchestrator did not become ready in time');
}

export default {
  checkHealth,
  listAgents,
  route,
  predict,
  initializeTraining,
  runTraining,
  settlePayment,
  assessDataQuality,
  waitForOrchestratorReady
};
