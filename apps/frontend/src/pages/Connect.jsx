// src/pages/Connect.jsx
import { useState } from "react";
import { enableWallet, getUsedAddresses } from "../lib/cardano";
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

export default function Connect() {
  const [address, setAddress] = useState(
    localStorage.getItem("aurev_address") || ""
  );
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function connect() {
    setError("");
    setStatus("connecting");

    try {
      const { api } = await enableWallet();
      const addrs = await getUsedAddresses(api);
      const primary = addrs?.[0] || "";

      if (!primary) throw new Error("no address found");

      setAddress(primary);
      localStorage.setItem("aurev_address", primary);
      setStatus("connected");
    } catch (err) {
      setError(err.message || "wallet connect failed");
      setStatus("error");
    }
  }

  function disconnect() {
    setAddress("");
    localStorage.removeItem("aurev_address");
    setStatus("idle");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1f] via-purple-950 to-[#0f0a1f]">
      <NavBar />

      <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
          </CardHeader>

          <CardContent>
            {address ? (
              <div className="space-y-4">
                <div>
                  <Label>Connected address:</Label>
                  <p className="font-mono mt-1 break-all text-sm">{address}</p>
                </div>

                <Button variant="destructive" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button onClick={connect} disabled={status === "connecting"}>
                  {status === "connecting" ? "Connecting..." : "Connect Wallet"}
                </Button>

                <div>
                  <Label>Or paste address manually:</Label>
                  <Input
                    className="mt-2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="addr_test..."
                  />

                  <Button
                    className="mt-2"
                    onClick={() => {
                      localStorage.setItem("aurev_address", address);
                      setStatus("connected");
                    }}
                  >
                    Save Address
                  </Button>
                </div>

                {error && (
                  <div className="text-destructive mt-2">{error}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
