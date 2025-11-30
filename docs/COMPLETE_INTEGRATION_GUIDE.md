# AurevGuard Complete Integration & Architecture Documentation

## 📋 Documentation Created

This comprehensive guide includes all integration layers from orchestrator through wallet connection to frontend dashboard. All guides are located in `/docs/` directory.

### 1. **ORCHESTRATOR_BACKEND_INTEGRATION.md**
**Purpose:** Connect Masumi Orchestrator (Port 8080) to Express Backend (Port 5000)

**Key Sections:**
- Architecture diagram showing full data flow
- Backend endpoints that call orchestrator
- Step-by-step integration flow (prepare data → send → receive → store)
- Response structure with risk scores, anomaly scores, SHAP values
- Configuration variables and error handling
- Testing examples (curl commands)
- Performance optimization with caching and batch processing
- Health checks and logging
- Security considerations
- Deployment checklist

**Endpoints:**
- `POST /masumi/predict` - Send wallet features, receive predictions
- `GET /health/orchestrator` - Check orchestrator health

---

### 2. **BACKEND_FRONTEND_INTEGRATION.md**
**Purpose:** Connect React Frontend (Port 3000) to Express Backend (Port 5000)

**Key Sections:**
- Frontend API layer architecture
- orchestratorApi.js - HTTP client for backend communication
- usePrediction hook - React hook for prediction fetching
- PredictionContext - Global state management
- Component implementations:
  - PredictionCard - Display risk score
  - SHAPExplainer - Feature importance visualization
  - AnomalyDetection - Multi-model anomaly scores
- Data flow diagram showing full request/response cycle
- Environment variables for frontend

**API Routes:**
- `GET /api/predictions/:walletAddress` - Fetch predictions
- `POST /api/predictions/batch` - Batch predictions
- `GET /api/shap/:walletAddress` - SHAP explanations
- `GET /api/anomaly/:walletAddress` - Anomaly scores

---

### 3. **WALLET_INTEGRATION_GUIDE.md**
**Purpose:** Enable Cardano wallet connection and blockchain interaction

**Key Sections:**
- Wallet context setup (address, balance, network detection)
- Wallet provider detection (Nami, Eternl, Flint)
- Connection flow with error handling
- Get transaction history and UTXOs
- Sign messages for verification
- PaymentProcessor component - Handle 2 ADA payments for live pipeline
- Backend payment verification middleware
- Supported wallets with install links

**Key Functions:**
- `connectWallet()` - Enable wallet and get address
- `disconnectWallet()` - Clear wallet state
- `getTransactionHistory()` - Fetch wallet transactions
- `signMessage()` - Sign data with wallet
- `handlePayment()` - Process 2 ADA payment

---

### 4. **LIVE_PIPELINE_GUIDE.md**
**Purpose:** Process real-time blockchain transactions with AI analysis

**Key Sections:**
- Architecture showing Blockfrost → Feature Engineering → Orchestrator → Frontend
- LivePipeline class with full implementation:
  - Async session management
  - Fetch wallet transactions from Blockfrost
  - Extract 18 features from transaction data
  - Send to orchestrator for predictions
  - Process batch wallets concurrently
- Backend endpoints for pipeline job management
- Frontend LivePipelineProcessor component
- Job status polling (2-second intervals)
- Configuration for Blockfrost API

**Features Extracted:**
1. tx_count_24h
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
18. (18 total)

---

### 5. **FRONTEND_PAGES_ARCHITECTURE.md**
**Purpose:** Complete frontend page structure and routing

**Pages Included:**
1. **ConnectWallet** - Initial entry point
   - Wallet detection (Nami, Eternl, Flint)
   - Auto-load prediction after connection
   - Redirect to dashboard on success

2. **Dashboard** - Main hub
   - Risk score summary
   - SHAP explanations
   - Anomaly detection results
   - Score comparison
   - Quick navigation links
   - Refresh and logout controls

3. **AIPredictions** - Detailed analysis
   - Top 15 features by importance
   - Feature contribution details
   - Historical predictions
   - SHAP interpretation guide

