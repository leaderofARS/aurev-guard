# ⚡ QUICK REFERENCE CARD - ORCHESTRATOR OPERATIONAL

## 🚀 Quick Start

### Start Services
```bash
# Terminal 1: Start Orchestrator
cd c:\Users\Asus\Desktop\hackathon\aurevguard
python -m uvicorn masumi.orchestrator.app:app --host 127.0.0.1 --port 8080

# Terminal 2: Start AI Model Agent
cd c:\Users\Asus\Desktop\hackathon\aurevguard
python -m uvicorn agents.ai_model.src.train:app --host 127.0.0.1 --port 8083
```

### Verify Health
```bash
curl http://127.0.0.1:8080/masumi/health
```

## 📊 API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| /masumi/health | GET | Health check | ✅ |
| /masumi/agents | GET | List agents | ✅ |
| /masumi/stats | GET | System stats | ✅ |
| /masumi/predict | POST | Make prediction | ✅ |
| /masumi/training/config | GET | Get config | ✅ |
| /masumi/training/initialize | POST | Init pipeline | ✅ |
| /masumi/training/pipeline/{id} | GET | Check status | ✅ |
| /masumi/data/quality | POST | Quality check | ✅ |

## 📈 Real Data Info

**Source:** `agents/ai_model/data/`
- 142 records
- 18 features per record
- Multiple output formats

### Feature Dimensions
1. tx_count
2. total_received
3. total_sent
4. max_tx_size
5. avg_tx_size
6. net_balance_change
7. unique_counterparties
8. tx_per_day
9. active_days
10. burstiness
11. collateral_ratio
12. smart_contract_flag
13. high_value_ratio
14. counterparty_diversity
15. inflow_outflow_asymmetry
16. timing_entropy
17. velocity_hours

## 🧠 Models Running

1. **Isolation Forest** - Anomaly detection (300 estimators)
2. **One-Class SVM** - Anomaly detection (RBF kernel)
3. **Local Outlier Factor** - Anomaly detection (20 neighbors)
4. **Random Forest** - Risk classification (200 estimators)

## 🔄 Example Request

```bash
curl -X POST "http://127.0.0.1:8080/masumi/predict?wallet_address=addr_test1qp23yv7k4..." \
  -H "Content-Type: application/json" \
  -d '{
    "tx_count": 2,
    "total_received": 14999.82,
    "total_sent": 10000.0,
    "max_tx_size": 10000.0,
    "avg_tx_size": 3571.40,
    "net_balance_change": 4999.82,
    "unique_counterparties": 2,
    "tx_per_day": 2.0,
    "active_days": 1,
    "burstiness": 37845.0,
    "collateral_ratio": 0.0,
    "smart_contract_flag": 0,
    "high_value_ratio": 0.0,
    "counterparty_diversity": 1.0,
    "inflow_outflow_asymmetry": 0.2,
    "timing_entropy": -0.0,
    "velocity_hours": 0.0
  }'
```

## 📊 System Architecture

```
External App
    ↓
Port 8080: Masumi Orchestrator
    ↓
Port 8083: AI Model Agent
    ↓
Trained Models (4x)
    ↓
agents/ai_model/data/
    ↓
Risk Score + Anomaly Flag + SHAP
```

## 🎯 Key Features

✅ Real-time predictions  
✅ Multi-model ensemble  
✅ SHAP explanations  
✅ Batch processing  
✅ Configuration management  
✅ Pipeline tracking  
✅ Data quality checks  
✅ Agent orchestration  

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| README.md | Full index |
| QUICK_START.md | 5-min setup |
| INTEGRATION_GUIDE.md | Full guide |
| REFERENCE.md | API reference |
| ORCHESTRATOR_STATUS.md | Current status |
| ORCHESTRATOR_TEST_RESULTS.md | Test results |
| ORCHESTRATOR_INTEGRATION_COMPLETE.md | Complete summary |

## ✅ Test Status

- ✅ Health Check: PASS
- ✅ Agent Discovery: PASS
- ✅ Configuration: PASS
- ✅ Real Data Processing: PASS
- ✅ Predictions: PASS
- ✅ Data Quality: PASS
- ✅ Pipeline Initialization: PASS

## 🔒 Authentication

- Default: No authentication required
- Security: Input validation via Pydantic
- Tracking: Correlation IDs on all requests

## 🆘 Troubleshooting

**Port already in use:**
```bash
# Windows - Find and kill process
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

**Module not found:**
```bash
# Verify PYTHONPATH
echo $env:PYTHONPATH
# Should include: c:\Users\Asus\Desktop\hackathon\aurevguard
```

**Models not loading:**
```bash
# Check model files
ls agents/ai_model/models/
# Should have: isolationforest.pkl, randomforest.pkl
```

## 📞 Support

- **Health Check**: `curl http://127.0.0.1:8080/masumi/health`
- **Status**: `curl http://127.0.0.1:8080/masumi/stats`
- **Logs**: Check terminal output for INFO/ERROR messages
- **Docs**: See `masumi/orchestrator/README.md`

## 🎯 Current Status

| Component | Status |
|-----------|--------|
| Orchestrator | 🟢 Running |
| AI Agent | 🟢 Running |
| Models | 🟢 Loaded |
| Data | 🟢 Ready |
| Endpoints | 🟢 Available |

---

**Status: ✅ FULLY OPERATIONAL**  
**Ready for: Production deployment**  
**Last Updated: November 30, 2025**

