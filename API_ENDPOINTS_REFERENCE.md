# 📡 AUREV Guard API Endpoints Reference

## Base URL
```
http://localhost:5000
```

---

## 🔍 Available Endpoints

### Health Check
```
GET /health
```
Returns server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-30T04:50:48.720Z",
  "requestId": "b575777d-fc58-447c-a1ae-d76d3de259a0"
}
```

---

### API Information
```
GET /api
```
Lists all available API endpoints.

**Response:**
```json
{
  "message": "AUREV Guard API",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /health",
    "scan": {
      "address": "POST /scan/address"
    },
    "livePipeline": {
      "start": "POST /api/live-pipeline/start",
      "status": "GET /api/live-pipeline/status/:jobId",
      "results": "GET /api/live-pipeline/results/:walletAddress"
    },
    "realPipeline": {
      "start": "POST /api/real-pipeline/start",
      "status": "GET /api/real-pipeline/status/:jobId",
      "results": "GET /api/real-pipeline/results/:walletAddress"
    }
  }
}
```

---

### Scan Information
```
GET /scan
```
Lists available scan endpoints.

**Response:**
```json
{
  "message": "Scan API",
  "endpoints": {
    "scanAddress": {
      "method": "POST",
      "path": "/scan/address",
      "description": "Scan a Cardano wallet address for risk assessment"
    }
  }
}
```

---

## 📋 Main Endpoints

### 1. Scan Address
```
POST /scan/address
```

**Request Body:**
```json
{
  "address": "addr_test1qzmk3fsufz87t87ftmwsxh6k5tz4w5n8hy0jxl4mm4m7u9xzhua2uqrj2m94vak02jt68slzwa7ccfyg4h42g8j6e0jqs2e4le"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "addr_test1...",
    "riskScore": 45,
    "transactionCount": 5,
    "balance": "1000000",
    "scanTimestamp": "2025-11-30T04:50:48.720Z"
  }
}
```

---

### 2. Start Live Pipeline (Mock Data)
```
POST /api/live-pipeline/start
```

**Request Body:**
```json
{
  "walletAddress": "addr_test1...",
  "transactionId": "tx_test_12345"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_abc123",
  "walletAddress": "addr_test1...",
  "status": "started",
  "message": "Live pipeline processing started"
}
```

---

### 3. Start Real Pipeline (Blockfrost Data)
```
POST /api/real-pipeline/start
```

**Request Body:**
```json
{
  "walletAddress": "addr_test1...",
  "transactionId": "tx_test_12345",
  "paymentTxHash": "tx_payment_hash_optional"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_real_abc123",
  "walletAddress": "addr_test1...",
  "status": "started",
  "message": "Real blockchain pipeline processing started"
}
```

---

### 4. Get Pipeline Status
```
GET /api/live-pipeline/status/:jobId
GET /api/real-pipeline/status/:jobId
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_abc123",
  "walletAddress": "addr_test1...",
  "status": "processing",
  "progress": 45,
  "stage": "Running AI models...",
  "startTime": "2025-11-30T04:50:48.720Z"
}
```

---

### 5. Get Pipeline Results
```
GET /api/live-pipeline/results/:walletAddress
GET /api/real-pipeline/results/:walletAddress
```

**Response:**
```json
{
  "success": true,
  "walletAddress": "addr_test1...",
  "results": [
    {
      "jobId": "job_abc123",
      "timestamp": "2025-11-30T04:50:48.720Z",
      "results": {
        "wallet_address": "addr_test1...",
        "prediction": {
          "risk_score": 0.73,
          "risk_label": "HIGH_RISK",
          "anomaly_score": 0.42,
          "is_anomaly": true
        }
      }
    }
  ],
  "count": 1
}
```

---

## 🧪 Testing Endpoints

### Test Health
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5000/health
```

### Test API Info
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5000/api
```

### Test Scan Info
```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5000/scan
```

### Test Scan Address
```powershell
$body = @{ address = "addr_test1qzmk3fsufz87t87ftmwsxh6k5tz4w5n8hy0jxl4mm4m7u9xzhua2uqrj2m94vak02jt68slzwa7ccfyg4h42g8j6e0jqs2e4le" } | ConvertTo-Json
Invoke-WebRequest -UseBasicParsing -Method POST -Uri "http://localhost:5000/scan/address" -ContentType "application/json" -Body $body
```

---

## ⚠️ Common Errors

### "Cannot GET /api"
- **Solution**: Use `GET /api` (now returns endpoint list) or use specific endpoints like `POST /api/live-pipeline/start`

### "Cannot GET /scan"
- **Solution**: Use `GET /scan` (now returns endpoint info) or use `POST /scan/address` to scan

### "404 Not Found"
- **Check**: Backend is running on port 5000
- **Check**: Route path is correct (case-sensitive)
- **Check**: HTTP method is correct (GET vs POST)

---

## 📝 Notes

- All POST endpoints require `Content-Type: application/json` header
- All endpoints return JSON responses
- Error responses include `error` field with description
- All requests include `X-Request-Id` header for tracking

