export default function RiskCard({ result }) {
  if (!result) return null;

  const score = Number(result.score || 0);

  const status =
    score >= 75
      ? { label: "HIGH RISK", color: "bg-red-100 text-red-800 border-red-200" }
      : score >= 50
      ? {
          label: "MEDIUM RISK",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        }
      : {
          label: "LOW RISK",
          color: "bg-green-100 text-green-800 border-green-200",
        };

  return (
    <div className="w-full p-4 rounded-xl border bg-white shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Risk Score</div>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold">{score}</p>
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold border ${status.color}`}
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-medium">Details</h4>
        <pre className="mt-2 p-3 bg-gray-50 rounded-md text-xs overflow-auto">
          {JSON.stringify(result.details || {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
