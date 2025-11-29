# 🔥 GIT COMMIT SEQUENCE — 30 HOUR HACKATHON ROADMAP

## Team Roles

- **You (Person 1)** → AI Engine + Masumi Agent + Hydra
- **Person 2** → Backend Core (API + Gateway + Wallet)
- **Person 3** → Backend Integrations (Masumi API, Aiken call layer)
- **Person 4** → Frontend UI
- **Person 5** → Frontend State + Integration

---

## 🕒 PHASE 0 — T-0 to T+30 mins
### Repo Bootstrap

**Commit #1 — Root Monorepo Init**
```
feat: initialize monorepo with pnpm workspaces + backend + frontend + contracts + agents folders
```

**Commit #2 — Toolchains**
```
chore: add Aiken project init, Masumi agent scaffold, Hydra node configs, Vite+React bootstrap
```

---

## 🕒 PHASE 1 — T+30 mins to T+2 hours
### Environment Foundations

- **Person 1 (AI/Masumi):**
  ```
  feat: setup python env + risk-scoring boilerplate + dataset loader
  ```

- **Person 2 (Backend Core):**
  ```
  feat: express server init + healthcheck route + .env placeholders
  ```

- **Person 3 (Backend-Chain):**
  ```
  feat: add wallet provider (Eternl CIP-30) gateway module outline
  ```

- **Person 4 (Frontend UI):**
  ```
  feat: initialize pages: Home, Scan, Dashboard
  ```

- **Person 5 (Frontend State):**
  ```
  feat: setup global store (Zustand/Redux) + API hooks
  ```

---

## 🕒 PHASE 2 — T+2 to T+5 hours
### Core Logic Begins

- **AI (You):**
  ```
  feat: add anomaly detection model + scoring function + JSON output schema
  ```

- **Backend 2:**
  ```
  feat: POST /scan route + connect AI microservice stub
  ```

- **Backend 3:**
  ```
  feat: blockchain-utils for UTxO fetch + address validation (Blockfrost/Cardano-node)
  ```

- **Frontend 4:**
  ```
  feat: scan form + wallet input validation
  ```

- **Frontend 5:**
  ```
  feat: integrate API request to backend scan endpoint
  ```

---

## 🕒 PHASE 3 — T+5 to T+8 hours
### Masumi + Aiken Activation

- **AI/Masumi (You):**
  ```
  feat: masumi agent action: submitRiskProof + verifyRiskScore
  ```

- **Backend 3:**
  ```
  feat: Plutus/Aiken integration module (contract address + datum builder)
  ```

- **Contracts (You):**
  ```
  feat: aiken: add compliance NFT validator + metadata structure
  ```

- **Frontend 4:**
  ```
  feat: display scan result card (risk score, reason, timestamp)
  ```

- **Frontend 5:**
  ```
  feat: add "Mint Proof" button + loading states
  ```

---

## 🕒 PHASE 4 — T+8 to T+12 hours
### Chain Writes + NFT Proof

- **You:**
  ```
  feat: masumi agent executes mintProof() with contract interaction
  ```

- **Backend 3:**
  ```
  feat: tx builder for Aiken contract + submit transaction
  ```

- **Backend 2:**
  ```
  feat: GET /proofs?address=xxx route returning on-chain logs
  ```

- **Frontend 4:**
  ```
  feat: proof list UI
  ```

- **Frontend 5:**
  ```
  feat: integrate proof fetch endpoint
  ```

---

## 🕒 PHASE 5 — T+12 to T+15 hours
### Hydra Layer Setup

- **You:**
  ```
  feat: hydra-head-init + basic multi-party channel config
  ```

- **Backend 3:**
  ```
  feat: hydra-client wrapper for high-speed proof submission
  ```

- **Backend 2:**
  ```
  feat: /hydra/submit route
  ```

- **Frontend 4/5:**
  ```
  feat: toggle between mainchain/hydra mode
  ```

---

## 🕒 PHASE 6 — T+15 to T+18 hours
### First Full Pipeline Working

**Commit:**
```
feat: end-to-end scan → score → mint → display proof complete pipeline
```

**Everyone merges.**

---

## 🕒 PHASE 7 — T+18 to T+22 hours
### Polish & Stability

- **AI:**
  ```
  refactor: improve scoring confidence + edge-case handling
  ```

- **Backend:**
  ```
  fix: error handling + better logs
  ```

- **Frontend:**
  ```
  style: polish UI, add charts, highlight risk levels
  ```

- **Aiken:**
  ```
  refactor: contract simplification + smaller datum
  ```

- **Masumi:**
  ```
  feat: agent heartbeat + logging channel
  ```

---

## 🕒 PHASE 8 — T+22 to T+25 hours
### Demo Mode + Fast Paths

**Commit:**
```
feat: add demo addresses + fast test runner + sample proof NFTs
```

**Frontend:**
```
feat: add "Demo Scan" button
```

---

## 🕒 PHASE 9 — T+25 to T+28 hours
### Hardening + Docs

**Commit:**
```
docs: README + architecture diagram + sequence diagrams + API docs
```

**Commit:**
```
test: integration tests for scan and proof minting
```

---

## 🕒 PHASE 10 — T+28 to T+30 hours
### Final Merge + Deployment

**Commit:**
```
build: docker-compose for backend + AI service
```

**Commit:**
```
release: v1.0 hackathon edition
```

**Commit:**
```
chore: final frontend build + deploy + live demo prep
```

---

## 🔥 FINAL COMMIT OF THE HACKATHON

```
release: final demo build + all systems integrated + presentation ready
```

---

## 📊 Quick Reference Timeline

| Time | Phase | Focus |
|------|-------|-------|
| 0-0.5h | Phase 0 | Repo Bootstrap |
| 0.5-2h | Phase 1 | Environment Setup |
| 2-5h | Phase 2 | Core Logic |
| 5-8h | Phase 3 | Masumi + Aiken |
| 8-12h | Phase 4 | Chain Writes |
| 12-15h | Phase 5 | Hydra Setup |
| 15-18h | Phase 6 | Full Pipeline |
| 18-22h | Phase 7 | Polish |
| 22-25h | Phase 8 | Demo Mode |
| 25-28h | Phase 9 | Docs + Tests |
| 28-30h | Phase 10 | Deploy + Final |

---

## 🎯 Success Criteria

- ✅ End-to-end scan working
- ✅ Risk score displayed
- ✅ Proof minted on-chain
- ✅ Hydra integration functional
- ✅ UI polished and responsive
- ✅ Demo mode ready
- ✅ Documentation complete
- ✅ Presentation prepared

---

**Remember:** Commit early, commit often. Merge to `develop` regularly. Communicate constantly!
