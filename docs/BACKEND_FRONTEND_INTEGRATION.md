# Backend → Frontend Integration Guide

## Overview

This document explains how the **React Frontend** (Port 3000) integrates with the **Node.js Backend** (Port 5000) to display AI predictions, risk scores, SHAP explanations, and anomaly detection results.

---

## Frontend Architecture

```
src/
├── api/
│   ├── orchestratorApi.js      # Calls backend /api/predictions
│   ├── walletApi.js            # Wallet connection & transactions
│   └── dashboardApi.js         # Dashboard data aggregation
├── components/
│   ├── PredictionCard.jsx      # Displays risk score
│   ├── SHAPExplainer.jsx       # SHAP visualization
│   ├── AnomalyDetection.jsx    # Anomaly scores
│   └── ScoreComparison.jsx     # Compare multiple models
├── pages/
│   ├── ConnectWallet.jsx       # Wallet connection page
│   ├── Dashboard.jsx           # Main dashboard
│   ├── AIPredictions.jsx       # AI explanation page
│   ├── AnomalyScores.jsx       # Anomaly detection page
│   └── TransactionHistory.jsx  # Live pipeline data
├── contexts/
│   ├── PredictionContext.jsx   # Global prediction state
│   └── WalletContext.jsx       # Global wallet state
└── hooks/
    ├── usePrediction.js        # Fetch predictions
    └── useWallet.js            # Manage wallet
```

---

## API Layer - Frontend to Backend

### 1. **Orchestrator API Client**

**File:** `apps/frontend/src/api/orchestratorApi.js`

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const orchestratorApi = {
  // Get prediction for a wallet
  getPrediction: async (walletAddress, includeSHAP = true) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/predictions/${walletAddress}`,
        {
          params: { include_shap: includeSHAP },
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Prediction fetch failed:', error);
      throw error;
    }
  },

  // Get batch predictions
  getBatchPredictions: async (walletAddresses) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/predictions/batch`,
        { wallets: walletAddresses },
        { timeout: 60000 }
      );
      return response.data;
    } catch (error) {
      console.error('Batch predictions failed:', error);
      throw error;
    }
  },

  // Get SHAP explanation details
  getSHAPExplanation: async (walletAddress) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/shap/${walletAddress}`,
        { timeout: 15000 }
      );
      return response.data;
    } catch (error) {
      console.error('SHAP explanation fetch failed:', error);
      throw error;
    }
  },

  // Get anomaly scores
  getAnomalyScores: async (walletAddress) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/anomaly/${walletAddress}`,
        { timeout: 15000 }
      );
      return response.data;
    } catch (error) {
      console.error('Anomaly scores fetch failed:', error);
      throw error;
    }
  },

  // Health check
  checkHealth: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/health/orchestrator`,
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
};

export default orchestratorApi;
```

---

### 2. **Custom Hook - usePrediction**

**File:** `apps/frontend/src/hooks/usePrediction.js`

```javascript
import { useState, useCallback } from 'react';
import orchestratorApi from '../api/orchestratorApi';

export const usePrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrediction = useCallback(async (walletAddress) => {
    setLoading(true);
    setError(null);
    try {
      const data = await orchestratorApi.getPrediction(walletAddress, true);
      setPrediction(data);
      return data;
    } catch (err) {
      setError(err.message);
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBatch = useCallback(async (walletAddresses) => {
    setLoading(true);
    setError(null);
    try {
      const data = await orchestratorApi.getBatchPredictions(walletAddresses);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    prediction,
    loading,
    error,
    fetchPrediction,
    fetchBatch
  };
};
```

---

### 3. **Global Prediction Context**

**File:** `apps/frontend/src/contexts/PredictionContext.jsx`

```javascript
import React, { createContext, useState, useCallback } from 'react';
import orchestratorApi from '../api/orchestratorApi';

export const PredictionContext = createContext();

export const PredictionProvider = ({ children }) => {
  const [predictions, setPredictions] = useState({});
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPrediction = useCallback(async (walletAddress) => {
    setLoading(true);
    setError(null);
    try {
      const data = await orchestratorApi.getPrediction(walletAddress);
      setPredictions(prev => ({
        ...prev,
        [walletAddress]: data
      }));
      setSelectedWallet(walletAddress);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions({});
    setSelectedWallet(null);
  }, []);

  const value = {
    predictions,
    selectedWallet,
    loading,
    error,
    loadPrediction,
    clearPredictions
  };

  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  );
};
```

