// components/ComplianceModal.jsx
import { useState } from 'react';
import { contractLog } from '../lib/api';

export default function ComplianceModal({ address, score, metadata }) {
  const [loading, setLoading] = useState(false);
  const [unsignedTxHex, setUnsignedTxHex] = useState(null);
  const [error, setError] = useState(null);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const payload = { address, score, metadata };
      const res = await contractLog(payload);
      // expect { unsignedTxHex: 'hex..' }
      setUnsignedTxHex(res.unsignedTxHex || res.unsigned_tx_hex || null);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!unsignedTxHex) return;
    navigator.clipboard.writeText(unsignedTxHex);
    alert('Copied unsignedTxHex to clipboard');
  }

  function downloadHex() {
    if (!unsignedTxHex) return;
    const blob = new Blob([unsignedTxHex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unsignedTx-${address?.slice(0,8) || 'tx'}.hex`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 bg-white/60 rounded-lg border">
      <div className="flex items-center gap-3">
        <button onClick={generate} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
          {loading ? 'Generating...' : 'Generate Compliance Proof'}
        </button>
        {unsignedTxHex && (
          <>
            <button onClick={copyToClipboard} className="px-3 py-1 border rounded-md">Copy</button>
            <button onClick={downloadHex} className="px-3 py-1 border rounded-md">Download</button>
          </>
        )}
      </div>
      {error && <div className="text-rose-600 mt-2">{error}</div>}
      {unsignedTxHex && (
        <div className="mt-3">
          <h5 className="text-sm font-medium">Unsigned Tx Hex</h5>
          <pre className="mt-2 p-3 bg-slate-50 rounded-md text-xs overflow-auto break-all">{unsignedTxHex}</pre>
        </div>
      )}
    </div>
  );
}
