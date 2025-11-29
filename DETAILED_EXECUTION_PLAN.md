# 🎯 AUREV Guard - Detailed 30-Hour Execution Plan

## Team Roles Quick Reference

- **Person 1 (You)** → AI Engine + Masumi Agent + Hydra
- **Person 2** → Backend Core (API + Gateway + Wallet)
- **Person 3** → Backend Integrations (Masumi API, Aiken call layer)
- **Person 4** → Frontend UI
- **Person 5** → Frontend State + Integration

---

## PHASE 1 — Hours 0–3: Kickoff & Repo + Infra Bootstrap

**Goal (end of Phase):** Monorepo created, dev branches made, local Cardano node/Blockfrost or testnet access verified, basic React + API skeleton runnable.

### Hour 0–1 (0:00–1:00)

- **All:** 15m quick sync — goals, roles, acceptance criteria
- **Person 2:** Create monorepo (yarn workspaces / pnpm), initialize backend service folder, create README, CI skeleton
- **Person 4:** Create React app skeleton (Vite + TypeScript + Tailwind), set up dev proxy
- **Person 1:** Create AI folder, outline model plan + data sources, create requirements.txt
- **Person 3:** Prepare Cardano dev access (Blockfrost key / local node) and Hydra dev images

### Hour 1–2 (1:00–2:00)

- **Person 2:** API skeleton (Express/Node or Fastify) with health endpoint; init Postgres or in-memory DB
- **Person 3:** Set up Aiken toolchain locally; verify `aiken build` works
- **Person 4/5:** Wire basic landing UI pages and placeholder wallet-connect button

### Hour 2–3 (2:00–3:00)

- **Person 1:** Create a minimal model stub that accepts tx data and returns `{ risk_score, reasons }` (deterministic rule-based for now)
- **Git:** Create branches `phase1/bootstrap` and push. Tag `v0.1-bootstrap`

**Integration Outcome:**
- ✅ `yarn start` runs frontend
- ✅ `node server` returns health
- ✅ Model stub responds to test curl
- ✅ Aiken toolchain compiled

---

## PHASE 2 — Hours 3–6: API Endpoints + Wallet Stub + AI Data Prep

**Goal:** API endpoints for ingesting txs & addresses exist; Eternl/CIP-30 wallet connection plan; initial training dataset ingested or synthetic dataset created.

### Hour 3–4

- **Person 2:** Implement endpoints: `POST /scan/address`, `POST /scan/tx`, `GET /status/:id`. Add request validation
- **Person 4:** Implement UI form to submit an address / tx to the backend
- **Person 1:** Create initial dataset (synthetic + known scam examples) and data loader script

### Hour 4–5

- **Person 3:** Implement a simple gateway wrapper (Blockfrost) to fetch UTxOs and tx history for an address; expose to backend as `fetchChainData(address)`
- **Person 1:** Hook model stub to backend endpoint: `POST /scan/address` triggers model inference and returns `{score, evidence}`

### Hour 5–6

- **Person 2/3:** Add logging + request tracing (simple UUID)
- **Person 4/5:** Frontend shows returned risk score and evidence panel
- **Git:** Tag `v0.2-api-ws`

**Integration Outcome:**
- ✅ Demo: UI submit address → backend fetch chain data → model returns risk score → UI displays

---

## 🍕 BREAK — 45 minutes (after Phase 2: Hours 6–6:45)

---

## PHASE 3 — Hours 6.75–9.75: Masumi Agent Skeleton & Local Mock Decisions

**Goal:** Masumi agent runtime stub that can accept job and return signed decision; expose agent API; agent can be called by backend.

### Hour 6.75–7.75

- **Person 1:** Set up Masumi dev environment and agent process skeleton (Rust or Masumi SDK). Agent accepts JSON `{address, tx_hash}` and returns `{risk_score, model_hash, signature}`
- **Person 3:** Prepare an agent-to-backend handshake endpoint

### Hour 7.75–8.75

- **Person 2:** Implement backend connector `masumiClient.sendEvaluation()` and store `model_hash` + `signature`
- **Person 1:** Implement agent local verification: given `model_hash` and evidence, can produce a deterministic signature

### Hour 8.75–9.75

- **Person 4:** Update UI to call backend which triggers Masumi agent; display on-screen `agent_signature` and `model_hash`
- **Integration test:** Submit address → Masumi agent returns signed risk object → backend stores signature

**Integration Outcome:**
- ✅ End-to-end Masumi-signed risk proof appears in UI

---

## PHASE 4 — Hours 9.75–12.75: Aiken Smart Contract Skeleton + Local Mint Test

**Goal:** Aiken contract that accepts a `risk_hash` and mints an NFT or records a UTxO with `risk_hash`. Compile + local test.

### Hour 9.75–10.75

