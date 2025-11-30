# LIVE Pipeline - Testing & Validation Guide

## Pre-Testing Checklist

- [ ] All files created successfully
- [ ] Backend server starts without errors
- [ ] Frontend builds successfully
- [ ] Orchestrator running on port 8080
- [ ] Environment variables configured

---

## Unit Testing

### Test 1: Backend Server Startup

```bash
cd apps/backend
npm start
```

**Expected Output:**
```
✅ Server running on port 5000
📝 Health check: http://localhost:5000/health
🔧 Environment: development
```

**Validation:**
```bash
curl http://localhost:5000/health
# Response: { "status": "ok", "timestamp": "..." }
```

---

### Test 2: Route Registration

```bash
# Check if routes are registered
curl http://localhost:5000/api/live-pipeline/start -X POST
```

**Expected:** Should not get 404 error

---

### Test 3: Start Pipeline

```bash
curl -X POST http://localhost:5000/api/live-pipeline/start \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl",
    "transactionId": "txn_test_001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "jobId": "job_1234567890_abc123",
  "walletAddress": "addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl",
  "status": "started",
  "message": "Live pipeline processing started"
}
```

**Validation Checklist:**
- ✅ `success` is `true`
- ✅ `jobId` is generated (format: `job_<timestamp>_<random>`)
- ✅ `status` is `"started"`
- ✅ Response time < 500ms

---

### Test 4: Get Pipeline Status

```bash
# Use jobId from Test 3
curl http://localhost:5000/api/live-pipeline/status/job_1234567890_abc123
```

**Expected Response:**
```json
{
  "success": true,
  "jobId": "job_1234567890_abc123",
  "walletAddress": "addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl",
  "status": "processing",
  "progress": 35,
  "results": null,
  "error": null
}
```

**Validation Checklist:**
- ✅ `success` is `true`
- ✅ `progress` is between 0-100
- ✅ `status` is one of: `processing`, `completed`, `failed`
- ✅ Response time < 100ms

---

### Test 5: Progress Tracking

```bash
# Run this multiple times to see progress increase
for i in {1..10}; do
  echo "Check $i:"
  curl http://localhost:5000/api/live-pipeline/status/job_1234567890_abc123 | jq '.data.progress'
  sleep 1
done
```

**Expected Behavior:**
- Progress starts at ~10%
- Increases gradually
- Reaches 100% around 7-8 seconds
- Status changes from "processing" to "completed"

---

### Test 6: Completed Job Results

```bash
# After job completes, check status again
curl http://localhost:5000/api/live-pipeline/status/job_1234567890_abc123
```

**Expected Response:**
```json
{
  "success": true,
  "status": "completed",
  "progress": 100,
  "results": {
    "wallet_address": "addr_test1qz2fxv...",
    "timestamp": "2025-11-30T10:30:00Z",
    "features": {
      "tx_count_24h": 15,
      "total_received": 500,
      ...
    },
    "prediction": {
      "risk_score": 0.35,
      "anomaly_score": 0.12,
      "prediction": "LOW_RISK"
    },
    "transaction_count": 47,
    "utxo_count": 8
  }
}
```

**Validation Checklist:**
- ✅ `status` is `"completed"`
- ✅ `progress` is `100`
- ✅ `results` object exists
- ✅ `prediction.risk_score` is 0.0-1.0
- ✅ `prediction.anomaly_score` is 0.0-1.0
- ✅ All 17+ features present

---

### Test 7: Get Results History

```bash
curl http://localhost:5000/api/live-pipeline/results/addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl
```

**Expected Response:**
```json
{
  "success": true,
  "walletAddress": "addr_test1qz2fxv...",
  "results": [
    {
      "jobId": "job_...",
      "timestamp": "2025-11-30T10:30:00Z",
      "results": { ... }
    }
  ],
  "count": 1
}
```

**Validation Checklist:**
- ✅ `success` is `true`
- ✅ `results` is an array
- ✅ Results are sorted by timestamp (newest first)
- ✅ Max 50 results returned

---

## Frontend Testing

### Test 1: Component Import

```jsx
// In your React component file
import LivePipelineProcessor from '@/components/LivePipelineProcessor';

// Check for errors in browser console
```

**Expected:** No import errors

---

### Test 2: Component Render

```jsx
export default function TestPage() {
  return (
    <LivePipelineProcessor
      walletAddress="addr_test1qz2fxv2umyhttkxyxp8x0dlsdtg35rwuyh3y5d3xj75xxccjg2wl"
    />
  );
}
```

**Expected:**
- ✅ Component renders without errors
- ✅ "Start Analysis" button visible
- ✅ Wallet address displayed

---

### Test 3: UI States

Test each UI state:

**Idle State:**
- [ ] "Start Analysis" button enabled
- [ ] Message: "Wallet: addr_test1..."

**Processing State:**
- [ ] Progress bar visible
- [ ] Spinning icon visible
- [ ] Progress percentage displayed
- [ ] "Cancel" button visible
- [ ] Processing steps listed

**Completed State:**
- [ ] "✅ Analysis Complete!" message
- [ ] Risk Score displayed
- [ ] Anomaly Score displayed
- [ ] "Analyze Again" button visible
- [ ] Features panel collapsible

**Error State:**
- [ ] "❌ Processing Failed" message
- [ ] Error message displayed
- [ ] "Try Again" button visible

---

### Test 4: Click Interactions