4. **AnomalyDetection** - Multi-model scoring
   - Individual model scores (RF, ISO, SVM, LOF)
   - Ensemble agreement percentage
   - Pie chart of anomaly/normal
   - Model performance comparison

5. **LivePipeline** - Real-time analysis
   - Payment processing UI
   - Transaction processing status
   - Real-time result updates
   - Information about live pipeline benefits

**Routing Configuration:**
- `/` → `/connect-wallet`
- `/connect-wallet` → ConnectWallet page
- `/dashboard` → Dashboard page (protected)
- `/predictions` → AI Predictions page
- `/anomalies` → Anomaly Detection page
- `/live-pipeline` → Live Pipeline page
- `/settings` → Settings page

---

### 6. **DASHBOARD_COMPONENTS.md**
**Purpose:** Reusable React components for dashboard visualizations

**Components:**
1. **PredictionCard** - Main risk score display
   - Color-coded severity (green/yellow/orange/red)
   - Quick stats (anomaly, confidence, ensemble)
   - Timestamp

2. **SHAPExplainer** - Feature importance chart
   - Top N features selector
   - Bar chart visualization
   - Feature details with explanations
   - Impact arrows (↑ increases, ↓ decreases)

3. **AnomalyDetection** - Model score display
   - Individual model progress bars
   - Color-coded risk levels
   - Ensemble agreement indicator

4. **ScoreComparison** - Multi-metric comparison
   - Risk score vs anomaly vs confidence vs ensemble
   - Bar chart comparison

5. **RiskGauge** - Circular gauge visualization
   - Animated progress ring
   - Color-coded by risk level
   - Percentage display

6. **FeatureTable** - Detailed feature values
   - Sortable table
   - Feature names and values
   - Click-to-select functionality

7. **TrendChart** - Historical trend visualization
   - LineChart showing risk and anomaly over time
   - Timestamp x-axis
   - Multiple series support

8. **ModelEnsemble** - Voting visualization
   - Individual model results
   - Consensus percentage
   - Green/gray border for agreement

---

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER LAYER                           │
├─────────────────────────────────────────────────────────┤
│  Browser (React Frontend) - Port 3000                   │
│  ├── Connect Wallet Page (Nami/Eternl/Flint)           │
│  ├── Dashboard (Risk Summary)                          │
│  ├── AI Predictions (SHAP Analysis)                   │
│  ├── Anomaly Detection (Model Scores)                 │
│  ├── Live Pipeline (Payment & Analysis)               │
│  └── Settings Page                                     │
└────────────────────┬────────────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼────────────────────────────────────┐
│                 BACKEND LAYER                           │
├─────────────────────────────────────────────────────────┤
│  Node.js Express Server - Port 5000                     │
│  ├── API Routes                                        │
│  ├── Payment Verification Middleware                   │
│  ├── Database (MongoDB)                               │
│  ├── Cache Layer (Redis)                              │
│  └── Wallet Authentication                            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP POST
┌────────────────────▼────────────────────────────────────┐
│              ORCHESTRATION LAYER                        │
├─────────────────────────────────────────────────────────┤
│  FastAPI Orchestrator - Port 8080                      │
│  ├── /masumi/predict Endpoint                          │
│  ├── Feature Validation                               │
│  ├── Model Routing                                     │
│  └── Response Assembly                                │
└────────────────────┬────────────────────────────────────┘
                     │ Distributes to
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──┐ ┌──────▼───┐ ┌─────▼────┐
│ Random   │ │ Isolation│ │  SVM +   │
│ Forest   │ │ Forest   │ │  LOF     │
│ (5 feat) │ │(8 feat)  │ │ Ensemble │
└───┬──────┘ └──────┬───┘ └─────┬────┘
    │               │           │
    └───────────────┼───────────┘
                    │ Predictions
                    │ (Risk + Anomaly + SHAP)
