# Frontend Pages Architecture & Flow Guide

## Overview

This document outlines the complete frontend application structure, page flow, and component architecture for the AurevGuard Cardano blockchain risk assessment system.

---

## Application Flow

```
Start
  │
  ├─→ Connect Wallet Page
  │   ├─ Detect wallet extensions (Nami/Eternl/Flint)
  │   ├─ User selects wallet
  │   ├─ Connect wallet & fetch address
  │   └─ Load initial prediction
  │
  ├─→ Dashboard Page (Main Hub)
  │   ├─ Display risk score & summary
  │   ├─ Show SHAP explanations
  │   ├─ Show anomaly detection results
  │   └─ Show score comparison
  │
  ├─→ AI Predictions Page
  │   ├─ Detailed SHAP feature analysis
  │   ├─ Feature importance ranking
  │   ├─ Risk factor explanations
  │   └─ Historical predictions
  │
  ├─→ Anomaly Detection Page
  │   ├─ Model ensemble scores
  │   ├─ Anomaly visualizations
  │   ├─ Threshold alerts
  │   └─ Anomaly history
  │
  ├─→ Live Pipeline Page
  │   ├─ Payment processing (2 ADA)
  │   ├─ Transaction processing
  │   ├─ Real-time updates
  │   └─ Results storage
  │
  └─→ Settings Page
      ├─ Manage wallets
      ├─ Configure thresholds
      ├─ Privacy settings
      └─ API keys

```

---

## Page 1: Connect Wallet

**File:** `apps/frontend/src/pages/ConnectWallet.jsx`

**Purpose:** Initial entry point - user connects their Cardano wallet

```javascript
import React, { useState, useEffect, useContext } from 'react';
import { Wallet, AlertCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WalletContext } from '../contexts/WalletContext';
import { PredictionContext } from '../contexts/PredictionContext';
import WalletConnect from '../components/WalletConnect';

const ConnectWallet = () => {
  const navigate = useNavigate();
  const { connected, address } = useContext(WalletContext);
  const { loadPrediction } = useContext(PredictionContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && address) {
      // Auto-load prediction after successful connection
      loadPrediction(address).then(() => {
        setTimeout(() => navigate('/dashboard'), 2000);
      });
    }
  }, [connected, address]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>

      {/* Main card */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full backdrop-blur-lg">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-lg inline-block mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AurevGuard
          </h1>
          <p className="text-gray-600 mt-2 text-lg font-semibold">
            Blockchain Risk Assessment
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Powered by AI & SHAP Explainability
          </p>
        </div>

        {/* Features list */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <Feature icon="✓" text="AI-powered risk scoring" />
          <Feature icon="✓" text="Real-time anomaly detection" />
          <Feature icon="✓" text="SHAP-based explanations" />
          <Feature icon="✓" text="Live transaction analysis" />
        </div>

        {/* Wallet connection */}
        <div className="mb-6">
          <WalletConnect />
        </div>

        {/* Info box */}
        {!connected && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Supported wallets:</strong> Nami, Eternl, Flint
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Network:</strong> Cardano Testnet
            </p>
          </div>
        )}

        {connected && (
          <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded text-center">
            <Check className="text-green-600 mx-auto mb-2" size={24} />
            <p className="text-green-800 font-semibold">
              Wallet Connected!
            </p>
            <p className="text-green-700 text-sm mt-1">
              Redirecting to dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const Feature = ({ icon, text }) => (
  <div className="flex items-center gap-3">
    <span className="text-green-600 font-bold">{icon}</span>
    <span className="text-gray-700 text-sm">{text}</span>
  </div>
);

export default ConnectWallet;
```

---

## Page 2: Dashboard

**File:** `apps/frontend/src/pages/Dashboard.jsx`

**Purpose:** Main hub showing risk summary, SHAP explanations, anomalies, and scores

