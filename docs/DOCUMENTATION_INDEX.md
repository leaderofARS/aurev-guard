# 📚 AurevGuard Documentation Index

## 📖 Quick Navigation

### **Start Here**
- **[COMPLETE_INTEGRATION_GUIDE.md](COMPLETE_INTEGRATION_GUIDE.md)** - Master overview of entire system
- **[README.md](../README.md)** - Project overview and getting started

---

## 🔗 Integration Guides (Read in Order)

### **1. Orchestrator → Backend Integration**
📄 **[ORCHESTRATOR_BACKEND_INTEGRATION.md](ORCHESTRATOR_BACKEND_INTEGRATION.md)**

**Covers:**
- Connecting FastAPI Orchestrator (Port 8080) to Express Backend (Port 5000)
- Sending blockchain features to AI models
- Receiving risk scores and anomaly predictions
- SHAP value generation
- Caching and batch processing
- Error handling and health checks

**Key Files:**
- `apps/backend/src/routes/predictions.js`
- `apps/backend/src/services/dataService.js`
- `masumi/orchestrator/app.py`

---

### **2. Backend → Frontend Integration**
📄 **[BACKEND_FRONTEND_INTEGRATION.md](BACKEND_FRONTEND_INTEGRATION.md)**

**Covers:**
- Frontend React app (Port 3000) calling backend REST APIs
- API client layer (axios)
- React hooks for data fetching
- Global context for state management
- Component implementations
- Data flow from user action to display

**Key Files:**
- `apps/frontend/src/api/orchestratorApi.js`
- `apps/frontend/src/hooks/usePrediction.js`
- `apps/frontend/src/contexts/PredictionContext.jsx`
- `apps/frontend/src/components/PredictionCard.jsx`

---

### **3. Wallet Integration**
📄 **[WALLET_INTEGRATION_GUIDE.md](WALLET_INTEGRATION_GUIDE.md)**

**Covers:**
- Detecting and connecting Cardano wallets (Nami/Eternl/Flint)
- Fetching wallet address and balance
- Getting transaction history
- Processing 2 ADA payments for live pipeline
- Verifying payments on blockchain
- Signing messages with wallet

**Key Files:**
- `apps/frontend/src/contexts/WalletContext.jsx`
- `apps/frontend/src/components/WalletConnect.jsx`
- `apps/frontend/src/components/PaymentProcessor.jsx`
- `apps/backend/src/middleware/walletAuth.js`

---

### **4. Live Pipeline - Transaction Processing**
📄 **[LIVE_PIPELINE_GUIDE.md](LIVE_PIPELINE_GUIDE.md)**

**Covers:**
- Querying Blockfrost API for real-time transactions
- Extracting 18 blockchain features
- Async batch processing
- Sending to orchestrator for predictions
- Job status polling from frontend
- Storing results in database

**Key Files:**
- `agents/ai_model/src/live_pipeline.py`
- `apps/backend/src/routes/livePipeline.js`
- `apps/frontend/src/components/LivePipelineProcessor.jsx`

---

## 🎨 Frontend Architecture Guides

### **5. Frontend Pages & Routing**
📄 **[FRONTEND_PAGES_ARCHITECTURE.md](FRONTEND_PAGES_ARCHITECTURE.md)**

**Pages:**
1. **ConnectWallet** - Initial wallet connection
2. **Dashboard** - Main hub with risk summary
3. **AIPredictions** - Detailed SHAP analysis
4. **AnomalyDetection** - Multi-model scoring
5. **LivePipeline** - Payment and transaction processing
6. **Settings** - User configuration

**Router Configuration:**
```
/ → /connect-wallet
/dashboard (protected)
/predictions
/anomalies
/live-pipeline
/settings
```

---

### **6. Dashboard Components**
📄 **[DASHBOARD_COMPONENTS.md](DASHBOARD_COMPONENTS.md)**