---

## Frontend Components

### 1. **Prediction Card Component**

**File:** `apps/frontend/src/components/PredictionCard.jsx`

```javascript
import React from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';

const PredictionCard = ({ prediction, loading, error }) => {
  if (loading) {
    return <div className="p-6 bg-gray-100 rounded-lg animate-pulse">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
        <AlertCircle className="text-red-600" />
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  const getRiskColor = (score) => {
    if (score < 0.3) return 'bg-green-100 text-green-800';
    if (score < 0.6) return 'bg-yellow-100 text-yellow-800';
    if (score < 0.8) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskLabel = (score) => {
    if (score < 0.3) return 'LOW RISK';
    if (score < 0.6) return 'MEDIUM RISK';
    if (score < 0.8) return 'HIGH RISK';
    return 'CRITICAL RISK';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Risk Assessment</h3>
          <p className="text-sm text-gray-600 mt-1">{prediction.walletAddress}</p>
        </div>
        <TrendingUp className="text-blue-600" />
      </div>

      <div className={`mt-4 p-4 rounded-lg ${getRiskColor(prediction.riskScore)}`}>
        <div className="text-3xl font-bold">
          {(prediction.riskScore * 100).toFixed(1)}%
        </div>
        <div className="text-sm font-semibold mt-2">
          {getRiskLabel(prediction.riskScore)}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">Anomaly Score</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {(prediction.anomalyScore * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">Model Confidence</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {(prediction.modelConfidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Updated: {new Date(prediction.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default PredictionCard;
```

---

### 2. **SHAP Explainer Component**

**File:** `apps/frontend/src/components/SHAPExplainer.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import orchestratorApi from '../api/orchestratorApi';

const SHAPExplainer = ({ walletAddress }) => {
  const [shapData, setShapData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShap = async () => {
      setLoading(true);
      try {
        const data = await orchestratorApi.getSHAPExplanation(walletAddress);
        setShapData(data);
      } catch (error) {
        console.error('Failed to fetch SHAP:', error);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchShap();
    }
  }, [walletAddress]);

  if (loading) return <div>Loading SHAP explanations...</div>;
  if (!shapData) return <div>No SHAP data available</div>;

  const chartData = Object.entries(shapData.shap_values)
    .map(([feature, value]) => ({
      feature: feature.replace(/_/g, ' ').toUpperCase(),
      value: parseFloat(value)
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 10); // Top 10 features

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Feature Importance (SHAP Values)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Feature Explanations:</h4>
        <div className="space-y-2">
          {chartData.map(({ feature, value }) => (
            <div key={feature} className="text-xs">
              <span className={value > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                {feature}
              </span>
              <span className="text-gray-600 ml-2">
                {value > 0 ? '↑ increases risk' : '↓ decreases risk'} by {Math.abs(value).toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SHAPExplainer;
```

---

### 3. **Anomaly Detection Component**

**File:** `apps/frontend/src/components/AnomalyDetection.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import orchestratorApi from '../api/orchestratorApi';

const AnomalyDetection = ({ walletAddress }) => {
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnomalies = async () => {
      setLoading(true);
      try {
        const data = await orchestratorApi.getAnomalyScores(walletAddress);
        setAnomalies(data);
      } catch (error) {
        console.error('Failed to fetch anomalies:', error);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchAnomalies();
    }
  }, [walletAddress]);

  if (loading) return <div>Loading anomaly detection...</div>;
  if (!anomalies) return <div>No anomaly data available</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Anomaly Detection Results
        </h3>
      </div>

      <div className="space-y-3">
        {Object.entries(anomalies.model_scores).map(([model, score]) => (
          <div key={model} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">{model}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      score > 0.7
                        ? 'bg-red-600'
                        : score > 0.4
                        ? 'bg-orange-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${score * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-12">
                  {(score * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
        <p>
          <strong>Ensemble Agreement:</strong> {(anomalies.ensemble_agreement * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default AnomalyDetection;
```

