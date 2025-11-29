<<<<<<< Updated upstream
import { useState } from "react";
import React from "react";
import { Link } from "react-router-dom";
import RiskForm from "../components/RiskForm";
import ComplianceModal from "../components/ComplianceModal";

export default function Proof() {
  const [lastResult, setLastResult] = useState(null);
  const [lastAddress, setLastAddress] = useState("");

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Compliance Proof</h1>
          <nav className="space-x-4">
            <Link to="/" className="text-blue-600">Wallet</Link>
            <Link to="/risk" className="text-blue-600">Risk Checker</Link>
          </nav>
        </header>

        <RiskForm
          defaultAddress={lastAddress}
          onResult={(res, addr) => {
            setLastResult(res);
            setLastAddress(addr);
          }}
        />

        {lastResult && (
          <ComplianceModal
            address={lastAddress}
            score={lastResult.score}
            metadata={lastResult.details}
          />
        )}
=======
// src/pages/Proof.jsx
import { useState } from "react";
import NavBar from "../components/NavBar";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Proof() {
  const [proofId, setProofId] = useState("");
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [anchorResult, setAnchorResult] = useState(null);

  async function fetchDecision() {
    setError("");
    setBundle(null);
    setAnchorResult(null);
    if (!proofId.trim()) {
      setError("Please enter a Proof ID");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/decisions/${proofId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBundle(data);
    } catch (err) {
      setError(err.message || "Failed to fetch decision");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnchor() {
    if (!bundle?.proofId) return setError("No proof available to anchor");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/anchor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proofId: bundle.proofId,
          strategy: "hash-only",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnchorResult(data);
    } catch (err) {
      setError(err.message || "Failed to anchor proof");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1f] via-purple-950 to-[#0f0a1f]">
      <NavBar />
      <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fetch Decision Bundle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="proofId">Proof ID</Label>
                <Input
                  id="proofId"
                  value={proofId}
                  onChange={(e) => setProofId(e.target.value)}
                  placeholder="proof-xxxxxxxx-xxxx-xxxx"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={fetchDecision} disabled={loading}>
                  {loading ? "Loading..." : "Fetch Decision Bundle"}
                </Button>
                <Button
                  onClick={() => {
                    setProofId("");
                    setBundle(null);
                    setAnchorResult(null);
                    setError("");
                  }}
                  variant="secondary"
                >
                  Clear
                </Button>
              </div>
              {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
              )}
            </CardContent>
          </Card>

          {bundle && (
            <Card>
              <CardHeader>
                <CardTitle>Bundle Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <strong>Request ID:</strong>{" "}
                    <span className="font-mono">{bundle.requestId}</span>
                  </div>
                  <div>
                    <strong>Address:</strong>{" "}
                    <span className="font-mono break-all">
                      {bundle.address}
                    </span>
                  </div>
                  <div>
                    <strong>Risk Score:</strong> {bundle.riskScore} —{" "}
                    <em>{bundle.riskLevel}</em>
                  </div>
                  <div>
                    <strong>Explanation:</strong> {bundle.explanation}
                  </div>
                  <div>
                    <strong>Model:</strong> {bundle.modelHash}
                  </div>
                  <div>
                    <strong>Proof ID:</strong>{" "}
                    <span className="font-mono">{bundle.proofId || "—"}</span>
                  </div>
                  <div>
                    <strong>Decision Hash:</strong>{" "}
                    <span className="font-mono break-all">
                      {bundle.decisionHash || "—"}
                    </span>
                  </div>
                  <div>
                    <strong>Unsigned TX:</strong>{" "}
                    <span className="font-mono break-all">
                      {bundle.unsignedTxHex || "—"}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-3">
                    {bundle.proofId && (
                      <Button
                        onClick={() =>
                          navigator.clipboard?.writeText(bundle.proofId)
                        }
                      >
                        Copy proofId
                      </Button>
                    )}
                    {bundle.decisionHash && (
                      <Button
                        onClick={() =>
                          navigator.clipboard?.writeText(bundle.decisionHash)
                        }
                      >
                        Copy decisionHash
                      </Button>
                    )}
                    <Button
                      onClick={() =>
                        window.open(
                          `/v1/decisions/${bundle.proofId || proofId}`,
                          "_blank"
                        )
                      }
                    >
                      Open full bundle (new tab)
                    </Button>
                    <Button
                      onClick={handleAnchor}
                      disabled={loading || !bundle.proofId}
                    >
                      Anchor Proof
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {anchorResult && (
            <Card>
              <CardHeader>
                <CardTitle>Anchor Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div>
                    <strong>Anchored Tx ID:</strong>{" "}
                    <span className="font-mono break-all">
                      {anchorResult.anchoredTxId}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Status: {anchorResult.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
>>>>>>> Stashed changes
      </div>
    </div>
  );
}
