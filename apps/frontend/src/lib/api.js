<<<<<<< Updated upstream
const BASE = import.meta.env.VITE_API_BASE || ""; 
// Example: VITE_API_BASE="http://localhost:4000"
=======
// Default to backend dev port when VITE_API_BASE is not set in dev.
// When deploying or using a proxy, set VITE_API_BASE in your env (e.g. VITE_API_BASE=http://localhost:3001)
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
=======

export async function getRiskHistory(address) {
  // GET endpoint
  return request(`/risk/history/${address}`, {}, "GET");
}

export async function getProject() {
  return request("/project", {}, "GET");
}
>>>>>>> Stashed changes
