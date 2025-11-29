# 🔌 Backend ↔ AI/Masumi Integration Checklist

**Status:** Ready for Implementation  
**Last Updated:** November 30, 2025

---

## ✅ What's Already Done (Don't Touch)

- [x] AI Model code (`agents/ai_model/src/train.py`) - **UNCHANGED**
- [x] AI Model Agent (`masumi/agents/ai_model/app.py`) - **UNCHANGED**
- [x] Payment Agent (`masumi/agents/payment/app.py`) - **UNCHANGED**
- [x] Masumi Orchestrator (`masumi/orchestrator/app.py`) - **UNCHANGED**
- [x] Compliance Agent (`masumi/agents/compliance/`) - **UNCHANGED**
- [x] Wallet Integration - **COMPLETED**

---

## 📝 Integration Implementation Checklist

### Phase 1: Service Layer Creation

- [ ] **Create adapter services (NEW FILES):**
  - [x] `apps/backend/src/services/orchestratorClient.js` - ✅ CREATED
  - [x] `apps/backend/src/services/aiModelAdapter.js` - ✅ CREATED
  - [x] `apps/backend/src/services/paymentAgentAdapter.js` - ✅ CREATED
  - [x] `apps/backend/src/services/index.js` - ✅ CREATED

- [ ] **Read the integration approach:**
  - [x] `INTEGRATION_APPROACH.md` - Full architecture & design
  - [x] `INTEGRATION_EXAMPLES.md` - Code examples & patterns

### Phase 2: Update Backend Configuration

- [ ] **Update environment variables (`apps/backend/.env`):**
  ```bash
  # Orchestrator
  ORCHESTRATOR_URL=http://localhost:8080
  ORCHESTRATOR_ROUTE_ENDPOINT=/masumi/route
  ORCHESTRATOR_TIMEOUT=30000

  # AI Agent (optional, for direct calls)
  AI_AGENT_URL=http://localhost:8083
  AI_AGENT_TIMEOUT=30000

  # Payment Agent (optional, for direct calls)
  PAYMENT_AGENT_URL=http://localhost:8081
  PAYMENT_AGENT_TIMEOUT=30000

  # Routing mode: true = via orchestrator, false = direct calls
  USE_ORCHESTRATOR=true
  ```

### Phase 3: Update Backend Controllers

- [ ] **Update `apps/backend/src/controllers.js`:**
  - [ ] Import adapter services at top:
    ```javascript
    import { aiModelAdapter, paymentAgentAdapter, orchestratorClient } from './services/index.js';
    ```
  
  - [ ] Update `postScanAddress()`:
    - Replace: `await fetch(\`${config.PY_AI_URL}/ai/score\`, {...})`
    - With: `await aiModelAdapter.getPrediction({address, features})`
  
  - [ ] Update `postAgentDecision()`:
    - Add: `await paymentAgentAdapter.getSettleValidation({transaction_id, features})`
    - Add: `await paymentAgentAdapter.validateWithCompliance(paymentReq, riskData)`
    - Update bundle with: `masumiDecision`, `paymentStatus`, etc.
  
  - [ ] Optional: Update `postContractLog()` to log Masumi decisions

- [ ] **Add new endpoint `getServicesHealth()`:**
  - Check health of all integration services
  - Return status of Orchestrator, AI Agent, Payment Agent
  - Add to routes: `GET /health/services`

### Phase 4: Update Backend Server Initialization

