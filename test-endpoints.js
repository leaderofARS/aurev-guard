import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001";
const TEST_ADDRESS =
  "addr1q9aqc6xjy8e6j6xz8g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g7h7g";

async function test() {
  try {
    console.log("🧪 Testing AUREV Guard Backend Endpoints\n");

    // Test 1: /health
    console.log("1️⃣  GET /health");
    let res = await fetch(`${BASE_URL}/health`);
    let data = await res.json();
    console.log(`Status: ${res.status}, Response:`, data);
    console.log();

    // Test 2: /ai/score
    console.log("2️⃣  POST /ai/score");
    res = await fetch(`${BASE_URL}/ai/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: TEST_ADDRESS }),
    });
    data = await res.json();
    console.log(`Status: ${res.status}, Response:`, data);
    console.log();

    // Test 3: /scan/address
    console.log("3️⃣  POST /scan/address");
    res = await fetch(`${BASE_URL}/scan/address`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: TEST_ADDRESS }),
    });
    data = await res.json();
    console.log(`Status: ${res.status}, Response:`, data);
    const riskScore = data.riskScore;
    console.log();

    // Test 4: /agent/decision
    console.log("4️⃣  POST /agent/decision");
    res = await fetch(`${BASE_URL}/agent/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: TEST_ADDRESS, riskScore }),
    });
    data = await res.json();
    console.log(`Status: ${res.status}, Response:`, data);
    console.log();

    // Test 5: /contract/log
    console.log("5️⃣  POST /contract/log");
    res = await fetch(`${BASE_URL}/contract/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: TEST_ADDRESS,
        riskScore,
        masumiDecision: "APPROVED",
      }),
    });
    data = await res.json();
    console.log(`Status: ${res.status}, Response:`, data);
    console.log();

    // Test 6: /risk/history
    console.log("6️⃣  GET /risk/history/:address");
    res = await fetch(`${BASE_URL}/risk/history/${TEST_ADDRESS}`);
    data = await res.json();
    console.log(
      `Status: ${res.status}, Response:`,
      JSON.stringify(data, null, 2)
    );
    console.log();

    console.log("✅ All tests completed!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

test();
