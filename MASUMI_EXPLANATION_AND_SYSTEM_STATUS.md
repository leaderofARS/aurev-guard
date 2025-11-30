# Masumi Explanation & System Status Check

## 🤖 What is Masumi in AUREV Guard?

### Overview

**Masumi** is an **AI Agent Orchestration Framework** that acts as the "brain" of AUREV Guard. It's a middleware layer that coordinates multiple autonomous AI agents to work together on complex tasks.

### Masumi's Role in AUREV Guard

```
┌─────────────────────────────────────────────────────────────┐
│                    MASUMI ORCHESTRATOR                      │
│              (The "Conductor" of AI Agents)                 │
└─────────────────────────────────────────────────────────────┘

Masumi is NOT an AI model itself.
Masumi is a COORDINATION LAYER that:
  1. Discovers and registers AI agents
  2. Routes requests to the right agent
  3. Orchestrates multi-step workflows
  4. Tracks correlation IDs for debugging
  5. Handles errors and fallbacks
```

### What Masumi Does

#### 1. **Agent Discovery & Registration**
- **Location**: `masumi/orchestrator/config.yaml`
- **Purpose**: Defines which AI agents are available
- **Registered Agents**:
  ```yaml
  - payment (Port 8081)      → Payment validation
  - compliance (Port 8082)   → Compliance scoring
  - ai_model (Port 8083)     → ML risk prediction
  ```

#### 2. **Workflow Orchestration**
- **Location**: `masumi/orchestrator/router.py`
- **Purpose**: Routes requests to appropriate agents based on workflow type
- **Supported Workflows**:
  - `ai_predict` → AI risk prediction only
  - `settle` → Payment settlement with risk assessment
  - `ai_train` → Initialize ML model training
  - `ai_train_run` → Execute training pipeline
  - `ai_config` → Get/update training configuration
  - `data_quality` → Assess data quality

#### 3. **Request Routing**
When Backend sends a request:
```
Backend → POST /masumi/route
{
  "workflow": "ai_predict",
  "payload": { "features": {...} }
}
```

Masumi:
1. Identifies workflow type (`ai_predict`)
2. Looks up which agent handles it (`ai_model`)
3. Calls the agent: `POST http://localhost:8083/predict`
4. Returns the response to Backend

#### 4. **Error Handling & Fallbacks**
- If AI agent is unavailable, Masumi returns a mock prediction
- Tracks correlation IDs for debugging
- Logs all agent interactions

#### 5. **Agent Health Monitoring**
- Checks if agents are alive
- Reports agent status
- Enables/disables agents dynamically

---

## 🔄 Complete Data Flow with Masumi

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Frontend Request                                     │
└─────────────────────────────────────────────────────────────┘

User clicks "Analyze Wallet" in Frontend
    ↓
Frontend: POST /api/live-pipeline/start
{
  walletAddress: "addr_test1...",
  transactionId: "tx_123"
}
    ↓
Backend receives request
```

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Backend Processing                                   │
└─────────────────────────────────────────────────────────────┘

Backend extracts features (18 dimensions)
    ↓
Backend: POST http://localhost:8080/masumi/route
{
  "workflow": "ai_predict",
  "payload": {
    "wallet_address": "addr_test1...",
    "features": {
      "tx_count_24h": 45,
      "total_received": 5000000,
      ...
    }
  }
}
    ↓
Masumi Orchestrator receives request
```

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Masumi Orchestration                                │
└─────────────────────────────────────────────────────────────┘

Masumi: route_request() function
    ↓
Identifies workflow: "ai_predict"
    ↓
Looks up agent: "ai_model" (from config.yaml)
    ↓
Agent endpoint: http://localhost:8083
    ↓
Masumi: POST http://localhost:8083/predict
{
  "wallet_address": "addr_test1...",
  "features": {...}
}
    ↓
AI Agent receives request
```

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: AI Agent Processing                                  │
└─────────────────────────────────────────────────────────────┘

AI Agent: Loads ML models
  - Random Forest (risk scoring)
  - Isolation Forest (anomaly detection)
    ↓
AI Agent: Runs predictions
  - risk_score: 0.73
  - anomaly_score: 0.42
  - is_anomaly: true
    ↓
AI Agent: Returns response
{
  "risk_score": 0.73,
  "risk_label": "HIGH_RISK",
  "anomaly_score": 0.42,
  "is_anomaly": true,
  "confidence": 0.89
}
    ↓
Masumi receives AI Agent response
```

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Response Back to Backend                             │
└─────────────────────────────────────────────────────────────┘

Masumi: Returns response to Backend
{
  "workflow": "ai_predict",
  "prediction": {
    "risk_score": 0.73,
    "risk_label": "HIGH_RISK",
    ...
  },
  "status": "success"
}
    ↓
Backend: Stores results in PipelineJob
    ↓
Backend: Returns to Frontend
{
  "jobId": "job_abc123",
  "status": "completed",
  "results": {...}
}
    ↓