```jsx
// Test start button
const component = render(<LivePipelineProcessor walletAddress="..." />);
const startBtn = component.getByText('Start Analysis');
fireEvent.click(startBtn);
// Should transition to "processing" state
```

---

### Test 5: Progress Bar Animation

**Expected Behavior:**
- [ ] Progress bar smooth animation
- [ ] Width increases 0% → 100%
- [ ] Color gradient visible (blue to indigo)
- [ ] Percentage number updates

---

### Test 6: Real-time Polling

**Expected Behavior:**
- [ ] Status updates every 2 seconds
- [ ] Progress number increases gradually
- [ ] No console errors
- [ ] Stops polling when complete

---

### Test 7: Results Display

**When completed:**
- [ ] Risk Score shows as percentage
- [ ] Anomaly Score shows as percentage  
- [ ] Prediction shows HIGH_RISK or LOW_RISK
- [ ] Transaction count displayed
- [ ] Timestamp in human-readable format
- [ ] Features collapsible panel works
- [ ] Feature values formatted properly

---

## Integration Testing

### Test 1: End-to-End Flow

```bash
# 1. Start backend
cd apps/backend && npm start

# 2. Start frontend (in another terminal)
cd apps/frontend && npm run dev

# 3. Open browser to http://localhost:3000
# 4. Navigate to page with LivePipelineProcessor
# 5. Enter wallet address
# 6. Click "Start Analysis"
# 7. Watch progress bar
# 8. Verify results display
```

**Expected:** Complete success without errors

---

### Test 2: Multiple Concurrent Requests

```bash
# Start multiple jobs at once
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/live-pipeline/start \
    -H "Content-Type: application/json" \
    -d "{
      \"walletAddress\": \"addr_test_$i\",
      \"transactionId\": \"txn_$i\"
    }" &
done
```

**Expected:**
- ✅ All jobs get unique jobIds
- ✅ All jobs complete successfully
- ✅ No race conditions
- ✅ Results independent

---

### Test 3: Payment Verification (Middleware)

```bash
# Without payment verification (current mock mode)
curl -X POST http://localhost:5000/api/live-pipeline/start \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "addr_test1qz...",
    "transactionId": "txn_123"
  }'

# Should work (mock passes all payments)
```

---

### Test 4: Error Handling

**Test: Missing walletAddress**
```bash
curl -X POST http://localhost:5000/api/live-pipeline/start \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "txn_123"}'

# Expected: 400 error
# { "success": false, "error": "walletAddress is required" }
```

**Test: Invalid jobId**
```bash
curl http://localhost:5000/api/live-pipeline/status/invalid_job_id

# Expected: 404 error
# { "success": false, "error": "Job not found" }
```

---

## Performance Testing

### Test 1: Response Time

```bash
# Measure response time for start
time curl -X POST http://localhost:5000/api/live-pipeline/start \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "addr_test1qz...", "transactionId": "txn_123"}'
```

**Expected:** < 500ms

---

### Test 2: Status Check Performance

```bash
# Measure response time for status
time curl http://localhost:5000/api/live-pipeline/status/job_123
```

**Expected:** < 100ms

---

### Test 3: Load Test (Simple)

```bash
# Generate 100 requests
for i in {1..100}; do
  curl http://localhost:5000/api/live-pipeline/status/job_test &
done

# Monitor memory and CPU usage
# Should complete without hanging
```

---

## Browser Testing

### Test in Different Browsers

- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (if on Mac)
- [ ] Edge (Latest)

**Ensure:**
- ✅ UI renders correctly
- ✅ Animations smooth
- ✅ No console errors
- ✅ Responsive design works
- ✅ Mobile view responsive

---

## Validation Checklist

### Backend
- [ ] Server starts without errors
- [ ] All routes registered
- [ ] Start pipeline works
- [ ] Status tracking works
- [ ] Results retrieval works
- [ ] Error handling works
- [ ] No console errors
- [ ] Response times acceptable

### Frontend
- [ ] Component imports successfully
- [ ] Renders without errors
- [ ] All UI states work
- [ ] Progress animation smooth
- [ ] Polling works correctly
- [ ] Results display properly
- [ ] Error handling works
- [ ] Mobile responsive

### Integration
- [ ] Backend ↔ Frontend communication works
- [ ] Multiple jobs can run concurrently
- [ ] Results persist correctly
- [ ] No race conditions
- [ ] Clean error messages

### Performance
- [ ] Start job: < 500ms
- [ ] Status check: < 100ms
- [ ] Total processing: 7-8 seconds
- [ ] No memory leaks
- [ ] Handles 100+ requests

---

## Success Criteria

✅ All tests pass  
✅ No console errors  
✅ Response times acceptable  
✅ UI responsive and smooth  
✅ Results accurate  
✅ Error handling robust  

---

## Troubleshooting Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | Backend not running | Start backend server |
| 404 Not Found | Wrong endpoint | Check route path |
| Results null | Job still processing | Wait for completion |
| Component not importing | File not found | Check import path |
| Progress stuck | Polling error | Check network |
| High response time | Backend overload | Reduce concurrent jobs |
| Memory leak | Too many jobs | Add job cleanup |

---

## Post-Testing Steps

1. Document any issues found
2. Fix bugs as needed
3. Re-run full test suite
4. Get sign-off from team
5. Deploy to staging
6. Monitor in production

---

**Ready to test! Good luck! 🚀**