- **Person 3:** Write Aiken contract skeleton `ComplianceProof` with `mint_proof(risk_hash, address, level)` and compile
- **Person 2:** Create endpoint `POST /onchain/log` to call chain-mint simulation (testnet or local)

### Hour 10.75–11.75

- **Person 1:** Define canonical `risk_hash` format (sha256 of `{address, risk_score, timestamp, model_hash}`) and share spec
- **Person 3:** Implement test mint using Aiken CLI to locally mint a token or write UTxO. Verify using Blockfrost/testnet

### Hour 11.75–12.75

- **Person 4:** Create UI button "Mint Compliance Proof" which calls backend `/onchain/log`. Show pending tx
- **Tag:** `v0.4-aiken-mint`

**Integration Outcome:**
- ✅ Run mint flow locally: risk event → risk_hash → call Aiken contract → proof minted (local tx id shown)

---

## 🍕 BREAK — 45 minutes (after Phase 4: Hours 12.75–13.5)

---

## PHASE 5 — Hours 13.5–16.5: AI → Masumi Live Flow + Backend Event Bus

**Goal:** Replace model stub with an iterative ML model (or simple trained classifier). Event bus (Redis/Kafka) connects chain watchers → AI → Masumi → backend.

### Hour 13.5–14.5

- **Person 1:** Train simple classifier on the prepared dataset (random forest or isolation forest). Save model artifact. Add inference API
- **Person 2:** Integrate Redis or simple event queue; implement worker process that picks up addresses to scan

### Hour 14.5–15.5

- **Person 3:** Wire chain watcher (poll Blockfrost/new-block) to push suspicious txs to event bus
- **Person 1:** Worker consumes event → runs model → sends to Masumi client → receives signed decision

### Hour 15.5–16.5

- **Person 2:** Ensure persistence of events and decisions in DB with traceability
- **Person 4:** UI displays stream view: "recently scanned addresses" with score + signature

**Integration Outcome:**
- ✅ Automated pipeline: when new block/tx appears, system auto-scans, AI returns score, Masumi returns signed proof and backend stores it

---

## PHASE 6 — Hours 16.5–19.5: Backend ↔ Aiken On-Chain Write + NFT Proof Flow

**Goal:** Automate on-chain proof issuance triggered by risk thresholds and show on-chain record.

### Hour 16.5–17.5

- **Person 3:** Implement backend signer and transaction builder to call the Aiken mint endpoint programmatically. Ensure wallet (Eternl) key access for test wallets
- **Person 1:** Define mint policy conditions (who can mint, gas, metadata fields)

### Hour 17.5–18.5

- **Person 2:** Add endpoint `POST /proof/issue` which takes the signed risk object and performs an on-chain mint or writes UTxO; include revert/confirm states
- **Person 4:** UI: proof history page with on-chain links (testnet explorer)

### Hour 18.5–19.5

- **Person 1:** Generate 3 real test events to mint proofs at different levels (green/amber/red). Verify tx hashes and metadata correctness
- **Tag:** `v0.6-proofflow`

**Integration Outcome:**
- ✅ Fully automated chain write: suspicious tx → AI+Masumi decision → backend mints Compliance/Narrative NFT → UI shows final tx hash

---

## 🍕 BREAK — 45 minutes (after Phase 6: Hours 19.5–20.25)

---

## PHASE 7 — Hours 20.25–23.25: Frontend Wallet Connect + Scan UI + Off-Chain Visualization

**Goal:** Polished wallet connect with Eternl (CIP-30), UX for scanning addresses, evidence panels, and proof verification UI.

### Hour 20.25–21.25

- **Person 4:** Implement full wallet connect flow using CIP-30 / Eternl dApp connector. Request address, display balances, request signature for actions
- **Person 5:** UX polish: readable risk badge visuals and evidence expansion

### Hour 21.25–22.25

- **Person 2:** Implement auth for enterprise API keys and rate limits
- **Person 1:** Add explanation generation (short human-readable reasons) for each risk result

### Hour 22.25–23.25

- **Person 4/5:** Add proof verification page that shows the on-chain tx, verifies `risk_hash` against stored evidence, and validates Masumi signature (client-side verification)

**Integration Outcome:**
- ✅ User can connect wallet, submit an address or transaction, get real-time score, view on-chain proof, and verify signature locally

---

## PHASE 8 — Hours 23.25–26.25: Hydra Scaling Demo + Stress Flow

**Goal:** Demonstrate scaling via Hydra head (local Hydra), showing batch handling and sub-second finality for many scans/mints.

### Hour 23.25–24.25

- **Person 3:** Spin up local Hydra heads (docker) and connect backend to Hydra for fast off-chain interactions. Implement simple channel for issuing proof claims off-chain first
- **Person 2:** Add flow runbook to route high-frequency scans to Hydra channels

### Hour 24.25–25.25

- **Person 1:** Create synthetic high-throughput tx feed (script) to simulate many addresses and run through the pipeline
- **Person 4:** Update UI to show latency metrics (Hydra vs Mainchain)

