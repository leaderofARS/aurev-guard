// src/pages/Proof.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Proof() {
  const [proofId, setProofId] = useState("");
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [anchorLoading, setAnchorLoading] = useState(false);

  async function fetchDecision() {
    setError("");
    setBundle(null);

    if (!proofId.trim()) {
      setError("Please enter a Proof ID");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/decisions/${proofId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      setBundle(data);
    } catch (err) {
      setError(err.message || "Failed to fetch decision");
    } finally {
      setLoading(false);
    }
  }

  async function anchorHash() {
    if (!bundle || !bundle.proofId) return;

    setAnchorLoading(true);

    try {
      const res = await fetch(`${API_BASE}/v1/anchor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofId: bundle.proofId,
          strategy: "hash-only",
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      setBundle({
        ...bundle,
        anchoredTxId: data.anchoredTxId,
        status: "anchored",
      });

      alert(`Anchored! TxId: ${data.anchoredTxId}`);
    } catch (err) {
      alert(`Anchor failed: ${err.message}`);
    } finally {
      setAnchorLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  }

  function getRiskColor(level) {
    if (level === "HIGH")
      return "text-red-600 bg-red-100 border-red-300";
    if (level === "MEDIUM")
      return "text-yellow-600 bg-yellow-100 border-yellow-300";
    return "text-green-600 bg-green-100 border-green-300";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-4xl mx-auto p-8 space-y-8 pt-20">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Decision Proof Panel</h1>
          <nav className="space-x-4">
            <Link to="/" className="text-blue-600 hover:underline">
              Wallet
            </Link>
            <Link to="/risk" className="text-blue-600 hover:underline">
              Risk Checker
            </Link>
          </nav>
        </header>

        {/* Proof ID input */}
        <div className="p-4 border rounded-xl bg-white shadow">
          <label className="block text-sm mb-1 font-medium">Proof ID</label>

          <input
            value={proofId}
            onChange={(e) => setProofId(e.target.value)}
            className="w-full border p-2 rounded-md"
            placeholder="proof-xxxxxxxx-xxxx-xxxx"
          />

          <button
            onClick={fetchDecision}
            disabled={loading}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60"
          >
            {loading ? "Loading..." : "Fetch Decision Bundle"}
          </button>

          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Decision Bundle */}
        {bundle && (
          <div className="space-y-6">
            {/* Meta */}
            <div className="p-4 border rounded-xl bg-white shadow">
              <h3 className="text-lg font-semibold mb-3">Bundle Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Request ID:</span>
                  <p className="font-mono">{bundle.requestId}</p>
                </div>
                <div>
                  <span className="text-gray-600">Proof ID:</span>
                  <p className="font-mono">{bundle.proofId}</p>
                </div>
                <div>
                  <span className="text-gray-600">Timestamp:</span>
                  <p>{new Date(bundle.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-semibold">{bundle.status.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Risk */}
            <div className="p-4 border rounded-xl bg-white shadow">
              <h3 className="text-lg font-semibold mb-3">Risk Assessment</h3>

              <p className="font-mono text-sm break-all">
                {bundle.address}
              </p>

              <div className="flex items-center gap-3 mt-2">
                <div className="text-3xl font-bold">{bundle.riskScore}</div>
                <span
                  className={`px-3 py-1 rounded-md text-sm font-semibold border ${getRiskColor(
                    bundle.riskLevel
                  )}`}
                >
                  {bundle.riskLevel}
                </span>
              </div>
            </div>

            {/* Explanation */}
            <div className="p-4 border rounded-xl bg-white shadow">
              <h3 className="text-lg font-semibold mb-2">AI Explanation</h3>
              <p className="text-gray-700">{bundle.explanation}</p>
            </div>

            {/* Features */}
            <div className="p-4 border rounded-xl bg-white shadow">
              <h3 className="text-lg font-semibold mb-3">Feature Analysis</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Feature</th>
                    <th className="text-right py-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(bundle.features || {}).map(
                    ([key, value]) => (
                      <tr key={key} className="border-b">
                        <td className="py-2">{key}</td>
                        <td className="text-right py-2 font-mono">
                          {JSON.stringify(value)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Hashes */}
            <div className="p-4 border rounded-xl bg-white shadow">
              <h3 className="text-lg font-semibold mb-3">
                Cryptographic Verification
              </h3>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Model Hash:</span>
                  <p className="font-mono break-all">{bundle.modelHash}</p>
                </div>

                {bundle.decisionHash && (
                  <div>
                    <span className="text-gray-600">Decision Hash:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono break-all flex-1">
                        {bundle.decisionHash}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(bundle.decisionHash)
                        }
                        className="px-3 py-1 border rounded-md hover:bg-gray-50"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Unsigned Tx */}
            {bundle.unsignedTxHex && (
              <div className="p-4 border rounded-xl bg-white shadow">
                <h3 className="text-lg font-semibold mb-3">
                  Unsigned Transaction
                </h3>
                <textarea
                  readOnly
                  value={bundle.unsignedTxHex}
                  className="w-full p-3 bg-gray-50 rounded-md text-xs font-mono border"
                  rows="4"
                />
                <button
                  onClick={() =>
                    copyToClipboard(bundle.unsignedTxHex)
                  }
                  className="mt-2 px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Copy Unsigned Tx
                </button>
              </div>
            )}

            {/* Signed Tx */}
            {bundle.signedTxHex && (
              <div className="p-4 border rounded-xl bg-white shadow">
                <h3 className="text-lg font-semibold mb-3">
                  Signed Transaction
                </h3>
                <textarea
                  readOnly
                  value={bundle.signedTxHex}
                  className="w-full p-3 bg-gray-50 rounded-md text-xs font-mono border"
                  rows="4"
                />
                <button
                  onClick={() =>
                    copyToClipboard(bundle.signedTxHex)
                  }
                  className="mt-2 px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Copy Signed Tx
                </button>
              </div>
            )}

            {/* Anchor */}
            {bundle.decisionHash && !bundle.anchoredTxId && (
              <div className="p-4 border rounded-xl bg-white shadow">
                <button
                  onClick={anchorHash}
                  disabled={anchorLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-60"
                >
                  {anchorLoading ? "Anchoring..." : "⚓ Anchor Hash On-Chain"}
                </button>
                <p className="text-xs text-gray-600 mt-2">
                  Mock anchor: records decision hash on-chain
                </p>
              </div>
            )}

            {/* Anchored */}
            {bundle.anchoredTxId && (
              <div className="p-4 border rounded-xl bg-green-50 border-green-300 shadow">
                <h3 className="text-lg font-semibold mb-2 text-green-800">
                  ✓ Anchored
                </h3>
                <p className="font-mono break-all text-sm">
                  {bundle.anchoredTxId}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
