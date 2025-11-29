# 🎯 Masumi Orchestrator - AI Training Integration Guide

## Overview

The Masumi orchestrator has been enhanced to fully integrate all AI model training parameters from `agents/ai_model/src/`. This guide explains the new architecture, endpoints, and usage.

---

## ✨ What's New

### 1. **Complete Training Parameter Schema** (`ai_training_params.py`)

Comprehensive Pydantic models for all training parameters:

```python
AITrainingConfig  # Master config object
├── TransactionDataParams          # Data loading from Blockfrost
├── DataIOParams                   # I/O caching
├── VolumeFeatureParams            # Time-window features
├── EntropyFeatureParams           # Shannon/Rényi entropy
├── DailyAggregationParams         # Daily aggregation
├── GraphBuildParams               # Graph construction
├── GraphMetricsParams             # Graph metrics (centrality, clustering)
├── CommunityDetectionParams       # Community detection
├── IsolationForestParams          # IF hyperparameters
├── OneClassSVMParams              # SVM hyperparameters
├── LocalOutlierFactorParams       # LOF hyperparameters
├── AnomalyEnsembleParams          # Ensemble voting
├── RandomForestParams             # RF hyperparameters
├── SHAPExplainerParams            # SHAP configuration
├── SHAPArtifactParams             # SHAP output saving
├── NarrativeExplainerParams       # Narrative generation
├── LivePipelineParams             # Live inference
├── InferenceParams                # Inference modes
└── PreprocessingParams            # Data preprocessing
```

**All parameters directly map to code in:**
- `agents/ai_model/src/data_pipeline.py`
- `agents/ai_model/src/feature_engineering.py`
- `agents/ai_model/src/graph_features.py`
- `agents/ai_model/src/ml_pipeline.py`
- `agents/ai_model/src/inference.py`
- `agents/ai_model/src/shap_explain.py`
- `agents/ai_model/src/live_pipeline.py`

### 2. **Enhanced Models** (`models.py`)

New Pydantic models for training workflows:

```python
AIModelTrainingStep          # Individual training step
AIModelTrainingPipeline      # Complete pipeline execution
AIModelPredictionRequest     # Prediction request schema
AIModelPredictionResponse    # Prediction response schema
TrainingDataQuality          # Data quality metrics
ModelPerformanceMetrics      # Model evaluation metrics
```

### 3. **AI Model Agent Handler** (`ai_model_agent.py`)

New FastAPI microservice integrating with orchestrator:

**Endpoints:**
- `GET /health` - Service health
- `POST /predict` - Run predictions (Isolation Forest + Random Forest)
- `POST /train/initialize` - Initialize training pipeline
- `POST /train/run/{pipeline_id}` - Execute training
- `GET /train/pipeline/{pipeline_id}` - Get pipeline status
- `GET /config/training` - Get complete config
- `POST /config/training` - Update config
- `POST /data/quality` - Assess data quality

### 4. **Enhanced Router** (`router.py`)

New workflow types:

```python
Workflows:
├── settle              # Payment + risk assessment
├── ai_predict         # Pure AI prediction
├── ai_train           # Initialize training
├── ai_train_run       # Run training pipeline
├── ai_config          # Get/update config
└── data_quality       # Assess data quality
```

### 5. **Extended App Endpoints** (`app.py`)

**Training Configuration:**
- `GET /masumi/training/config` - Get current config
- `POST /masumi/training/config/apply` - Apply new config
- `GET /masumi/training/config/defaults` - Get defaults

**Training Pipeline:**
- `POST /masumi/training/initialize` - Create new pipeline
- `POST /masumi/training/run/{pipeline_id}` - Start execution
- `GET /masumi/training/pipeline/{pipeline_id}` - Check status

**AI Predictions:**
- `POST /masumi/predict` - Run prediction

**Data Quality:**
- `POST /masumi/data/quality` - Quality assessment

**Statistics:**
- `GET /masumi/stats` - System overview

### 6. **Updated Config** (`config.yaml`)

```yaml
agents:
  - ai_model:
    capabilities: [predict, health, train/initialize, train/run, config/training, data/quality]
    
training:
  data:
    blockfrost_api_key: ${BLOCKFROST_API_KEY}
    max_blocks: 500
  features:
    time_windows: [24h, 7d, 30d]
    include_entropy: true
    include_daily_agg: true
    include_graph: true
  graph:
    compute_centrality: [betweenness, closeness, eigenvector]
  anomaly:
    models: [isolation_forest, one_class_svm, lof]
    contamination: 0.1
  risk_model:
    n_estimators: 200
    max_depth: 20
  explainability:
    explainer_type: tree
    save_artifacts: true

workflows:
  settle, ai_predict, ai_train, ai_train_run, ai_config, data_quality
```

---

## 🚀 Usage Examples

### 1. Get Training Configuration

```bash
curl http://localhost:8080/masumi/training/config
```