```javascript
import React, { useContext, useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BarChart3, AlertTriangle, TrendingUp, Settings } from 'lucide-react';
import { WalletContext } from '../contexts/WalletContext';
import { PredictionContext } from '../contexts/PredictionContext';
import PredictionCard from '../components/PredictionCard';
import SHAPExplainer from '../components/SHAPExplainer';
import AnomalyDetection from '../components/AnomalyDetection';
import ScoreComparison from '../components/ScoreComparison';

const Dashboard = () => {
  const { connected, address, disconnectWallet } = useContext(WalletContext);
  const { predictions, selectedWallet, loading, error, fetchPrediction } = useContext(PredictionContext);
  const [refreshing, setRefreshing] = useState(false);

  if (!connected) {
    return <Navigate to="/connect-wallet" replace />;
  }

  const currentPrediction = predictions[selectedWallet];

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrediction(address);
    setRefreshing(false);
  };

  const handleLogout = () => {
    disconnectWallet();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              {address?.substring(0, 20)}...
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              to="/settings"
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <Settings size={24} className="text-gray-700" />
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border-2 border-red-600 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Score Card - Full width */}
          <div className="lg:col-span-3">
            <PredictionCard
              prediction={currentPrediction}
              loading={loading}
              error={error}
            />
          </div>

          {/* SHAP Analysis */}
          <div className="lg:col-span-2">
            {currentPrediction && (
              <SHAPExplainer walletAddress={selectedWallet} />
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Quick Links
            </h3>
            <div className="space-y-3">
              <Link
                to="/predictions"
                className="flex items-center gap-2 p-3 hover:bg-blue-50 rounded-lg transition"
              >
                <BarChart3 size={20} className="text-blue-600" />
                <span className="text-gray-700 font-semibold">AI Predictions</span>
              </Link>
              <Link
                to="/anomalies"
                className="flex items-center gap-2 p-3 hover:bg-orange-50 rounded-lg transition"
              >
                <AlertTriangle size={20} className="text-orange-600" />
                <span className="text-gray-700 font-semibold">Anomalies</span>
              </Link>
              <Link
                to="/live-pipeline"
                className="flex items-center gap-2 p-3 hover:bg-green-50 rounded-lg transition"
              >
                <TrendingUp size={20} className="text-green-600" />
                <span className="text-gray-700 font-semibold">Live Pipeline</span>
              </Link>
            </div>
          </div>

          {/* Anomaly Detection */}
          <div className="lg:col-span-2">
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

## Page 3: AI Predictions

**File:** `apps/frontend/src/pages/AIPredictions.jsx`

**Purpose:** Detailed SHAP explanations and feature importance analysis

```javascript
import React, { useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { WalletContext } from '../contexts/WalletContext';
import { PredictionContext } from '../contexts/PredictionContext';
import orchestratorApi from '../api/orchestratorApi';

const AIPredictions = () => {
  const { connected, address } = useContext(WalletContext);
  const { predictions, selectedWallet } = useContext(PredictionContext);
  const [shapData, setShapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  if (!connected) {
    return <Navigate to="/connect-wallet" replace />;
  }

  useEffect(() => {
    const fetchShap = async () => {
      setLoading(true);
      try {
        const data = await orchestratorApi.getSHAPExplanation(selectedWallet);
        setShapData(data);
      } catch (error) {
        console.error('Failed to fetch SHAP:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedWallet) {
      fetchShap();
    }
  }, [selectedWallet]);

  if (!predictions[selectedWallet]) {
    return <div>No predictions available</div>;
  }

  const chartData = shapData
    ? Object.entries(shapData.shap_values)
        .map(([feature, value]) => ({
          feature: feature.replace(/_/g, ' ').toUpperCase(),
          value: parseFloat(value),
          abs_value: Math.abs(parseFloat(value))
        }))
        .sort((a, b) => b.abs_value - a.abs_value)
        .slice(0, 15)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">AI Predictions & SHAP Explanations</h1>

        {/* Feature Importance Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Top 15 Features Impacting Risk Score
          </h2>
          
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-600">Loading SHAP explanations...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Feature Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Feature Contributions
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {chartData.map(({ feature, value }) => (
                <div
                  key={feature}
                  onClick={() => setSelectedFeature(feature)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedFeature === feature
                      ? 'bg-blue-100 border-2 border-blue-600'
                      : 'hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">{feature}</span>
                    <span
                      className={`text-sm font-bold ${
                        value > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {value > 0 ? '↑' : '↓'} {Math.abs(value).toFixed(3)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        value > 0 ? 'bg-red-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.abs(value) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interpretation Guide */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              How to Interpret SHAP Values
            </h3>
            <div className="space-y-4">
              <InterpretationBox
                title="Positive Values (Red)"
                description="Increase the predicted risk score. Higher positive values = stronger risk indicator."
                example="High burstiness (+0.38) indicates concentrated transaction activity, increasing risk."
              />
              <InterpretationBox
                title="Negative Values (Green)"
                description="Decrease the predicted risk score. More negative = stronger protective factor."
                example="Diverse counterparties (-0.22) indicates varied interactions, decreasing risk."
              />
              <InterpretationBox
                title="Magnitude"
                description="Larger absolute values have more impact on the final risk prediction."
                example="Feature with 0.45 impact > Feature with 0.15 impact"
              />
            </div>
          </div>
        </div>

        {/* Historical Predictions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Prediction History
          </h3>
          <p className="text-gray-600 text-sm">
            Last updated: {new Date(predictions[selectedWallet].timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

const InterpretationBox = ({ title, description, example }) => (
  <div className="bg-gray-50 p-3 rounded-lg">
    <h4 className="font-semibold text-gray-800">{title}</h4>
    <p className="text-sm text-gray-700 mt-1">{description}</p>
    <p className="text-xs text-gray-600 mt-2 italic">Example: {example}</p>
  </div>
);

export default AIPredictions;
```

---

## Page 4: Anomaly Detection

**File:** `apps/frontend/src/pages/AnomalyDetection.jsx`

**Purpose:** Show anomaly scores from multiple models and ensemble results

```javascript
import React, { useContext, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { WalletContext } from '../contexts/WalletContext';
import { PredictionContext } from '../contexts/PredictionContext';
import orchestratorApi from '../api/orchestratorApi';

const AnomalyDetectionPage = () => {
  const { connected } = useContext(WalletContext);
  const { predictions, selectedWallet } = useContext(PredictionContext);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!connected) {
    return <Navigate to="/connect-wallet" replace />;
  }

  useEffect(() => {
    const fetchAnomalies = async () => {
      setLoading(true);
      try {
        const data = await orchestratorApi.getAnomalyScores(selectedWallet);
        setAnomalies(data);
      } catch (error) {
        console.error('Failed to fetch anomalies:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedWallet) {
      fetchAnomalies();
    }
  }, [selectedWallet]);

  if (!anomalies) {
    return <div>Loading anomaly data...</div>;
  }

  const modelScores = Object.entries(anomalies.model_scores).map(([model, score]) => ({
    model,
    score: score * 100
  }));

  const pieData = [
    { name: 'Anomaly', value: anomalies.ensemble_agreement * 100 },
    { name: 'Normal', value: (1 - anomalies.ensemble_agreement) * 100 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Anomaly Detection Analysis</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ensemble Agreement */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Ensemble Agreement
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Model Scores */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Individual Model Scores
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                <Bar dataKey="score" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Model Details</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {modelScores.map(({ model, score }) => (
              <ModelCard key={model} model={model} score={score} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ModelCard = ({ model, score }) => {
  const getColor = (score) => {
    if (score > 70) return 'bg-red-100 border-red-600 text-red-800';
    if (score > 40) return 'bg-orange-100 border-orange-600 text-orange-800';
    return 'bg-green-100 border-green-600 text-green-800';
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getColor(score)}`}>
      <p className="font-semibold text-sm">{model}</p>
      <p className="text-3xl font-bold mt-2">{score.toFixed(1)}%</p>
      <p className="text-xs mt-2">
        {score > 70 ? 'High Anomaly' : score > 40 ? 'Medium Anomaly' : 'Low Anomaly'}
      </p>
    </div>
  );
};

export default AnomalyDetectionPage;
```

---

## Page 5: Live Pipeline

**File:** `apps/frontend/src/pages/LivePipeline.jsx`

**Purpose:** Process payment and enable live transaction analysis

```javascript
import React, { useContext, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { WalletContext } from '../contexts/WalletContext';
import PaymentProcessor from '../components/PaymentProcessor';
import LivePipelineProcessor from '../components/LivePipelineProcessor';

const LivePipelinePage = () => {
  const { connected } = useContext(WalletContext);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [transactionId, setTransactionId] = useState(null);

  if (!connected) {
    return <Navigate to="/connect-wallet" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Live Pipeline Analysis</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Section */}
          <PaymentProcessor
            onPaymentComplete={(txId) => {
              setPaymentComplete(true);
              setTransactionId(txId);
            }}
          />

          {/* Live Pipeline Section */}
          {paymentComplete && (
            <LivePipelineProcessor
              walletAddress="addr_test1q..."
              transactionId={transactionId}
            />
          )}
        </div>

        {/* Information */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            What is Live Pipeline?
          </h2>
          <ul className="text-blue-800 space-y-2">
            <li>✓ Real-time blockchain transaction analysis</li>
            <li>✓ Continuous risk and anomaly detection</li>
            <li>✓ Live feature engineering and updates</li>
            <li>✓ AI model predictions on fresh data</li>
            <li>✓ SHAP explanations for each transaction</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LivePipelinePage;
```

---

## App Router Configuration

**File:** `apps/frontend/src/App.jsx`

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { PredictionProvider } from './contexts/PredictionContext';

// Pages
import ConnectWallet from './pages/ConnectWallet';
import Dashboard from './pages/Dashboard';
import AIPredictions from './pages/AIPredictions';
import AnomalyDetection from './pages/AnomalyDetection';
import LivePipeline from './pages/LivePipeline';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <WalletProvider>
        <PredictionProvider>
          <Routes>
            <Route path="/connect-wallet" element={<ConnectWallet />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/predictions" element={<AIPredictions />} />
            <Route path="/anomalies" element={<AnomalyDetection />} />
            <Route path="/live-pipeline" element={<LivePipeline />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/connect-wallet" replace />} />
          </Routes>
        </PredictionProvider>
      </WalletProvider>
    </Router>
  );
}

export default App;
```

---

## Environment Configuration

**`apps/frontend/.env.local`:**

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ORCHESTRATOR_URL=http://localhost:8080
REACT_APP_BLOCKFROST_API_KEY=your_blockfrost_key
REACT_APP_PAYMENT_ADDRESS=addr_test1qpaymentaddress
REACT_APP_NETWORK=testnet
```

---

## Page Navigation Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  AurevGuard Application Flow                                │
└─────────────────────────────────────────────────────────────┘

    Start
      │
      ▼
  ┌─────────────────┐
  │ Connect Wallet  │  (Nami/Eternl/Flint)
  └────────┬────────┘
           │
           │ Connected
           ▼
  ┌─────────────────┐
  │  Dashboard      │◄──────────────────────┐
  │ (Risk Summary)  │                       │
  └──┬──┬──┬────────┘                       │
     │  │  │                                │
     │  │  └─────────────────────────────────┤─ Settings
     │  │                                   │
     │  ├──► AI Predictions                │
     │  │   (SHAP Analysis)                │
     │  │                                  │
     │  └──► Anomaly Detection             │
     │      (Model Scores)                 │
     │
     └──► Live Pipeline
         (Payment ──► Analysis)
```

---

## Component Hierarchy

```
App.jsx
├── WalletProvider
├── PredictionProvider
└── Routes
    ├── ConnectWallet
    │   └── WalletConnect
    ├── Dashboard
    │   ├── PredictionCard
    │   ├── SHAPExplainer
    │   ├── AnomalyDetection
    │   └── ScoreComparison
    ├── AIPredictions
    │   └── SHAP Charts & Details
    ├── AnomalyDetectionPage
    │   └── Ensemble Analysis
    ├── LivePipeline
    │   ├── PaymentProcessor
    │   └── LivePipelineProcessor
    └── Settings
        └── User Configuration
```

---

## Next Steps

1. Implement dashboard components guide (see `DASHBOARD_COMPONENTS.md`)
2. Deploy frontend to production
3. Set up CI/CD pipeline for frontend
4. Configure monitoring and error tracking

