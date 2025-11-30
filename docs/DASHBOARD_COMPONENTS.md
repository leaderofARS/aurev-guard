# Dashboard Components Architecture Guide

## Overview

This document details all reusable React components used throughout the AurevGuard dashboard, including their props, state management, and usage patterns.

---

## Component Hierarchy

```
Dashboard
├── PredictionCard
├── SHAPExplainer
├── AnomalyDetection
├── ScoreComparison
├── TransactionHistory
├── RiskGauge
├── FeatureTable
├── AlertBox
├── TrendChart
└── ModelEnsemble
```

---

## Component 1: PredictionCard

**Purpose:** Display main risk score with color-coded severity

```javascript
// apps/frontend/src/components/PredictionCard.jsx

import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

const PredictionCard = ({ prediction, loading, error }) => {
  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg animate-pulse h-48" />
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3">
        <AlertCircle className="text-red-600" size={24} />
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  const getRiskColor = (score) => {
    if (score < 0.3) return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-600',
      label: 'LOW RISK'
    };
    if (score < 0.6) return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-600',
      label: 'MEDIUM RISK'
    };
    if (score < 0.8) return {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-600',
      label: 'HIGH RISK'
    };
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-600',
      label: 'CRITICAL RISK'
    };
  };

  const risk = getRiskColor(prediction.riskScore);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Risk Assessment</h3>
            <p className="text-sm text-gray-600 mt-2">
              {prediction.walletAddress.substring(0, 30)}...
            </p>
          </div>
          <TrendingUp className="text-blue-600" size={28} />
        </div>

        <div className={`${risk.bg} border-2 ${risk.border} p-6 rounded-lg text-center`}>
          <div className="text-5xl font-bold">
            <span className={risk.text}>
              {(prediction.riskScore * 100).toFixed(1)}%
            </span>
          </div>
          <div className={`text-lg font-semibold mt-3 ${risk.text}`}>
            {risk.label}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <MetricBox
            label="Anomaly Score"
            value={(prediction.anomalyScore * 100).toFixed(1) + '%'}
            color="blue"
          />
          <MetricBox
            label="Confidence"
            value={(prediction.modelConfidence * 100).toFixed(1) + '%'}
            color="purple"
          />
          <MetricBox
            label="Ensemble Agree"
            value={(prediction.ensembleAgreement * 100).toFixed(1) + '%'}
            color="green"
          />
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Updated: {new Date(prediction.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    green: 'bg-green-50 text-green-800 border-green-200'
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-3 text-center`}>
      <p className="text-xs font-semibold opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

export default PredictionCard;
```

---

## Component 2: SHAPExplainer

**Purpose:** Visualize feature importance using SHAP values

```javascript
// apps/frontend/src/components/SHAPExplainer.jsx

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import orchestratorApi from '../api/orchestratorApi';

