# 🔑 How to Set Your Blockfrost API Key

## Where to Add Your API Key

The Blockfrost API key is read from **environment variables**. You have several options:

### Option 1: Create `.env` file in `apps/backend/` (Recommended)

Create a file: `apps/backend/.env`

```env
BLOCKFROST_API_KEY=your_actual_api_key_here
BLOCKFROST_PROJECT=preview
CARDANO_NETWORK=testnet
```

**Note**: The `.env` file is already configured to be loaded by `dotenv` in `apps/backend/src/config/index.js`

---

### Option 2: Set Environment Variable in PowerShell (Temporary)

```powershell
# In the terminal where you run the backend
$env:BLOCKFROST_API_KEY = "your_actual_api_key_here"
$env:BLOCKFROST_PROJECT = "preview"

# Then start backend
cd apps/backend
npm start
```

---

### Option 3: Set System Environment Variable (Permanent)

1. Open **System Properties** → **Environment Variables**
2. Add new variable:
   - **Variable name**: `BLOCKFROST_API_KEY`
   - **Variable value**: `your_actual_api_key_here`
3. Restart your terminal/IDE

---

## How It Works

1. **Backend reads the key** from `process.env.BLOCKFROST_API_KEY` (via `config/index.js`)
2. **Backend passes it** to the Python subprocess as an environment variable
3. **Python script reads it** from `os.getenv('BLOCKFROST_API_KEY')` in `live_pipeline.py`

---

## Get Your Blockfrost API Key

1. Go to https://blockfrost.io/
2. Sign up / Log in
3. Create a new project
4. Select **Cardano Preview Testnet** (for testnet) or **Cardano Mainnet** (for mainnet)
5. Copy your **Project ID** (this is your API key)

---

## Verify It's Working

After setting the API key, restart your backend and check the console:

```
🔑 BLOCKFROST_API_KEY: Set (mainnet123...)
```

If you see "NOT SET", the key isn't being read correctly.

---

## Current Code Flow

```
Backend (Node.js)
  ↓
Reads: process.env.BLOCKFROST_API_KEY
  ↓
Passes to Python subprocess via env object
  ↓
Python script (fetch_blockfrost.py)
  ↓
Reads: os.getenv('BLOCKFROST_API_KEY')
  ↓
Uses in: live_pipeline.py → BLOCKFROST_API_KEY = os.getenv("BLOCKFROST_API_KEY", "")
```

---

## Troubleshooting

### Key not being read?

1. **Check `.env` file location**: Must be in `apps/backend/.env`
2. **Check file format**: No spaces around `=`, no quotes needed
3. **Restart backend**: Environment variables are loaded at startup
4. **Check console**: Backend logs whether key is set

### Still not working?

Check the backend console output:
```
🔑 BLOCKFROST_API_KEY: Set (...)
```

If it says "NOT SET", the key isn't being read. Try:
- Using PowerShell environment variable instead
- Checking `.env` file syntax
- Restarting the backend server

---

## Example `.env` File

```env
# apps/backend/.env

PORT=5000
NODE_ENV=development

# Blockfrost Configuration
BLOCKFROST_API_KEY=mainnet1234567890abcdefghijklmnopqrstuvwxyz
BLOCKFROST_PROJECT=preview
CARDANO_NETWORK=testnet

# Other services
ORCHESTRATOR_URL=http://localhost:8080
FRONTEND_ORIGIN=http://localhost:5173
```

---

**The API key in `live_pipeline.py` is read from environment variables, so you need to set it in the backend's environment!**

