/**
 * EXAMPLE: How to Update Backend Controllers
 * 
 * This shows how to modify controllers.js to use the new adapter services
 * WITHOUT changing any AI or Masumi agent code
 * 
 * Just follow this pattern for each endpoint that needs AI/Masumi integration
 */

// ============================================================================
// EXAMPLE 1: Update POST /scan/address to use AI Model Adapter
// ============================================================================

/**
 * OLD VERSION (Direct Python AI stub):
 * 
 * export async function postScanAddress(req, res) {
 *   const { address } = req.body || {};
 *   const requestId = req.requestId;
 *   
 *   try {
 *     const aiRes = await fetch(`${config.PY_AI_URL}/ai/score`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ address }),
 *       timeout: 5000
 *     });
 * 
 *     let aiData = await aiRes.json();
 *     // ... rest of logic
 *   } catch (err) {
 *     // ... fallback
 *   }
 * }
 */

/**
 * NEW VERSION (Using AI Model Adapter):
 * 
 * import { aiModelAdapter } from './services/index.js';
 * 
 * export async function postScanAddress(req, res) {
 *   const { address, features } = req.body || {};
 *   const requestId = req.requestId;
 *   
 *   if (!address) {
 *     return res.status(400).json({ error: 'address is required', requestId });
 *   }
 * 
 *   try {
 *     // Call AI Model Adapter - it handles routing automatically
 *     const aiData = await aiModelAdapter.getPrediction({
 *       address,
 *       features: features || {}  // Optional: extracted features from Blockfrost
 *     });
 * 
 *     // Create decision bundle (same as before)
 *     const bundle = {
 *       requestId,
 *       timestamp: new Date().toISOString(),
 *       address,
 *       riskScore: aiData.riskScore,
 *       riskLevel: aiData.riskLevel,
 *       isAnomaly: aiData.isAnomaly,
 *       confidence: aiData.confidence,
 *       explanation: aiData.explanation || 'AI analysis performed',
 *       features: aiData.features || features || {},
 *       modelHash: aiData.modelHash || 'ai-v1-2024-11-30',
 *       masumiDecision: null,
 *       status: 'scored'
 *     };
 * 
 *     // Save bundle
 *     saveDecisionBundle(requestId, bundle);
 *     saveDecisionBundle(address, bundle);
 * 
 *     console.log(`[${requestId}] Scan complete: score=${bundle.riskScore}`);
 * 
 *     return res.json({
 *       address,
 *       riskScore: aiData.riskScore,
 *       riskLevel: aiData.riskLevel,
 *       isAnomaly: aiData.isAnomaly,
 *       confidence: aiData.confidence,
 *       requestId
 *     });
 * 
 *   } catch (err) {
 *     console.warn(`[${requestId}] AI prediction failed:`, err.message);
 *     
 *     // Fallback response (same as before)
 *     const fallback = {
 *       address,
 *       riskScore: 50,
 *       riskLevel: 'MEDIUM',
 *       isAnomaly: false,
 *       confidence: 0,
 *       requestId
 *     };
 *     
 *     return res.json(fallback);
 *   }
 * }
 */

// ============================================================================
// EXAMPLE 2: Update POST /agent/decision to use Payment Agent Adapter
// ============================================================================

/**
 * OLD VERSION (Just updates bundle):
 * 
 * export async function postAgentDecision(req, res) {
 *   const { requestId, address, riskScore } = req.body || {};
 *   
 *   if (!requestId || !address || riskScore === undefined) {
 *     return res.status(400).json({ error: 'Missing fields', requestId: req.requestId });
 *   }
 * 
 *   const bundle = getDecisionBundle(requestId);
 *   if (!bundle) {
 *     return res.status(404).json({ error: 'Bundle not found', requestId: req.requestId });
 *   }
 * 
 *   // Just updates locally
 *   bundle.masumiDecision = 'APPROVED';
 *   bundle.status = 'approved';
 *   saveDecisionBundle(requestId, bundle);
 * 
 *   return res.json({
 *     masumiRequestId: requestId,
 *     status: 'queued',
 *     decision: 'APPROVED'
 *   });
 * }
 */

/**
 * NEW VERSION (Actually validates with Payment Agent):
 * 
 * import { paymentAgentAdapter, orchestratorClient } from './services/index.js';
 * 
 * export async function postAgentDecision(req, res) {
 *   const { requestId, address, riskScore } = req.body || {};
 *   
 *   if (!requestId || !address || riskScore === undefined) {
 *     return res.status(400).json({ 
 *       error: 'requestId, address, and riskScore required',
 *       requestId: req.requestId 
 *     });
 *   }
 * 
 *   try {
 *     const bundle = getDecisionBundle(requestId);
 *     if (!bundle) {
 *       return res.status(404).json({ 
 *         error: 'Decision bundle not found',
 *         requestId: req.requestId 
 *       });
 *     }
 * 
 *     // 1. Validate settlement with Payment Agent
 *     const paymentValidation = await paymentAgentAdapter.getSettleValidation({
 *       transaction_id: requestId,
 *       features: bundle.features
 *     });
 * 
 *     console.log(`[${requestId}] Payment validation: ${paymentValidation.paymentStatus}`);
 * 
 *     // 2. If payment is valid, get compliance decision from Masumi
 *     let complianceResult = null;
 *     if (paymentValidation.isValid) {
 *       try {
 *         complianceResult = await paymentAgentAdapter.validateWithCompliance(
 *           { transaction_id: requestId, features: bundle.features },
 *           { 
 *             riskScore: bundle.riskScore,
 *             riskLevel: bundle.riskLevel,
 *             isAnomaly: bundle.isAnomaly
 *           }
 *         );
 * 
 *         bundle.masumiDecision = complianceResult.complianceDecision.toUpperCase();
 *       } catch (err) {
 *         console.warn(`[${requestId}] Compliance check failed:`, err.message);
 *         bundle.masumiDecision = 'PENDING';
 *       }
 *     } else {
 *       bundle.masumiDecision = 'REJECTED';
 *     }
 * 
 *     bundle.paymentStatus = paymentValidation.paymentStatus;
 *     bundle.status = 'decision_made';
 *     saveDecisionBundle(requestId, bundle);
 * 
 *     console.log(`[${requestId}] Agent decision: ${bundle.masumiDecision}`);
 * 
 *     return res.json({
 *       masumiRequestId: requestId,
 *       status: 'completed',
 *       decision: bundle.masumiDecision,
 *       paymentValidation: paymentValidation.paymentStatus,
 *       complianceResult: complianceResult
 *     });
 * 
 *   } catch (err) {
 *     console.error(`[${req.requestId}] Agent decision error:`, err);
 *     return res.status(500).json({
 *       error: 'Decision process failed',
 *       message: err.message,
 *       requestId: req.requestId
 *     });
 *   }
 * }
 */