const SHAPExplainer = ({ walletAddress, interactive = true }) => {
  const [shapData, setShapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [topN, setTopN] = useState(10);

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

  if (loading) return <div className="p-6 bg-gray-100 rounded-lg animate-pulse">Loading...</div>;
  if (!shapData) return <div className="p-6 text-gray-600">No SHAP data available</div>;

  const chartData = Object.entries(shapData.shap_values)
    .map(([feature, value]) => ({
      feature: feature.replace(/_/g, ' ').toUpperCase(),
      value: parseFloat(value),
      abs_value: Math.abs(parseFloat(value))
    }))
    .sort((a, b) => b.abs_value - a.abs_value)
    .slice(0, topN);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Feature Importance (SHAP Values)
        </h3>
        {interactive && (
          <select
            value={topN}
            onChange={(e) => setTopN(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={20}>Top 20</option>
          </select>
        )}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip
            formatter={(value) => value.toFixed(4)}
            content={<CustomTooltip />}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Explanations:</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {chartData.map(({ feature, value }) => (
            <div
              key={feature}
              onClick={() => setSelectedFeature(feature)}
              className={`p-3 rounded-lg cursor-pointer transition ${
                selectedFeature === feature
                  ? 'bg-blue-100 border-2 border-blue-600'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">{feature}</span>
                <span className={`text-sm font-bold ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {value > 0 ? '↑ increases' : '↓ decreases'} risk by {Math.abs(value).toFixed(3)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800">{data.feature}</p>
        <p className="text-blue-600">
          {data.value > 0 ? '↑' : '↓'} {Math.abs(data.value).toFixed(4)}
        </p>
      </div>
    );
  }
  return null;
};

export default SHAPExplainer;
```

---

## Component 3: AnomalyDetection

**Purpose:** Display multi-model anomaly scores with ensemble voting

```javascript
// apps/frontend/src/components/AnomalyDetection.jsx

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

  if (loading) return <div className="p-6 bg-gray-100 rounded-lg animate-pulse">Loading...</div>;
  if (!anomalies) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="text-orange-600" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">
          Anomaly Detection
        </h3>
      </div>

      <div className="space-y-3 mb-6">
        {Object.entries(anomalies.model_scores).map(([model, score]) => (
          <ModelScore key={model} model={model} score={score} />
        ))}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>Ensemble Agreement:</strong> {(anomalies.ensemble_agreement * 100).toFixed(1)}%
        </p>
        <p className="text-xs text-blue-700 mt-1">
          {anomalies.ensemble_agreement > 0.7
            ? '✓ High confidence in anomaly detection'
            : anomalies.ensemble_agreement > 0.5
            ? '⚠ Moderate consensus among models'
            : '⚠ Low consensus - requires manual review'}
        </p>
      </div>
    </div>
  );
};

const ModelScore = ({ model, score }) => {
  const getColor = (score) => {
    if (score > 0.7) {
      return {
        bg: 'bg-red-100',
        progress: 'bg-red-600',
        text: 'text-red-800',
        label: 'High Anomaly'
      };
    }
    if (score > 0.4) {
      return {
        bg: 'bg-orange-100',
        progress: 'bg-orange-600',
        text: 'text-orange-800',
        label: 'Medium Anomaly'
      };
    }
    return {
      bg: 'bg-green-100',
      progress: 'bg-green-600',
      text: 'text-green-800',
      label: 'Low Anomaly'
    };
  };

  const color = getColor(score);

  return (
    <div className={`${color.bg} p-4 rounded-lg`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-semibold ${color.text}`}>{model}</span>
        <span className={`text-sm font-bold ${color.text}`}>
          {(score * 100).toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-300 rounded-full h-2">
        <div
          className={`${color.progress} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
      <p className={`text-xs ${color.text} mt-2`}>{color.label}</p>
    </div>
  );
};

export default AnomalyDetection;
```

---

## Component 4: ScoreComparison

**Purpose:** Compare multiple scoring models

```javascript
// apps/frontend/src/components/ScoreComparison.jsx

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ScoreComparison = ({ prediction }) => {
  const data = [
    { name: 'Risk Score', value: prediction.riskScore * 100 },
    { name: 'Anomaly Score', value: prediction.anomalyScore * 100 },
    { name: 'Confidence', value: prediction.modelConfidence * 100 },
    { name: 'Ensemble Agree', value: prediction.ensembleAgreement * 100 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Score Comparison</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
          <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-4 gap-3 mt-6">
        {data.map(({ name, value }) => (
          <div key={name} className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-600">{name}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {value.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreComparison;
```

---

## Component 5: RiskGauge

**Purpose:** Circular gauge visualization for risk score

```javascript
// apps/frontend/src/components/RiskGauge.jsx

import React from 'react';

const RiskGauge = ({ score, size = 200 }) => {
  const circumference = 2 * Math.PI * (size / 2 - 20);
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (score) => {
    if (score < 30) return '#10b981';
    if (score < 60) return '#f59e0b';
    if (score < 80) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 20}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 20}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="20"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s' }}
        />
      </svg>
      <div className="text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <p className="text-4xl font-bold text-gray-800">{score.toFixed(1)}%</p>
        <p className="text-gray-600 text-sm">Risk Score</p>
      </div>
    </div>
  );
};

export default RiskGauge;
```

---

## Component 6: FeatureTable

**Purpose:** Display detailed feature values

```javascript
// apps/frontend/src/components/FeatureTable.jsx

import React, { useState } from 'react';

const FeatureTable = ({ features, onFeatureSelect }) => {
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const sortedFeatures = Object.entries(features)
    .sort(([, a], [, b]) => {
      if (sortBy === 'value') {
        return sortOrder === 'asc' ? a - b : b - a;
      }
      return 0;
    });

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Feature Values</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Feature</th>
              <th
                className="px-6 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSortBy('value');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
              >
                Value {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedFeatures.map(([name, value], idx) => (
              <tr
                key={name}
                onClick={() => onFeatureSelect?.(name)}
                className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer transition`}
              >
                <td className="px-6 py-4 text-sm text-gray-700">{name}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeatureTable;
```

---

## Component 7: TrendChart

**Purpose:** Show prediction history over time

```javascript
// apps/frontend/src/components/TrendChart.jsx

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrendChart = ({ data, title = 'Trend Over Time' }) => {
  if (!data || data.length === 0) {
    return <div className="p-6 text-gray-600">No data available</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">{title}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="riskScore"
            stroke="#ef4444"
            dot={false}
            name="Risk Score"
          />
          <Line
            type="monotone"
            dataKey="anomalyScore"
            stroke="#f59e0b"
            dot={false}
            name="Anomaly Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
```

---

## Component 8: ModelEnsemble

**Purpose:** Visualize how ensemble voting works

```javascript
// apps/frontend/src/components/ModelEnsemble.jsx

import React from 'react';

const ModelEnsemble = ({ modelResults }) => {
  const consensus = (modelResults.filter(m => m.consensus).length / modelResults.length * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Model Ensemble Voting</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {modelResults.map((result) => (
          <div
            key={result.name}
            className={`p-4 rounded-lg border-2 ${
              result.consensus
                ? 'bg-green-50 border-green-600'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <p className="font-semibold text-gray-800">{result.name}</p>
            <p className="text-2xl font-bold mt-2">
              {result.score > 0.5 ? 'ANOMALY' : 'NORMAL'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Confidence: {(result.score * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <p className="text-blue-800">
          <strong>Ensemble Consensus:</strong> {consensus}% agree
        </p>
      </div>
    </div>
  );
};

export default ModelEnsemble;
```

---

## Component Usage Examples

```javascript
// In Dashboard.jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-3">
    <PredictionCard prediction={prediction} loading={loading} error={error} />
  </div>

  <div className="lg:col-span-2">
    <SHAPExplainer walletAddress={address} interactive={true} />
  </div>

  <div>
    <AnomalyDetection walletAddress={address} />
  </div>

  <div className="lg:col-span-3">
    <ScoreComparison prediction={prediction} />
  </div>

  <div className="lg:col-span-2">
    <TrendChart data={historicalData} />
  </div>

  <div>
    <RiskGauge score={prediction.riskScore * 100} size={240} />
  </div>
</div>
```

---

## Styling Conventions

**Color Scheme:**
- Risk/Critical: `red-600` (#dc2626)
- High: `orange-600` (#ea580c)
- Medium: `yellow-600` (#ca8a04)
- Low: `green-600` (#16a34a)
- Info: `blue-600` (#2563eb)
- Secondary: `purple-600` (#7c3aed)

**Spacing:**
- Container: `p-6` (24px)
- Section: `mb-6` (24px)
- Item: `gap-3` to `gap-6`

**Typography:**
- Title: `text-lg font-semibold`
- Subtitle: `text-sm text-gray-600`
- Value: `text-2xl font-bold`

---

## Next Steps

1. Deploy all components
2. Set up Storybook for component documentation
3. Configure visual regression testing
4. Set up performance monitoring

