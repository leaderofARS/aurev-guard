// src/components/WalletConnect.jsx
import { useState } from "react";
import { enableWallet, getUsedAddresses } from "../lib/cardano";
import { setWallet, clearWallet } from "../lib/wallet";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

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

      // store globally for signing flows
      setWallet(api, { walletName });

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
    clearWallet();
  }

  return (
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
          </div>
        )}

        {error && <p className="text-destructive text-sm mt-2">Error: {error}</p>}
      </CardContent>
    </Card>
  );
}
