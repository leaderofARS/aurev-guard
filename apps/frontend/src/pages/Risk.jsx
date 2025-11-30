// src/pages/Risk.jsx
import { useState, useContext } from "react";
import NavBar from "../components/NavBar";
import { WalletContext } from "../context/WalletContext";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function Risk() {
  const { wallet } = useContext(WalletContext);
  const [address, setAddress] = useState(wallet?.address || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [agentResponse, setAgentResponse] = useState(null);
  const [proofResponse, setProofResponse] = useState(null);

  async function handleScan() {
    setError("");
    setScanResult(null);
    setAgentResponse(null);
    setProofResponse(null);

    if (!address || !address.trim()) {
      setError("Please enter an address to scan.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/scan/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      setError(err.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAgentDecision(decision = "APPROVED") {
    if (!scanResult?.requestId)
      return setError("Scan first to obtain requestId.");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agent/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: scanResult.requestId,
          address: address.trim(),
          riskScore: scanResult.riskScore,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgentResponse(data);
    } catch (err) {
      setError(err.message || "Agent decision failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateProof(masumiDecision = "APPROVED") {
    if (!scanResult?.requestId)
      return setError("Scan first to obtain requestId.");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/contract/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: scanResult.requestId,
          address: address.trim(),
          riskScore: scanResult.riskScore,
          masumiDecision,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProofResponse(data);
    } catch (err) {
      setError(err.message || "Proof generation failed");
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
              <CardTitle>Risk Scan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Address to scan</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={wallet?.address || "addr_test1..."}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleScan} disabled={loading}>
                  {loading ? "Scanning..." : "Scan Address"}
                </Button>
                <Button
                  onClick={() => {
                    setAddress(wallet?.address || "");
                  }}
                  variant="secondary"
                >
                  Use Connected Wallet
                </Button>
              </div>

              {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
              )}
            </CardContent>
          </Card>

          {scanResult && (
            <Card>
              <CardHeader>
                <CardTitle>Scan Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Risk Score</div>
                    <div className="text-3xl font-bold">
                      {scanResult.riskScore}
                    </div>
                    <div className="text-sm mt-2">
                      Level:{" "}
                      <span className="font-semibold">
                        {scanResult.riskLevel}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Explanation</div>
                    <div className="mt-1 text-sm text-gray-200">
                      {scanResult.explanation}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      model: {scanResult.modelHash} • requestId:{" "}
                      {scanResult.requestId}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <Button onClick={() => handleAgentDecision("APPROVED")}>
                    Record Agent Decision (Approve)
                  </Button>
                  <Button onClick={() => handleGenerateProof("APPROVED")}>
                    Generate Proof
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {agentResponse && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(agentResponse, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {proofResponse && (
            <Card>
              <CardHeader>
                <CardTitle>Proof Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <strong>proofId:</strong>{" "}
                    <span className="font-mono break-all">
                      {proofResponse.proofId}
                    </span>
                  </div>
                  <div>
                    <strong>decisionHash:</strong>{" "}
                    <span className="font-mono break-all">
                      {proofResponse.decisionHash}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Button
                      onClick={() =>
                        navigator.clipboard?.writeText(proofResponse.proofId)
                      }
                    >
                      Copy proofId
                    </Button>
                    <Button
                      onClick={() =>
                        navigator.clipboard?.writeText(
                          proofResponse.decisionHash
                        )
                      }
                    >
                      Copy hash
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          `/v1/decisions/${proofResponse.proofId}`,
                          "_blank"
                        )
                      }
                    >
                      View Bundle
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