┌───────────────────▼────────────────────────────────────┐
│           DATA PROCESSING LAYER                        │
├─────────────────────────────────────────────────────────┤
│  Live Pipeline (agents/ai_model/src/live_pipeline.py) │
│  ├── Blockfrost API Query                             │
│  ├── Feature Engineering (18 dimensions)              │
│  ├── Async Processing                                 │
│  └── Database Storage                                 │
└─────────────────────────────────────────────────────────┘
        │
        ├──► Cardano Testnet (Blockfrost)
        ├──► SQLite / MongoDB
        └──► Result Cache (Redis)
```

---

## 🔄 Complete Data Flow

### **User Scenario: Check Risk Score**

```
1. User connects wallet
   ↓
2. Frontend fetches wallet address & balance
   ↓
3. Frontend calls Backend: GET /api/predictions/addr_test1q...
   ↓
4. Backend prepares blockchain data (18 features)
   ↓
5. Backend calls Orchestrator: POST /masumi/predict
   ↓
6. Orchestrator routes to:
   - Random Forest (5 engineered features)
   - Isolation Forest (8 engineered features)
   - SVM/LOF ensemble
   ↓
7. Models predict:
   - Risk score (0-1)
   - Anomaly score (0-1)
   - SHAP values
   ↓
8. Orchestrator returns JSON response
   ↓
9. Backend caches results (1 hour TTL)
   ↓
10. Backend returns to Frontend
    ↓
11. Frontend displays:
    - PredictionCard (risk %)
    - SHAPExplainer (top 10 features)
    - AnomalyDetection (model scores)
    - ScoreComparison (multi-metric)
```

---

### **Payment Scenario: Enable Live Pipeline**

```
1. User clicks "Start Analysis" on Live Pipeline page
   ↓
2. Frontend displays payment form (2 ADA)
   ↓
3. User clicks "Pay" button
   ↓
4. Frontend:
   - Gets user's enabled wallet
   - Creates transaction for 2 ADA
   - Signs with wallet key
   - Submits to blockchain
   ↓
5. Backend:
   - Receives transaction ID
   - Verifies on blockchain via Blockfrost
   - Confirms 2 ADA received
   - Records payment
   ↓
6. Backend triggers Live Pipeline job:
   - Creates job record
   - Spawns Python process
   ↓
7. Python Live Pipeline:
   - Fetches transactions from Blockfrost
   - Extracts 18 features
   - Sends to Orchestrator
   - Stores results
   ↓
8. Frontend polls job status every 2 seconds
   ↓
9. When complete, displays:
   - Transaction count
   - Risk score
   - Anomaly score
   - SHAP explanations
   - Historical trend
```

---

## 📦 Environment Setup

### **Frontend `.env.local`**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ORCHESTRATOR_URL=http://localhost:8080
REACT_APP_BLOCKFROST_API_KEY=preprod...
REACT_APP_PAYMENT_ADDRESS=addr_test1q...
REACT_APP_NETWORK=testnet
```

### **Backend `.env`**
```env
ORCHESTRATOR_URL=http://localhost:8080
ORCHESTRATOR_PORT=8080
BLOCKFROST_API_KEY=preprod...
CARDANO_NETWORK=testnet
DB_URL=mongodb://localhost:27017/aurevguard
REDIS_URL=redis://localhost:6379
PAYMENT_ADDRESS=addr_test1q...
PAYMENT_AMOUNT_LOVELACE=2000000
```

### **Orchestrator/AI Model `.env`**
```env
BLOCKFROST_API_KEY=preprod...
ORCHESTRATOR_URL=http://localhost:8080
CARDANO_NETWORK=testnet
SHAP_ENABLE=true
```

---

## ✅ Deployment Checklist

### **Orchestrator (Port 8080)**
- [ ] FastAPI running
- [ ] Models loaded (RF, ISO, SVM, LOF)
- [ ] SHAP explainer initialized
- [ ] Health check endpoint responding
- [ ] Port 8080 accessible from backend

### **Backend (Port 5000)**
- [ ] Express server running
- [ ] Database connected (MongoDB)
- [ ] Redis cache running
- [ ] Blockfrost API key configured
- [ ] Routes tested with Postman
- [ ] CORS enabled for frontend