**Response:**
```json
{
  "status": "success",
  "config": {
    "isolation_forest": {
      "n_estimators": 300,
      "contamination": 0.1,
      "random_state": 42
    },
    "random_forest": {
      "n_estimators": 200,
      "max_depth": 20,
      "class_weight": "balanced"
    },
    "shap_explainer": {
      "explainer_type": "tree",
      "save_artifacts": true
    },
    ...
  }
}
```

### 2. Initialize Training Pipeline

```bash
curl -X POST http://localhost:8080/masumi/training/initialize \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "status": "initialized",
  "pipeline_id": "pipeline-2025-11-30T...",
  "total_steps": 9,
  "config_parameters": 150
}
```

### 3. Run Training Pipeline

```bash
curl -X POST http://localhost:8080/masumi/training/run/pipeline-2025-11-30T... \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "status": "started",
  "pipeline_id": "pipeline-2025-11-30T...",
  "message": "Training pipeline started in background"
}
```

### 4. Make AI Prediction

```bash
curl -X POST http://localhost:8080/masumi/predict \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "addr_...",
    "features": {
      "tx_count_24h": 10,
      "total_value_24h": 500000,
      "largest_value_24h": 100000,
      "std_value_24h": 50000,
      "unique_counterparts_24h": 5,
      "entropy_of_destinations": 2.3,
      "share_of_daily_volume": 0.05
    },
    "include_explanation": true,
    "include_shap": true
  }'
```

**Response:**
```json
{
  "status": "success",
  "prediction": {
    "status": "success",
    "risk_score": 0.35,
    "anomaly_score": -0.12,
    "anomaly_flag": 1,
    "explanation": {...},
    "shap_values": {...}
  }
}
```

### 5. Assess Data Quality

```bash
curl -X POST http://localhost:8080/masumi/data/quality \
  -H "Content-Type: application/json" \
  -d '{
    "records": [...],
    "missing_values": 5,
    "outliers": 2
  }'
```

---

## 🔄 Training Pipeline Execution Flow

```
1. Initialize Pipeline
   └─ Load config from AITrainingConfig
   └─ Create AIModelTrainingPipeline object
   └─ Return pipeline_id

2. Run Pipeline (9 Steps)
   ├─ Step 1: Data Loading
   │  └─ Fetch from Blockfrost (max_blocks, tx_count_per_address)
   │  └─ Output: Raw transactions JSON
   ├─ Step 2: Feature Engineering
   │  └─ Volume features (24h, 7d, 30d windows)
   │  └─ Entropy features (Shannon, Rényi)
   │  └─ Daily aggregation
   │  └─ Output: features.csv
   ├─ Step 3: Graph Analysis
   │  └─ Build transaction graph
   │  └─ Compute metrics (degree, centrality, clustering)
   │  └─ Optional: Community detection
   │  └─ Output: graph_features.csv
   ├─ Step 4: Preprocessing
   │  └─ Handle missing values
   │  └─ Scale features
   │  └─ Select features
   ├─ Step 5: Anomaly Detection
   │  └─ Train IsolationForest (300 estimators, contamination=0.1)
   │  └─ Train OneClassSVM (rbf kernel, nu=0.1)
   │  └─ Train LOF (20 neighbors)
   │  └─ Ensemble voting
   │  └─ Output: anomaly_results.csv
   ├─ Step 6: Risk Scoring
   │  └─ Train RandomForest (200 estimators, max_depth=20)
   │  └─ Split: 80% train, 20% test
   │  └─ Save model: randomforest.pkl
   ├─ Step 7: Model Evaluation
   │  └─ Compute ROC-AUC, precision/recall, F1
   │  └─ Feature importance
   │  └─ 5-fold cross-validation
   ├─ Step 8: SHAP Explanation
   │  └─ Generate SHAP values (TreeExplainer)
   │  └─ Save SHAP artifacts
   │  └─ Per-address contributions
   │  └─ Output: shap_summary.csv, per_address.json
   └─ Step 9: Export
      └─ Export models (PKL)
      └─ Export data (CSV, JSON)
      └─ Export predictions
      └─ Generate report
```

---

## 📊 Parameter Mapping to Source Code

| Parameter Category | Source File | Key Functions |
|---|---|---|
| **Data Loading** | `data_pipeline.py` | `fetch_transactions_for_address()`, `build_features_from_addresses()` |
| **Feature Engineering** | `feature_engineering.py` | `load_transactions()`, `aggregate_volume_features()`, `compute_entropy_features()` |
| **Daily Aggregation** | `feature_engineering.py` | `aggregate_daily_stats()`, `compute_rolling_stats()` |
| **Graph Features** | `graph_features.py` | `build_counterparty_edges()`, `compute_graph_metrics()`, `detect_communities()` |
| **Anomaly Detection** | `ml_pipeline.py` | `run_models()` with IsolationForest, OneClassSVM, LOF |
| **Risk Scoring** | `ml_pipeline.py` | RandomForest training, evaluation |
| **Inference** | `inference.py` | `load_models()`, `detect_anomaly()`, `predict_risk()` |
| **SHAP** | `shap_explain.py` | `compute_shap_values()`, `save_shap_artifacts()` |
| **Narratives** | `narrative_explainer.py` | Human-readable explanations |
| **Live Inference** | `live_pipeline.py` | Real-time batch processing |

