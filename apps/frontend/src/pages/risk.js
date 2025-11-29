import { useState } from 'react';
import WalletConnect from '../components/WalletConnect';
import RiskForm from '../components/RiskForm';
import RiskCard from '../components/RiskCard';

export default function RiskPage() {
  const [walletSession, setWalletSession] = useState(null);
  const [result, setResult] = useState(null);
  const [address, setAddress] = useState('');

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-6">
        <WalletConnect onConnect={(s) => setWalletSession(s)} />
        <RiskForm defaultAddress={walletSession?.address} onResult={(res, addr) => { setResult({ ...res, address: addr }); setAddress(addr); }} />
        <RiskCard result={result} />
      </div>
    </div>
  );
}
