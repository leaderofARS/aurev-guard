# AUREV Guard: Quick Start Guide

## Prerequisites
- Node.js >= 16
- npm or pnpm
- (Optional) Cardano wallet extension (Nami, Flint, Lace) for full wallet integration

---

## Setup & Run Locally (Development)

### **1. Backend Setup**
```bash
cd apps/backend
npm install
npm start
# Server runs on http://localhost:3000
```

**Verify backend is running:**
```bash
curl http://localhost:3000/health
# Should return: { "status": "ok", "timestamp": "..." }
```

### **2. Frontend Setup**
```bash
cd apps/frontend

# Create .env file with backend URL
cp .env.example .env
# Edit .env and ensure:
# VITE_API_BASE=http://localhost:3000

npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### **3. Open in Browser**
Navigate to: `http://localhost:5173`

---

## Usage

### **Wallet Page** (`http://localhost:5173/`)
1. Click "Connect Cardano Wallet"
2. Select wallet (Nami, Flint, Lace)
3. Approve connection
4. See your connected address displayed

### **Risk Checker** (`http://localhost:5173/risk`)
1. (Optional) Connect wallet or manually enter address
2. Click "Scan Address"
3. View risk score with status badge (LOW/MEDIUM/HIGH)
4. See transaction count, balance, and timestamps

### **Compliance Proof** (`http://localhost:5173/proof`)
1. Enter address or scan from wallet
2. Click "Generate Compliance Proof"
3. Copy or download the unsigned transaction hex
4. (In production) Sign and submit this transaction

---

## API Endpoints Reference

### **Health Check**
```bash
GET http://localhost:3000/health
```

### **Scan Address**
```bash
curl -X POST http://localhost:3000/scan/address \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}'
```

### **Get AI Score**
```bash
curl -X POST http://localhost:3000/ai/score \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg"}'
```

### **Get Agent Decision**
```bash
curl -X POST http://localhost:3000/agent/decision \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg","riskScore":65}'
```

### **Get Contract Log (Unsigned TX)**
```bash
curl -X POST http://localhost:3000/contract/log \
  -H "Content-Type: application/json" \
  -d '{"address":"addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg","action":"compliance_check"}'
```

### **Get Risk History**
```bash
curl http://localhost:3000/risk/history/addr_test1qz2fxv2umyhttkxyxp8x0dlsdtqbx5qxnlwujcd2n0r3f8k2fr0xg
```

---

## Development Commands

### **Backend**
```bash
cd apps/backend

# Start server (one-time run)
npm start

# Start with auto-reload (watch mode)
npm run dev

# Run endpoint tests
node test-endpoints.js
```

### **Frontend**
```bash
cd apps/frontend

# Dev server with HMR (hot reload)
npm run dev

# Build for production
npm build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

---

## Project Structure

```
apps/
├── backend/
│   ├── src/
│   │   ├── index.js              # Server entry point
│   │   ├── server.js             # Express app configuration
│   │   ├── config/
│   │   │   └── index.js          # Environment & config
│   │   ├── routes/               # 5 route handlers
│   │   │   ├── scan.js
│   │   │   ├── ai.js
│   │   │   ├── agent.js
│   │   │   ├── contract.js
│   │   │   └── risk.js
│   │   ├── controllers/          # Request handlers
│   │   ├── services/             # Mock integrations (Masumi, Aiken, Blockfrost, Hydra)
│   │   ├── middleware/           # Error handling
│   │   └── store/                # In-memory history store
│   ├── package.json
│   └── test-endpoints.js         # Smoke tests
│
└── frontend/
    ├── src/
    │   ├── main.jsx              # React root
    │   ├── App.jsx               # Router & pages
    │   ├── pages/                # 3 pages
    │   │   ├── Wallet.jsx
    │   │   ├── Risk.jsx
    │   │   └── Proof.jsx
    │   ├── components/           # 6 reusable components
    │   │   ├── WalletConnect.jsx
    │   │   ├── RiskForm.jsx
    │   │   ├── RiskCard.jsx
    │   │   ├── ComplianceModal.jsx
    │   │   └── UiButton.jsx
    │   ├── lib/                  # Utilities
    │   │   ├── api.js            # API client (calls backend)
    │   │   └── cardano.js        # CIP-30 wallet integration
    │   ├── utils/
    │   │   └── formatter.js
    │   └── index.css             # Tailwind global styles
    ├── .env.example              # Environment template
    ├── vite.config.js
    ├── package.json
    └── index.html
```

---

## Environment Variables

### **Frontend** (`.env`)
```env
VITE_API_BASE=http://localhost:3000
```

### **Backend** (optional `.env`)
```env
PORT=3000
NODE_ENV=development
```

---

## Common Issues & Solutions

### **Issue: "Failed to connect to backend"**
- Ensure backend is running on port 3000
- Check `VITE_API_BASE` in frontend `.env`
- Verify CORS is enabled (it is by default)

### **Issue: "ENOENT: no such file or directory"**
- Run `npm install` in both backend and frontend
- Check you're in the correct directory

### **Issue: "Port 3000 already in use"**
- Change backend port: `PORT=3001 npm start`
- Update frontend `.env`: `VITE_API_BASE=http://localhost:3001`

### **Issue: Wallet not connecting**
- Install a CIP-30 wallet extension (Nami, Flint, Lace)
- Ensure you're on testnet
- Check browser console for errors

---

## MVP Features (Scope)

✅ **Implemented:**
- 5 Backend REST endpoints
- 3 Frontend pages
- Wallet connection (CIP-30)
- Risk scanning with mock data
- Compliance proof generation
- In-memory history tracking
- Error handling

❌ **Not Yet Implemented (Future):**
- Real Blockfrost integration
- Real Masumi AI scoring
- Real Aiken smart contracts
- Real transaction signing
- Persistent database
- User authentication
- Analytics/logging

---

## Deployment (Production)

### **Backend**
1. Deploy to hosting platform (Vercel, Railway, Render, etc.)
2. Set `NODE_ENV=production`
3. Configure CORS for frontend domain
4. Note the deployed URL (e.g., `https://api.aurev-guard.io`)

### **Frontend**
1. Update `VITE_API_BASE` in `.env` to production backend URL
2. Run `npm run build`
3. Deploy `dist/` folder to hosting (Vercel, Netlify, etc.)

---

## Support & Debugging

### **View Backend Logs**
```bash
cd apps/backend
npm start
# Logs show all requests and errors
```

### **View Frontend Logs**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API requests

### **Run Endpoint Tests**
```bash
cd apps/backend
npm start &  # Start server in background
node test-endpoints.js  # Run tests
```

---

## Next Steps

1. ✅ Run backend & frontend locally
2. ✅ Test wallet connection
3. ✅ Scan addresses and view risk scores
4. [ ] Integrate real Blockfrost API
5. [ ] Add transaction signing
6. [ ] Deploy to production
7. [ ] Monitor usage & errors

---

**Happy hacking! 🚀**
