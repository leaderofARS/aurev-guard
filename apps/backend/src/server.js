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

const app = express();

// Core middleware
app.use(cors(
  {
    origin: FRONTEND,
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

const PORT = config.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ AUREV Guard Backend running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});

export default app;
