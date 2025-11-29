# 🚀 Quick Start Guide - Masumi Orchestrator AI Training

## ⚡ 5-Minute Setup

### 1. Start Orchestrator (Port 8080)
```bash
cd masumi/orchestrator
uvicorn app:app --port 8080 --reload
```

### 2. Start AI Model Agent (Port 8083)
```bash
cd masumi/orchestrator
uvicorn ai_model_agent:app --port 8083 --reload
```

### 3. Verify Systems Running
```bash
curl http://localhost:8080/masumi/health
curl http://localhost:8083/health
curl http://localhost:8080/masumi/stats
```

---

## 📍 Common Tasks

### Get Training Configuration
```bash
curl http://localhost:8080/masumi/training/config | jq .
```

### Initialize Training Pipeline
```bash
PIPELINE_ID=$(curl -X POST http://localhost:8080/masumi/training/initialize \
  | jq -r '.pipeline_id')
echo "Pipeline ID: $PIPELINE_ID"
```

### Run Training
```bash
curl -X POST http://localhost:8080/masumi/training/run/$PIPELINE_ID
```

### Check Training Progress
```bash
curl http://localhost:8080/masumi/training/pipeline/$PIPELINE_ID | jq .
```

### Make Risk Prediction
```bash
curl -X POST http://localhost:8080/masumi/predict \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "addr_test1...",
    "features": {
      "tx_count_24h": 10,
      "total_value_24h": 500000,
      "largest_value_24h": 100000,
      "std_value_24h": 50000,
      "unique_counterparts_24h": 5,
      "entropy_of_destinations": 2.3,
      "share_of_daily_volume": 0.05
    }
  }' | jq .
```

### Check System Status
```bash
curl http://localhost:8080/masumi/stats | jq .
```

---

## 🔧 Configuration

### Get Default Config
```bash
curl http://localhost:8080/masumi/training/config/defaults | jq . > config.json
```

### Edit & Apply Config
```bash
# Edit config.json with your values
curl -X POST http://localhost:8080/masumi/training/config/apply \
  -H "Content-Type: application/json" \
  -d @config.json
```

### Key Configuration Parameters

```python
# Anomaly Detection
contamination: 0.1           # 10% expected anomalies
n_estimators: 300            # Isolation Forest trees

# Risk Scoring
n_estimators: 200            # Random Forest trees
max_depth: 20                # Tree depth

# Feature Windows
time_windows: [24h, 7d, 30d] # Analysis periods

# Data
max_blocks: 500              # Blockfrost blocks to fetch
batch_size: 100              # Inference batch size
```

---

## 📊 Training Pipeline (9 Steps)

```
Step 1: Data Loading
  └─ Fetch transactions from Blockfrost
  └─ Load raw data: transactions.json

Step 2: Feature Engineering
  └─ Volume features (24h, 7d, 30d)
  └─ Entropy features (Shannon, Rényi)
  └─ Daily aggregation
  └─ Output: features.csv

Step 3: Graph Analysis
  └─ Build transaction network
  └─ Compute centrality (betweenness, closeness)
  └─ Clustering coefficient
  └─ Community detection
  └─ Output: graph_features.csv

Step 4: Preprocessing
  └─ Handle missing values
  └─ Scale features (standard)
  └─ Select features
  └─ Handle outliers

Step 5: Anomaly Detection
  └─ Isolation Forest (300 estimators)
  └─ One-Class SVM (rbf kernel)
  └─ Local Outlier Factor (20 neighbors)
  └─ Ensemble voting
  └─ Output: anomaly_results.csv

Step 6: Risk Scoring
  └─ Random Forest (200 estimators)
  └─ Train/test split (80/20)
  └─ Balanced class weights
  └─ Save: randomforest.pkl

Step 7: Evaluation
  └─ ROC-AUC score
  └─ Precision & recall
  └─ F1 score
  └─ Confusion matrix
  └─ 5-fold cross-validation

Step 8: SHAP Explanation
  └─ Generate SHAP values
  └─ Per-address contributions
  └─ Feature importance
  └─ Save artifacts (JSON, CSV)

Step 9: Export
  └─ Export models (.pkl)
  └─ Export features (.csv)
  └─ Export predictions (.json)
  └─ Generate report
```

---

## 🎯 API Endpoints Reference

### Health & Stats
```
GET  /masumi/health                              # Orchestrator health
GET  /masumi/stats                               # System statistics
GET  /masumi/agents                              # List agents
GET  /masumi/agents/{name}                       # Agent details
GET  /masumi/agents/{name}/health                # Agent health
```

### Training Configuration
```
GET  /masumi/training/config                     # Get current config
GET  /masumi/training/config/defaults            # Get defaults
POST /masumi/training/config/apply               # Apply new config
```