- [ ] **Update `apps/backend/src/server.js`:**
  - [ ] Import services initializer:
    ```javascript
    import { initializeServices } from './services/index.js';
    ```
  
  - [ ] Add initialization in startup:
    ```javascript
    app.listen(PORT, async () => {
      console.log(`Backend running on http://localhost:${PORT}`);
      
      // Initialize integration services
      try {
        await initializeServices();
      } catch (err) {
        console.warn('Services not ready, running in fallback mode:', err.message);
      }
    });
    ```

### Phase 5: Testing

- [ ] **Start services in order:**
  ```bash
  # Terminal 1: Masumi Orchestrator
  cd masumi/orchestrator
  python app.py
  
  # Terminal 2: AI Model Agent
  cd agents/ai_model/src
  uvicorn train:app --port 8083
  
  # Terminal 3: Payment Agent
  cd masumi/agents/payment
  uvicorn app:app --port 8081
  
  # Terminal 4: Backend
  cd apps/backend
  npm install
  npm start
  ```

- [ ] **Test endpoints:**
  ```bash
  # Health check all services
  curl http://localhost:3001/health/services
  
  # Scan address (now uses AI adapter)
  curl -X POST http://localhost:3001/scan/address \
    -H "Content-Type: application/json" \
    -d '{"address":"addr_test1..."}'
  
  # Agent decision (now validates with Payment Agent)
  curl -X POST http://localhost:3001/agent/decision \
    -H "Content-Type: application/json" \
    -d '{"requestId":"req-123","address":"addr_test1...","riskScore":72}'
  ```

- [ ] **Verify adapter behavior:**
  - [ ] AI predictions return via adapter
  - [ ] Payment validation works
  - [ ] Compliance decisions from orchestrator
  - [ ] Fallbacks work when services are down
  - [ ] Error messages are clear

### Phase 6: Documentation & Notes

- [ ] **Review:**
  - [x] `INTEGRATION_APPROACH.md` - Full architecture
  - [x] `INTEGRATION_EXAMPLES.md` - Code patterns

- [ ] **Document your changes:**
  - [ ] Create `apps/backend/INTEGRATION_LOG.md` with:
    - What was changed
    - Why it was changed
    - How to debug issues
    - How to add new agents in future

---

## 🎯 Key Points to Remember

### ✅ DO THIS:

1. **Use the adapter services** in controllers
   - `aiModelAdapter.getPrediction()`
   - `paymentAgentAdapter.getSettleValidation()`
   - `paymentAgentAdapter.validateWithCompliance()`

2. **Leave existing code alone:**
   - Don't modify `agents/ai_model/`
   - Don't modify `masumi/` agents
   - Don't modify `masumi/orchestrator/`

3. **Handle errors gracefully:**
   - Adapters return fallbacks automatically
   - Check the `fallback` flag in response
   - Log errors for debugging

4. **Use environment variables:**
   - `ORCHESTRATOR_URL` for main routing
   - `USE_ORCHESTRATOR` to switch routing mode
   - Agent URLs optional (for debugging)

### ❌ DON'T DO THIS:

1. **Don't directly call agent endpoints** from controllers
   - Use adapters instead
   - Makes it easier to change routing later

2. **Don't modify AI or Masumi code**
   - New code only (adapters)
   - Integration layer only
   - Keep original code pristine

3. **Don't hardcode URLs** in controllers
   - Use environment variables
   - Set in `.env` file
   - Load via `config/index.js`

4. **Don't assume services are always up**
   - Always have fallbacks
   - Check health endpoints
   - Handle timeouts gracefully

---

## 📊 Integration Flow (After Implementation)

```
User Request
    ↓
Frontend (React)
    ↓
Backend API (Express)
    ├─→ [NEW] Service Layer
    │      ├─→ orchestratorClient
    │      ├─→ aiModelAdapter
    │      └─→ paymentAgentAdapter
    ↓
Masumi Orchestrator (Port 8080)
    ├─→ AI Model Agent (Port 8083)
    ├─→ Payment Agent (Port 8081)
    └─→ Compliance Agent (Port 8082)
    ↓
