import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import LivePipelineProcessor from './LivePipelineProcessor';

/**
 * WalletRiskAnalyzer: Main component for wallet risk scanning
 * Allows user to choose between mock data (fast) and real Blockfrost data (costs testnet ADA)
 */
const WalletRiskAnalyzer = ({ walletAddress }) => {
  const [analysisMode, setAnalysisMode] = useState('mock'); // 'mock' or 'real'
  const [showResults, setShowResults] = useState(false);
  const [lastResults, setLastResults] = useState(null);

  const handleAnalysisComplete = (results) => {
    setLastResults(results);
    setShowResults(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
        <h2 className="text-lg font-bold text-blue-900 mb-2">🔍 Wallet Risk Analysis</h2>
        <p className="text-sm text-blue-700 mb-4">
          Analyze wallet transaction patterns for fraud risk and anomalies.
        </p>

        {/* Mode selector */}
        <div className="bg-white p-3 rounded border border-blue-200 mb-4">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Select Analysis Mode:</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="mock"
                checked={analysisMode === 'mock'}
                onChange={(e) => setAnalysisMode(e.target.value)}
                className="cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">
                ⚡ Quick Analysis (Mock Data)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="real"
                checked={analysisMode === 'real'}
                onChange={(e) => setAnalysisMode(e.target.value)}
                className="cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">
                <Zap size={14} className="inline mr-1" />
                Live Blockfrost (Real Data - costs ~0.17 ADA)
              </span>
            </label>
          </div>
          {analysisMode === 'real' && (
            <p className="text-xs text-orange-600 mt-2 font-semibold">
              ⚠️ This will query live Cardano blockchain data. Ensure sufficient testnet ADA balance.
            </p>
          )}
        </div>

        {/* Pipeline processor */}
        <LivePipelineProcessor
          walletAddress={walletAddress}
          onComplete={handleAnalysisComplete}
          useRealData={analysisMode === 'real'}
        />
      </div>

      {/* Show previous results if available */}
      {showResults && lastResults && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-bold text-green-900 mb-3">📊 Latest Analysis Results</h3>
          <div className="text-xs bg-white p-3 rounded font-mono max-h-96 overflow-y-auto">
            <pre>{JSON.stringify(lastResults, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletRiskAnalyzer;