---

## Frontend Pages

### 1. **Connect Wallet Page**

**File:** `apps/frontend/src/pages/ConnectWallet.jsx`

```javascript
import React, { useState, useContext } from 'react';
import { Wallet } from 'lucide-react';
import { WalletContext } from '../contexts/WalletContext';
import { PredictionContext } from '../contexts/PredictionContext';
import { useNavigate } from 'react-router-dom';

const ConnectWallet = () => {
  const { connectWallet, connected, address } = useContext(WalletContext);
  const { loadPrediction } = useContext(PredictionContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const walletAddress = await connectWallet();
      if (walletAddress) {
        await loadPrediction(walletAddress);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <Wallet className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">AurevGuard</h1>
          <p className="text-gray-600 mt-2">Blockchain Risk Assessment</p>
        </div>

        {!connected ? (
          <div>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
            {error && (
              <p className="text-red-600 text-sm mt-3 text-center">{error}</p>
            )}
          </div>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800 font-semibold">Wallet Connected</p>
            <p className="text-green-700 text-sm mt-1 break-all">{address}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectWallet;
```

---

### 2. **Dashboard Page**

**File:** `apps/frontend/src/pages/Dashboard.jsx`

```javascript
import React, { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { WalletContext } from '../contexts/WalletContext';
import { PredictionContext } from '../contexts/PredictionContext';
import PredictionCard from '../components/PredictionCard';
import SHAPExplainer from '../components/SHAPExplainer';
import AnomalyDetection from '../components/AnomalyDetection';
import ScoreComparison from '../components/ScoreComparison';

const Dashboard = () => {
  const { connected, address } = useContext(WalletContext);
  const { predictions, selectedWallet, loading, error } = useContext(PredictionContext);

  if (!connected) {
    return <Navigate to="/connect-wallet" replace />;
  }

  const currentPrediction = predictions[selectedWallet];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2">Wallet: {address}</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prediction Card - Full Width */}
          <div className="lg:col-span-3">
            <PredictionCard
              prediction={currentPrediction}
              loading={loading}
              error={error}
            />
          </div>

          {/* SHAP Explainer */}
          <div className="lg:col-span-2">
            {currentPrediction && (
              <SHAPExplainer walletAddress={selectedWallet} />
            )}
          </div>

          {/* Anomaly Detection */}
          <div>
            {currentPrediction && (
              <AnomalyDetection walletAddress={selectedWallet} />
            )}
          </div>

          {/* Score Comparison */}
          <div className="lg:col-span-3">
            {currentPrediction && (
              <ScoreComparison prediction={currentPrediction} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## Data Flow Diagram

```
┌─────────────────────┐
│   Frontend (React)  │
│   Port 3000         │
└──────────┬──────────┘
           │
           │ axios POST /api/predictions/:wallet
           │
┌──────────▼──────────┐
│  Backend (Express)  │
│  Port 5000          │
└──────────┬──────────┘
           │
           │ HTTP POST /masumi/predict
           │
┌──────────▼──────────┐
│  Orchestrator       │
│  Port 8080          │
└──────────┬──────────┘
           │
           │ Routes to models
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐  ┌─────▼───┐
│  RF   │  │   ISO   │
│ Model │  │ Model   │
└───────┘  └─────────┘
           │
           │ Returns predictions
           │
┌──────────▼──────────┐
│  Backend processes  │
│  and caches         │
└──────────┬──────────┘
           │
           │ JSON response
           │
┌──────────▼──────────┐
│  Frontend displays  │
│  predictions        │
└─────────────────────┘
```

---

## Environment Variables

**`.env.local` for Frontend:**

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WALLET_PROVIDER_URL=https://testnet.blockfrost.io
REACT_APP_CARDANO_NETWORK=testnet
```

---

## Next Steps

1. Implement wallet integration (see `WALLET_INTEGRATION_GUIDE.md`)
2. Set up live pipeline for transaction data (see `LIVE_PIPELINE_GUIDE.md`)
3. Deploy to production (see deployment documentation)