### Hour 25.25–26.25

- **Person 3:** Demonstrate commit-to-chain fallback: finalize Hydra head to Cardano mainnet/testnet for persisted proofs
- **Tag:** `v0.8-hydra-demo`

**Integration Outcome:**
- ✅ Show comparative latency: 200 simulated scans processed through Hydra head in minutes, with on-chain settlement shown afterward

---

## 🍕 BREAK — 45 minutes (after Phase 8: Hours 26.25–27.0)

---

## PHASE 9 — Hours 27.0–30.0: Polish, E2E Tests, Demo Prep, Pitch Run-Through

**Goal:** Final bug fixes, end-to-end testing, demo script dry-runs, finalize pitch slides and backup plan.

### Hour 27.0–28.0

- **All:** Run full E2E test (user scan → AI → Masumi → mint → verify). Capture any errors
- **Person 1:** Finalize model fallback (if model fails, deterministic rules run)
- **Person 2/3:** Harden endpoints, add request timeouts, guardrails

### Hour 28.0–29.0

- **Person 4/5:** Polish UI, create short 3-step demo flows, record backup screencast of demo flows (in case network/testnet fails)
- **Person 1:** Prepare minimal supervisor summary for Q&A (how model works, data, false positive rate)

### Hour 29.0–30.0

- **Full team:** Pitch run-through (3-minute live demo + 2 min Q&A prep)
- **Final git tag:** `v1.0-final` and push release

**Integration Outcome:**
- ✅ Stable demo build, recorded backup, pitch ready

---

## PHASE 10 — Final Submission & Handover (overlaps last 30 mins)

- Prepare submission ZIP
- Fill hackathon forms
- Attach README, architecture diagrams, mermaid charts, and video link
- Ensure **Team name: AUREV Guard** and short 350-char readme string included

---

## 📊 Commit / Git Roadmap (High Level)

- `main` protected; work in `phaseX/*` branches
- Create short-lived PRs for major integration points
- **Tags after each phase:**
  - `v0.1-bootstrap`
  - `v0.2-api-ws`
  - `v0.4-aiken-mint`
  - `v0.6-proofflow`
  - `v0.8-hydra-demo`
  - `v1.0-final`

- **Frequent commits with messages like:**
  - `feat(api): add /scan/address`
  - `feat(masumi): agent verification endpoint`
  - `ci(aiken): add build/test`

---

## ✅ Integration Outcomes & Acceptance Criteria Per Phase

Phase end must have these artifacts (demoable):

1. ✅ Repo + run instructions
2. ✅ API endpoints + model stub responding
3. ✅ Masumi agent returns signed decisions
4. ✅ Aiken contract compiles and can mint proof
5. ✅ Automated pipeline: chain watcher → AI → Masumi
6. ✅ Backend mints proof on chain from signed decisions
7. ✅ Wallet connect + UI displays proofs + verification
8. ✅ Hydra head demonstrates bulk, low-latency processing
9. ✅ E2E run clean + backup demo recording
10. ✅ Submission ZIP + pitch slides

---

## ⏱️ Minute-Level Discipline & Best Practices (Non-Negotiable)

- Each hour ends with a **5–10 minute sync**: commits pushed, short stand-up
- Always push **at least one working artifact per hour**—no "works on my machine" wins points
- **Tag & PR** when a cross-team integration changes an API contract
- Keep **feature flags** for unfinished parts (don't break demo route)
- **Person 1 (you):** gatekeeper for AI → Masumi schema. If schema changes, call immediate sync

---

## 🚨 Contingency & Fallback Plans

### If Aiken minting to testnet fails:
- Use on-chain UTxO simulation (record hash + show saved tx payload)
- Playback signed tx in demo

### If Masumi runtime unstable:
- Show pre-signed sample proofs
- Prove signature verification works locally

### If Hydra not ready:
- Show a simulated low-latency queue with metrics
- Emphasize design/why Hydra matters
- Use recorded stress test

---

## 📋 Hourly Sync Checklist Template

```
Hour X Sync (5 mins):
- Person 1: [status + blockers]
- Person 2: [status + blockers]
- Person 3: [status + blockers]
- Person 4: [status + blockers]
- Person 5: [status + blockers]
- Next hour priorities: [list]
- Commits pushed: [yes/no]
```

---

## 🎯 Success Metrics

- **Technical:** All 10 acceptance criteria met
- **Demo:** 3-minute live demo runs smoothly
- **Backup:** Recorded screencast ready
- **Pitch:** Clear value prop + tech differentiation
- **Submission:** All materials uploaded on time

---

**Team Name:** AUREV Guard  
**Hackathon:** Cardano Asia Hackathon  
**Tech Stack:** AI • Masumi • Aiken • Hydra • React • Node.js

---

**Remember:** Commit early, commit often. Communicate constantly. Stay calm. You've got this! 🚀
