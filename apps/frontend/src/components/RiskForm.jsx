// components/RiskForm.jsx
import { useState } from 'react';
import { scanAddress } from '../lib/api';

export default function RiskForm({ defaultAddress, onResult }) {
  const [address, setAddress] = useState(defaultAddress || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e?.preventDefault();
    setError(null);
    if (!address) return setError('Please enter a wallet address');
    setLoading(true);
    try {
      const res = await scanAddress(address);
      // expected shape: { score: number, details: {...} }
      onResult?.(res, address);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="p-4 bg-white/60 rounded-lg border">
      <label className="block text-sm font-medium mb-2">Wallet address</label>
      <input
        className="w-full p-2 rounded-md border focus:outline-none focus:ring-2"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="addr1..."
      />
      <div className="flex gap-2 mt-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-sky-600 text-white rounded-md disabled:opacity-60"
        >
          {loading ? 'Scanning...' : 'Scan Address'}
        </button>
        <button
          type="button"
          onClick={() => { setAddress(defaultAddress || ''); }}
          className="px-4 py-2 border rounded-md"
        >
          Autofill Connected
        </button>
      </div>
      {error && <div className="text-rose-600 text-sm mt-2">{error}</div>}
    </form>
  );
}