**Reusable Components:**
1. **PredictionCard** - Risk score display
2. **SHAPExplainer** - Feature importance chart
3. **AnomalyDetection** - Model scores
4. **ScoreComparison** - Multi-metric comparison
5. **RiskGauge** - Circular gauge visualization
6. **FeatureTable** - Detailed feature values
7. **TrendChart** - Historical trends
8. **ModelEnsemble** - Voting visualization

---

## 🧠 AI & ML Documentation

### **7. SHAP Explanability**
📄 **[SHAP_EXPLANATION_DEMO.md](../SHAP_EXPLANATION_DEMO.md)**

**Covers:**
- SHAP TreeExplainer framework
- Feature importance interpretation
- Business use cases
- Model ensemble voting
- Random data testing
- Verification checklist

---

## 🏗️ System Architecture

### **Complete System Diagram**

```
┌─────────────────────────────────────────┐
│     Frontend (React) - Port 3000        │
│  ├─ Connect Wallet                      │
│  ├─ Dashboard                           │
│  ├─ AI Predictions                      │
│  ├─ Anomalies                           │
│  └─ Live Pipeline                       │
└────────────┬────────────────────────────┘
             │ REST API
┌────────────▼────────────────────────────┐
│     Backend (Express) - Port 5000       │
│  ├─ API Routes                          │
│  ├─ Payment Verification                │
│  └─ Feature Extraction                  │
└────────────┬────────────────────────────┘
             │ HTTP POST
┌────────────▼────────────────────────────┐
│  Orchestrator (FastAPI) - Port 8080     │
│  ├─ /masumi/predict Endpoint            │
│  └─ Model Routing                       │
└────────────┬────────────────────────────┘
             │ Distributes to
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
   RF      ISO    SVM+LOF
```

---

## 📊 Data Flow Examples

### **Scenario 1: Check Risk Score**
```
User → Frontend ConnectWallet
     → Backend /api/predictions/:wallet
     → Orchestrator /masumi/predict
     → ML Models (RF, ISO, SVM/LOF)
     → Risk + Anomaly + SHAP values
     → Frontend Dashboard displays
```

### **Scenario 2: Enable Live Pipeline**
```
User → Frontend PaymentProcessor
     → Wallet signs 2 ADA transaction
     → Backend verifies via Blockfrost
     → Backend triggers Live Pipeline job
     → Python queries Blockfrost
     → Extract 18 features
     → Send to Orchestrator
     → Store results
     → Frontend polls status
     → Display results
```

---

## ⚙️ Configuration Files

### **Frontend**
- `apps/frontend/.env.local` - Environment variables
- `apps/frontend/vite.config.js` - Build configuration
- `apps/frontend/tailwind.config.js` - Styling
- `apps/frontend/src/App.jsx` - Main router

### **Backend**
- `apps/backend/.env` - Environment variables
- `apps/backend/src/index.js` - Server entry
- `apps/backend/package.json` - Dependencies

### **Orchestrator**
- `masumi/orchestrator/.env` - Environment variables
- `masumi/orchestrator/app.py` - FastAPI app
- `agents/ai_model/src/train.py` - Model training

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ (Frontend & Backend)
- Python 3.13+ (Orchestrator & AI Model)
- Cardano wallet (Nami/Eternl/Flint)
- Blockfrost API key (testnet)

### **Installation**

**1. Clone and Install**
```bash
# Frontend
cd apps/frontend
npm install
npm run dev

# Backend
cd apps/backend
npm install
npm start

# Orchestrator
cd masumi/orchestrator
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app
```

**2. Configure Environment**
```bash
# Frontend .env.local
REACT_APP_API_URL=http://localhost:5000
REACT_APP_BLOCKFROST_API_KEY=your_key

# Backend .env
ORCHESTRATOR_URL=http://localhost:8080
BLOCKFROST_API_KEY=your_key

# Orchestrator .env
BLOCKFROST_API_KEY=your_key
```

**3. Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Orchestrator: http://localhost:8080

---

## 🧪 Testing

### **Test Orchestrator**
```bash
curl -X POST http://localhost:8080/masumi/predict \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "addr_test1q...",
    "features": {...}
  }'
```

