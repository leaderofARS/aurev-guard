# 🧪 Testing Live Pipeline with Blockfrost API Key

## ✅ Setup Complete

Your Blockfrost API key is configured in `apps/backend/.env`:
```
BLOCKFROST_API_KEY=previewXjcueZf3rkZKHUeC0e7rnDNG6pzsX02X
```

## 🚀 How to Test

### Step 1: Restart Backend Server

**Important**: The backend loads `.env` file at startup, so you need to restart it:

```powershell
# Stop the current backend (Ctrl+C)
# Then restart:
cd apps/backend
npm start
```

You should see in the console:
```
🔑 BLOCKFROST_API_KEY: Set (previewXjcu...)
```

If you see "NOT SET", the `.env` file isn't being loaded. Check:
- File is at: `apps/backend/.env` (not in `apps/backend/src/`)
- File format is correct: `BLOCKFROST_API_KEY=your_key` (no spaces around `=`)

---

### Step 2: Start All Services

**Terminal 1 - Backend:**
```powershell
cd apps/backend
npm start
```

**Terminal 2 - Masumi Orchestrator:**
```powershell
cd C:\Users\Asus\Desktop\hackathon\aurevguard
python -m uvicorn masumi.orchestrator.app:app --reload --port 8080
```

**Terminal 3 - Frontend:**
```powershell
cd apps/frontend
npm run dev
```

---

### Step 3: Test Live Pipeline

1. **Open Frontend**: http://localhost:5173
2. **Navigate to Risk Page**
3. **Enter Wallet Address**: 
   ```
   addr_test1qzmk3fsufz87t87ftmwsxh6k5tz4w5n8hy0jxl4mm4m7u9xzhua2uqrj2m94vak02jt68slzwa7ccfyg4h42g8j6e0jqs2e4le
   ```
4. **Select Mode**: "Live Blockfrost (Real Data - costs ~0.17 ADA)"
5. **Click**: "Pay & Start Analysis (0.17 ADA)"
6. **Approve Payment** in Eternl wallet
7. **Watch Progress**: Pipeline should process and show results

---

## 🔍 What to Check

### Backend Console Should Show:

```
✅ Started real pipeline job: job_real_...
🔄 Starting Python subprocess to fetch Blockfrost data for: addr_test1...
📁 Project root: C:\Users\Asus\Desktop\hackathon\aurevguard
📜 Script path: C:\Users\Asus\Desktop\hackathon\aurevguard\apps\backend\scripts\fetch_blockfrost.py
🐍 Python path: python
🔑 BLOCKFROST_API_KEY: Set (previewXjcu...)
  [Python stdout] Models loaded successfully
  [Python stdout] Fetching transactions for wallet: addr_test1...
  [Python stdout] Found X transactions
✅ Successfully fetched X transactions
```

### If You See Errors:

**"BLOCKFROST_API_KEY not set"**:
- Restart backend server
- Check `.env` file location and format
- Verify key is in `apps/backend/.env`

**"403 Forbidden"**:
- API key might be invalid
- Check if key is for correct network (preview vs mainnet)
- Verify key at https://blockfrost.io/

**"Import error: No module named 'agents'"**:
- This should be fixed now with the standalone script
- If still occurs, check Python path

---

## 📊 Expected Flow

1. **User clicks "Pay & Start Analysis"**
   - Frontend → Backend: POST `/api/real-pipeline/start`
   - Backend creates job and starts processing

2. **Backend fetches Blockfrost data**
   - Spawns Python script: `fetch_blockfrost.py`
   - Script uses API key from environment
   - Returns transaction data

3. **Backend runs feature engineering**
   - Extracts 18 features from transactions
   - Prepares feature vector

4. **Backend calls Orchestrator**
   - POST to Masumi: `/masumi/route`
   - Workflow: `ai_predict`
   - Gets risk score and anomaly detection

5. **Results displayed**
   - Frontend shows risk score
   - Shows anomaly flag
   - Shows feature importance

---

## ✅ Success Indicators

- ✅ Backend console shows "BLOCKFROST_API_KEY: Set"
- ✅ Python script runs without import errors
- ✅ Transactions are fetched from Blockfrost
- ✅ Features are extracted successfully
- ✅ Orchestrator returns predictions
- ✅ Frontend displays results

---

## 🐛 Troubleshooting

### API Key Not Working?

1. **Verify key format**: No quotes, no spaces
   ```
   ✅ Correct: BLOCKFROST_API_KEY=previewXjcueZf3rkZKHUeC0e7rnDNG6pzsX02X
   ❌ Wrong:   BLOCKFROST_API_KEY="previewXjcueZf3rkZKHUeC0e7rnDNG6pzsX02X"
   ```

2. **Check network**: Make sure key is for `preview` (testnet)
   - Your key starts with `preview` ✅
   - If it starts with `mainnet`, change `BLOCKFROST_PROJECT=mainnet`

3. **Restart backend**: Environment variables load at startup

### Still Having Issues?

Check backend console for:
- API key status message
- Python script output
- Error messages with debug info

The debug info will show:
- Project root path
- Python path
- Whether agents directory exists
- Full error traceback

---

**Your API key is set! Restart the backend and test the live pipeline.** 🚀