### **Frontend (Port 3000)**
- [ ] React app building
- [ ] Wallet extensions detected
- [ ] API calls working
- [ ] All pages rendering
- [ ] Dashboard components displaying data
- [ ] Payment flow tested on testnet

### **Live Pipeline**
- [ ] Python environment configured
- [ ] Blockfrost API key working
- [ ] Async processing tested
- [ ] Database writes working
- [ ] Job polling implemented

### **Security**
- [ ] Environment variables in `.env`
- [ ] Secrets not in git (check `.gitignore`)
- [ ] HTTPS in production
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] CORS properly configured

---

## 🚀 Quick Start Commands

### **Start Orchestrator**
```bash
cd masumi/orchestrator
python -m app
# Runs on http://localhost:8080
```

### **Start Backend**
```bash
cd apps/backend
npm install
npm start
# Runs on http://localhost:5000
```

### **Start Frontend**
```bash
cd apps/frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### **Start Live Pipeline**
```bash
cd agents/ai_model
python src/live_pipeline.py \
  --wallet addr_test1q... \
  --blockfrost-key your_key
```

---

## 📊 Testing

### **Test Orchestrator**
```bash
curl -X POST http://localhost:8080/masumi/predict \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

### **Test Backend**
```bash
curl -X GET http://localhost:5000/api/predictions/addr_test1q... \
  -H "Authorization: Bearer token"
```

### **Test Frontend**
- Open http://localhost:3000
- Connect wallet (Nami/Eternl/Flint)
- View dashboard

---

## 📚 Related Documentation

- **SHAP_EXPLANATION_DEMO.md** - SHAP framework details
- **ORCHESTRATOR_BACKEND_INTEGRATION.md** - Orchestrator connection
- **BACKEND_FRONTEND_INTEGRATION.md** - Frontend API integration
- **WALLET_INTEGRATION_GUIDE.md** - Wallet connection
- **LIVE_PIPELINE_GUIDE.md** - Transaction processing
- **FRONTEND_PAGES_ARCHITECTURE.md** - Page structure
- **DASHBOARD_COMPONENTS.md** - Component library

---

## 🔐 Security Notes

1. **Secrets Management**
   - Keep `.env` files out of git (.gitignore updated)
   - Use environment variables for all secrets
   - Rotate API keys regularly

2. **Authentication**
   - Wallet signatures for user verification
   - JWT tokens for API authentication
   - Bearer token pattern for requests

3. **Payment Security**
   - Verify transactions on blockchain
   - Confirm required amounts before processing
   - Store payment records for audit

4. **Data Protection**
   - Cache predictions for privacy
   - Don't log sensitive wallet data
   - HTTPS in production

---

## 📝 Git Configuration

The updated `.gitignore` includes:
- All node_modules and dependencies
- Environment variable files
- Credentials and secrets
- Build outputs and caches
- Database files
- Log files
- IDE configurations
- OS-specific files
- Blockchain state files
- AI model weights
- Python virtual environments
- Docker overrides
- Temporary files

**Key entries:**
```
.env*
*.key, *.pem
node_modules/
__pycache__/
.venv/
dist/, build/
*.db, *.sqlite
.idea/, .vscode/
```

---

## 🎯 Next Steps

1. **Deploy Infrastructure**
   - Set up cloud servers (AWS/GCP/Azure)
   - Configure load balancing
   - Set up monitoring

2. **Production Hardening**
   - Enable HTTPS/TLS
   - Implement rate limiting
   - Add request signing

3. **Monitoring & Logging**
   - Set up ELK stack
   - Configure alerts
   - Implement APM

4. **Scale**
   - Database replication
   - Cache clustering
   - Worker pool expansion

---

## 📞 Support

For issues or questions:
1. Check relevant documentation file
2. Review test examples
3. Check environment variables
4. Verify all services are running on correct ports

---

**Documentation Version:** 1.0  
**Last Updated:** November 30, 2025  
**Status:** Complete & Ready for Deployment  
