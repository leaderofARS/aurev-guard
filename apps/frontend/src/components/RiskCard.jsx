// components/RiskCard.jsx
export default function RiskCard({ result }) {
  // result: { score: number, details: { ... } }
  if (!result) return null;
  const score = Number(result.score ?? 0);
  const getBadge = (s) => {
    if (s >= 75) return { text: 'HIGH RISK', classes: 'bg-red-100 text-red-800 border-red-200' };
    if (s >= 50) return { text: 'MEDIUM RISK', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { text: 'LOW RISK', classes: 'bg-green-100 text-green-800 border-green-200' };
  };
  const badge = getBadge(score);
  return (
    <div className="p-4 rounded-lg border shadow-sm bg-white/60">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Risk score</div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-bold">{score}</div>
            <div className={`px-2 py-1 rounded-md text-xs font-semibold border ${badge.classes}`}>
              {badge.text}
            </div>
          </div>
        </div>
        <div className="text-sm text-slate-600">Address: <span className="font-mono">{result.address?.slice?.(0,12) || '—'}</span></div>
      </div>

      <div className="mt-4">
        <h4 className="font-medium">Details</h4>
        <pre className="mt-2 p-3 bg-slate-50 rounded-md text-xs overflow-auto">{JSON.stringify(result.details || {}, null, 2)}</pre>
      </div>
    </div>
  );
}
