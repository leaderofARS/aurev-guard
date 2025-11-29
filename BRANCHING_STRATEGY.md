# Git Branching Strategy - AUREV Guard

## 🏆 PRIMARY BRANCHES

- `main` - Production-ready code
- `develop` - Integration branch for all features
- `release/demo` - Demo preparation branch
- `release/final` - Final release candidate

---

## 👥 TEAM-SPECIFIC BRANCH GROUPS

### 1️⃣ AI + Masumi Agent Engineer (You)

- `ai/agent-core` - Core agent runtime and logic
- `ai/masumi-integration` - Masumi SDK integration
- `ai/model-training` - ML model training pipelines
- `ai/offchain-risk-engine` - Risk scoring engine
- `ai/agent-testing` - Agent test suites

### 2️⃣ Backend Engineer A
(API, Eternl wallet connection, Gateway, Node.js)

- `backend/api-core` - Core API endpoints
- `backend/wallet-integration` - Eternl wallet + CIP-30
- `backend/gateway-layer` - API gateway logic
- `backend/blockchain-services` - Cardano/Blockfrost services
- `backend/tests` - Backend test suites

### 3️⃣ Backend Engineer B
(Scaling logic, AI–Backend bridge, Transaction builder)

- `backend/ai-bridge` - AI engine integration
- `backend/tx-builder` - Transaction construction
- `backend/hydra-adapter` - Hydra node adapter
- `backend/logging-monitoring` - Logging & monitoring

### 4️⃣ Frontend Engineer A
(Dashboard, Risk UI, Wallet connect)

- `frontend/ui-core` - Core UI components
- `frontend/wallet-connect` - Wallet connection UI
- `frontend/risk-visualizer` - Risk score visualization
- `frontend/agent-dashboard` - Agent monitoring dashboard

### 5️⃣ Frontend Engineer B
(UX, animations, state management, error fallback)

- `frontend/state-management` - Global state (Context/Redux)
- `frontend/error-handling` - Error boundaries & fallbacks
- `frontend/components-library` - Reusable component library
- `frontend/integration-tests` - Frontend integration tests

### 6️⃣ Smart Contract Engineer (Aiken)

- `contracts/aiken-core` - Core validator logic
- `contracts/compliance-nft` - Compliance proof minting
- `contracts/log-proofs` - On-chain proof logging
- `contracts/tests` - Contract unit & integration tests

### 7️⃣ Hydra / Integration Engineer

- `hydra/head-setup` - Hydra head configuration
- `hydra/api-adapter` - Hydra API client
- `hydra/load-testing` - Performance & load tests
- `hydra/final-integration` - End-to-end integration

---

## 🔥 CROSS-FUNCTIONAL BRANCHES
(Used when two or more people work together)

- `integration/frontend-backend` - Frontend ↔ Backend integration
- `integration/ai-backend` - AI ↔ Backend integration
- `integration/masumi-cardano` - Masumi ↔ Cardano integration
- `integration/aiken-backend` - Smart contracts ↔ Backend
- `integration/hydra-mainchain` - Hydra ↔ Mainchain integration

---

## 🚑 HOTFIX BRANCHES
(For last-minute bug kills near demo time)

- `hotfix/frontend-ui` - Critical UI fixes
- `hotfix/backend-api` - Critical API fixes
- `hotfix/ai-agent` - Critical agent fixes
- `hotfix/contracts` - Critical contract fixes
- `hotfix/hydra` - Critical Hydra fixes

---

## 🚀 AUTOMATION + DEVOPS BRANCHES (Optional)

- `devops/dockerization` - Docker setup & configs
- `devops/ci-cd` - CI/CD pipeline setup
- `devops/testing-suite` - Automated testing infrastructure

---

## ⭐ How Your Team Works With These Branches

1. **No one pushes to `main`**
2. All merges follow: `feature-branch` → `develop` → `main` with PR + review
3. Every feature branch must end with:
   - ✅ Lint
   - ✅ Test
   - ✅ Build
   - ✅ Small demo

4. Integration branches ensure you avoid last-minute chaos

---

## 🎯 Recommended GitHub Rules

- ✅ Require PR approvals
- ✅ Enable status checks (build + lint)
- ✅ Protect `main` and `release/*` branches
- ✅ Auto-delete merged branches

---

## 📋 Branch Workflow Example

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b ai/agent-core

# Work on your feature
git add .
git commit -m "feat: implement agent core logic"
git push origin ai/agent-core

# Create PR to develop
# After review and approval, merge to develop

# For integration work
git checkout develop
git pull origin develop
git checkout -b integration/ai-backend

# Collaborate with backend team
# Merge to develop when ready
```

---

## 🔄 Release Process

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/demo

# Test and fix bugs on release branch
# When ready, merge to main
git checkout main
git merge release/demo
git tag -a v1.0.0-demo -m "Demo release"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/demo
```

---

**Remember:** Communication is key. Use PR descriptions, comments, and team chat to coordinate integration work!
