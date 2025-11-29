import fetch from 'node-fetch';

// Test all 5 API endpoints
const BASE_URL = 'http://localhost:3000';

async function test() {
  try {
    console.log('🧪 Testing AUREV Guard Backend Endpoints\n');

    // Test 1: Health check
    console.log('1️⃣ GET /health');
    let res = await fetch(`${BASE_URL}/health`);
    console.log(await res.json());
    console.log();

    // Test 2: POST /scan/address
    console.log('2️⃣ POST /scan/address');
    res = await fetch(`${BASE_URL}/scan/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: 'addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg' }),
    });
    console.log(await res.json());
    console.log();

    // Test 3: POST /ai/score
    console.log('3️⃣ POST /ai/score');
    res = await fetch(`${BASE_URL}/ai/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: 'addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg' }),
    });
    console.log(await res.json());
    console.log();

    // Test 4: POST /agent/decision
    console.log('4️⃣ POST /agent/decision');
    res = await fetch(`${BASE_URL}/agent/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: 'addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg', riskScore: 65 }),
    });
    console.log(await res.json());
    console.log();

    // Test 5: POST /contract/log
    console.log('5️⃣ POST /contract/log');
    res = await fetch(`${BASE_URL}/contract/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: 'addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg', action: 'compliance_check' }),
    });
    console.log(await res.json());
    console.log();

    // Test 6: GET /risk/history/:address
    console.log('6️⃣ GET /risk/history/:address');
    res = await fetch(`${BASE_URL}/risk/history/addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg`);
    console.log(await res.json());
    console.log();

    console.log('✅ All tests completed!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
