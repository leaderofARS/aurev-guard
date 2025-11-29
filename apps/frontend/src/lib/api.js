const BASE = import.meta.env.VITE_API_BASE || ""; 
// Example: VITE_API_BASE="http://localhost:4000"

async function request(path, body = {}) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }

  return await res.json();
}

export async function scanAddress(address) {
  return request("/scan/address", { address });
}

export async function contractLog(payload) {
  return request("/contract/log", payload);
}

export async function getAiScore(address) {
  return request("/ai/score", { address });
}

export async function getAgentDecision(address, riskScore) {
  return request("/agent/decision", { address, riskScore });
}

export async function getRiskHistory(address) {
  const res = await fetch(`${BASE}/risk/history/${address}`);

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }

  return await res.json();
}
