import { useState } from "react";
import { contractLog } from "../lib/api";
import { getWallet } from "../lib/wallet";

export default function ComplianceModal({ address, score, metadata }) {
  const [unsignedTxHex, setUnsignedTxHex] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signedTxHex, setSignedTxHex] = useState("");

  async function generate() {
    setError("");
    setLoading(true);

    try {
      const res = await contractLog({
        address,
        score,
        metadata,
      });

      setUnsignedTxHex(res.unsignedTxHex || res.unsigned_tx_hex || "");
    } catch (err) {
      setError(err.message || "Failed to generate proof");
    } finally {
      setLoading(false);
    }
  }

  async function sign() {
    if (!unsignedTxHex) return;
    const { api } = getWallet() || {};
    if (!api || typeof api.signTx !== "function") {
      setError(
        "Connected wallet does not support signTx. You can copy the unsigned hex and sign externally."
      );
      return;
    }

    try {
      setError("");
      setLoading(true);
      // Some CIP-30 wallets expect a hex string; some expect a CBOR object.
      // The second boolean param requests the signed transaction in hex for some wallets.
      const signed = await api.signTx(unsignedTxHex, true);
      // signed can be string or object { signedTx } depending on wallet
      const hex =
        typeof signed === "string"
          ? signed
          : signed?.signedTx || signed?.signed || JSON.stringify(signed);
      setSignedTxHex(hex);
      console.log("Signed TX:", hex);
    } catch (e) {
      console.error("sign error", e);
      setError("Signing failed: " + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full p-4 border rounded-xl bg-white shadow">
      <div className="space-y-3">
        <button
          onClick={generate}
          disabled={loading}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md disabled:opacity-60 text-center"
        >
          {loading ? "Generating..." : "Generate Compliance Proof"}
        </button>

        <div className="text-sm text-slate-600">
          Address: <span className="font-mono">{address || "—"}</span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      {unsignedTxHex && (
        <div className="mt-4 space-y-3">
          <h4 className="font-medium">Unsigned Transaction Hex</h4>

          <pre className="mt-2 p-3 bg-gray-50 rounded-md text-xs overflow-auto break-words max-h-40">
            {unsignedTxHex}
          </pre>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => navigator.clipboard.writeText(unsignedTxHex)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              Copy Unsigned Hex
            </button>

            <button
              onClick={() => {
                const blob = new Blob([unsignedTxHex], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "unsigned-tx.hex";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 border rounded-md text-sm"
            >
              Download Unsigned Hex
            </button>

            <button
              onClick={sign}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md ml-auto"
            >
              Sign (Wallet)
            </button>
          </div>
        </div>
      )}
      {signedTxHex && (
        <div className="mt-3 p-3 bg-green-50 rounded-md">
          <div className="text-sm font-medium">Signed Transaction Hex</div>
          <pre className="mt-2 text-xs overflow-auto break-words">
            {signedTxHex}
          </pre>
        </div>
      )}
    </div>
  );
}