Original Code (UNTOUCHED)
    ├─→ agents/ai_model/src/train.py
    ├─→ masumi/orchestrator/app.py
    └─→ masumi/agents/**
```

---

## 🔧 Troubleshooting

### Issue: "Orchestrator not found"
- **Cause:** Port 8080 orchestrator not running
- **Fix:** Start orchestrator first: `python masumi/orchestrator/app.py`

### Issue: "AI predictions timing out"
- **Cause:** AI agent slow or not running
- **Fix:** Check `http://localhost:8083/health`
- **Workaround:** Increase `ORCHESTRATOR_TIMEOUT` in .env

### Issue: "Payment validation always fails"
- **Cause:** Features missing required fields
- **Fix:** Ensure features include `amount` and `user_id`

### Issue: "Adapters returning fallbacks"
- **Cause:** Services unavailable or slow
- **Fix:** Check health endpoints, increase timeouts

### Issue: "Controller still calling old endpoints"
- **Cause:** Import not updated
- **Fix:** Add import: `import { aiModelAdapter, ... } from './services/index.js';`

---

## 📚 Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `INTEGRATION_APPROACH.md` | Architecture & design | ✅ Reference |
| `INTEGRATION_EXAMPLES.md` | Code examples & patterns | ✅ Reference |
| `apps/backend/src/services/orchestratorClient.js` | Orchestrator wrapper | ✅ Created |
| `apps/backend/src/services/aiModelAdapter.js` | AI Model wrapper | ✅ Created |
| `apps/backend/src/services/paymentAgentAdapter.js` | Payment Agent wrapper | ✅ Created |
| `apps/backend/src/services/index.js` | Service exports | ✅ Created |
| `apps/backend/src/controllers.js` | **NEEDS UPDATE** | 📝 TODO |
| `apps/backend/src/server.js` | **NEEDS UPDATE** | 📝 TODO |
| `apps/backend/.env` | **NEEDS UPDATE** | 📝 TODO |

---

## 🚀 Next Steps (In Order)

1. **Read the docs:**
   - Review `INTEGRATION_APPROACH.md` (full architecture)
   - Review `INTEGRATION_EXAMPLES.md` (code patterns)

2. **Update configuration:**
   - Add environment variables to `apps/backend/.env`
   - Update `apps/backend/src/config/index.js` if needed

3. **Update backend:**
   - Update `apps/backend/src/controllers.js` with adapter calls
   - Update `apps/backend/src/server.js` with service initialization
   - Update routes if needed (probably not)

4. **Test:**
   - Start all services (Orchestrator → AI → Payment → Backend)
   - Test endpoints via curl or Postman
   - Verify adapters are being called
   - Check for fallback behaviors

5. **Verify:**
   - All endpoints work
   - Fallbacks work when services down
   - Error messages are clear
   - No changes to original AI/Masumi code

---

## 💡 Pro Tips

- **Use `USE_ORCHESTRATOR=true`** to route through orchestrator (recommended)
- **Set `USE_ORCHESTRATOR=false`** to call agents directly (for debugging)
- **Check health endpoint** before each test: `curl http://localhost:3001/health/services`
- **Look at adapter code** to understand request/response format
- **Monitor console logs** for correlation IDs to trace requests
- **Keep original code** in separate branches or backups

---

## ❓ FAQ

**Q: Do I need to modify the AI model code?**  
A: **No.** All integration happens in the new adapter services.

**Q: Can I call agents directly instead of through orchestrator?**  
A: **Yes.** Set `USE_ORCHESTRATOR=false` in .env to call agents directly.

**Q: What if the orchestrator is down?**  
A: Adapters will fail gracefully and return fallbacks. System keeps working.

**Q: How do I add a new agent?**  
A: Create a new adapter service (follow the pattern) and import it in controllers.

**Q: Do I need to change the database?**  
A: No. Decision bundles remain the same structure.

**Q: How do I debug?**  
A: Check console logs (correlation IDs), test health endpoints, check env vars.

---

## 📞 Support

If you have questions or run into issues:

1. Check the **troubleshooting** section above
2. Review the **INTEGRATION_APPROACH.md** for architecture details
3. Check **adapter code comments** for implementation details
4. Look at **INTEGRATION_EXAMPLES.md** for code patterns
5. Check **console logs** for detailed error messages

---

**You're all set! The integration layer is ready. Now just update the controllers and you'll have full AI/Masumi integration without touching any of the original code.** 🎉
