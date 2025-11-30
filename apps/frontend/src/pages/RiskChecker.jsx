// src/pages/RiskChecker.jsx
import React, { useState } from "react";
import { scanAddress, getAgentDecision, contractLog } from "../lib/api";
import { enableWallet } from "../lib/cardano";
import NavBar from "../components/NavBar";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";

// UI box showing risk score
function ScoreBox({ score, level, explanation }) {
  const color =
    level === "HIGH"
      ? "bg-red-900/60 border-red-700 text-red-200"
      : level === "MEDIUM"
      ? "bg-yellow-900/60 border-yellow-700 text-yellow-200"
      : "bg-green-900/60 border-green-700 text-green-200";

  return (
    <div className={`p-4 rounded border ${color}`}>
      <div className="text-sm">
        Risk Level: <strong>{level}</strong>
      </div>
      <div className="text-3xl font-bold">{score}</div>
      <div className="mt-2 text-sm text-purple-200">{explanation}</div>
    </div>
  );
}

export default function RiskChecker() {
  const [address, setAddress] = useState(
    localStorage.getItem("aurev_address") || ""
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [unsignedTx, setUnsignedTx] = useState("");
  const [signedTx, setSignedTx] = useState("");
  const [error, setError] = useState("");

  async function checkRisk(e) {
    e?.preventDefault();
    setError("");

    if (!address) {
      setError("address required");
      return;
    }

    setLoading(true);
    try {
      const res = await scanAddress(address);
      setResult(res);
    } catch (err) {
      setError(err.message || "scan failed");
    }
    setLoading(false);
  }

  async function generateProof() {
    setError("");
    if (!result) return;

    try {
      // 1. Masumi decision (mock)
      const agent = await getAgentDecision(
        address,
        result.riskScore ?? result.score
      );
      const masumiDecision =
        agent.data?.decision || agent.decision || "APPROVED";

      // 2. Contract log -> generates unsignedTx
      const log = await contractLog({
        address,
        riskScore: result.riskScore ?? result.score,
        masumiDecision,
      });

      const unsigned = log.data?.unsignedTxHex || log.unsignedTxHex || "";
      setUnsignedTx(unsigned);
    } catch (err) {
      setError(err.message || "proof generation failed");
    }
  }

  async function signTx() {
    setError("");

    if (!unsignedTx) return;

    try {
      const { api } = await enableWallet();
      if (!api || typeof api.signTx !== "function")
        throw new Error("wallet signTx not available");

      let signed;

      try {
        // CIP-30 with witness flag
        signed = await api.signTx(unsignedTx, true);
      } catch (e) {
        // fallback: no witness flag
        signed = await api.signTx(unsignedTx);
      }

      setSignedTx(typeof signed === "string" ? signed : JSON.stringify(signed));
    } catch (err) {
      // fallback for UI demo
      setSignedTx(`SIMULATED_SIGNED_TX_${Date.now()}`);
      setError("Could not sign with wallet; simulated signedTx provided");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1f] via-purple-950 to-[#0f0a1f]">
      <NavBar />

      <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Risk Checker</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Address input */}
            <form onSubmit={checkRisk}>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="addr_test..."
                className="mb-2"
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Scanning..." : "Check Risk"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setAddress(localStorage.getItem("aurev_address") || "")
                  }
                >
                  Autofill
                </Button>
              </div>
            </form>

            {error && <div className="text-destructive mt-3">{error}</div>}

            {/* Score */}
            {result && (
              <div className="mt-4">
                <ScoreBox
                  score={result.riskScore ?? result.score}
                  level={result.riskLevel ?? result.level}
                  explanation={result.explanation}
                />
                <div className="mt-3">
                  <Button onClick={generateProof}>Generate Proof</Button>
                </div>
              </div>
            )}

            {/* Unsigned TX */}
            {unsignedTx && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Unsigned Transaction Hex</CardTitle>
                </CardHeader>

                <CardContent>
                  <pre className="text-xs break-all overflow-auto">
                    {unsignedTx}
                  </pre>

                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => navigator.clipboard.writeText(unsignedTx)}
                    >
                      Copy
                    </Button>

                    <Button onClick={signTx}>Sign with Wallet</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signed TX */}
            {signedTx && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Signed Transaction</CardTitle>
                </CardHeader>

                <CardContent>
                  <pre className="text-xs break-all overflow-auto">
                    {signedTx}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
