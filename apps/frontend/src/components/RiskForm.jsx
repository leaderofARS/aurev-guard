import { useState } from "react";
import { scanAddress } from "../lib/api";

export default function RiskForm({ defaultAddress, onResult }) {
  const [address, setAddress] = useState(defaultAddress || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setLoading(true);
    try {
      const res = await scanAddress(address);
      onResult?.(res, address);
    } catch (err) {
      setError(err.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full p-4 border rounded-xl bg-white shadow"
    >
      <label className="block text-sm mb-1 font-medium">Wallet address</label>

      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full border p-2 rounded-md"
        placeholder="addr1..."
      />

      <div className="flex gap-2 mt-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-60"
        >
          {loading ? "Scanning..." : "Scan Address"}
        </button>

        <button
          type="button"
          onClick={() => setAddress(defaultAddress || "")}
          className="px-4 py-2 border rounded-md"
        >
          Autofill Connected
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </form>
  );
}