---

## 🔌 Integration Points

### Orchestrator ↔ AI Model Agent

```python
# Via router.py routing:
route_request(registry, {
    "workflow": "ai_predict",
    "payload": {
        "wallet_address": "addr_...",
        "features": {...},
        "include_explanation": True,
        "include_shap": True
    }
})

# Via workflow: "ai_train"
route_request(registry, {
    "workflow": "ai_train",
    "payload": {
        "config": AITrainingConfig.to_dict()
    }
})
```

### AI Model Agent Execution

```python
# In ai_model_agent.py:
1. Load models from cache or disk
   └─ isolationforest.pkl
   └─ randomforest.pkl
   └─ SHAP TreeExplainer

2. Run prediction:
   └─ anomaly_score = iso_model.decision_function(features)
   └─ risk_prob = rf_model.predict_proba(features)[0][1]
   └─ shap_vals = explainer.shap_values(features)

3. Return standardized response:
   {
     "status": "success",
     "risk_score": 0.35,
     "anomaly_score": -0.12,
     "anomaly_flag": 1,
     "explanation": {...},
     "shap_values": {...},
     "inference_time_ms": 45.2
   }
```

---

## 📋 Configuration Hierarchy

```
config.yaml (static)
    │
    ├─→ agents: [payment, compliance, ai_model]
    │
    ├─→ training: {...}  # Static training defaults
    │
    └─→ workflows: {settle, ai_predict, ai_train, ...}

AITrainingConfig (Pydantic)
    │
    ├─→ Isolation Forest: 300 estimators, 0.1 contamination
    ├─→ OneClassSVM: rbf kernel, nu=0.1
    ├─→ LOF: 20 neighbors
    ├─→ Random Forest: 200 estimators, max_depth=20
    ├─→ SHAP: tree explainer, save artifacts
    ├─→ Graph: degree, centrality, clustering
    ├─→ Features: 24h, 7d, 30d windows + entropy + daily
    └─→ Data: Blockfrost config + cache settings
```

---

## 🔧 Running the System

### 1. Start Masumi Orchestrator (Port 8080)

```bash
cd masumi/orchestrator
uvicorn app:app --port 8080 --reload
```

**Expected Output:**
```
✅ Registered 3 agents
INFO:     Uvicorn running on http://0.0.0.0:8080
```

### 2. Start AI Model Agent (Port 8083)

```bash
cd masumi/orchestrator
uvicorn ai_model_agent:app --port 8083 --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8083
✅ Models loaded successfully
```

### 3. Verify All Services

```bash
curl http://localhost:8080/masumi/health
curl http://localhost:8080/masumi/agents
curl http://localhost:8080/masumi/stats
```

---

## 📚 Key Classes & Their Relationships

```
AITrainingConfig
├── Defines all 150+ parameters
├── Validates via Pydantic
└── Exports to dict/YAML

AIModelTrainingPipeline
├── Tracks 9 training steps
├── Stores config reference
├── Records metrics/errors
└── Manages lifecycle

AIModelTrainingStep
├── Individual step execution
├── Records timing (start/end)
├── Captures I/O data
└── Stores metrics

AIModelPredictionRequest/Response
├── Standardized I/O schema
├── Includes SHAP/explanations
└── Tracks inference time

TrainingDataQuality
├── Validates data completeness
├── Detects outliers/missing
└── Scores overall quality

ModelPerformanceMetrics
├── ROC-AUC, precision, recall
├── Confusion matrix
├── Feature importance
└── Training/test metrics
```

---

## 🎯 Next Steps

1. **Deploy AI Model Agent** - Ensure it's running on port 8083
2. **Test Endpoints** - Use curl/Postman to verify
3. **Load Training Data** - Place data in `agents/ai_model/data/`
4. **Initialize Pipeline** - Create pipeline with POST `/masumi/training/initialize`
5. **Run Training** - Execute with POST `/masumi/training/run/{pipeline_id}`
6. **Monitor Progress** - Check status with GET `/masumi/training/pipeline/{pipeline_id}`
7. **Make Predictions** - Use POST `/masumi/predict` with trained models

---

## 🆘 Troubleshooting

| Issue | Solution |
|---|---|
| "Agent not found" | Ensure config.yaml has all 3 agents registered |
| "Models not loaded" | Check `agents/ai_model/models/*.pkl` exist |
| "Training stuck" | Check agent logs, increase timeout in router |
| "SHAP errors" | Ensure features match BASE_FEATURES in inference.py |
| "Config validation fails" | Validate against AITrainingConfig schema |

---

## 📖 Documentation Files

- `MONOREPO_CANVAS.md` - Full system architecture
- `ai_training_params.py` - Complete parameter schema
- `models.py` - Data models for training/inference
- `ai_model_agent.py` - Agent implementation
- `router.py` - Workflow routing logic
- `app.py` - Orchestrator endpoints
- `config.yaml` - Agent & workflow configuration

