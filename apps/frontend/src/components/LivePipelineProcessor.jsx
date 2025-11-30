import React, { useState } from 'react';
import { Play, Pause, RefreshCw, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { enableWallet, sendSimplePayment } from '../lib/cardano';

const LivePipelineProcessor = ({ walletAddress, onComplete, useRealData = false }) => {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, payment_required, processing, completed, error
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [pollingId, setPollingId] = useState(null);
  const [paymentTxHash, setPaymentTxHash] = useState(null);
  const [paymentAddress] = useState('addr_test1qpu5vlrf4xkxv2qpwngf6cjhtw542ayty80v8dyr49rf5ewvxwdrt70qlcpeeagscasafhffqsxy36t90ldv06wqrk2qum8x5w'); // Testnet payment address

  const handlePayment = async () => {
    try {
      setStatus('payment_required');
      setError(null);

      // Enable wallet
      const { api, walletName } = await enableWallet();
      console.log(`💰 Connected to ${walletName} wallet`);

      // Send payment (0.17 ADA = 17,000,000 lovelace)
      const txHash = await sendSimplePayment(api, paymentAddress, 0.17);
      console.log(`✅ Payment sent: ${txHash}`);

      setPaymentTxHash(txHash);

      // Wait a moment for transaction to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start pipeline with payment hash
      await startPipeline(txHash);
    } catch (err) {
      console.error('Payment error:', err);
      setError(`Payment failed: ${err.message}`);
      setStatus('error');
    }
  };

  const startPipeline = async (txHash = null) => {
    if (!walletAddress) {
      setError('Wallet address is required');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setError(null);
    setProgress(5);

    try {
      // Choose endpoint based on mode
      const endpoint = useRealData ? '/api/real-pipeline/start' : '/api/live-pipeline/start';
      const statusEndpoint = useRealData ? '/api/real-pipeline/status' : '/api/live-pipeline/status';

      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            transactionId: `txn_${Date.now()}`,
            paymentTxHash: txHash || paymentTxHash,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || 'Failed to start pipeline');
        setStatus('error');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setJobId(data.jobId);
        pollJobStatus(data.jobId, statusEndpoint);
      } else {
        setError(data.error || 'Failed to start pipeline');
        setStatus('error');
      }
    } catch (err) {
      setError(err.message || 'Failed to start pipeline');
      setStatus('error');
      setProgress(0);
    }
  };

  const pollJobStatus = async (jId, statusEndpoint = '/api/live-pipeline/status') => {
    const interval = setInterval(async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        const response = await fetch(
          `${API_BASE}${statusEndpoint}/${jId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();
        if (data.success) {
          const jobData = data;
          setProgress(jobData.progress || 0);

          if (jobData.status === 'completed') {
            clearInterval(interval);
            setStatus('completed');
            setResults(jobData.results);
            if (onComplete) onComplete(jobData.results);
          } else if (jobData.status === 'failed') {
            clearInterval(interval);
            setStatus('error');
            setError(jobData.error || 'Pipeline processing failed');
          }
        }
      } catch (err) {
        console.error('Status check failed:', err);
        clearInterval(interval);
        setStatus('error');
        setError('Failed to check job status');
      }
    }, 2000); // Check every 2 seconds

    setPollingId(interval);
  };

  const stopPipeline = () => {
    if (pollingId) {
      clearInterval(pollingId);
      setPollingId(null);
    }
    setStatus('idle');
    setProgress(0);
    setJobId(null);
  };

  const reset = () => {
    stopPipeline();
    setResults(null);
    setError(null);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg border border-blue-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        🔄 Live Pipeline Processing
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Wallet: <span className="font-mono font-semibold">{walletAddress || 'N/A'}</span>
      </p>

      {status === 'idle' && (
        <button
          onClick={useRealData ? handlePayment : () => startPipeline()}
          disabled={!walletAddress}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          {useRealData ? (
            <>
              <Wallet size={18} />
              Pay & Start Analysis (0.17 ADA)
            </>
          ) : (
            <>
              <Play size={18} />
              Start Analysis
            </>
          )}
        </button>
      )}

      {status === 'payment_required' && (
        <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="text-yellow-600" size={20} />
            <span className="text-yellow-800 font-medium">Processing Payment...</span>
          </div>
          <p className="text-sm text-yellow-700">
            Please approve the transaction in your wallet (Eternl/Nami).
          </p>
        </div>
      )}

      {status === 'processing' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="animate-spin text-blue-600" size={20} />
            <span className="text-blue-800 font-medium">Processing wallet data...</span>
          </div>

          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-700 font-medium">
                {Math.floor(Math.min(progress, 100))}% complete
              </p>
              <button
                onClick={stopPipeline}
                className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded font-medium transition-colors"
              >
                <Pause size={14} className="inline mr-1" />
                Cancel
              </button>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>📊 Fetching transaction data from Cardano...</p>
              <p>🔧 Engineering features...</p>
              <p>🧠 Running AI models for risk assessment...</p>
              <p>⚡ Processing with orchestrator...</p>
            </div>
          </div>
          {jobId && (
            <p className="text-xs text-gray-500 mt-3">Job ID: {jobId}</p>
          )}
        </div>
      )}

      {status === 'completed' && results && (
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
            <div className="flex-1">
              <p className="text-green-800 font-semibold mb-3">✅ Analysis Complete!</p>

              <div className="space-y-2 text-sm bg-white p-3 rounded mb-3">
                {results.prediction && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Risk Score:</span>
                      <span className="font-bold text-red-600">
                        {(results.prediction.risk_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Anomaly Score:</span>
                      <span className="font-bold text-orange-600">
                        {(results.prediction.anomaly_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Prediction:</span>
                      <span className={`font-bold ${results.prediction.prediction === 'HIGH_RISK'
                        ? 'text-red-600'
                        : 'text-green-600'
                        }`}>
                        {results.prediction.prediction}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">Risk Level:</span>
                      <span className={`font-bold px-3 py-1 rounded text-white ${results.prediction.risk_label === 'HIGH'
                        ? 'bg-red-600'
                        : results.prediction.risk_label === 'MEDIUM'
                          ? 'bg-orange-600'
                          : 'bg-green-600'
                        }`}>
                        {results.prediction.risk_label || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Confidence:</span>
                      <span className="font-bold text-blue-600">
                        {(results.prediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Anomaly Detected:</span>
                      <span className={`font-bold ${results.prediction.is_anomaly
                        ? 'text-red-600'
                        : 'text-green-600'
                        }`}>
                        {results.prediction.is_anomaly ? '⚠️ Yes' : '✓ No'}
                      </span>
                    </div>
                  </>
                )}

                {results.transaction_count !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Transactions:</span>
                    <span className="font-bold">{results.transaction_count}</span>
                  </div>
                )}

                {results.timestamp && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">Timestamp:</span>
                    <span className="text-xs font-mono">
                      {new Date(results.timestamp).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {results.features && Object.keys(results.features).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-700">
                    📋 View extracted features (18 dimensions)
                  </summary>
                  <div className="mt-2 bg-white p-2 rounded text-gray-700 max-h-40 overflow-y-auto">
                    {Object.entries(results.features).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1 border-b border-gray-100">
                        <span className="font-mono">{key}:</span>
                        <span className="font-mono font-semibold">
                          {typeof value === 'number' ? value.toFixed(4) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* AI Analysis Section */}
              {(() => {
                const narrative = results.orchestrator_response?.narrative || results.orchestrator_response?.explanation?.narrative;
                const isMock = narrative && narrative.includes("Mock prediction returned");

                if (!narrative || isMock) return null;

                return (
                  <div className="mt-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🧠</span>
                      <h4 className="font-bold text-purple-900">AI Risk Analysis</h4>
                    </div>

                    {/* Narrative */}
                    <div className="bg-white p-3 rounded border border-purple-100 shadow-sm mb-3">
                      <p className="text-gray-800 text-sm leading-relaxed">
                        {narrative}
                      </p>
                    </div>

                    {/* Risk Drivers */}
                    {(results.orchestrator_response.top_risk_drivers?.length > 0 || results.orchestrator_response.explanation?.top_risk_drivers?.length > 0) && (
                      <div className="mb-3">
                        <h5 className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-2">Key Risk Drivers</h5>
                        <div className="space-y-2">
                          {(results.orchestrator_response.top_risk_drivers || results.orchestrator_response.explanation?.top_risk_drivers || []).slice(0, 3).map((driver, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-purple-100">
                              <span className="text-sm text-gray-700">{typeof driver === 'string' ? driver : driver.feature}</span>
                              {typeof driver === 'object' && driver.importance && (
                                <span className="text-xs font-bold text-purple-600">{(driver.importance * 100).toFixed(0)}% Impact</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Recent Transactions Preview */}
              {results.blockfrost_data?.transactions?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-xl">📜</span> Recent Transactions
                  </h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                        <tr>
                          <th className="px-3 py-2">Time</th>
                          <th className="px-3 py-2">Hash</th>
                          <th className="px-3 py-2 text-right">Amount (ADA)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {results.blockfrost_data.transactions.slice(0, 10).map((tx) => {
                          // Find amount sent to this wallet
                          const output = tx.outputs.find(o => o.address === walletAddress);
                          const amount = output
                            ? (parseInt(output.amount.find(a => a.unit === 'lovelace')?.quantity || 0) / 1000000).toFixed(2)
                            : '0.00';

                          return (
                            <tr key={tx.tx_hash} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-600">
                                {new Date(tx.block_time).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs text-blue-600 truncate max-w-[100px]" title={tx.tx_hash}>
                                {tx.tx_hash.substring(0, 8)}...
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-gray-800">
                                {amount} ₳
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Analyze Another Wallet
                </button>

                <details className="relative group">
                  <summary className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded cursor-pointer list-none h-full flex items-center">
                    <span className="text-xs font-bold">JSON</span>
                  </summary>
                  <div className="absolute bottom-full right-0 mb-2 w-96 bg-gray-900 text-gray-100 p-4 rounded-lg shadow-xl text-xs font-mono overflow-auto max-h-96 z-50 hidden group-open:block">
                    <pre>{JSON.stringify(results, null, 2)}</pre>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-2">❌ Processing Failed</p>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              <button
                onClick={reset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePipelineProcessor;