### Training Pipeline
```
POST /masumi/training/initialize                 # Create pipeline
POST /masumi/training/run/{pipeline_id}          # Execute training
GET  /masumi/training/pipeline/{pipeline_id}     # Get status
```

### Prediction & Data Quality
```
POST /masumi/predict                             # Risk prediction
POST /masumi/data/quality                        # Quality assessment
```

### Workflow Routing
```
POST /masumi/route                               # Generic workflow
```

---

## 📁 File Structure

```
masumi/orchestrator/
├── app.py                           # Main FastAPI app (10 endpoints)
├── ai_model_agent.py               # AI training/inference agent
├── ai_training_params.py           # All 150+ parameters
├── models.py                       # Data models (6 new)
├── router.py                       # Workflow routing (6 workflows)
├── registry.py                     # Agent registry (unchanged)
├── policies.py                     # Policy logic (unchanged)
├── config.yaml                     # Configuration (expanded)
├── INTEGRATION_GUIDE.md            # Complete guide
├── SUMMARY.md                      # Overview
├── REFERENCE.md                    # Parameter reference
└── QUICK_START.md                  # This file
```

---

## 🐛 Troubleshooting

### Port 8080 Already in Use
```bash
netstat -ano | findstr :8080  # Windows
sudo lsof -i :8080             # macOS/Linux
# Kill the process and restart
```

### Agent Not Found
```bash
# Check config.yaml has all 3 agents registered
curl http://localhost:8080/masumi/agents | jq .agents[].name
```

### Models Not Loading
```bash
# Verify model files exist
ls agents/ai_model/models/
# Should have: isolationforest.pkl, randomforest.pkl
```

### Training Stuck
```bash
# Check logs for errors
# Increase timeout in router.py (default 30s)
# Monitor background tasks via pipeline status
```

### SHAP Errors
```bash
# Ensure required features match inference.py BASE_FEATURES
# Check data quality with: POST /masumi/data/quality
```

---

## 📚 Documentation Files

| File | Purpose |
|---|---|
| `INTEGRATION_GUIDE.md` | Complete integration guide (7 examples) |
| `SUMMARY.md` | High-level overview & highlights |
| `REFERENCE.md` | All parameters & endpoints |
| `QUICK_START.md` | This file - quick reference |

---

## 🎓 Learning Path

1. **Start Here** ← You are here
2. **Run Quick Examples** → Use the curl commands above
3. **Read INTEGRATION_GUIDE.md** → Understand architecture
4. **Explore REFERENCE.md** → Learn all parameters
5. **Review SUMMARY.md** → High-level overview
6. **Check Source Code** → `agents/ai_model/src/`

---

## ✅ Checklist

- [ ] Orchestrator running on port 8080
- [ ] AI Model Agent running on port 8083
- [ ] All services responding to health checks
- [ ] Training config retrieved successfully
- [ ] Pipeline initialized successfully
- [ ] Can make risk predictions
- [ ] Can assess data quality
- [ ] All workflows operational

---

## 🚀 Next Steps

1. **Load Training Data**
   ```bash
   # Place data in: agents/ai_model/data/
   # Required: transactions.json, features.csv
   ```

2. **Initialize Training Pipeline**
   ```bash
   PIPELINE_ID=$(curl -X POST http://localhost:8080/masumi/training/initialize | jq -r '.pipeline_id')
   ```

3. **Run Training** (Background)
   ```bash
   curl -X POST http://localhost:8080/masumi/training/run/$PIPELINE_ID
   ```

4. **Monitor Progress**
   ```bash
   watch -n 5 "curl http://localhost:8080/masumi/training/pipeline/$PIPELINE_ID | jq '.completed_steps'"
   ```

5. **Make Predictions**
   ```bash
   # Once models are trained, use /masumi/predict endpoint
   ```

---

## 📞 Support Resources

- **API Documentation**: See INTEGRATION_GUIDE.md (Section 2)
- **Parameters Reference**: See REFERENCE.md
- **Configuration**: See config.yaml + ai_training_params.py
- **Source Code**: agents/ai_model/src/
- **Examples**: INTEGRATION_GUIDE.md (Usage Examples section)

---

## ✨ Key Capabilities

✅ **150+ Training Parameters** - Complete coverage from source code  
✅ **9-Step Pipeline** - Fully automated training  
✅ **6 Workflows** - settle, ai_predict, ai_train, ai_train_run, ai_config, data_quality  
✅ **Ensemble Models** - Isolation Forest, SVM, LOF, Random Forest  
✅ **SHAP Explanation** - Feature importance & narrative generation  
✅ **Background Execution** - Non-blocking training & inference  
✅ **Model Caching** - Efficient inference  
✅ **Full Logging** - Correlation tracking & error handling  

---

**Ready to go! 🎉**

