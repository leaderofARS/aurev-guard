const BASE = import.meta.env.VITE_API_BASE || "";

async function request(path, body = {}, method = "POST") {
  const url = BASE + path;

  const opts =
    method === "GET"
      ? undefined
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        };

  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return await res.json();
}

export async function scanAddress(address) {
  return request("/scan/address", { address });
}

export async function getAiScore(address) {
  return request("/ai/score", { address });
}

export async function getAgentDecision(address, riskScore) {
  return request("/agent/decision", { address, riskScore });
}

export async function contractLog(payload) {
  return request("/contract/log", payload);
}

export async function getRiskHistory(address) {
  // GET endpoint
  return request(`/risk/history/${address}`, {}, "GET");
}