### **Test Backend**
```bash
curl -X GET http://localhost:5000/api/predictions/addr_test1q... \
  -H "Authorization: Bearer token"
```

### **Test Frontend**
- Open http://localhost:3000
- Connect wallet
- View predictions

---

## 📋 Feature Checklist

### **Orchestrator Features**
- [x] Random Forest model (5 features)
- [x] Isolation Forest model (8 features)
- [x] SVM + LOF ensemble
- [x] SHAP explanations
- [x] Risk score generation
- [x] Anomaly detection
- [x] Model health checks

### **Backend Features**
- [x] REST API endpoints
- [x] Blockchain data fetching
- [x] Feature extraction (18 dimensions)
- [x] Payment verification
- [x] Live pipeline jobs
- [x] Result caching
- [x] Database storage

### **Frontend Features**
- [x] Wallet connection
- [x] Connect Wallet page
- [x] Dashboard page
- [x] AI Predictions page
- [x] Anomaly Detection page
- [x] Live Pipeline page
- [x] Payment processing
- [x] SHAP visualization
- [x] Real-time updates

---

## 🔐 Security

### **.gitignore Updates**
- Environment variables (`.env*`)
- Credentials and secrets
- Model weights
- Database files
- Node modules and dependencies
- Python virtual environments
- Build outputs and caches
- IDE configurations

✅ **Updated comprehensive `.gitignore`** (see file for all entries)

---

## 📚 Full Documentation Index

| Document | Purpose | Location |
|----------|---------|----------|
| COMPLETE_INTEGRATION_GUIDE.md | Master overview | `/docs/` |
| ORCHESTRATOR_BACKEND_INTEGRATION.md | Orchestrator connection | `/docs/` |
| BACKEND_FRONTEND_INTEGRATION.md | Frontend API integration | `/docs/` |
| WALLET_INTEGRATION_GUIDE.md | Wallet & payment | `/docs/` |
| LIVE_PIPELINE_GUIDE.md | Transaction processing | `/docs/` |
| FRONTEND_PAGES_ARCHITECTURE.md | Page structure | `/docs/` |
| DASHBOARD_COMPONENTS.md | Component library | `/docs/` |
| SHAP_EXPLANATION_DEMO.md | SHAP framework | `/docs/` |
| .gitignore | Git configuration | Root |

---

## ✨ Key Highlights

✅ **Complete Integration** - Orchestrator → Backend → Frontend → Wallet  
✅ **Real-time Processing** - Live pipeline with async job handling  
✅ **Explainable AI** - SHAP values for all predictions  
✅ **Multi-model** - 4 different ML models with ensemble voting  
✅ **Blockchain Ready** - Cardano testnet integration  
✅ **Payment System** - 2 ADA for live pipeline analysis  
✅ **Full Documentation** - 8 comprehensive guides  
✅ **Security Configured** - Comprehensive .gitignore  

---

## 🎯 Next Steps

1. **Review Documentation** - Start with COMPLETE_INTEGRATION_GUIDE.md
2. **Set Up Environment** - Configure `.env` files
3. **Start Services** - Run orchestrator, backend, frontend
4. **Test Integration** - Use provided curl/code examples
5. **Deploy** - Follow deployment checklist
6. **Monitor** - Set up logging and alerts

---

## 📞 Quick Reference

**Ports:**
- Frontend: 3000
- Backend: 5000
- Orchestrator: 8080

**Key APIs:**
- `GET /api/predictions/:wallet` - Fetch predictions
- `POST /masumi/predict` - Orchestrator inference
- `POST /api/live-pipeline/start` - Start analysis

**Supported Wallets:**
- Nami (https://namiwallet.io)
- Eternl (https://eternl.io)
- Flint (https://flint-wallet.com)

---

## 📝 Notes

- All documentation is markdown-based for easy reading
- Code examples are production-ready
- Environment variables required for deployment
- Security best practices implemented
- Comprehensive testing examples provided

---

**Documentation Complete & Ready for Use**  
**Last Updated:** November 30, 2025  
**Version:** 1.0  
**Status:** ✅ Ready for Production Deployment
