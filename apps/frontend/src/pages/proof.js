import { useState } from 'react';
import ComplianceModal from '../components/ComplianceModal';
import RiskForm from '../components/RiskForm';

export default function ProofPage() {
  const [lastResult, setLastResult] = useState(null);
  const [lastAddress, setLastAddress] = useState('');

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-xl font-semibold">Compliance Proof</h2>
        <RiskForm defaultAddress={lastAddress} onResult={(res, addr) => { setLastResult(res); setLastAddress(addr); }} />
        {!lastResult && <div className="text-sm text-slate-500">Run a scan first to generate a compliance proof.</div>}
        {lastResult && (
          <ComplianceModal address={lastAddress} score={lastResult.score} metadata={lastResult.details} />
        )}
      </div>
    </div>
  );
}
