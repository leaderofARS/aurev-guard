import { useState } from "react";
import React from "react";
import { Link } from "react-router-dom";
import WalletConnect from "../components/WalletConnect";
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
            <Link to="/" className="text-blue-600">
              Wallet
            </Link>
            <Link to="/risk" className="text-blue-600">
              Risk Checker
            </Link>
          </nav>
        </header>

        {/* Allow connecting a wallet on the Proof page so user can autofill address */}
        <WalletConnect
          onConnect={(session) => {
            if (session) setLastAddress(session.address);
          }}
        />

        <RiskForm
          defaultAddress={lastAddress}
          onResult={(res, addr) => {
            setLastResult(res);
            setLastAddress(addr);
          }}
        />

        {!lastResult && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-sm text-slate-600">
            Run a scan (enter an address or connect a wallet) to generate a
            compliance proof.
          </div>
        )}

        {lastResult && (
          <ComplianceModal
            address={lastAddress}
            score={lastResult.score}
            metadata={lastResult.details}
          />
        )}
      </div>
    </div>
  );
}
