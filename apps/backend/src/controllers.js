import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import config from './config/index.js';
import { saveDecisionBundle, getDecisionBundle } from './decisionStore.js';

// POST /scan/address
export async function postScanAddress(req, res) {
  const { address } = req.body || {};
  const requestId = req.requestId;
  
  if (!address) {
    return res.status(400).json({ error: 'address is required', requestId });
  }

  try {
    // Call Python AI stub
    const aiRes = await fetch(`${config.PY_AI_URL}/ai/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
      timeout: 5000
    });

    let aiData;
    if (!aiRes.ok) {
      throw new Error('AI service error');
    }
    aiData = await aiRes.json();

    // Create decision bundle
    const bundle = {
      requestId,
      timestamp: new Date().toISOString(),
      address,
      riskScore: aiData.riskScore,
      riskLevel: aiData.riskLevel,
      explanation: aiData.explanation,
      features: aiData.features || { sample: 'data' },
      modelHash: aiData.modelHash,
      masumiDecision: null,
      proofId: null,
      decisionHash: null,
      unsignedTxHex: null,
      signedTxHex: null,
      anchoredTxId: null,
      status: 'scored'
    };

    // Save bundle (by requestId and address)
    saveDecisionBundle(requestId, bundle);
    saveDecisionBundle(address, bundle);

    console.log(`[${requestId}] Scan complete: score=${bundle.riskScore}`);

    return res.json({
      ...aiData,
      requestId
    });

  } catch (err) {
    console.warn(`[${requestId}] AI fallback:`, err.message);
    
    // Fallback response
    const fallback = {
      address,
      riskScore: 50,
      riskLevel: 'MEDIUM',
      explanation: 'AI unavailable fallback',
      features: { fallback: true },
      modelHash: 'fallback-v1',
      timestamp: new Date().toISOString()
    };

    const bundle = {
      requestId,
      timestamp: fallback.timestamp,
      address,
      ...fallback,
      masumiDecision: null,
      proofId: null,
      decisionHash: null,
      unsignedTxHex: null,
      signedTxHex: null,
      anchoredTxId: null,
      status: 'scored'
    };

    saveDecisionBundle(requestId, bundle);
    saveDecisionBundle(address, bundle);

    return res.json({ ...fallback, requestId });
  }
}

// POST /agent/decision
export async function postAgentDecision(req, res) {
  const { requestId, address, riskScore } = req.body || {};
  
  if (!requestId || !address || riskScore === undefined) {
    return res.status(400).json({ 
      error: 'requestId, address, and riskScore are required',
      requestId: req.requestId 
    });
  }

  const bundle = getDecisionBundle(requestId);
  if (!bundle) {
    return res.status(404).json({ 
      error: 'Decision bundle not found',
      requestId: req.requestId 
    });
  }

  // Update bundle with Masumi decision
  bundle.masumiDecision = 'APPROVED';
  bundle.status = 'approved';
  saveDecisionBundle(requestId, bundle);

  console.log(`[${requestId}] Agent decision: APPROVED`);

  return res.json({
    masumiRequestId: requestId,
    status: 'queued',
    decision: 'APPROVED'
  });
}

// POST /contract/log
export async function postContractLog(req, res) {
  const { requestId, address, riskScore, masumiDecision } = req.body || {};
  
  if (!requestId || !address || riskScore === undefined || !masumiDecision) {
    return res.status(400).json({ 
      error: 'requestId, address, riskScore, and masumiDecision are required',
      requestId: req.requestId 
    });
  }

  const bundle = getDecisionBundle(requestId);
  if (!bundle) {
    return res.status(404).json({ 
      error: 'Decision bundle not found',
      requestId: req.requestId 
    });
  }

  // Generate proof components
  const proofId = `proof-${uuidv4()}`;
  const unsignedTxHex = `FAKE_UNSIGNED_TX_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  
  // Compute decision hash (canonical JSON)
  const hashData = {
    address: bundle.address,
    explanation: bundle.explanation,
    features: bundle.features,
    masumiDecision,
    modelHash: bundle.modelHash,
    proofId,
    requestId,
    riskScore: bundle.riskScore
  };
  const canonical = JSON.stringify(hashData, Object.keys(hashData).sort());
  const decisionHash = crypto.createHash('sha256').update(canonical).digest('hex');

  // Update bundle
  bundle.proofId = proofId;
  bundle.unsignedTxHex = unsignedTxHex;
  bundle.decisionHash = decisionHash;
  bundle.masumiDecision = masumiDecision;
  bundle.status = 'proof_generated';
  
  saveDecisionBundle(requestId, bundle);
  saveDecisionBundle(proofId, bundle);

  console.log(`[${requestId}] Proof generated: ${proofId}, hash=${decisionHash.substring(0, 16)}...`);

  return res.json({
    unsignedTxHex,
    metadata: {
      risk: bundle.riskScore,
      level: bundle.riskLevel,
      modelHash: bundle.modelHash
    },
    proofId,
    decisionHash
  });
}

// GET /v1/decisions/:proofId
export async function getDecision(req, res) {
  const { proofId } = req.params || {};
  
  if (!proofId) {
    return res.status(400).json({ 
      error: 'proofId is required',
      requestId: req.requestId 
    });
  }

  const bundle = getDecisionBundle(proofId);
  if (!bundle) {
    return res.status(404).json({ 
      error: 'Decision not found',
      requestId: req.requestId 
    });
  }

  console.log(`[${req.requestId}] Retrieved decision: ${proofId}`);

  return res.json(bundle);
}

// POST /v1/anchor
export async function postAnchor(req, res) {
  const { proofId, strategy } = req.body || {};
  
  if (!proofId) {
    return res.status(400).json({ 
      error: 'proofId is required',
      requestId: req.requestId 
    });
  }

  const bundle = getDecisionBundle(proofId);
  if (!bundle) {
    return res.status(404).json({ 
      error: 'Decision bundle not found',
      requestId: req.requestId 
    });
  }

  // Mock anchor
  const anchoredTxId = `ANCHOR_TX_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  
  bundle.anchoredTxId = anchoredTxId;
  bundle.status = 'anchored';
  saveDecisionBundle(proofId, bundle);

  console.log(`[${req.requestId}] Anchored: ${proofId} -> ${anchoredTxId}`);

  return res.json({
    anchoredTxId,
    status: 'pending'
  });
}