// ============================================================================
// EXAMPLE 3: New Endpoint - GET /api/health/services
// ============================================================================

/**
 * NEW ENDPOINT: Check status of all integration services
 * 
 * import { orchestratorClient, aiModelAdapter, paymentAgentAdapter } from './services/index.js';
 * 
 * export async function getServicesHealth(req, res) {
 *   try {
 *     const [orchestrator, aiModel, payment] = await Promise.allSettled([
 *       orchestratorClient.checkHealth(),
 *       aiModelAdapter.checkHealth(),
 *       paymentAgentAdapter.checkHealth()
 *     ]);
 * 
 *     const services = {
 *       orchestrator: {
 *         ready: orchestrator.status === 'fulfilled' && orchestrator.value.healthy,
 *         ...orchestrator.value
 *       },
 *       aiModel: {
 *         ready: aiModel.status === 'fulfilled' && aiModel.value.healthy,
 *         ...aiModel.value
 *       },
 *       payment: {
 *         ready: payment.status === 'fulfilled' && payment.value.healthy,
 *         ...payment.value
 *       }
 *     };
 * 
 *     const allReady = Object.values(services).every(s => s.ready);
 * 
 *     return res.json({
 *       status: allReady ? 'ready' : 'degraded',
 *       timestamp: new Date().toISOString(),
 *       services
 *     });
 *   } catch (err) {
 *     return res.status(500).json({
 *       error: 'Failed to check services',
 *       message: err.message
 *     });
 *   }
 * }
 */

// ============================================================================
// KEY CHANGES SUMMARY
// ============================================================================

/**
 * WHAT CHANGED:
 * 
 * 1. IMPORTS:
 *    OLD: import fetch from 'node-fetch'; 
 *         import { PY_AI_URL } from './config/index.js';
 *    NEW: import { aiModelAdapter, paymentAgentAdapter, orchestratorClient } 
 *         from './services/index.js';
 * 
 * 2. AI CALLS:
 *    OLD: await fetch(`${config.PY_AI_URL}/ai/score`, {...})
 *    NEW: await aiModelAdapter.getPrediction({address, features})
 * 
 * 3. PAYMENT VALIDATION:
 *    OLD: No payment validation (just mock)
 *    NEW: await paymentAgentAdapter.getSettleValidation({transaction_id, features})
 * 
 * 4. COMPLIANCE DECISIONS:
 *    OLD: No real Masumi agent calls
 *    NEW: await paymentAgentAdapter.validateWithCompliance(paymentReq, riskData)
 * 
 * 5. ERROR HANDLING:
 *    OLD: Basic fallback
 *    NEW: Services return fallbacks automatically, fallback flag in response
 * 
 * WHAT DIDN'T CHANGE:
 * ✅ Decision bundle structure
 * ✅ Route definitions
 * ✅ Response format
 * ✅ Request validation
 * ✅ Database operations
 * ✅ AI Model code (agents/ai_model/)
 * ✅ Masumi agent code (masumi/)
 * ✅ Orchestrator code (masumi/orchestrator/)
 */

// ============================================================================
// COMPLETE MINIMAL EXAMPLE
// ============================================================================

/**
 * Here's how to add it to controllers.js:
 */

/*
// At the top of controllers.js:
import { aiModelAdapter, paymentAgentAdapter } from './services/index.js';

// Then update the function:
export async function postScanAddress(req, res) {
  const { address } = req.body || {};
  const requestId = req.requestId;
  
  if (!address) {
    return res.status(400).json({ error: 'address required', requestId });
  }

  try {
    // SINGLE LINE CHANGE: Use adapter instead of direct fetch
    const aiData = await aiModelAdapter.getPrediction({ address, features: {} });
    
    const bundle = {
      requestId,
      timestamp: new Date().toISOString(),
      address,
      riskScore: aiData.riskScore,
      riskLevel: aiData.riskLevel,
      isAnomaly: aiData.isAnomaly,
      confidence: aiData.confidence,
      explanation: 'AI analysis performed',
      features: aiData.rawData,
      modelHash: 'ai-v1-2024-11-30',
      status: 'scored'
    };

    saveDecisionBundle(requestId, bundle);
    return res.json({ address, ...aiData, requestId });

  } catch (err) {
    console.warn(`[${requestId}] AI failed:`, err.message);
    return res.json({ address, riskScore: 50, riskLevel: 'MEDIUM', requestId });
  }
}
*/
