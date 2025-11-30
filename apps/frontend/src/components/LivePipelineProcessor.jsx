import React, { useState } from 'react';
import { Play, Pause, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const LivePipelineProcessor = ({ walletAddress, onComplete }) => {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, completed, error
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [pollingId, setPollingId] = useState(null);

  const startPipeline = async () => {
    if (!walletAddress) {
      setError('Wallet address is required');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setError(null);
    setProgress(5);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/live-pipeline/start',
        {
          walletAddress,
          transactionId: `txn_${Date.now()}`,
        },
        { timeout: 10000 }
      );

      if (response.data.success) {
        setJobId(response.data.jobId);
        pollJobStatus(response.data.jobId);
      } else {
        setError(response.data.error || 'Failed to start pipeline');
        setStatus('error');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to start pipeline');
      setStatus('error');
      setProgress(0);
    }
  };

  const pollJobStatus = async (jId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/live-pipeline/status/${jId}`,
          { timeout: 10000 }
        );

        if (response.data.success) {
          const jobData = response.data;
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
          onClick={startPipeline}
          disabled={!walletAddress}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        >
          <Play size={18} />
          Start Analysis
        </button>
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
                      <span className={`font-bold ${
                        results.prediction.prediction === 'HIGH_RISK'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {results.prediction.prediction}
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

              <button
                onClick={reset}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors"
              >
                <RefreshCw size={14} className="inline mr-1" />
                Analyze Again
              </button>
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
