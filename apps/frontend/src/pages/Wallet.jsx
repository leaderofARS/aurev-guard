// src/pages/Wallet.jsx
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";
import NavBar from "../components/NavBar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function Wallet() {
  const navigate = useNavigate();
  const { wallet, disconnectWallet, restoreWallet } = useContext(WalletContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreWallet();
    setLoading(false);
  }, [restoreWallet]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a1f] via-purple-950 to-[#0f0a1f]">
        <NavBar />
        <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground py-20">Loading wallet...</div>
        </div>
      </div>
    );
  }

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a1f] via-purple-950 to-[#0f0a1f]">
        <NavBar />
        <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-fuchsia-300 mb-4">
              No Wallet Connected
            </h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet first to access the dashboard.
            </p>
            <Button
              onClick={() => navigate("/connect")}
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1f] via-purple-950 to-[#0f0a1f]">
      <NavBar />
      <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Wallet Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-fuchsia-300">Connected Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Wallet Type</p>
                <p className="font-semibold">
                  {wallet.walletName || "Manual Entry"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p className="font-mono text-sm break-all">
                  {wallet.address}
                </p>
              </div>
              <Button
                onClick={disconnectWallet}
                variant="destructive"
              >
                Disconnect
              </Button>
            </CardContent>
          </Card>

          {/* Available Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:border-fuchsia-400/50 transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-fuchsia-300">📊 Risk Analysis</CardTitle>
                <CardDescription>
                  Scan your wallet for compliance risks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="/risk"
                  className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold text-sm"
                >
                  Start Scan →
                </a>
              </CardContent>
            </Card>

            <Card className="hover:border-fuchsia-400/50 transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-fuchsia-300">🔐 Generate Proof</CardTitle>
                <CardDescription>
                  Create cryptographic proof of assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="/proof"
                  className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold text-sm"
                >
                  Generate →
                </a>
              </CardContent>
            </Card>

            <Card className="hover:border-fuchsia-400/50 transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-fuchsia-300">⚡ Demo Flow</CardTitle>
                <CardDescription>
                  Try complete risk assessment demo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="/risk-demo"
                  className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold text-sm"
                >
                  Demo →
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
