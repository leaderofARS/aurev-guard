// src/components/WalletConnect.jsx
import { useState } from "react";
import { enableWallet, getUsedAddresses } from "../lib/cardano";
<<<<<<< Updated upstream
=======
import { setWallet, clearWallet } from "../lib/wallet";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
>>>>>>> Stashed changes

export default function WalletConnect({ onConnect }) {
  const [status, setStatus] = useState("idle");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  async function connect() {
    try {
      setError("");
      setStatus("connecting");

      const { api, walletName } = await enableWallet();
      const usedAddresses = await getUsedAddresses(api);

      const primary = usedAddresses?.[0] || "";
      setAddress(primary);

      onConnect?.({
        api,
        address: primary,
        walletName,
      });
<<<<<<< Updated upstream

=======
      setWallet(api, { walletName });
>>>>>>> Stashed changes
      setStatus("connected");
    } catch (err) {
      setError(err.message || "Failed to connect");
      setStatus("error");
    }
  }

  function disconnect() {
    setStatus("idle");
    setAddress("");
    onConnect?.(null);
  }

  return (
<<<<<<< Updated upstream
    <div className="p-4 border rounded-xl bg-white shadow">
      <h3 className="text-lg font-semibold mb-2">Wallet</h3>

      {status !== "connected" ? (
        <button
          onClick={connect}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Connect Cardano Wallet
        </button>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Connected</p>
            <p className="font-mono text-sm">{address}</p>
=======
    <Card>
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
        <CardDescription>
          Works with CIP-30 wallets like Nami / Flint.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status !== "connected" ? (
          <Button onClick={connect} disabled={status === "connecting"}>
            {status === "connecting" ? "Connecting..." : "Connect Cardano Wallet"}
          </Button>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Connected</p>
              <p className="font-mono text-sm break-all">{address}</p>
            </div>
            <Button onClick={disconnect} variant="destructive" size="sm">
              Disconnect
            </Button>
>>>>>>> Stashed changes
          </div>
        )}

<<<<<<< Updated upstream
          <button
            onClick={disconnect}
            className="px-3 py-1 bg-red-500 text-white rounded-md"
          >
            Disconnect
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-2">Error: {error}</p>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Works with CIP-30 wallets like Nami / Flint.
      </p>
    </div>
=======
        {error && <p className="text-destructive text-sm mt-2">Error: {error}</p>}
      </CardContent>
    </Card>
>>>>>>> Stashed changes
  );
}
