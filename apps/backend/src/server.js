import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Modular route files
import scanRoutes from './routes/scan.js';
import aiRoutes from './routes/ai.js';
import agentRoutes from './routes/agent.js';
import contractRoutes from './routes/contract.js';
import riskRoutes from './routes/risk.js';
import livePipelineRoutes from './routes/livePipeline.js';
import realPipelineRoutes from './routes/realPipeline.js';

const app = express();

// Core middleware
app.use(cors(
  {
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  }
));
app.use(express.json());

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  console.log(`[${req.requestId}] ${req.method} ${req.path}`);
  next();
});

// Route mounting
app.use('/scan', scanRoutes);
app.use('/ai', aiRoutes);
app.use('/agent', agentRoutes);
app.use('/contract', contractRoutes);
app.use('/risk', riskRoutes);
app.use('/api/live-pipeline', livePipelineRoutes);
app.use('/api/real-pipeline', realPipelineRoutes);

// Root API endpoint - list available endpoints
app.get('/api', (req, res) => {
  res.json({
    message: 'AUREV Guard API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      scan: {
        address: 'POST /scan/address',
        description: 'Scan a Cardano wallet address'
      },
      livePipeline: {
        start: 'POST /api/live-pipeline/start',
        status: 'GET /api/live-pipeline/status/:jobId',
        results: 'GET /api/live-pipeline/results/:walletAddress'
      },
      realPipeline: {
        start: 'POST /api/real-pipeline/start',
        status: 'GET /api/real-pipeline/status/:jobId',
        results: 'GET /api/real-pipeline/results/:walletAddress'
      }
    }
  });
});

// Root scan endpoint - show available scan methods
app.get('/scan', (req, res) => {
  res.json({
    message: 'Scan API',
    endpoints: {
      scanAddress: {
        method: 'POST',
        path: '/scan/address',
        description: 'Scan a Cardano wallet address for risk assessment',
        body: {
          address: 'string (Cardano wallet address)'
        }
      }
    }
  });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = config.PORT || 5000; // Changed default to 5000 to match frontend expectations

app.listen(PORT, () => {
  console.log(`✅ AUREV Guard Backend running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API Base: http://localhost:${PORT}/api`);
  console.log(`📝 Scan: http://localhost:${PORT}/scan`);
});

export default app;
