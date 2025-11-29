// components/WalletConnect.jsx
import { useState } from 'react';
import { enableWallet, getUsedAddresses } from '../lib/cardano';

export default function WalletConnect({ onConnect }) {
  const [provider, setProvider] = useState(null);
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | error
  const [err, setErr] = useState(null);

  async function connect() {
    setErr(null);
    setStatus('connecting');
    try {
      const { api, providerKey } = await enableWallet();
      setProvider(api);
      // attempt to fetch used addresses (hex)
      const addrs = await getUsedAddresses(api);
      const primary = addrs?.[0] ? addrs[0] : '';
      setAddress(primary);
      setStatus('connected');
      onConnect?.({ api, providerKey, address: primary });
    } catch (e) {
      setErr(e.message || String(e));
      setStatus('error');
    }
  }

  function disconnect() {
    setProvider(null);
    setAddress('');
    setStatus('idle');
    onConnect?.(null);
  }

  return (
    <div className="p-4 bg-white/60 dark:bg-slate-900 rounded-xl shadow-sm border">
      <h3 className="text-lg font-semibold mb-2">Wallet</h3>
      <div className="flex items-center gap-3">
        {status !== 'connected' ? (
          <button
            onClick={connect}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition"
          >
            Connect Cardano Wallet
          </button>
        ) : (
          <>
            <div className="flex-1">
              <div className="text-sm text-slate-500">Connected ({provider?.name || 'CIP-30'})</div>
              <div className="font-mono text-sm truncate">{address || '—'}</div>
            </div>
            <button
              onClick={disconnect}
              className="px-3 py-1 rounded-md bg-rose-500 text-white hover:bg-rose-600"
            >
              Disconnect
            </button>
          </>
        )}
      </div>
      {err && <div className="text-xs text-rose-600 mt-2">Error: {err}</div>}
      <div className="text-xs text-slate-400 mt-2">Works with CIP-30 wallets like Nami / Flint.</div>
    </div>
  );
}
