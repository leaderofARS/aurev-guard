import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { enableWallet, getUsedAddresses } from "../lib/cardano";
import { isValidCardanoAddress, formatAddressDisplay } from "../lib/wallet";
import { WalletContext } from "../context/WalletContext";
import NavBar from "../components/NavBar";

export default function WalletConnect() {
  const navigate = useNavigate();
  const {
    wallet,
    connectWallet,
    disconnectWallet,
    setError,
    setLoading,
    error,
    loading,
  } = useContext(WalletContext);

  const [manualAddress, setManualAddress] = useState("");
  const [validationError, setValidationError] = useState("");
  const [activeTab, setActiveTab] = useState("external"); // 'external' or 'manual'

  useEffect(() => {
    // Auto-focus to dashboard if already connected
    if (wallet.isConnected) {
      const timer = setTimeout(() => {
        navigate("/app");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [wallet.isConnected, navigate]);

  async function handleExternalWalletConnect() {
    setError(null);
    setValidationError("");
    setLoading(true);

    try {
      const { api, walletName } = await enableWallet();
      const addresses = await getUsedAddresses(api);
      const primaryAddress = addresses?.[0];

      if (!primaryAddress) {
        throw new Error("No addresses found in wallet");
      }

      connectWallet(api, primaryAddress, walletName);
      setValidationError("");
    } catch (err) {
      const message = err.message || "Failed to connect wallet";
      setError(message);
      setValidationError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleManualAddressSubmit() {
    setValidationError("");
    const trimmed = manualAddress.trim();

    if (!trimmed) {
      setValidationError("Please enter an address");
      return;
    }

    if (!isValidCardanoAddress(trimmed)) {
      setValidationError(
        "Invalid Cardano address format. Must start with addr1 or addr_test"
      );
      return;
    }

    connectWallet(null, trimmed, "manual");
    setValidationError("");
  }

  function handleDisconnect() {
    disconnectWallet();
    setManualAddress("");
    setValidationError("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1f] via-purple-950 to-[#0f0a1f] text-white">
      <NavBar />

      <div className="pt-28 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">
            Connect Your Wallet
          </h1>
          <p className="text-gray-300 text-lg">
            Choose how you'd like to connect to Aurev Guard
          </p>
        </div>

        {/* Success Message */}
        {wallet.isConnected && (
          <div className="mb-8 p-4 rounded-lg bg-green-900/30 border border-green-500/50 text-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">✓</span>
              <span className="font-semibold">
                Wallet Connected Successfully!
              </span>
            </div>
            <p className="text-sm text-green-300">
              {wallet.walletName && `Connected via ${wallet.walletName}`}
            </p>
            <p className="text-sm text-green-300 break-all font-mono mt-2">
              {formatAddressDisplay(wallet.address)}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate("/app")}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        {!wallet.isConnected && (
          <>
            <div className="mb-8 flex gap-4 border-b border-purple-700/50">
              <button
                onClick={() => setActiveTab("external")}
                className={`px-6 py-3 font-semibold transition-all ${
                  activeTab === "external"
                    ? "border-b-2 border-fuchsia-400 text-fuchsia-300"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                External Wallet (CIP-30)
              </button>
              <button
                onClick={() => setActiveTab("manual")}
                className={`px-6 py-3 font-semibold transition-all ${
                  activeTab === "manual"
                    ? "border-b-2 border-fuchsia-400 text-fuchsia-300"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                Manual Address Entry
              </button>
            </div>

            {/* External Wallet Tab */}
            {activeTab === "external" && (
              <div className="p-8 rounded-xl border border-purple-700/50 bg-purple-900/20 backdrop-blur-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3 text-fuchsia-300">
                    Connect with CIP-30 Wallet
                  </h2>
                  <p className="text-gray-300 text-sm mb-4">
                    Use your Cardano wallet extension (Nami, Flint, Lace, etc.)
                    to securely connect.
                  </p>
                  <div className="bg-purple-900/40 p-4 rounded-lg mb-4 text-sm text-gray-300">
                    <p className="mb-2 font-semibold">For testing:</p>
                    <p>
                      Make sure you have a Cardano wallet extension installed
                      and configured.
                    </p>
                  </div>
                </div>

                {validationError && activeTab === "external" && (
                  <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">
                    {validationError}
                  </div>
                )}

                <button
                  onClick={handleExternalWalletConnect}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg"
                >
                  {loading ? "Connecting..." : "Connect Wallet"}
                </button>
              </div>
            )}

            {/* Manual Address Tab */}
            {activeTab === "manual" && (
              <div className="p-8 rounded-xl border border-purple-700/50 bg-purple-900/20 backdrop-blur-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3 text-fuchsia-300">
                    Enter Address Manually
                  </h2>
                  <p className="text-gray-300 text-sm mb-4">
                    Paste a Cardano wallet address directly. You'll be able to
                    scan it, but won't be able to sign transactions.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    Cardano Address
                  </label>
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => {
                      setManualAddress(e.target.value);
                      setValidationError("");
                    }}
                    placeholder="addr1... or addr_test..."
                    className="w-full px-4 py-3 rounded-lg bg-purple-900/40 border border-purple-700 text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30 transition"
                  />
                </div>

                {validationError && activeTab === "manual" && (
                  <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">
                    {validationError}
                  </div>
                )}

                <button
                  onClick={handleManualAddressSubmit}
                  disabled={loading || !manualAddress.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg"
                >
                  {loading ? "Processing..." : "Continue with Address"}
                </button>

                <p className="mt-4 text-xs text-gray-400">
                  Your address will be stored locally. We don't store sensitive
                  data on our servers.
                </p>
              </div>
            )}
          </>
        )}

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border border-purple-700/50 bg-purple-900/20">
            <h3 className="font-semibold text-fuchsia-300 mb-2">🔐 Security</h3>
            <p className="text-sm text-gray-300">
              External wallet connections use standard Cardano CIP-30 protocol.
              Your private keys never leave your wallet.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-purple-700/50 bg-purple-900/20">
            <h3 className="font-semibold text-fuchsia-300 mb-2">⚡ Features</h3>
            <p className="text-sm text-gray-300">
              Once connected, scan your address for compliance risks and
              generate cryptographic proofs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
