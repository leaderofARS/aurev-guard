# AUREV Guard (monorepo)

This repository contains a minimal MVP scaffold for the AUREV Guard agent-first architecture.

Structure

apps/
backend/ # Node.js + Express backend
frontend/ # React + Vite + TypeScript frontend

Docs: `docs/openapi.yaml`

How to run (from repo root)

1. Backend

```
cd apps/backend
npm install
npm run dev
```

2. Frontend

```
cd apps/frontend
npm install
npm run dev
```

Notes

- This is an MVP with in-memory repositories and mock agents (no real Cardano node).
- Payment signing flow expects a browser wallet implementing CIP-30 (e.g., Eternl) or you can use the dev fake wallet injection added during development.

# AUREV Guard — Demo MVP

This repository contains a simple demo for AUREV Guard (Cardano compliance prototype).

Components:

- `apps/backend` — Node/Express backend (port 3001)
- `python-ai` — FastAPI AI stub (port 5000)
- `apps/frontend` — React + Vite frontend (port 5173/5174)

Follow the playbook in `demo-playbook.txt` to run locally.

# AUREV Guard

Autonomous AI Compliance Agent on Cardano

AUREV Guard is a real-time AI regulatory system built for the Cardano Asia Hackathon. It detects high-risk blockchain activity, scores wallet behaviors using machine-learning models, and publishes verifiable compliance proofs on-chain. The system integrates Masumi for AI agent orchestration, Aiken for smart contract execution, Hydra for scalable low-latency interactions, and a React frontend for live monitoring and visualization.

---

## 🚀 Core Features

- **AI-Powered Risk Analysis**  
  Machine-learning pipelines detect anomalies, fraud patterns, and risky behavioral signals from wallet and transaction flows.

- **Masumi AI Agents**  
  Autonomous compliance agents evaluate risk, collaborate, and write validated decisions to the chain.

- **Aiken Smart Contracts**  
  On-chain "Compliance Proof" records and status updates stored as immutable UTxOs.

- **Hydra Scaling Layer**  
  Fast, sub-second local transaction execution for agent simulations and rapid compliance checks.

- **Frontend Dashboard**  
  React + JavaScript interface to visualize risk scores, alerts, transaction history, and verification proofs.

- **Backend Gateway Layer**  
  Node.js API engine with Eternl wallet integration, AI-agent triggers, and secure off-chain compute.

---

## 🏗️ Architecture Overview

AUREV Guard runs as a multi-service monorepo:

Frontend → API Gateway → AI Engine → Masumi Agents → Aiken Contracts → Hydra Head → Cardano Mainchain

### Components:

- **frontend/** – React UI for visualization
- **backend/** – Node.js APIs, Eternl wallet integration
- **ai-engine/** – Python ML models + risk scoring
- **masumi-agent/** – Rust-based autonomous agents
- **contracts/** – Aiken smart contracts
- **hydra/** – Hydra node + scripts
- **infra/** – docker, configs
- **shared/** – utilities & schemas

---

## 🛠️ Technology Stack

**Frontend:** React, JavaScript, Tailwind  
**Backend:** Node.js, Express, Lucid/Mesh, Eternl Wallet (CIP-30)  
**AI Engine:** Python, scikit-learn, graph analysis, anomaly detection  
**Agent Layer:** Masumi SDK, Rust  
**Smart Contracts:** Aiken  
**Scaling:** Hydra Head  
**Blockchain:** Cardano Mainnet/Testnet, Blockfrost  
**Storage:** IPFS, encrypted state memory

---

## 📦 Smart Contract Logic (Aiken)

- Create compliance-proof UTxOs
- Store `risk_score`, `address_hash`, `decision_hash`
- Ensure immutability and agent-verification

---

## 🔄 Compliance Flow

1. Backend ingests wallet/transaction activity
2. AI Engine produces real-time risk scoring
3. Masumi Agent validates & formats decision
4. Aiken Contract stores compliance proof
5. Dashboard displays on-chain + off-chain data
6. Hydra provides ultra-fast interaction for demos

---

## 🧪 Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start frontend

```bash
cd frontend
npm run dev
```

### 3. Start backend

```bash
cd backend
npm start
```

### 4. Run AI engine

```bash
cd ai-engine
python app.py
```

---

## 📌 Key Achievements

- Real-time anomaly detection pipeline
- Fully autonomous blockchain-aware AI agents
- Trust-minimized compliance verification using Aiken
- Scalable execution via Hydra
- End-to-end monitoring dashboard

---

## 🙌 Team

AUREV Guard – Cardano Asia Hackathon
AI • Masumi • Aiken • Hydra • Backend • Frontend