Frontend: Displays results to user
```

---

## 🎯 Why Masumi is Important

### Without Masumi (Direct Connection)
```
Backend → AI Agent (direct)
Problems:
- Tight coupling (Backend must know AI Agent details)
- No workflow orchestration
- Difficult to add new agents
- No error handling/fallbacks
- Hard to scale
```

### With Masumi (Orchestrated)
```
Backend → Masumi → AI Agent
Benefits:
- Loose coupling (Backend doesn't know agent details)
- Workflow orchestration (multi-step processes)
- Easy to add new agents (just update config.yaml)
- Built-in error handling and fallbacks
- Scalable (add more agents easily)
- Correlation tracking for debugging
```

---

## 📊 Masumi Architecture

### Component Structure

```
masumi/
├── orchestrator/
│   ├── app.py              → FastAPI main application
│   ├── router.py           → Workflow routing logic
│   ├── registry.py        → Agent registry (discovery)
│   ├── config.yaml         → Agent configuration
│   ├── models.py           → Pydantic data models
│   ├── ai_training_params.py → Training parameters
│   └── ai_model_agent.py  → AI agent integration
│
├── agents/
│   ├── ai_model/          → AI ML models (port 8083)
│   ├── compliance/         → Compliance agent (port 8082)
│   └── payment/            → Payment agent (port 8081)
│
└── common/
    └── typing.py           → Shared types (correlation_id)
```

### Key Files Explained

#### 1. `masumi/orchestrator/app.py`
- **Purpose**: Main FastAPI application
- **Endpoints**:
  - `GET /masumi/health` → Health check
  - `GET /masumi/agents` → List all agents
  - `POST /masumi/route` → Route workflow requests
  - `POST /masumi/predict` → Direct prediction
  - `GET /masumi/training/config` → Get training config

#### 2. `masumi/orchestrator/router.py`
- **Purpose**: Workflow routing logic
- **Function**: `route_request(registry, body)`
- **Workflows**:
  - `ai_predict` → Routes to `ai_model` agent
  - `settle` → Routes to multiple agents (ai_model → compliance → payment)
  - `ai_train` → Routes to `ai_model` agent for training

#### 3. `masumi/orchestrator/config.yaml`
- **Purpose**: Agent configuration
- **Defines**:
  - Agent names, endpoints, capabilities
  - Training parameters
  - Workflow definitions

#### 4. `masumi/orchestrator/registry.py`
- **Purpose**: Agent discovery and registration
- **Functions**:
  - `register(agent)` → Register new agent
  - `get(name)` → Get agent by name
  - `list()` → List all agents

---

## 🔍 Masumi Workflow Examples

### Example 1: AI Prediction Workflow

```python
# Backend sends:
POST /masumi/route
{
  "workflow": "ai_predict",
  "payload": {
    "wallet_address": "addr_test1...",
    "features": {
      "tx_count_24h": 45,
      "total_received": 5000000
    }
  }
}

# Masumi processes:
1. Identifies workflow: "ai_predict"
2. Looks up agent: "ai_model" (port 8083)
3. Calls: POST http://localhost:8083/predict
4. Returns: Prediction response
```

### Example 2: Payment Settlement Workflow

```python
# Backend sends:
POST /masumi/route
{
  "workflow": "settle",
  "payload": {
    "wallet_address": "addr_test1...",
    "amount": 1000000
  }
}

# Masumi processes:
1. Step 1: Call ai_model → Get risk score
2. Step 2: If risk > 0.5, call compliance → Get compliance score
3. Step 3: Call payment → Validate settlement
4. Returns: Combined result from all steps
```

---

## 🧪 Testing All Components

### System Status Check Script

I'll create a comprehensive test script that checks:
1. ✅ Frontend (Port 5173)
2. ✅ Backend (Port 5000)
3. ✅ Masumi Orchestrator (Port 8080)
4. ✅ AI Agent (Port 8083)
5. ✅ Live Pipeline Integration
6. ✅ End-to-End Flow

---

## 📝 Summary: What Masumi Does

| Function | Description |
|----------|-------------|
| **Agent Discovery** | Finds and registers AI agents from config.yaml |
| **Request Routing** | Routes requests to the right agent based on workflow |
| **Workflow Orchestration** | Coordinates multi-step processes across agents |
| **Error Handling** | Provides fallbacks when agents are unavailable |
| **Correlation Tracking** | Tracks requests for debugging |
| **Health Monitoring** | Checks if agents are alive and responding |

**In Simple Terms**: Masumi is like a **smart router** that:
- Knows which AI agent can do what
- Routes requests to the right agent
- Coordinates multiple agents working together
- Handles errors gracefully
- Makes the system scalable and maintainable

---

## 🚀 How to Start All Services

### Terminal 1: Masumi Orchestrator
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard
python -m uvicorn masumi.orchestrator.app:app --reload --port 8080
```

### Terminal 2: Backend
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\backend
npm start
```

### Terminal 3: Frontend
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\apps\frontend
npm run dev
```

### Terminal 4: AI Agent (Optional - if running separately)
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard\agents\ai_model
python -m uvicorn src.agent:app --reload --port 8083
```

---

## ✅ Verification Checklist

- [ ] Masumi Orchestrator running on port 8080
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] AI Agent accessible (via Masumi)
- [ ] All agents registered in Masumi
- [ ] Health endpoints responding
- [ ] Live pipeline can route through Masumi
- [ ] End-to-end flow working

---

**Masumi is the "glue" that makes all AI agents work together seamlessly!** 🤖✨

